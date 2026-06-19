export interface LogoElement {
  id: string;
  type: "text" | "icon" | "shape" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  zIndex: number;
  groupId?: string;

  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  textDecoration?: "none" | "underline";

  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  gradientType?: "none" | "linear" | "radial";
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;

  iconName?: string;
  shapeType?: "rect" | "circle" | "triangle" | "line" | "diamond" | "hexagon" | "star";

  imageSrc?: string;
  blur?: number;
}

export interface LogoProject {
  id: string;
  name: string;
  elements: LogoElement[];
  canvasWidth: number;
  canvasHeight: number;
  canvasBackground: string;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasSettings {
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  backgroundPreset: string;
}

export interface TemplateCategory {
  name: string;
  label: string;
}

export interface CanvasViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

export const DEFAULT_FONTS = [
  "Outfit", "Inter", "Georgia", "Playfair Display", "Arial Black",
  "Courier New", "Trebuchet MS", "Impact", "Garamond", "Roboto",
  "Montserrat", "Poppins", "Merriweather", "Space Grotesk",
  "Oswald", "Lora", "Nunito", "DM Sans",
];

export const SHAPES = ["rect", "circle", "triangle", "line", "diamond", "hexagon", "star"] as const;

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { name: "business", label: "Business" },
  { name: "tech", label: "Technology" },
  { name: "restaurant", label: "Restaurant" },
  { name: "fashion", label: "Fashion" },
  { name: "real-estate", label: "Real Estate" },
  { name: "education", label: "Education" },
  { name: "health", label: "Health" },
  { name: "sports", label: "Sports" },
];

export const CANVAS_PRESETS = [
  { label: "Social Square (1080×1080)", w: 1080, h: 1080 },
  { label: "Social Story (1080×1920)", w: 1080, h: 1920 },
  { label: "Banner (1200×628)", w: 1200, h: 628 },
  { label: "Business Card (1050×600)", w: 1050, h: 600 },
  { label: "Logo (600×300)", w: 600, h: 300 },
  { label: "Header (1920×400)", w: 1920, h: 400 },
  { label: "Square (500×500)", w: 500, h: 500 },
  { label: "Custom", w: 600, h: 300 },
];

export const BG_PRESETS = [
  { id: "solid-white", label: "White", bg: "#FFFFFF" },
  { id: "solid-light", label: "Light Gray", bg: "#F1F5F9" },
  { id: "solid-dark", label: "Dark", bg: "#1C1C1E" },
  { id: "solid-black", label: "Black", bg: "#000000" },
  { id: "transparent", label: "Transparent", bg: "transparent" },
  { id: "gradient-blue", label: "Blue Gradient", bg: "linear-gradient(135deg, #2563EB, #1E40AF)" },
  { id: "gradient-green", label: "Green Gradient", bg: "linear-gradient(135deg, #16A34A, #15803D)" },
  { id: "gradient-sunset", label: "Sunset", bg: "linear-gradient(135deg, #F59E0B, #DC2626)" },
  { id: "gradient-purple", label: "Purple", bg: "linear-gradient(135deg, #7C3AED, #4C1D95)" },
  { id: "gradient-ocean", label: "Ocean", bg: "linear-gradient(135deg, #0891B2, #0F766E)" },
];
