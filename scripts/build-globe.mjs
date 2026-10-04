// Precomputes the hero globe (run: pnpm globe).
// 1. land-points.json: a Fibonacci sphere sampled on land, so the client ships
//    a small list of coordinates instead of map geometry.
// 2. public/globe.svg: one route projected once, used as the static
//    fallback (mobile, reduced motion, no WebGL). It carries its own dark mode.
import fs from "node:fs";
import { geoContains, geoInterpolate, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";

// The static fallback shows the "next destination" route.
const globe = JSON.parse(fs.readFileSync("content/globe.json", "utf8"));
const fallbackRoute = globe.routes.find((route) => route.id === "next");
const city = (code) => [globe.cities[code].lon, globe.cities[code].lat];
const topology = JSON.parse(fs.readFileSync("node_modules/world-atlas/land-110m.json", "utf8"));
const land = feature(topology, topology.objects.land);

const SAMPLES = 16000;
const golden = Math.PI * (3 - Math.sqrt(5));
const points = [];

for (let i = 0; i < SAMPLES; i++) {
  const y = 1 - (i / (SAMPLES - 1)) * 2;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = ((((golden * i * 180) / Math.PI) % 360) + 540) % 360 - 180;
  if (lat < -60) continue; // Antarctica adds noise, not meaning.
  if (geoContains(land, [lon, lat])) points.push(Math.round(lat * 10) / 10, Math.round(lon * 10) / 10);
}
fs.writeFileSync("src/components/globe/land-points.json", JSON.stringify(points));

const size = 400;
const projection = geoOrthographic()
  .rotate([-fallbackRoute.center.lon, -fallbackRoute.center.lat])
  .translate([size / 2, size / 2])
  .scale(size / 2 - 4)
  .clipAngle(90);

let dots = "";
for (let i = 0; i < points.length; i += 2) {
  const p = projection([points[i + 1], points[i]]);
  if (p) dots += `M${Math.round(p[0])} ${Math.round(p[1])}h0`;
}
const routes = fallbackRoute.arcs
  .map(([a, b]) => {
    const interpolate = geoInterpolate(city(a), city(b));
    return geoPath(projection)({
      type: "LineString",
      coordinates: Array.from({ length: 33 }, (_, i) => interpolate(i / 32)),
    });
  })
  .join("");
const pins = fallbackRoute.pins
  .map((code) => projection(city(code)).map(Math.round))
  .map(([x, y]) => `<circle class="c" cx="${x}" cy="${y}" r="4"/>`)
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
<style>.d{stroke:#14213d;opacity:.35}.r{stroke:#e4572e}.c{fill:#e4572e}.o{stroke:#14213d;opacity:.15}
@media (prefers-color-scheme:dark){.d{stroke:#ece6da;opacity:.4}.o{stroke:#ece6da}.r{stroke:#ff7a50}.c{fill:#ff7a50}}</style>
<circle class="o" cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="none"/>
<path class="d" d="${dots}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
<path class="r" d="${routes}" stroke-width="2" fill="none" stroke-dasharray="5 4"/>
${pins}
</svg>`;
fs.writeFileSync("public/globe.svg", svg);
console.log(`${points.length / 2} land points · globe.svg ${(svg.length / 1024).toFixed(1)} KB`);
