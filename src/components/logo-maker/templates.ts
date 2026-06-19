import { LogoProject, LogoElement } from "./types";

let tid = 0;
function t(text: string, x: number, y: number, fontSize = 32, fill = "#0B192C", fontFamily = "Outfit"): LogoElement {
  return { id: "t" + tid++, type: "text", x, y, width: 280, height: fontSize + 8, rotation: 0, locked: false, visible: true, opacity: 1, zIndex: 0, text, fontFamily, fontSize, fontWeight: 800, fontStyle: "normal", textAlign: "center", letterSpacing: 0, lineHeight: 1.2, textDecoration: "none", fill } as LogoElement;
}
function s(shapeType: string, x: number, y: number, w: number, h: number, fill: string, z: number): LogoElement {
  return { id: "t" + tid++, type: "shape", x, y, width: w, height: h, rotation: 0, locked: false, visible: true, opacity: 1, zIndex: z, shapeType: shapeType as any, fill, stroke: "none", strokeWidth: 0 } as LogoElement;
}
function ic(iconName: string, x: number, y: number, size: number, fill: string, z: number): LogoElement {
  return { id: "t" + tid++, type: "icon", x, y, width: size, height: size, rotation: 0, locked: false, visible: true, opacity: 1, zIndex: z, iconName, fill } as LogoElement;
}
function ln(x1: number, y1: number, x2: number, y2: number, color: string, w: number, z: number): LogoElement {
  return { id: "t" + tid++, type: "shape", x: x1, y: y1, width: x2 - x1, height: y2 - y1, rotation: 0, locked: false, visible: true, opacity: 1, zIndex: z, shapeType: "line", fill: color, stroke: "none", strokeWidth: w } as LogoElement;
}

export function renderTemplateSVG(tpl: LogoProject): string {
  const W = tpl.canvasWidth, H = tpl.canvasHeight;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${W} ${H}">`;
  if (tpl.canvasBackground && tpl.canvasBackground !== "transparent") svg += `<rect width="${W}" height="${H}" fill="${tpl.canvasBackground}"/>`;
  const sorted = [...tpl.elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const el of sorted) {
    if (!el.visible) continue;
    svg += `<g transform="translate(${el.x},${el.y})" opacity="${el.opacity}">`;
    if (el.type === "text") {
      svg += `<text x="0" y="0" font-family="${el.fontFamily}" font-size="${Math.round((el.fontSize || 32) * 0.7)}" font-weight="${el.fontWeight}" fill="${el.fill}" transform="translate(${el.width / 2},${el.height / 2})" text-anchor="middle" dominant-baseline="central">${el.text}</text>`;
    } else if (el.type === "icon") {
      const d = getIconPathForPreview(el.iconName || "star");
      const s = Math.min(el.width, el.height);
      svg += `<g transform="translate(${el.width / 2},${el.height / 2}) scale(${s / 24}) translate(-12,-12)"><path d="${d}" fill="${el.fill}"/></g>`;
    } else if (el.type === "shape") {
      const cx = el.width / 2, cy = el.height / 2, r = Math.min(cx, cy);
      if (el.shapeType === "rect") svg += `<rect width="${el.width}" height="${el.height}" fill="${el.fill}" rx="2"/>`;
      else if (el.shapeType === "circle") svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${el.fill}"/>`;
      else if (el.shapeType === "triangle") svg += `<polygon points="${cx},0 ${el.width},${el.height} 0,${el.height}" fill="${el.fill}"/>`;
      else if (el.shapeType === "diamond") svg += `<polygon points="${cx},0 ${el.width},${cy} ${cx},${el.height} 0,${cy}" fill="${el.fill}"/>`;
      else if (el.shapeType === "hexagon") { const p = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(" "); svg += `<polygon points="${p}" fill="${el.fill}"/>`; }
      else if (el.shapeType === "star") { const p = Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rad = i % 2 === 0 ? r : r * 0.4; return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`; }).join(" "); svg += `<polygon points="${p}" fill="${el.fill}"/>`; }
      else if (el.shapeType === "line") svg += `<line x1="0" y1="${cy}" x2="${el.width}" y2="${cy}" stroke="${el.fill}" stroke-width="3"/>`;
    }
    svg += `</g>`;
  }
  svg += `</svg>`;
  return svg;
}

function getIconPathForPreview(name: string): string {
  const ICONS: Record<string, string> = {
    star: "M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16l-6.4 4.8L8 14l-6-4.8h7.6z",
    heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z",
    shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
    bolt: "M13 2L3 14h8l-2 8 10-12h-8z",
    coffee: "M2 21h18v2H2v-2zM20 8h-2V5h-2V3h4v5zm-4 2H6V5h10v5z",
    leaf: "M17 8C8 10 5 15 2 21c0 0 7-3 14-6s3-9 1-7z",
    crown: "M12 2l3 7 7-3-4 8H6L2 6l7 3z",
    rocket: "M12 2S7 9 7 14c0 3.31 2.24 6 5 6s5-2.69 5-6c0-5-5-12-5-12zm-1 19h2v2h-2v-2z",
    globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2zm6-5H6v-2h12v2z",
    music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
    sun: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2v-2H2v2zm18 0h2v-2h-2v2zM11 2v2h2V2h-2zm0 18v2h2v-2h-2zm-6.36-1.64l1.41-1.41-1.41-1.41-1.41 1.41 1.41 1.41zm12.72-12.72l-1.41 1.41 1.41 1.41 1.41-1.41-1.41-1.41z",
    zap: "M13 2L4 14h6l-2 8 9-12h-6l2-8z",
    camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "map-pin": "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10-3a4 4 0 0 1-4 4M23 21v-2a4 4 0 0 0-3-3.87",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
    play: "M5 3l14 9-14 9z",
    gift: "M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6m16-4v4H4V8m4 0V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2M4 8h16M3 12h18",
    phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  };
  return ICONS[name] || ICONS.star;
}

export const TEMPLATES: LogoProject[] = [
  /* ── Business ── */
  { id: "tpl_business1", name: "Corporate Pro", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 10, 10, 580, 280, "#0B192C", 0), ic("shield", 300, 70, 60, "#3B82F6", 1), t("NEXUS", 300, 160, 48, "#FFFFFF", "Outfit"), t("Elevating Innovation", 300, 200, 16, "#64748B", "Inter")] },
  { id: "tpl_business2", name: "Executive Suite", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#F8F6F1", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 0, 300, 300, "#0B192C", 0), s("rect", 320, 0, 280, 300, "#FFFFFF", 1), t("Apex", 150, 140, 52, "#FFFFFF", "Playfair Display"), t("Leadership Redefined", 460, 130, 16, "#0B192C", "Inter"), ln(370, 160, 550, 160, "#0B192C", 1, 2), t("Strategy", 460, 185, 12, "#64748B", "Inter"), t("Growth", 460, 205, 12, "#64748B", "Inter"), t("Impact", 460, 225, 12, "#64748B", "Inter")] },
  { id: "tpl_business3", name: "Minimalist", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 20, 20, 6, 260, "#2563EB", 0), t("STRIDE", 300, 120, 48, "#0B192C", "Outfit"), t("Business Consulting", 300, 170, 14, "#64748B", "Inter"), s("line", 220, 198, 160, 2, "#2563EB", 1)] },

  /* ── Tech ── */
  { id: "tpl_tech1", name: "Tech Startup", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("circle", 230, 60, 140, 140, "rgba(37,99,235,0.08)", 0), ic("bolt", 300, 130, 50, "#2563EB", 1), t("VELORA", 300, 200, 42, "#0B192C", "Space Grotesk"), t("Tech for tomorrow", 300, 235, 14, "#64748B", "Inter")] },
  { id: "tpl_tech2", name: "SaaS Brand", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#0F172A", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 120, 600, 180, "rgba(37,99,235,0.1)", 0), ic("zap", 120, 80, 48, "#60A5FA", 1), t("CLOUDNINE", 300, 80, 44, "#FFFFFF", "Space Grotesk"), t("Enterprise Cloud Solutions", 300, 215, 16, "rgba(255,255,255,0.5)", "Inter"), s("circle", 460, 50, 100, 100, "rgba(96,165,250,0.06)", 2)] },
  { id: "tpl_tech3", name: "AI / ML", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#020617", createdAt: 0, updatedAt: 0,
    elements: [s("hexagon", 220, 40, 160, 130, "rgba(99,102,241,0.12)", 0), ic("bolt", 300, 105, 40, "#818CF8", 1), t("SENTIENT", 300, 190, 40, "#FFFFFF", "Space Grotesk"), t("Artificial Intelligence", 300, 225, 13, "rgba(129,140,248,0.5)", "Inter"), s("circle", 520, 30, 40, 40, "rgba(99,102,241,0.08)", 2), s("circle", 60, 240, 30, 30, "rgba(99,102,241,0.06)", 2)] },

  /* ── Restaurant ── */
  { id: "tpl_rest1", name: "Bistro", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#F8F6F1", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 180, 600, 120, "#1E3A5F", 0), ic("coffee", 300, 70, 55, "#D97706", 1), t("CAFE", 300, 155, 46, "#1E3A5F", "Playfair Display"), t("Authentic Flavors", 300, 225, 15, "rgba(255,255,255,0.7)", "Inter")] },
  { id: "tpl_rest2", name: "Fine Dining", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#1C1C1E", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 100, 30, 400, 240, "#2D2D2F", 0), s("diamond", 260, 50, 80, 80, "#D4AF37", 1), t("MAISON", 300, 155, 44, "#FFFFFF", "Playfair Display"), t("Culinaire", 300, 195, 14, "#D4AF37", "Inter"), s("line", 220, 175, 160, 1, "rgba(212,175,55,0.3)", 2)] },
  { id: "tpl_rest3", name: "Food Truck", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFBEB", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 200, 600, 100, "#DC2626", 0), ic("star", 300, 75, 50, "#DC2626", 1), t("EL FUEGO", 300, 155, 44, "#DC2626", "Arial Black"), t("Tacos & Tequila", 300, 232, 15, "rgba(255,255,255,0.85)", "Inter")] },

  /* ── Fashion ── */
  { id: "tpl_fashion1", name: "Fashion Label", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("diamond", 260, 40, 80, 80, "#DC2626", 0), s("diamond", 270, 50, 60, 60, "#FFFFFF", 1), ic("heart", 300, 80, 30, "#DC2626", 2), t("LUXE", 300, 155, 50, "#0B192C", "Playfair Display"), t("Haute Couture", 300, 195, 14, "#DC2626", "Inter"), s("line", 140, 170, 320, 2, "#DC2626", 3)] },
  { id: "tpl_fashion2", name: "Streetwear", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#0B192C", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 20, 20, 260, 260, "rgba(255,255,255,0.03)", 0), s("rect", 320, 20, 260, 260, "rgba(255,255,255,0.03)", 1), ic("zap", 120, 80, 60, "#F59E0B", 2), t("URBAN", 300, 150, 52, "#FFFFFF", "Arial Black"), t("Edge", 480, 90, 36, "#F59E0B", "Outfit"), t("Est. 2026", 140, 180, 11, "rgba(255,255,255,0.2)", "Inter")] },

  /* ── Real Estate ── */
  { id: "tpl_re1", name: "Realty", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#F1F5F9", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 0, 600, 300, "#F1F5F9", 0), s("rect", 20, 20, 560, 260, "#FFFFFF", 1), ic("shield", 300, 75, 50, "#0F766E", 2), t("HOMELAND", 300, 155, 38, "#0F766E", "Outfit"), t("Find your place", 300, 190, 14, "#64748B", "Inter")] },
  { id: "tpl_re2", name: "Luxury Estates", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#0B192C", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 220, 600, 80, "rgba(212,175,55,0.9)", 0), ic("crown", 300, 65, 60, "#D4AF37", 1), t("SILVERCREST", 300, 150, 40, "#FFFFFF", "Playfair Display"), t("Luxury Real Estate", 300, 248, 14, "rgba(11,25,44,0.7)", "Inter")] },

  /* ── Education ── */
  { id: "tpl_edu1", name: "Academy", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 200, 600, 100, "#2563EB", 0), ic("star", 300, 70, 55, "#2563EB", 1), t("EDUQUEST", 300, 155, 40, "#0B192C", "Outfit"), t("Learn Without Limits", 300, 232, 14, "rgba(255,255,255,0.8)", "Inter")] },
  { id: "tpl_edu2", name: "University", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#F8F6F1", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 0, 600, 300, "#F8F6F1", 0), ic("book", 300, 65, 55, "#7C3AED", 1), t("MERIDIAN", 300, 150, 42, "#0B192C", "Georgia"), t("University of Excellence", 300, 192, 14, "#7C3AED", "Inter"), s("line", 180, 168, 240, 2, "#7C3AED", 2)] },

  /* ── Health ── */
  { id: "tpl_health1", name: "Wellness", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("circle", 140, 40, 120, 120, "rgba(22,163,74,0.08)", 0), ic("leaf", 300, 70, 55, "#16A34A", 1), t("VITALIS", 300, 160, 42, "#0B192C", "Outfit"), t("Wellness Redefined", 300, 198, 14, "#16A34A", "Inter")] },
  { id: "tpl_health2", name: "Medical", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#F0F9FF", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 0, 600, 300, "#F0F9FF", 0), s("circle", 230, 50, 140, 140, "#FFFFFF", 1), ic("heart", 300, 120, 40, "#DC2626", 2), t("AURA MEDICAL", 300, 210, 34, "#0B192C", "Outfit"), t("Advanced Healthcare", 300, 245, 13, "#64748B", "Inter")] },
  { id: "tpl_health3", name: "Yoga Studio", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FDF2F8", createdAt: 0, updatedAt: 0,
    elements: [s("circle", 250, 50, 100, 100, "rgba(236,72,153,0.06)", 0), ic("sun", 300, 100, 35, "#EC4899", 1), t("LOTUS", 300, 170, 40, "#0B192C", "Outfit"), t("Yoga & Mindfulness", 300, 205, 13, "#EC4899", "Inter")] },

  /* ── Sports ── */
  { id: "tpl_sport1", name: "Athletic", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("hexagon", 230, 30, 140, 120, "#DC2626", 0), ic("zap", 300, 90, 45, "#FFFFFF", 1), t("FUSION", 300, 190, 44, "#0B192C", "Arial Black"), t("Unleash Potential", 300, 230, 13, "#DC2626", "Inter")] },
  { id: "tpl_sport2", name: "Fitness", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#020617", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 230, 600, 70, "#DC2626", 0), ic("bolt", 120, 55, 55, "#DC2626", 1), t("IRONCLAD", 300, 150, 48, "#FFFFFF", "Arial Black"), t("Train. Compete. Conquer.", 300, 255, 13, "rgba(255,255,255,0.6)", "Inter"), s("line", 180, 175, 240, 3, "#DC2626", 2)] },

  /* ── New Categories ── */
  { id: "tpl_photo", name: "Photography", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#1C1C1E", createdAt: 0, updatedAt: 0,
    elements: [s("circle", 240, 40, 120, 120, "rgba(255,255,255,0.03)", 0), ic("camera", 300, 100, 40, "rgba(255,255,255,0.8)", 1), t("APERTURE", 300, 175, 42, "#FFFFFF", "Outfit"), t("Visual Storytelling", 300, 212, 13, "rgba(255,255,255,0.4)", "Inter")] },
  { id: "tpl_creative", name: "Creative Agency", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 0, 420, 300, "#0B192C", 0), s("rect", 420, 0, 180, 300, "#F59E0B", 1), ic("star", 120, 70, 50, "#F59E0B", 2), t("STUDIO", 120, 160, 52, "#FFFFFF", "Outfit"), t("Creative Agency", 120, 200, 14, "rgba(255,255,255,0.5)", "Inter"), s("diamond", 480, 100, 60, 60, "#FFFFFF", 2), t("C", 510, 130, 28, "#0B192C", "Outfit")] },
  { id: "tpl_music", name: "Music Label", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#0B192C", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 40, 40, 520, 220, "rgba(255,255,255,0.02)", 0), ic("music", 300, 75, 55, "#3B82F6", 1), t("ECHO", 300, 160, 46, "#FFFFFF", "Outfit"), t("Recordings", 300, 198, 14, "rgba(255,255,255,0.35)", "Inter"), s("line", 200, 186, 200, 1, "rgba(59,130,246,0.3)", 2)] },
  { id: "tpl_travel", name: "Travel Agency", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#F0F9FF", createdAt: 0, updatedAt: 0,
    elements: [ic("globe", 300, 65, 60, "#0891B2", 0), t("WANDERLUST", 300, 155, 42, "#0B192C", "Outfit"), t("Explore More", 300, 195, 14, "#0891B2", "Inter"), s("line", 190, 180, 220, 2, "#0891B2", 1)] },
  { id: "tpl_law", name: "Legal Firm", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#F8F6F1", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 20, 20, 560, 260, "#FFFFFF", 0), ic("shield", 300, 70, 55, "#1E3A5F", 1), t("HARCOURT", 300, 155, 40, "#1E3A5F", "Georgia"), t("Legal Advisors", 300, 192, 14, "#64748B", "Inter"), s("line", 190, 176, 220, 1, "#1E3A5F", 2)] },
  { id: "tpl_spa", name: "Spa & Beauty", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFF5F5", createdAt: 0, updatedAt: 0,
    elements: [s("circle", 230, 40, 140, 140, "rgba(236,72,153,0.05)", 0), ic("leaf", 300, 110, 36, "#EC4899", 1), t("SERENE", 300, 178, 40, "#0B192C", "Playfair Display"), t("Luxury Spa & Wellness", 300, 218, 12, "#EC4899", "Inter")] },
  { id: "tpl_pet", name: "Pet Care", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFBEB", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 0, 200, 600, 100, "#D97706", 0), ic("heart", 300, 65, 55, "#D97706", 1), t("PAWSOME", 300, 148, 44, "#0B192C", "Outfit"), t("Pet Care & Grooming", 300, 232, 14, "rgba(255,255,255,0.8)", "Inter")] },
  { id: "tpl_construction", name: "Construction", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#1C1C1E", createdAt: 0, updatedAt: 0,
    elements: [s("rect", 10, 10, 580, 280, "#2D2D2F", 0), ic("shield", 140, 80, 55, "#F59E0B", 1), t("BUILDWELL", 300, 155, 42, "#FFFFFF", "Arial Black"), t("Construction & Engineering", 300, 195, 13, "rgba(255,255,255,0.4)", "Inter"), s("rect", 380, 65, 140, 80, "rgba(245,158,11,0.15)", 2), s("diamond", 420, 65, 60, 60, "#F59E0B", 3)] },
  { id: "tpl_nonprofit", name: "Non-Profit", canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF", createdAt: 0, updatedAt: 0,
    elements: [s("circle", 40, 30, 100, 100, "rgba(22,163,74,0.06)", 0), s("circle", 80, 60, 100, 100, "rgba(22,163,74,0.05)", 1), ic("heart", 130, 110, 40, "#16A34A", 2), t("HOPE", 300, 120, 46, "#0B192C", "Outfit"), t("Building a better tomorrow", 300, 175, 14, "#16A34A", "Inter"), s("rect", 150, 220, 300, 50, "#16A34A", 3), t("Donate Now", 300, 245, 15, "#FFFFFF", "Outfit")] },
];
