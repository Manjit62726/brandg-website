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

  iconName?: string;
  shapeType?: "rect" | "circle" | "triangle" | "line" | "diamond" | "hexagon" | "star";

  imageSrc?: string;
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

export interface TemplateCategory {
  name: string;
  label: string;
}

export interface CanvasViewport {
  zoom: number;
  panX: number;
  panY: number;
}

export const DEFAULT_FONTS = [
  "Outfit", "Inter", "Georgia", "Playfair Display", "Arial Black",
  "Courier New", "Trebuchet MS", "Impact", "Garamond", "Roboto",
  "Montserrat", "Poppins", "Merriweather", "Space Grotesk",
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
