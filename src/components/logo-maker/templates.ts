import { LogoProject } from "./types";
import { genId } from "./utils";

let tid = 0;
function t(text: string, x: number, y: number, fontSize = 32, fill = "#0B192C", fontFamily = "Outfit"): ReturnType<typeof import("./types").createTextElement> {
  return { id: genId(), type: "text", x, y, width: 280, height: fontSize + 8, rotation: 0, locked: false, visible: true, opacity: 1, zIndex: tid++, text, fontFamily, fontSize, fontWeight: 800, fontStyle: "normal", textAlign: "center", letterSpacing: 0, lineHeight: 1.2, textDecoration: "none", fill };
}

function s(shapeType: string, x: number, y: number, w: number, h: number, fill: string, zIndex: number): ReturnType<typeof import("./types").createShapeElement> {
  return { id: genId(), type: "shape", x, y, width: w, height: h, rotation: 0, locked: false, visible: true, opacity: 1, zIndex, shapeType: shapeType as any, fill, stroke: "none", strokeWidth: 0 };
}

function ic(iconName: string, x: number, y: number, size: number, fill: string, zIndex: number): ReturnType<typeof import("./types").createIconElement> {
  return { id: genId(), type: "icon", x, y, width: size, height: size, rotation: 0, locked: false, visible: true, opacity: 1, zIndex, iconName, fill };
}

export const TEMPLATES: LogoProject[] = [
  {
    id: "tpl_business", name: "Corporate Pro", elements: [
      s("rect", 10, 10, 580, 280, "#0B192C", 0),
      ic("shield", 300, 70, 60, "#3B82F6", 1),
      t("NEXUS", 300, 160, 48, "#FFFFFF", "Outfit"),
      t("Elevating Innovation", 300, 200, 16, "#64748B", "Inter"),
    ], canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
  },
  {
    id: "tpl_tech", name: "Tech Startup", elements: [
      s("circle", 230, 60, 140, 140, "rgba(37,99,235,0.08)", 0),
      ic("bolt", 300, 130, 50, "#2563EB", 1),
      t("VELORA", 300, 200, 42, "#0B192C", "Space Grotesk"),
      t("Tech for tomorrow", 300, 235, 14, "#64748B", "Inter"),
    ], canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
  },
  {
    id: "tpl_restaurant", name: "Bistro", elements: [
      s("rect", 0, 180, 600, 120, "#1E3A5F", 0),
      ic("coffee", 300, 70, 55, "#D97706", 1),
      t("CAFE", 300, 155, 46, "#1E3A5F", "Playfair Display"),
      t("Authentic Flavors", 300, 225, 15, "rgba(255,255,255,0.7)", "Inter"),
    ], canvasWidth: 600, canvasHeight: 300, canvasBackground: "#F8F6F1", createdAt: 0, updatedAt: 0,
  },
  {
    id: "tpl_fashion", name: "Fashion Label", elements: [
      s("diamond", 260, 40, 80, 80, "#DC2626", 0),
      s("diamond", 270, 50, 60, 60, "#FFFFFF", 1),
      ic("heart", 300, 80, 30, "#DC2626", 2),
      t("LUXE", 300, 155, 50, "#0B192C", "Playfair Display"),
      t("Haute Couture", 300, 195, 14, "#DC2626", "Inter"),
      s("line", 140, 170, 320, 2, "#DC2626", 3),
    ], canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
  },
  {
    id: "tpl_realestate", name: "Realty", elements: [
      s("rect", 0, 0, 600, 300, "#F1F5F9", 0),
      s("rect", 20, 20, 560, 260, "#FFFFFF", 1),
      ic("shield", 300, 75, 50, "#0F766E", 2),
      t("HOMELAND", 300, 155, 38, "#0F766E", "Outfit"),
      t("Find your place", 300, 190, 14, "#64748B", "Inter"),
    ], canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
  },
  {
    id: "tpl_education", name: "Academy", elements: [
      s("rect", 0, 200, 600, 100, "#2563EB", 0),
      ic("star", 300, 70, 55, "#2563EB", 1),
      t("EDUQUEST", 300, 155, 40, "#0B192C", "Outfit"),
      t("Learn Without Limits", 300, 232, 14, "rgba(255,255,255,0.8)", "Inter"),
    ], canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
  },
  {
    id: "tpl_health", name: "Wellness", elements: [
      s("circle", 140, 40, 120, 120, "rgba(22,163,74,0.08)", 0),
      ic("leaf", 300, 70, 55, "#16A34A", 1),
      t("VITALIS", 300, 160, 42, "#0B192C", "Outfit"),
      t("Wellness Redefined", 300, 198, 14, "#16A34A", "Inter"),
    ], canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
  },
  {
    id: "tpl_sports", name: "Athletic", elements: [
      s("hexagon", 230, 30, 140, 120, "#DC2626", 0),
      ic("zap", 300, 90, 45, "#FFFFFF", 1),
      t("FUSION", 300, 190, 44, "#0B192C", "Arial Black"),
      t("Unleash Potential", 300, 230, 13, "#DC2626", "Inter"),
    ], canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
  },
];
