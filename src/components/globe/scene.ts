import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import landPoints from "./land-points.json";

export type GlobeColors = { ink: string; signal: string; paper: string };
export type GlobeCity = { code: string; lat: number; lon: number };
export type GlobeRoute = {
  center: { lat: number; lon: number };
  zoom: number;
  arcs: [string, string][];
  pins: string[];
};
/** Screen position of a city label, in CSS pixels relative to the canvas. */
export type LabelPosition = { code: string; x: number; y: number; visible: boolean };

const RADIUS = 1;
const DEG = Math.PI / 180;
const DRAW_START = 0.5;
const DRAW_DURATION = 1.4;
const TRIP = 2.6;

function toVector(lat: number, lon: number, radius = RADIUS) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** Great-circle arc lifted off the surface, higher for longer trips. */
function arcPoints(from: Vector3, to: Vector3, segments = 96) {
  const lift = 0.06 + from.angleTo(to) * 0.22;
  const points: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = from.clone().lerp(to, t).normalize();
    points.push(point.multiplyScalar(RADIUS + Math.sin(Math.PI * t) * lift));
  }
  return points;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Rotation that brings a lat/lon to the front of the globe. */
const rotationFor = ({ lat, lon }: { lat: number; lon: number }) => ({ x: lat * DEG, y: (-90 - lon) * DEG });

// Round, depth-faded dots: cheaper and crisper than textured sprites.
const dotMaterial = (color: Color, size: number, alpha: number) =>
  new ShaderMaterial({
    uniforms: { uColor: { value: color }, uSize: { value: size }, uAlpha: { value: alpha } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uSize;
      varying float vFacing;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFacing = normalize(normalMatrix * normalize(position)).z;
        gl_PointSize = uSize * (3.2 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vFacing;
      void main() {
        if (length(gl_PointCoord - 0.5) > 0.5) discard;
        gl_FragColor = vec4(uColor, smoothstep(-0.1, 0.6, vFacing) * uAlpha);
      }`,
  });

type Options = {
  colors: GlobeColors;
  cities: GlobeCity[];
  routes: GlobeRoute[];
  /** Called every frame with the projected city labels of the active route. */
  onLabels?: (labels: LabelPosition[]) => void;
  /** Called when the visitor starts or stops dragging the globe. */
  onDrag?: (dragging: boolean) => void;
};

/**
 * Dotted globe that tells the portfolio's routes (home base, the GPConnect
 * corridor, next destination). Parcels travel along the active route's arcs.
 * Returns controls so the React wrapper owns the lifecycle.
 */
export function createGlobe(
  canvas: HTMLCanvasElement,
  { colors, cities, routes, onLabels, onDrag }: Options,
) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 10);
  camera.position.set(0, 0, 3.4); // At 3.4 the sphere is framed like the SVG fallback.
  const toCamera = new Vector3(0, 0, 1);

  const globe = new Group();
  scene.add(globe);

  const ink = new Color(colors.ink);
  const signal = new Color(colors.signal);
  const paper = new Color(colors.paper);
  const signalMaterials: (MeshBasicMaterial | LineBasicMaterial)[] = [];

  // Solid core hides the dots on the far side.
  const coreMaterial = new MeshBasicMaterial({ color: paper });
  globe.add(new Mesh(new SphereGeometry(RADIUS * 0.985, 48, 48), coreMaterial));

  const positions = new Float32Array((landPoints.length / 2) * 3);
  for (let i = 0; i < landPoints.length; i += 2) {
    toVector(landPoints[i], landPoints[i + 1]).toArray(positions, (i / 2) * 3);
  }
  const landGeometry = new BufferGeometry();
  landGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  globe.add(new Points(landGeometry, dotMaterial(ink, 4.2, 0.6)));

  // A faint, even grid over the whole sphere keeps its outline readable over
  // the oceans, even when the camera zooms in.
  const GRID = 9000;
  const grid = new Float32Array(GRID * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < GRID; i++) {
    const y = 1 - (i / (GRID - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    new Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r).toArray(grid, i * 3);
  }
  const gridGeometry = new BufferGeometry();
  gridGeometry.setAttribute("position", new BufferAttribute(grid, 3));
  globe.add(new Points(gridGeometry, dotMaterial(ink, 2.2, 0.16)));

  const cityVectors = new Map(cities.map((city) => [city.code, toVector(city.lat, city.lon)]));
  const at = (code: string) => {
    const vector = cityVectors.get(code);
    if (!vector) throw new Error(`Unknown city "${code}" in content/globe.json`);
    return vector;
  };

  const pinGeometry = new RingGeometry(0.016, 0.028, 32);
  const parcelGeometry = new SphereGeometry(0.02, 12, 12);
  const signalMaterial = <T extends MeshBasicMaterial | LineBasicMaterial>(material: T) => {
    signalMaterials.push(material);
    return material;
  };

  // One group per route: its arcs, the parcels riding them and its pins.
  const built = routes.map((route) => {
    const group = new Group();
    group.visible = false;

    const arcs = route.arcs.map(([a, b]) => {
      const points = arcPoints(at(a), at(b));
      const geometry = new BufferGeometry().setFromPoints(points);
      geometry.setDrawRange(0, 0);
      group.add(new Line(geometry, signalMaterial(new LineBasicMaterial({ color: signal }))));
      const parcel = new Mesh(parcelGeometry, signalMaterial(new MeshBasicMaterial({ color: signal })));
      parcel.visible = false;
      group.add(parcel);
      return { points, geometry, parcel };
    });

    const pins = route.pins.map((code) => {
      const material = signalMaterial(
        new MeshBasicMaterial({ color: signal, transparent: true, depthWrite: false }),
      );
      const ring = new Mesh(pinGeometry, material);
      const position = at(code);
      ring.position.copy(position.clone().multiplyScalar(1.002));
      ring.lookAt(position.clone().multiplyScalar(2));
      group.add(ring);
      return { code, ring, material };
    });

    globe.add(group);
    return { group, arcs, pins, rotation: rotationFor(route.center), zoom: route.zoom };
  });

  let active = 0;
  let routeStart = 0;
  built[active].group.visible = true;
  globe.rotation.set(built[active].rotation.x, built[active].rotation.y, 0);
  camera.position.z = built[active].zoom;

  const pointer = { x: 0, y: 0 };
  // Drag: an offset on top of the route's rotation, with inertia on release.
  // After a few idle seconds it eases back so the active route is in view again.
  const DRAG_SPEED = 0.006; // radians per pixel
  const RETURN_AFTER = 4; // seconds
  const drag = { x: 0, y: 0, vx: 0, vy: 0, active: false, lastX: 0, lastY: 0, releasedAt: -Infinity };

  function onPointerDown(event: PointerEvent) {
    drag.active = true;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.vx = drag.vy = 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.dataset.dragging = "true";
    onDrag?.(true);
  }
  function onPointerMove(event: PointerEvent) {
    if (!drag.active) return;
    drag.vy = (event.clientX - drag.lastX) * DRAG_SPEED;
    drag.vx = (event.clientY - drag.lastY) * DRAG_SPEED;
    drag.y += drag.vy;
    drag.x = Math.max(-1.1, Math.min(1.1, drag.x + drag.vx));
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  }
  function onPointerUp(event: PointerEvent) {
    if (!drag.active) return;
    drag.active = false;
    drag.releasedAt = clock;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    delete canvas.dataset.dragging;
    onDrag?.(false);
  }
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  let frame = 0;
  let running = false;
  let clock = 0;
  let last = 0;
  const world = new Vector3();

  function resize() {
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }

  function emitLabels() {
    if (!onLabels) return;
    const { clientWidth, clientHeight } = canvas;
    onLabels(
      built[active].pins.map(({ code, ring }) => {
        ring.getWorldPosition(world);
        // A label is shown only while its city faces the camera.
        const visible = world.clone().normalize().dot(toCamera) > 0.45;
        world.project(camera);
        return {
          code,
          x: ((world.x + 1) / 2) * clientWidth,
          y: ((1 - world.y) / 2) * clientHeight,
          visible,
        };
      }),
    );
  }

  function render(now: number) {
    // Own clock, so a paused globe (offscreen, hidden tab) resumes where it was.
    clock += last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    const t = clock - routeStart;
    const route = built[active];

    if (!drag.active) {
      // Inertia after a throw, then a slow return to the route once idle.
      drag.y += drag.vy;
      drag.x = Math.max(-1.1, Math.min(1.1, drag.x + drag.vx));
      drag.vx *= 0.92;
      drag.vy *= 0.92;
      if (clock - drag.releasedAt > RETURN_AFTER) {
        drag.x *= 0.97;
        drag.y *= 0.97;
      }
    }

    // Follow the active route plus the drag offset, a slow sway and pointer parallax.
    const sway = drag.active ? 0 : Math.sin(clock * 0.15) * 0.08;
    const targetY = route.rotation.y + drag.y + sway + pointer.x * 0.35;
    const targetX = route.rotation.x + drag.x + pointer.y * 0.2;
    const follow = drag.active ? 0.35 : 0.08;
    globe.rotation.y += (targetY - globe.rotation.y) * follow;
    globe.rotation.x += (targetX - globe.rotation.x) * follow;
    camera.position.z += (route.zoom - camera.position.z) * 0.04;

    route.arcs.forEach(({ points, geometry, parcel }, i) => {
      const draw = Math.min(1, Math.max(0, (t - DRAW_START - i * 0.18) / DRAW_DURATION));
      geometry.setDrawRange(0, Math.ceil(easeInOut(draw) * points.length));
      // Once drawn, a parcel loops along each arc, staggered so they don't move in lockstep.
      const travel = draw < 1 ? -1 : ((t - DRAW_START - DRAW_DURATION + i * 0.7) % (TRIP + 0.8)) / TRIP;
      parcel.visible = travel >= 0 && travel <= 1;
      if (parcel.visible) parcel.position.copy(points[Math.round(easeInOut(travel) * (points.length - 1))]);
    });

    route.pins.forEach(({ ring, material }, i) => {
      const pulse = (clock * 0.7 + i * 0.37) % 1;
      ring.scale.setScalar(1 + pulse * 1.4);
      material.opacity = Math.min(1, t * 2) * (1 - pulse * 0.85);
    });

    renderer.render(scene, camera);
    emitLabels();
    if (running) frame = requestAnimationFrame(render);
  }

  resize();

  return {
    play() {
      if (running) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(render);
    },
    pause() {
      running = false;
      cancelAnimationFrame(frame);
    },
    resize,
    setRoute(index: number) {
      if (index === active || !built[index]) return;
      built[active].group.visible = false;
      active = index;
      built[active].group.visible = true;
      built[active].arcs.forEach(({ geometry, parcel }) => {
        geometry.setDrawRange(0, 0);
        parcel.visible = false;
      });
      routeStart = clock;
      // A new route recentres the globe, whatever the visitor did with it.
      drag.releasedAt = -Infinity;
    },
    setPointer(x: number, y: number) {
      pointer.x = x;
      pointer.y = y;
    },
    setColors(next: GlobeColors) {
      ink.set(next.ink);
      signal.set(next.signal);
      paper.set(next.paper);
      coreMaterial.color.copy(paper);
      signalMaterials.forEach((material) => material.color.copy(signal));
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      scene.traverse((object) => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose();
        (mesh.material as MeshBasicMaterial | undefined)?.dispose?.();
      });
      renderer.dispose();
    },
  };
}
