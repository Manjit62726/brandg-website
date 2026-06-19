import { LogoElement, LogoProject } from "./types";

let _idCounter = 0;
export function genId(): string {
  return "el_" + Date.now().toString(36) + "_" + (++_idCounter).toString(36);
}

export function createTextElement(text: string, x: number, y: number): LogoElement {
  return {
    id: genId(), type: "text", x, y, width: 200, height: 40, rotation: 0,
    locked: false, visible: true, opacity: 1, zIndex: 0,
    text, fontFamily: "Outfit", fontSize: 32, fontWeight: 800,
    fontStyle: "normal", textAlign: "center", letterSpacing: 0, lineHeight: 1.2,
    textDecoration: "none", fill: "#0B192C",
  };
}

export function createShapeElement(shapeType: LogoElement["shapeType"], x: number, y: number): LogoElement {
  return {
    id: genId(), type: "shape", x, y, width: 60, height: 60, rotation: 0,
    locked: false, visible: true, opacity: 1, zIndex: 0,
    shapeType: shapeType || "rect", fill: "#2563EB", stroke: "none", strokeWidth: 0,
  };
}

export function createIconElement(iconName: string, x: number, y: number): LogoElement {
  return {
    id: genId(), type: "icon", x, y, width: 50, height: 50, rotation: 0,
    locked: false, visible: true, opacity: 1, zIndex: 0,
    iconName, fill: "#2563EB",
  };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

const STORAGE_KEY = "brandg_logo_projects";

export function saveProjects(projects: LogoProject[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch {}
}

export function loadProjects(): LogoProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

export function deepCloneProject(p: LogoProject): LogoProject {
  return JSON.parse(JSON.stringify(p));
}

export function snapValue(v: number, grid: number): number {
  return Math.round(v / grid) * grid;
}

export function distributeElements(els: { id: string; x: number; y: number; width: number; height: number }[], dir: "horizontal" | "vertical"): Record<string, { x?: number; y?: number }> {
  const result: Record<string, { x?: number; y?: number }> = {};
  if (els.length < 3) return result;
  if (dir === "horizontal") {
    const sorted = [...els].sort((a, b) => a.x - b.x);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const space = (last.x + last.width - first.x) / (sorted.length - 1);
    sorted.forEach((el, i) => { result[el.id] = { x: first.x + space * i - (sorted.indexOf(el) === 0 ? 0 : 0) }; });
    // Adjust: set x directly
    sorted.forEach((el, i) => { result[el.id] = { x: first.x + space * i }; });
  } else {
    const sorted = [...els].sort((a, b) => a.y - b.y);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const space = (last.y + last.height - first.y) / (sorted.length - 1);
    sorted.forEach((el, i) => { result[el.id] = { y: first.y + space * i }; });
  }
  return result;
}

export function getAlignedGuides(
  movingId: string,
  allElements: LogoElement[],
  dx: number,
  dy: number,
  threshold = 5
): { hx?: number; hy?: number; guides: { type: "h" | "v"; pos: number }[] } {
  const moving = allElements.find((e) => e.id === movingId);
  if (!moving) return { guides: [] };
  const guides: { type: "h" | "v"; pos: number }[] = [];
  let hx: number | undefined;
  let hy: number | undefined;
  const mx = moving.x + dx, my = moving.y + dy;
  const mc = mx + moving.width / 2, mr = mx + moving.width;
  const mb = my + moving.height, mc_y = my + moving.height / 2;

  for (const el of allElements) {
    if (el.id === movingId || !el.visible) continue;
    const ec = el.x + el.width / 2, er = el.x + el.width;
    const eb = el.y + el.height, ec_y = el.y + el.height / 2;

    if (Math.abs(mx - el.x) < threshold) { guides.push({ type: "v", pos: el.x }); if (hx === undefined) hx = el.x - moving.x; }
    else if (Math.abs(mx - ec) < threshold) { guides.push({ type: "v", pos: ec }); if (hx === undefined) hx = ec - moving.x; }
    else if (Math.abs(mx - er) < threshold) { guides.push({ type: "v", pos: er }); if (hx === undefined) hx = er - moving.x; }

    if (Math.abs(my - el.y) < threshold) { guides.push({ type: "h", pos: el.y }); if (hy === undefined) hy = el.y - moving.y; }
    else if (Math.abs(my - ec_y) < threshold) { guides.push({ type: "h", pos: ec_y }); if (hy === undefined) hy = ec_y - moving.y; }
    else if (Math.abs(my - eb) < threshold) { guides.push({ type: "h", pos: eb }); if (hy === undefined) hy = eb - moving.y; }

    if (Math.abs(mc - el.x) < threshold && hx === undefined) { hx = el.x - moving.x - moving.width / 2; guides.push({ type: "v", pos: el.x }); }
    if (Math.abs(mc - ec) < threshold && hx === undefined) { hx = ec - moving.x - moving.width / 2; guides.push({ type: "v", pos: ec }); }
    if (Math.abs(mc - er) < threshold && hx === undefined) { hx = er - moving.x - moving.width / 2; guides.push({ type: "v", pos: er }); }

    if (Math.abs(mc_y - el.y) < threshold && hy === undefined) { hy = el.y - moving.y - moving.height / 2; guides.push({ type: "h", pos: el.y }); }
    if (Math.abs(mc_y - ec_y) < threshold && hy === undefined) { hy = ec_y - moving.y - moving.height / 2; guides.push({ type: "h", pos: ec_y }); }
    if (Math.abs(mc_y - eb) < threshold && hy === undefined) { hy = eb - moving.y - moving.height / 2; guides.push({ type: "h", pos: eb }); }

    if (Math.abs(mr - el.x) < threshold && hx === undefined) { hx = el.x - moving.x - moving.width; guides.push({ type: "v", pos: el.x }); }
    if (Math.abs(mr - ec) < threshold && hx === undefined) { hx = ec - moving.x - moving.width; guides.push({ type: "v", pos: ec }); }
    if (Math.abs(mr - er) < threshold && hx === undefined) { hx = er - moving.x - moving.width; guides.push({ type: "v", pos: er }); }

    if (Math.abs(mb - el.y) < threshold && hy === undefined) { hy = el.y - moving.y - moving.height; guides.push({ type: "h", pos: el.y }); }
    if (Math.abs(mb - ec_y) < threshold && hy === undefined) { hy = ec_y - moving.y - moving.height; guides.push({ type: "h", pos: ec_y }); }
    if (Math.abs(mb - eb) < threshold && hy === undefined) { hy = eb - moving.y - moving.height; guides.push({ type: "h", pos: eb }); }
  }
  return { hx, hy, guides };
}
