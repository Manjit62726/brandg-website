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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

export function loadProjects(): LogoProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}
