import "server-only";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Locale } from "@/i18n/config";

/*
 * All editable content lives in /content. Every text field is either a plain
 * string (same in both languages) or an object { fr, en }. Files are validated
 * at build time, so a typo in a JSON file fails the build with a clear message
 * instead of rendering a broken page.
 */

const text = z.union([z.string(), z.object({ fr: z.string(), en: z.string() })]);
const textList = z.array(text);
type Text = z.infer<typeof text>;

export const t = (value: Text, locale: Locale) => (typeof value === "string" ? value : value[locale]);

const url = z.url().nullable().optional();

const profileSchema = z.object({
  name: z.string(),
  role: text,
  location: text,
  email: z.email(),
  phone: z.string().nullable(),
  showPhone: z.boolean(),
  links: z.object({ github: url, linkedin: url }),
  availability: z.object({ date: z.string(), label: text, detail: text }),
  tracking: z.string(),
  headline: text,
  intro: text,
  heroMetrics: z.array(z.object({ value: text, label: text })),
  about: textList,
  cv: z.object({ fr: z.string(), en: z.string() }),
});

const stepSchema = z.object({
  id: z.string(),
  status: text,
  period: text,
  kind: z.enum(["work", "education", "milestone"]),
  title: text,
  org: z.string().nullable(),
  place: text.nullable(),
  summary: text,
  points: textList.default([]),
  current: z.boolean().default(false),
});

const skillsSchema = z.array(z.object({ group: text, note: text.optional(), items: z.array(z.string()) }));

const projectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number(),
  featured: z.boolean(),
  context: z.enum(["pro", "personal", "school"]),
  year: z.string(),
  title: z.string(),
  tagline: text,
  problem: text,
  solution: text,
  role: text,
  highlights: textList,
  metrics: z.array(z.object({ value: text, label: text })).default([]),
  stack: z.array(z.string()),
  links: z.object({ demo: url, code: url, codeSecondary: url, note: text.optional() }).default({}),
});

const globeSchema = z.object({
  cities: z.record(z.string(), z.object({ name: z.string(), lat: z.number(), lon: z.number() })),
  routes: z.array(
    z.object({
      id: z.string(),
      label: text,
      detail: text,
      /** A section anchor ("#contact") or a project page. */
      href: z.union([z.string(), z.object({ project: z.string() })]),
      center: z.object({ lat: z.number(), lon: z.number() }),
      /** Camera distance: lower is closer (3.4 frames the whole globe). */
      zoom: z.number().min(2.2).max(3.4).default(3.4),
      arcs: z.array(z.tuple([z.string(), z.string()])),
      pins: z.array(z.string()),
    }),
  ),
});

export type Profile = z.infer<typeof profileSchema>;
export type Globe = z.infer<typeof globeSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type Project = z.infer<typeof projectSchema>;

const root = path.join(process.cwd(), "content");

function load<T>(schema: z.ZodType<T>, file: string): T {
  const raw = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(`content/${file} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const getProfile = () => load(profileSchema, "profile.json");
export const getJourney = () => load(z.array(stepSchema), "journey.json");
export const getSkills = () => load(skillsSchema, "skills.json");
export const getGlobe = () => load(globeSchema, "globe.json");

export function getProjects() {
  const dir = path.join(root, "projects");
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => load(projectSchema, `projects/${file}`))
    .sort((a, b) => a.order - b.order);
}

export const getProject = (slug: string) => getProjects().find((p) => p.slug === slug);
