"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LogoElement, LogoProject, CanvasViewport, CanvasSettings, Toast, CANVAS_PRESETS, BG_PRESETS, DEFAULT_FONTS } from "./types";
import { genId, createTextElement, createShapeElement, createIconElement, saveProjects, loadProjects, clamp, deepCloneProject, snapValue, getAlignedGuides } from "./utils";
import { getIconPaths, getIconPath } from "./icons";
import { TEMPLATES } from "./templates";

const DEFAULT_PROJECT: LogoProject = {
  id: genId(), name: "Untitled", elements: [],
  canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF",
  createdAt: Date.now(), updatedAt: Date.now(),
};

const DEFAULT_CANVAS: CanvasSettings = {
  showGrid: false, gridSize: 20, snapToGrid: false, showRulers: false, showGuides: true, backgroundPreset: "solid-white",
};

/* ── SVG icon components for toolbar ── */
function IconText() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9.5" y1="20" x2="14.5" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>; }
function IconShape() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>; }
function IconIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>; }
function IconImage() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>; }
function IconGroup() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="8" height="8" rx="1"/><rect x="14" y="10" width="8" height="8" rx="1"/></svg>; }
function IconUngroup() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/><line x1="10" y1="6" x2="14" y2="6"/><line x1="6" y1="10" x2="6" y2="14"/></svg>; }
function IconCopy() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>; }
function IconTrash() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>; }
function IconLock() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function IconBringForward() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 12 19 16 23 12"/><polyline points="5 12 1 16 9 12" transform="rotate(180 5 12)"/><rect x="7" y="10" width="10" height="8" rx="1"/></svg>; }
function IconSendBackward() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 12 19 8 23 12"/><polyline points="5 12 1 8 9 12" transform="rotate(180 5 12)"/><rect x="7" y="6" width="10" height="8" rx="1"/></svg>; }
function IconBringToFront() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 12 19 16 23 12"/><rect x="7" y="10" width="10" height="8" rx="1"/></svg>; }
function IconSendToBack() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 12 19 8 23 12"/><rect x="7" y="6" width="10" height="8" rx="1"/></svg>; }
function IconAlignLeft() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="17" y2="18"/></svg>; }
function IconAlignCenter() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="6" x2="19" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="18" y2="18"/></svg>; }
function IconAlignRight() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="7" y1="18" x2="21" y2="18"/></svg>; }
function IconAlignTop() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="18" y1="3" x2="18" y2="17"/></svg>; }
function IconAlignMiddle() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="5" x2="6" y2="19"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="18" y1="7" x2="18" y2="17"/></svg>; }
function IconAlignBottom() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="9" x2="6" y2="21"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="18" y1="7" x2="18" y2="21"/></svg>; }
function IconUndo() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>; }
function IconRedo() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>; }
function IconGrid() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function IconSnap() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="2"/></svg>; }
function IconGuides() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><line x1="6" y1="3" x2="6" y2="21"/><line x1="18" y1="3" x2="18" y2="21"/></svg>; }
function IconCheck() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconX() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconDownload() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconSave() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function IconNew() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconTemplates() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function IconSearch() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconFolder() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }

function escXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function applyGradient(ctx: CanvasRenderingContext2D, el: LogoElement, x: number, y: number, w: number, h: number) {
  if (el.gradientType === "linear") {
    const angle = (el.gradientAngle || 0) * (Math.PI / 180);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const cx = w / 2, cy = h / 2;
    const len = Math.sqrt(w * w + h * h) / 2;
    const x1 = cx - len * cos, y1 = cy - len * sin;
    const x2 = cx + len * cos, y2 = cy + len * sin;
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, el.gradientStart || el.fill || "#2563EB");
    g.addColorStop(1, el.gradientEnd || el.fill || "#1E40AF");
    return g;
  }
  if (el.gradientType === "radial") {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
    g.addColorStop(0, el.gradientStart || el.fill || "#2563EB");
    g.addColorStop(1, el.gradientEnd || el.fill || "#1E40AF");
    return g;
  }
  return el.fill || "#2563EB";
}

function drawElement(ctx: CanvasRenderingContext2D, el: LogoElement) {
  if (el.blur && el.blur > 0) ctx.filter = `blur(${el.blur}px)`;
  const fillOrGrad = applyGradient(ctx, el, 0, 0, el.width, el.height);
  if (el.type === "text") {
    ctx.font = `${el.fontStyle === "italic" ? "italic " : ""}${el.fontWeight || 400} ${el.fontSize}px "${el.fontFamily}", sans-serif`;
    ctx.textAlign = (el.textAlign as CanvasTextAlign) || "center";
    ctx.textBaseline = "middle";
    if (el.shadowColor) {
      ctx.shadowColor = el.shadowColor;
      ctx.shadowBlur = el.shadowBlur || 0;
      ctx.shadowOffsetX = el.shadowOffsetX || 0;
      ctx.shadowOffsetY = el.shadowOffsetY || 0;
    }
    ctx.fillStyle = fillOrGrad;
    ctx.fillText(el.text || "", el.width / 2, el.height / 2);
    if (el.stroke && el.stroke !== "none" && (el.strokeWidth || 0) > 0) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.strokeWidth || 2;
      ctx.strokeText(el.text || "", el.width / 2, el.height / 2);
    }
    ctx.shadowColor = "transparent";
    ctx.filter = "none";
  } else if (el.type === "icon") {
    ctx.fillStyle = fillOrGrad;
    const s = Math.min(el.width, el.height);
    ctx.save();
    ctx.translate(el.width / 2, el.height / 2);
    ctx.scale(s / 24, s / 24);
    ctx.translate(-12, -12);
    const d = getIconPath(el.iconName || "star");
    const p = new Path2D(d);
    ctx.fill(p);
    ctx.restore();
    ctx.filter = "none";
  } else if (el.type === "shape") {
    const cx = el.width / 2, cy = el.height / 2, r = Math.min(cx, cy);
    const drawShape = () => {
      if (el.shapeType === "rect") ctx.fillRect(0, 0, el.width, el.height);
      else if (el.shapeType === "circle") { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
      else if (el.shapeType === "triangle") { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(el.width, el.height); ctx.lineTo(0, el.height); ctx.closePath(); ctx.fill(); }
      else if (el.shapeType === "diamond") { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(el.width, cy); ctx.lineTo(cx, el.height); ctx.lineTo(0, cy); ctx.closePath(); ctx.fill(); }
      else if (el.shapeType === "hexagon") {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 6; const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
        ctx.closePath(); ctx.fill();
      } else if (el.shapeType === "star") {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const rad = i % 2 === 0 ? r : r * 0.4; const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
        ctx.closePath(); ctx.fill();
      } else if (el.shapeType === "line") {
        ctx.strokeStyle = fillOrGrad;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(el.width, cy); ctx.stroke();
      }
    };
    if (el.gradientType && el.gradientType !== "none") {
      ctx.fillStyle = fillOrGrad;
      drawShape();
    } else {
      ctx.fillStyle = el.fill || "#2563EB";
      drawShape();
    }
    if (el.stroke && el.stroke !== "none" && el.shapeType !== "line") {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.strokeWidth || 2;
      const redraw = () => {
        if (el.shapeType === "rect") ctx.strokeRect(0, 0, el.width, el.height);
        else if (el.shapeType === "circle") { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
        else if (el.shapeType === "triangle") { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(el.width, el.height); ctx.lineTo(0, el.height); ctx.closePath(); ctx.stroke(); }
        else if (el.shapeType === "diamond") { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(el.width, cy); ctx.lineTo(cx, el.height); ctx.lineTo(0, cy); ctx.closePath(); ctx.stroke(); }
        else if (el.shapeType === "hexagon") { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 6; const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.closePath(); ctx.stroke(); }
        else if (el.shapeType === "star") { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const rad = i % 2 === 0 ? r : r * 0.4; const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.closePath(); ctx.stroke(); }
      };
      redraw();
    }
    ctx.filter = "none";
  } else if (el.type === "image" && el.imageSrc) {
    const img = new Image();
    if (img.complete) ctx.drawImage(img, 0, 0, el.width, el.height);
    else { img.onload = () => ctx.drawImage(img, 0, 0, el.width, el.height); img.src = el.imageSrc; }
    ctx.filter = "none";
  }
}

export default function LogoEditorAdvanced() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<LogoProject>(() => {
    const saved = loadProjects();
    return saved.length > 0 ? saved[0] : { ...DEFAULT_PROJECT, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<CanvasViewport>({ zoom: 1, panX: 0, panY: 0 });
  const [dragMode, setDragMode] = useState<"none" | "move" | "resize" | "rotate" | "pan" | "marquee">("none");
  const [dragData, setDragData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"layers" | "text" | "color" | "icons" | "shapes" | "templates">("layers");
  const [showTemplates, setShowTemplates] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(DEFAULT_CANVAS);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [guides, setGuides] = useState<{ type: "h" | "v"; pos: number }[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [savedProjects, setSavedProjects] = useState<LogoProject[]>([]);
  const [showProjectLib, setShowProjectLib] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCanvasBg, setShowCanvasBg] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [history, setHistory] = useState<LogoProject[]>(() => [deepCloneProject(DEFAULT_PROJECT)]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const historyRef = useRef<LogoProject[]>([]);
  const historyIdxRef = useRef(0);
  const skipHistoryRef = useRef(false);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const sel = selectedIds.length === 1 ? project.elements.find((e) => e.id === selectedIds[0]) : null;

  /* ── Toast ── */
  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = genId();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  /* ── History ── */
  useEffect(() => { historyRef.current = history; historyIdxRef.current = historyIdx; }, [history, historyIdx]);

  useEffect(() => {
    if (!skipHistoryRef.current && project.elements.length > 0) {
      const h = historyRef.current; const hi = historyIdxRef.current;
      const newH = h.slice(0, hi + 1);
      newH.push(deepCloneProject(project));
      if (newH.length > 50) newH.shift();
      setHistory(newH); setHistoryIdx(newH.length - 1);
    }
    skipHistoryRef.current = false;
  }, [project]);

  /* ── Auto-save ── */
  useEffect(() => {
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      saveProjects([project]);
    }, 3000);
    return () => clearTimeout(autoSaveRef.current);
  }, [project]);

  /* ── Load saved projects list ── */
  useEffect(() => { setSavedProjects(loadProjects()); }, []);

  useEffect(() => { renderCanvas(); });

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    const newIdx = historyIdxRef.current - 1;
    const prev = historyRef.current[newIdx];
    if (prev) { skipHistoryRef.current = true; setProject(deepCloneProject(prev)); setHistoryIdx(newIdx); }
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    const newIdx = historyIdxRef.current + 1;
    const next = historyRef.current[newIdx];
    if (next) { skipHistoryRef.current = true; setProject(deepCloneProject(next)); setHistoryIdx(newIdx); }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === " " || e.code === "Space") { e.preventDefault(); setSpaceHeld(true); }
      if (e.key === "Delete" || e.key === "Backspace") { removeSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); duplicateSelected(); }
      if (e.key === "g" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); groupSelected(); }
      if (e.key === "g" && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); ungroupSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveProject(); addToast("Project saved"); }
    };
    const upHandler = (e: KeyboardEvent) => { if (e.key === " " || e.code === "Space") setSpaceHeld(false); };
    window.addEventListener("keydown", handler); window.addEventListener("keyup", upHandler);
    return () => { window.removeEventListener("keydown", handler); window.removeEventListener("keyup", upHandler); };
  }, [selectedIds]);

  const updateProject = useCallback((updater: (p: LogoProject) => void) => {
    setProject((prev) => { const next = { ...prev, elements: [...prev.elements], updatedAt: Date.now() }; updater(next); return next; });
  }, []);

  const addElement = useCallback((el: LogoElement) => {
    updateProject((p) => { el.zIndex = p.elements.length; p.elements.push(el); setSelectedIds([el.id]); });
  }, [updateProject]);

  const updateElement = useCallback((id: string, changes: Partial<LogoElement>) => {
    updateProject((p) => { const idx = p.elements.findIndex((e) => e.id === id); if (idx >= 0) p.elements[idx] = { ...p.elements[idx], ...changes }; });
  }, [updateProject]);

  const removeSelected = useCallback(() => {
    updateProject((p) => { p.elements = p.elements.filter((e) => !selectedIds.includes(e.id)); setSelectedIds([]); });
  }, [selectedIds, updateProject]);

  const duplicateSelected = useCallback(() => {
    updateProject((p) => {
      const newIds: string[] = [];
      for (const el of p.elements) { if (selectedIds.includes(el.id)) { const copy = { ...el, id: genId(), x: el.x + 10, y: el.y + 10, zIndex: p.elements.length }; p.elements.push(copy); newIds.push(copy.id); } }
      setSelectedIds(newIds);
    });
  }, [selectedIds, updateProject]);

  const sendBackward = useCallback(() => {
    updateProject((p) => { for (const id of selectedIds) { const i = p.elements.findIndex((e) => e.id === id); if (i > 0) { const tmp = p.elements[i]; p.elements[i] = { ...p.elements[i - 1], zIndex: i }; p.elements[i - 1] = { ...tmp, zIndex: i - 1 }; } } });
  }, [selectedIds, updateProject]);

  const bringForward = useCallback(() => {
    updateProject((p) => { for (const id of selectedIds) { const i = p.elements.findIndex((e) => e.id === id); if (i < p.elements.length - 1) { const tmp = p.elements[i]; p.elements[i] = { ...p.elements[i + 1], zIndex: i }; p.elements[i + 1] = { ...tmp, zIndex: i + 1 }; } } });
  }, [selectedIds, updateProject]);

  const sendToBack = useCallback(() => {
    updateProject((p) => { const selected = p.elements.filter((e) => selectedIds.includes(e.id)); const rest = p.elements.filter((e) => !selectedIds.includes(e.id)); p.elements = [...selected, ...rest].map((e, i) => ({ ...e, zIndex: i })); });
  }, [selectedIds, updateProject]);

  const bringToFront = useCallback(() => {
    updateProject((p) => { const selected = p.elements.filter((e) => selectedIds.includes(e.id)); const rest = p.elements.filter((e) => !selectedIds.includes(e.id)); p.elements = [...rest, ...selected].map((e, i) => ({ ...e, zIndex: i })); });
  }, [selectedIds, updateProject]);

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const gid = genId(); updateProject((p) => { for (const el of p.elements) { if (selectedIds.includes(el.id)) el.groupId = gid; } });
  }, [selectedIds, updateProject]);

  const ungroupSelected = useCallback(() => {
    updateProject((p) => { for (const el of p.elements) { if (selectedIds.includes(el.id) || (el.groupId && selectedIds.some((sid) => { const se = p.elements.find((e) => e.id === sid); return se && se.groupId === el.groupId; }))) el.groupId = undefined; } });
  }, [selectedIds, updateProject]);

  const alignElements = useCallback((dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (selectedIds.length < 2) return;
    updateProject((p) => {
      const els = p.elements.filter((e) => selectedIds.includes(e.id));
      if (dir === "left") { const mx = Math.min(...els.map((e) => e.x)); els.forEach((e) => e.x = mx); }
      else if (dir === "center") { const mx = Math.min(...els.map((e) => e.x + e.width / 2)); const mr = Math.max(...els.map((e) => e.x + e.width / 2)); els.forEach((e) => e.x = (mx + mr) / 2 - e.width / 2); }
      else if (dir === "right") { const mx = Math.max(...els.map((e) => e.x + e.width)); els.forEach((e) => e.x = mx - e.width); }
      else if (dir === "top") { const my = Math.min(...els.map((e) => e.y)); els.forEach((e) => e.y = my); }
      else if (dir === "middle") { const my = Math.min(...els.map((e) => e.y + e.height / 2)); const mr = Math.max(...els.map((e) => e.y + e.height / 2)); els.forEach((e) => e.y = (my + mr) / 2 - e.height / 2); }
      else if (dir === "bottom") { const my = Math.max(...els.map((e) => e.y + e.height)); els.forEach((e) => e.y = my - e.height); }
    });
  }, [selectedIds, updateProject]);

  const alignToCanvas = useCallback((dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (selectedIds.length === 0) return;
    updateProject((p) => { for (const id of selectedIds) { const el = p.elements.find((e) => e.id === id); if (!el) continue; if (dir === "left") el.x = 0; else if (dir === "center") el.x = (p.canvasWidth - el.width) / 2; else if (dir === "right") el.x = p.canvasWidth - el.width; else if (dir === "top") el.y = 0; else if (dir === "middle") el.y = (p.canvasHeight - el.height) / 2; else if (dir === "bottom") el.y = p.canvasHeight - el.height; } });
  }, [selectedIds, updateProject]);

  const lockSelected = useCallback(() => {
    updateProject((p) => { for (const id of selectedIds) { const el = p.elements.find((e) => e.id === id); if (el) el.locked = !el.locked; } });
  }, [selectedIds, updateProject]);

  const loadTemplate = useCallback((tpl: LogoProject) => {
    const fresh = { ...tpl, id: genId(), name: tpl.name + " (copy)", elements: tpl.elements.map((e) => ({ ...e, id: genId() })), createdAt: Date.now(), updatedAt: Date.now() };
    setProject(fresh); setProjectName(fresh.name); setSelectedIds([]); setShowTemplates(false);
  }, []);

  const newProject = useCallback(() => {
    const fresh = { ...DEFAULT_PROJECT, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
    setProject(fresh); setProjectName("Untitled"); setSelectedIds([]); setShowTemplates(true);
  }, []);

  const switchProject = useCallback((p: LogoProject) => {
    setProject(p); setProjectName(p.name); setSelectedIds([]); setShowProjectLib(false);
  }, []);

  const deleteProject = useCallback((id: string) => {
    const all = loadProjects().filter((x) => x.id !== id);
    saveProjects(all); setSavedProjects(all);
    if (project.id === id) { const fresh = { ...DEFAULT_PROJECT, id: genId(), createdAt: Date.now(), updatedAt: Date.now() }; setProject(fresh); setProjectName("Untitled"); }
    addToast("Project deleted");
  }, [project]);

  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id); setRenameValue(currentName);
  }, []);

  const finishRename = useCallback(() => {
    if (!renamingId) return;
    const all = loadProjects().map((p) => p.id === renamingId ? { ...p, name: renameValue || p.name } : p);
    saveProjects(all); setSavedProjects(all);
    if (project.id === renamingId) { setProjectName(renameValue || project.name); setProject((p) => ({ ...p, name: renameValue || p.name })); }
    setRenamingId(null);
  }, [renamingId, renameValue, project]);

  const saveProject = useCallback(() => {
    const p = { ...project, name: projectName, updatedAt: Date.now() };
    setProject(p);
    const all = loadProjects().filter((x) => x.id !== p.id);
    saveProjects([p, ...all].slice(0, 20));
    setSavedProjects([p, ...all].slice(0, 20));
    addToast("Project saved");
  }, [project, projectName, addToast]);

  /* ── Upload image ── */
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(src, img);
        const w = Math.min(img.naturalWidth, 300);
        const h = Math.min(img.naturalHeight, 300) * (w / Math.min(img.naturalWidth, 300));
        const el: LogoElement = { id: genId(), type: "image", x: 50, y: 50, width: w, height: h, rotation: 0, locked: false, visible: true, opacity: 1, zIndex: project.elements.length, imageSrc: src };
        addElement(el);
        addToast("Image added");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [addElement, addToast, project.elements.length]);

  /* ── Export ── */
  const exportPNG = useCallback((transparent = false, scale = 1) => {
    const canvas = document.createElement("canvas");
    const W = project.canvasWidth * scale, H = project.canvasHeight * scale;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    if (!transparent && project.canvasBackground && project.canvasBackground !== "transparent") {
      ctx.fillStyle = project.canvasBackground;
      ctx.fillRect(0, 0, project.canvasWidth, project.canvasHeight);
    }
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) { if (!el.visible) continue; ctx.save(); ctx.globalAlpha = el.opacity; ctx.translate(el.x + el.width / 2, el.y + el.height / 2); ctx.rotate((el.rotation * Math.PI) / 180); ctx.translate(-el.width / 2, -el.height / 2); drawElement(ctx, el); ctx.restore(); }
    const link = document.createElement("a");
    link.download = (projectName || "logo") + (transparent ? "-transparent" : "") + (scale > 1 ? "@" + scale + "x" : "") + ".png";
    link.href = canvas.toDataURL("image/png"); link.click();
    addToast(scale > 1 ? "High-res PNG exported" : transparent ? "Transparent PNG exported" : "PNG exported");
  }, [project, projectName, addToast]);

  const exportSVG = useCallback(() => {
    const W = project.canvasWidth, H = project.canvasHeight;
    const bg = project.canvasBackground;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    if (bg && bg !== "transparent") svg += `<rect width="${W}" height="${H}" fill="${bg}"/>`;
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      if (!el.visible) continue;
      svg += `<g transform="translate(${el.x},${el.y}) rotate(${el.rotation})" opacity="${el.opacity}">`;
      const fill = el.gradientType && el.gradientType !== "none"
        ? `url(#g_${el.id})` : (el.fill || "#2563EB");
      if (el.gradientType && el.gradientType !== "none") {
        svg += `<defs><linearGradient id="g_${el.id}" x1="0%" y1="0%" x2="100%" y2="100%">`;
        svg += `<stop offset="0%" stop-color="${el.gradientStart || el.fill}"/>`;
        svg += `<stop offset="100%" stop-color="${el.gradientEnd || el.fill}"/>`;
        svg += `</linearGradient></defs>`;
      }
      if (el.type === "text") {
        svg += `<text x="${el.width / 2}" y="${el.height / 2}" font-family="${el.fontFamily}" font-size="${el.fontSize}px" font-weight="${el.fontWeight}" font-style="${el.fontStyle}" fill="${fill}" text-anchor="${el.textAlign === "center" ? "middle" : el.textAlign === "right" ? "end" : "start"}" dominant-baseline="central">${escXml(el.text || "")}</text>`;
      } else if (el.type === "icon") {
        const d = getIconPath(el.iconName || "star");
        svg += `<g transform="translate(${el.width / 2},${el.height / 2}) scale(${Math.min(el.width, el.height) / 24}) translate(-12,-12)"><path d="${d}" fill="${fill}"/></g>`;
      } else if (el.type === "shape") {
        const cx = el.width / 2, cy = el.height / 2, r = Math.min(cx, cy);
        if (el.shapeType === "rect") svg += `<rect width="${el.width}" height="${el.height}" fill="${fill}" rx="2"/>`;
        else if (el.shapeType === "circle") svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
        else if (el.shapeType === "triangle") svg += `<polygon points="${cx},0 ${el.width},${el.height} 0,${el.height}" fill="${fill}"/>`;
        else if (el.shapeType === "diamond") svg += `<polygon points="${cx},0 ${el.width},${cy} ${cx},${el.height} 0,${cy}" fill="${fill}"/>`;
        else if (el.shapeType === "hexagon") { const p = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(" "); svg += `<polygon points="${p}" fill="${fill}"/>`; }
        else if (el.shapeType === "star") { const p = Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rad = i % 2 === 0 ? r : r * 0.4; return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`; }).join(" "); svg += `<polygon points="${p}" fill="${fill}"/>`; }
        else if (el.shapeType === "line") svg += `<line x1="0" y1="${cy}" x2="${el.width}" y2="${cy}" stroke="${fill}" stroke-width="3"/>`;
      } else if (el.type === "image" && el.imageSrc) {
        svg += `<image href="${el.imageSrc}" width="${el.width}" height="${el.height}"/>`;
      }
      svg += `</g>`;
    }
    svg += `</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a"); link.download = (projectName || "logo") + ".svg"; link.href = URL.createObjectURL(blob); link.click(); URL.revokeObjectURL(link.href);
    addToast("SVG exported");
  }, [project, projectName, addToast]);

  const exportFavicon = useCallback(() => {
    exportPNG(false, 64 / Math.max(project.canvasWidth, project.canvasHeight));
  }, [exportPNG]);

  /* ── Canvas rendering ── */
  function renderCanvas() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = project.canvasWidth, H = project.canvasHeight;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    if (project.canvasBackground && project.canvasBackground !== "transparent") {
      if (project.canvasBackground.startsWith("linear-gradient")) {
        const match = project.canvasBackground.match(/linear-gradient\(([^)]+)\)/);
        if (match) {
          const parts = match[1].split(",").map(s => s.trim());
          if (parts.length >= 2) {
            const g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, parts[0].replace(/^\d+deg\s*/, ""));
            g.addColorStop(1, parts[parts.length - 1]);
            ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
          }
        }
      } else { ctx.fillStyle = project.canvasBackground; ctx.fillRect(0, 0, W, H); }
    }
    if (canvasSettings.showGrid) {
      ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += canvasSettings.gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += canvasSettings.gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      if (!el.visible) continue;
      ctx.save(); ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-el.width / 2, -el.height / 2);
      drawElement(ctx, el);
      ctx.restore();
      if (selectedIds.includes(el.id)) {
        ctx.save(); ctx.strokeStyle = "#2563EB"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.strokeRect(el.x - 2, el.y - 2, el.width + 4, el.height + 4); ctx.setLineDash([]);
        const hs = 6; ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#2563EB"; ctx.lineWidth = 1.5;
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const hx = el.x + (dx > 0 ? el.width : 0); const hy = el.y + (dy > 0 ? el.height : 0); ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs); ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs); }
        ctx.restore();
      }
    }
    for (const g of guides) {
      ctx.save(); ctx.strokeStyle = "#FF0000"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      if (g.type === "v") { ctx.beginPath(); ctx.moveTo(g.pos, 0); ctx.lineTo(g.pos, H); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(0, g.pos); ctx.lineTo(W, g.pos); ctx.stroke(); }
      ctx.setLineDash([]); ctx.restore();
    }
    if (marquee) {
      ctx.save(); ctx.strokeStyle = "#2563EB"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.fillStyle = "rgba(37,99,235,0.08)"; ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.setLineDash([]); ctx.restore();
    }
  }

  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>): { cx: number; cy: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    return { cx: mx * (project.canvasWidth / rect.width), cy: my * (project.canvasHeight / rect.height) };
  }

  function handleCanvasDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (e.button === 1 || spaceHeld) { setDragMode("pan"); setDragData({ sx: e.clientX, sy: e.clientY, px: view.panX, py: view.panY }); return; }
    const { cx, cy } = getCanvasCoords(e);
    const sorted = [...project.elements].sort((a, b) => b.zIndex - a.zIndex);
    for (const el of sorted) {
      if (!el.visible || el.locked) continue;
      if (cx >= el.x && cx <= el.x + el.width && cy >= el.y && cy <= el.y + el.height) {
        let newSel: string[];
        if (e.shiftKey) { newSel = selectedIds.includes(el.id) ? selectedIds.filter((id) => id !== el.id) : [...selectedIds, el.id]; }
        else { newSel = selectedIds.includes(el.id) && selectedIds.length > 1 ? selectedIds : [el.id]; }
        setSelectedIds(newSel);
        setDragMode("move");
        const origs: Record<string, { x: number; y: number }> = {};
        for (const id of newSel) { const ee = project.elements.find((x) => x.id === id); if (ee) origs[id] = { x: ee.x, y: ee.y }; }
        setDragData({ mx: cx, my: cy, origs }); return;
      }
    }
    setDragMode("marquee"); setDragData({ mx: cx, my: cy });
    if (!e.shiftKey) setSelectedIds([]);
  }

  function handleCanvasMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragMode === "pan" && dragData) { const dx = e.clientX - dragData.sx, dy = e.clientY - dragData.sy; setView((v) => ({ ...v, panX: dragData.px + dx, panY: dragData.py + dy })); return; }
    if (dragMode === "move" && dragData) {
      let { cx, cy } = getCanvasCoords(e);
      let dx = cx - dragData.mx, dy = cy - dragData.my;
      if (canvasSettings.snapToGrid) { const first = project.elements.find((el) => selectedIds.includes(el.id)); if (first) { dx = snapValue(first.x + dx, canvasSettings.gridSize) - first.x; dy = snapValue(first.y + dy, canvasSettings.gridSize) - first.y; } }
      if (canvasSettings.showGuides && selectedIds.length === 1) {
        const result = getAlignedGuides(selectedIds[0], project.elements, dx, dy);
        setGuides(result.guides);
        if (result.hx !== undefined) dx = result.hx;
        if (result.hy !== undefined) dy = result.hy;
      }
      updateProject((p) => { for (const id of selectedIds) { const el = p.elements.find((x) => x.id === id); if (el && dragData.origs[id]) { el.x = dragData.origs[id].x + dx; el.y = dragData.origs[id].y + dy; if (el.groupId) { for (const ge of p.elements) { if (ge.groupId === el.groupId && !selectedIds.includes(ge.id)) { ge.x = ge.x + dx; ge.y = ge.y + dy; } } } } } });
      return;
    }
    if (dragMode === "marquee" && dragData) { const { cx, cy } = getCanvasCoords(e); setMarquee({ x: Math.min(dragData.mx, cx), y: Math.min(dragData.my, cy), w: Math.abs(cx - dragData.mx), h: Math.abs(cy - dragData.my) }); }
  }

  function handleCanvasUp() {
    if (dragMode === "marquee" && marquee) {
      const ids = project.elements.filter((el) => { if (!el.visible) return false; return el.x + el.width > marquee.x && el.x < marquee.x + marquee.w && el.y + el.height > marquee.y && el.y < marquee.y + marquee.h; }).map((el) => el.id);
      setSelectedIds(ids); setMarquee(null);
    }
    setDragMode("none"); setDragData(null); setGuides([]);
  }

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setView((v) => ({ ...v, zoom: clamp(v.zoom - e.deltaY * 0.001, 0.25, 4) })); }
    else { setView((v) => ({ ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY })); }
  };

  const filteredIcons = getIconPaths().filter((name) => name.toLowerCase().includes(iconSearch.toLowerCase()));
  const filteredTemplates = TEMPLATES.filter((t) => {
    if (templateCategory) {
      const catMap: Record<string, string[]> = {
        business: ["Corporate Pro"], tech: ["Tech Startup"], restaurant: ["Bistro"],
        fashion: ["Fashion Label"], "real-estate": ["Realty"], education: ["Academy"],
        health: ["Wellness"], sports: ["Athletic"],
      };
      if (!catMap[templateCategory]?.includes(t.name)) return false;
    }
    if (templateSearch && !t.name.toLowerCase().includes(templateSearch.toLowerCase())) return false;
    return true;
  });

  /* ── Render ── */
  return (
    <section className="le-section">
      {toasts.map((t) => (
        <div key={t.id} className={`le-toast le-toast-${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✗" : "i"}</span>
          {t.message}
        </div>
      ))}
      <div className="le-wrap" ref={wrapRef}>
        {/* ── TOP BAR ── */}
        <div className="le-topbar">
          <div className="le-topbar-left">
            <input className="le-name-input" value={projectName} onChange={(e) => setProjectName(e.target.value)} onBlur={saveProject} />
            <button className="le-btn-sm" onClick={newProject} title="New Project"><IconNew /> New</button>
            <button className="le-btn-sm" onClick={() => setShowTemplates(true)} title="Templates"><IconTemplates /> Templates</button>
            <div className="le-project-lib">
              <button className="le-btn-sm" onClick={() => { setSavedProjects(loadProjects()); setShowProjectLib(!showProjectLib); }} title="Projects"><IconFolder /> ({savedProjects.length})</button>
              {showProjectLib && (
                <div className="le-project-dropdown">
                  <div className="le-project-dd-head">Saved Projects</div>
                  {savedProjects.length === 0 && <div className="le-project-dd-empty">No saved projects</div>}
                  {savedProjects.map((p) => (
                    <div key={p.id} className={`le-project-dd-item${p.id === project.id ? " active" : ""}`} onClick={() => switchProject(p)}>
                      {renamingId === p.id ? (
                        <input className="le-project-rename-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={finishRename} onKeyDown={(e) => { if (e.key === "Enter") finishRename(); }} autoFocus onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <span className="le-project-dd-name" onDoubleClick={() => startRename(p.id, p.name)}>{p.name}</span>
                      )}
                      <span className="le-project-dd-date">{new Date(p.updatedAt).toLocaleDateString()}</span>
                      <button className="le-project-dd-del" onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}><IconX /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="le-topbar-center">
            <button className="le-btn-sm" onClick={undo} title="Undo (Ctrl+Z)"><IconUndo /></button>
            <button className="le-btn-sm" onClick={redo} title="Redo (Ctrl+Shift+Z)"><IconRedo /></button>
            <span className="le-tool-sep" />
            <button className={`le-btn-sm${canvasSettings.showGrid ? " active" : ""}`} onClick={() => setCanvasSettings((s) => ({ ...s, showGrid: !s.showGrid }))} title="Toggle Grid"><IconGrid /></button>
            <button className={`le-btn-sm${canvasSettings.snapToGrid ? " active" : ""}`} onClick={() => setCanvasSettings((s) => ({ ...s, snapToGrid: !s.snapToGrid }))} title="Snap to Grid"><IconSnap /></button>
            <button className={`le-btn-sm${canvasSettings.showGuides ? " active" : ""}`} onClick={() => setCanvasSettings((s) => ({ ...s, showGuides: !s.showGuides }))} title="Alignment Guides"><IconGuides /></button>
            <span className="le-tool-sep" />
            <select className="le-canvas-preset" value={`${project.canvasWidth}x${project.canvasHeight}`} onChange={(e) => { const [w, h] = e.target.value.split("x").map(Number); updateProject((p) => { p.canvasWidth = w; p.canvasHeight = h; }); }}>
              {CANVAS_PRESETS.map((p) => (<option key={`${p.w}x${p.h}`} value={`${p.w}x${p.h}`}>{p.label}</option>))}
            </select>
          </div>
          <div className="le-topbar-right">
            <button className="le-btn-sm" onClick={saveProject} title="Save (Ctrl+S)"><IconSave /> Save</button>
            <button className="le-btn-sm" onClick={() => setShowExportModal(true)} title="Export"><IconDownload /> Export</button>
          </div>
        </div>

        {/* ── EDITOR ── */}
        <div className="le-editor">
          {/* Toolbar */}
          <div className="le-toolbar">
            <button className="le-tool-btn" onClick={() => addElement(createTextElement("Text", 100, 100))} title="Add Text (T)"><IconText /></button>
            <button className="le-tool-btn" onClick={() => addElement(createShapeElement("rect", 100, 100))} title="Add Shape"><IconShape /></button>
            <button className="le-tool-btn" onClick={() => addElement(createIconElement("star", 100, 100))} title="Add Icon"><IconIcon /></button>
            <label className="le-tool-btn le-tool-upload" title="Upload Image">
              <IconImage />
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
            </label>
            <span className="le-tool-sep" />
            {selectedIds.length > 0 && (
              <>
                {selectedIds.length >= 2 && (
                  <><button className="le-tool-btn" onClick={groupSelected} title="Group (Ctrl+G)"><IconGroup /></button><button className="le-tool-btn" onClick={ungroupSelected} title="Ungroup (Ctrl+Shift+G)"><IconUngroup /></button><span className="le-tool-sep" /></>
                )}
                <button className="le-tool-btn" onClick={duplicateSelected} title="Duplicate (Ctrl+D)"><IconCopy /></button>
                <button className="le-tool-btn" onClick={removeSelected} title="Delete (Del)"><IconTrash /></button>
                <button className={`le-tool-btn${sel?.locked ? " active" : ""}`} onClick={lockSelected} title="Toggle Lock"><IconLock /></button>
                <span className="le-tool-sep" />
                <button className="le-tool-btn" onClick={bringForward} title="Bring Forward"><IconBringForward /></button>
                <button className="le-tool-btn" onClick={sendBackward} title="Send Backward"><IconSendBackward /></button>
                <button className="le-tool-btn" onClick={bringToFront} title="Bring to Front"><IconBringToFront /></button>
                <button className="le-tool-btn" onClick={sendToBack} title="Send to Back"><IconSendToBack /></button>
                <span className="le-tool-sep" />
                {selectedIds.length >= 2 && (
                  <><span className="le-tool-label">Align:</span>
                    <button className="le-tool-btn" onClick={() => alignElements("left")} title="Align Left"><IconAlignLeft /></button>
                    <button className="le-tool-btn" onClick={() => alignElements("center")} title="Align Center"><IconAlignCenter /></button>
                    <button className="le-tool-btn" onClick={() => alignElements("right")} title="Align Right"><IconAlignRight /></button>
                    <button className="le-tool-btn" onClick={() => alignElements("top")} title="Align Top"><IconAlignTop /></button>
                    <button className="le-tool-btn" onClick={() => alignElements("middle")} title="Align Middle"><IconAlignMiddle /></button>
                    <button className="le-tool-btn" onClick={() => alignElements("bottom")} title="Align Bottom"><IconAlignBottom /></button>
                    <span className="le-tool-sep" /></>
                )}
                <span className="le-tool-label">Canvas:</span>
                <button className="le-tool-btn" onClick={() => alignToCanvas("center")} title="Center Horizontally"><IconAlignCenter /></button>
                <button className="le-tool-btn" onClick={() => alignToCanvas("middle")} title="Center Vertically"><IconAlignMiddle /></button>
              </>
            )}
          </div>

          <div className="le-body">
            {/* ── LEFT SIDEBAR ── */}
            <div className="le-sidebar">
              <div className="le-sidebar-tabs">
                <button className={`le-stab${activeTab === "layers" ? " active" : ""}`} onClick={() => setActiveTab("layers")}>Layers</button>
                <button className={`le-stab${activeTab === "icons" ? " active" : ""}`} onClick={() => setActiveTab("icons")}>Icons</button>
                <button className={`le-stab${activeTab === "shapes" ? " active" : ""}`} onClick={() => setActiveTab("shapes")}>Shapes</button>
              </div>
              <div className="le-sidebar-body">
                {activeTab === "layers" && (
                  <div className="le-layers">
                    {[...project.elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => (
                      <div key={el.id} className={`le-layer${selectedIds.includes(el.id) ? " active" : ""}${el.locked ? " locked" : ""}${el.groupId ? " grouped" : ""}`} onClick={() => setSelectedIds([el.id])}>
                        <span className="le-layer-icon">{el.type === "text" ? "T" : el.type === "icon" ? "I" : el.type === "shape" ? "S" : "M"}</span>
                        <span className="le-layer-name">{el.text || el.iconName || el.shapeType || el.type}</span>
                        {el.groupId && <span className="le-layer-badge">G</span>}
                        <button className="le-layer-btn" onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }} title="Lock">{el.locked ? "🔒" : "🔓"}</button>
                        <button className="le-layer-btn" onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }} title="Toggle visibility">{el.visible ? "👁" : "—"}</button>
                      </div>
                    ))}
                    {project.elements.length === 0 && <div className="le-layer-empty">No elements yet</div>}
                  </div>
                )}
                {activeTab === "icons" && (
                  <div className="le-icon-section">
                    <div className="le-icon-search">
                      <IconSearch /><input className="le-icon-search-input" placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} />
                    </div>
                    <div className="le-icon-grid">
                      {filteredIcons.map((name) => (
                        <button key={name} className="le-icon-btn" onClick={() => addElement(createIconElement(name, 100, 100))} title={name}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={getIconPath(name)} /></svg>
                        </button>
                      ))}
                      {filteredIcons.length === 0 && <div className="le-icon-empty">No icons match</div>}
                    </div>
                  </div>
                )}
                {activeTab === "shapes" && (
                  <div className="le-shape-grid">
                    {["rect", "circle", "triangle", "diamond", "hexagon", "star", "line"].map((st) => (
                      <button key={st} className="le-shape-btn" onClick={() => addElement(createShapeElement(st as any, 100, 100))}>
                        {st === "rect" && <svg width="22" height="22" viewBox="0 0 22 22"><rect x="1" y="1" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>}
                        {st === "circle" && <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>}
                        {st === "triangle" && <svg width="22" height="22" viewBox="0 0 22 22"><polygon points="11,1 21,21 1,21" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>}
                        {st === "diamond" && <svg width="22" height="22" viewBox="0 0 22 22"><polygon points="11,1 21,11 11,21 1,11" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>}
                        {st === "hexagon" && <svg width="22" height="22" viewBox="0 0 22 22"><polygon points="11,1 20,6 20,16 11,21 2,16 2,6" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>}
                        {st === "star" && <svg width="22" height="22" viewBox="0 0 22 22"><polygon points="11,1 13.5,8 21,8 15,12.5 17,20 11,15.5 5,20 7,12.5 1,8 8.5,8" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>}
                        {st === "line" && <svg width="22" height="22" viewBox="0 0 22 22"><line x1="1" y1="11" x2="21" y2="11" stroke="currentColor" strokeWidth="2"/></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── CANVAS ── */}
            <div className="le-canvas-area">
              <div className="le-canvas-scroll" style={{ transform: `scale(${view.zoom}) translate(${view.panX / view.zoom}px, ${view.panY / view.zoom}px)`, transformOrigin: "0 0" }}>
                <canvas ref={canvasRef} className="le-canvas" onMouseDown={handleCanvasDown} onMouseMove={handleCanvasMove} onMouseUp={handleCanvasUp} onMouseLeave={handleCanvasUp} onWheel={handleCanvasWheel} />
              </div>
              <div className="le-zoom-bar">
                <button className="le-zoom-btn" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom - 0.1, 0.25, 4) }))}>-</button>
                <span className="le-zoom-label">{Math.round(view.zoom * 100)}%</span>
                <button className="le-zoom-btn" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom + 0.1, 0.25, 4) }))}>+</button>
                <button className="le-zoom-btn" onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })}>Fit</button>
                <span className="le-zoom-label">{project.canvasWidth}×{project.canvasHeight}</span>
              </div>
            </div>

            {/* ── PROPERTIES ── */}
            <div className="le-props">
              <div className="le-props-tabs">
                <button className={`le-stab${activeTab === "text" ? " active" : ""}`} onClick={() => setActiveTab("text")}>Text</button>
                <button className={`le-stab${activeTab === "color" ? " active" : ""}`} onClick={() => setActiveTab("color")}>Color</button>
              </div>
              <div className="le-sidebar-body">
                {!sel && !showCanvasBg && <div className="le-prop-empty">Select an element</div>}
                {!sel && (
                  <button className="le-prop-bg-btn" onClick={() => setShowCanvasBg(!showCanvasBg)}>
                    {showCanvasBg ? "← Element Props" : "Canvas Background →"}
                  </button>
                )}
                {showCanvasBg && (
                  <div className="le-prop-group">
                    <label className="le-prop-label">Background Presets</label>
                    <div className="le-bg-presets">
                      {BG_PRESETS.map((bp) => (
                        <button key={bp.id} className={`le-bg-preset-btn${project.canvasBackground === bp.bg ? " active" : ""}`} onClick={() => updateProject((p) => { p.canvasBackground = bp.bg; })} title={bp.label}>
                          {bp.bg.startsWith("linear") ? (
                            <span className="le-bg-preset-swatch" style={{ background: bp.bg }} />
                          ) : (
                            <span className="le-bg-preset-swatch" style={{ background: bp.bg === "transparent" ? "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%) 50% / 10px 10px" : bp.bg }} />
                          )}
                          <span className="le-bg-preset-label">{bp.label}</span>
                        </button>
                      ))}
                    </div>
                    <label className="le-prop-label">Custom Color</label>
                    <div className="le-prop-color-row">
                      <input className="le-prop-color" type="color" value={project.canvasBackground === "transparent" ? "#FFFFFF" : project.canvasBackground} onChange={(e) => updateProject((p) => { p.canvasBackground = e.target.value; })} />
                      <input className="le-prop-input" value={project.canvasBackground} onChange={(e) => updateProject((p) => { p.canvasBackground = e.target.value; })} placeholder="#HEX" />
                    </div>
                  </div>
                )}
                {sel && sel.type === "text" && activeTab === "text" && (
                  <div className="le-prop-group">
                    <label className="le-prop-label">Text</label>
                    <input className="le-prop-input" value={sel.text || ""} onChange={(e) => updateElement(sel.id, { text: e.target.value })} />
                    <label className="le-prop-label">Font</label>
                    <select className="le-prop-select" value={sel.fontFamily} onChange={(e) => updateElement(sel.id, { fontFamily: e.target.value })}>
                      {DEFAULT_FONTS.map((f) => (<option key={f} value={f}>{f}</option>))}
                    </select>
                    <label className="le-prop-label">Size</label>
                    <input className="le-prop-input" type="number" value={sel.fontSize} onChange={(e) => updateElement(sel.id, { fontSize: +e.target.value })} min={8} max={200} />
                    <div className="le-prop-row">
                      <div><label className="le-prop-label">Weight</label><select className="le-prop-select" value={sel.fontWeight} onChange={(e) => updateElement(sel.id, { fontWeight: +e.target.value })}><option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={700}>Bold</option><option value={800}>Extra Bold</option><option value={900}>Black</option></select></div>
                      <div><label className="le-prop-label">Style</label><select className="le-prop-select" value={sel.fontStyle} onChange={(e) => updateElement(sel.id, { fontStyle: e.target.value as any })}><option value="normal">Normal</option><option value="italic">Italic</option></select></div>
                    </div>
                    <label className="le-prop-label">Decoration</label>
                    <select className="le-prop-select" value={sel.textDecoration || "none"} onChange={(e) => updateElement(sel.id, { textDecoration: e.target.value as any })}><option value="none">None</option><option value="underline">Underline</option></select>
                    <label className="le-prop-label">Alignment</label>
                    <div className="le-prop-row">
                      {(["left", "center", "right"] as const).map((a) => (<button key={a} className={`le-prop-btn${sel.textAlign === a ? " active" : ""}`} onClick={() => updateElement(sel.id, { textAlign: a })}>{a === "left" ? "L" : a === "center" ? "C" : "R"}</button>))}
                    </div>
                    <label className="le-prop-label">Letter Spacing</label>
                    <input className="le-prop-input" type="number" value={sel.letterSpacing || 0} onChange={(e) => updateElement(sel.id, { letterSpacing: +e.target.value })} step={0.5} />
                    <label className="le-prop-label">Line Height</label>
                    <input className="le-prop-input" type="number" value={sel.lineHeight || 1.2} onChange={(e) => updateElement(sel.id, { lineHeight: +e.target.value })} step={0.1} min={0.5} max={3} />
                  </div>
                )}
                {(activeTab === "color" || (sel && sel.type !== "text")) && sel && (
                  <div className="le-prop-group">
                    <details className="le-prop-details" open>
                      <summary>Fill</summary>
                      <label className="le-prop-label">Color / HEX</label>
                      <div className="le-prop-color-row">
                        <input className="le-prop-color" type="color" value={sel.fill || "#2563EB"} onChange={(e) => updateElement(sel.id, { fill: e.target.value })} />
                        <input className="le-prop-input" value={sel.fill || ""} onChange={(e) => updateElement(sel.id, { fill: e.target.value })} placeholder="#HEX" />
                      </div>
                      <div className="le-prop-presets">
                        {["#2563EB", "#16A34A", "#DC2626", "#D97706", "#7C3AED", "#0891B2", "#0F766E", "#1C1C1E", "#FFFFFF", "#0B192C", "#F59E0B", "#EC4899"].map((c) => (
                          <button key={c} className={`le-preset-btn${sel.fill === c ? " active" : ""}`} style={{ background: c, border: c === "#FFFFFF" ? "1px solid rgba(255,255,255,0.15)" : "none" }} onClick={() => updateElement(sel.id, { fill: c })} />
                        ))}
                      </div>
                      <label className="le-prop-label">Gradient</label>
                      <select className="le-prop-select" value={sel.gradientType || "none"} onChange={(e) => updateElement(sel.id, { gradientType: e.target.value as any })}>
                        <option value="none">Solid</option>
                        <option value="linear">Linear Gradient</option>
                        <option value="radial">Radial Gradient</option>
                      </select>
                      {sel.gradientType && sel.gradientType !== "none" && (
                        <>
                          <label className="le-prop-label">Start Color</label>
                          <div className="le-prop-color-row">
                            <input className="le-prop-color" type="color" value={sel.gradientStart || sel.fill || "#2563EB"} onChange={(e) => updateElement(sel.id, { gradientStart: e.target.value })} />
                            <input className="le-prop-input" value={sel.gradientStart || ""} onChange={(e) => updateElement(sel.id, { gradientStart: e.target.value })} placeholder="#HEX" />
                          </div>
                          <label className="le-prop-label">End Color</label>
                          <div className="le-prop-color-row">
                            <input className="le-prop-color" type="color" value={sel.gradientEnd || sel.fill || "#1E40AF"} onChange={(e) => updateElement(sel.id, { gradientEnd: e.target.value })} />
                            <input className="le-prop-input" value={sel.gradientEnd || ""} onChange={(e) => updateElement(sel.id, { gradientEnd: e.target.value })} placeholder="#HEX" />
                          </div>
                          {sel.gradientType === "linear" && (
                            <><label className="le-prop-label">Angle (°)</label><input className="le-prop-input" type="number" value={sel.gradientAngle || 0} onChange={(e) => updateElement(sel.id, { gradientAngle: +e.target.value })} step={15} /></>
                          )}
                        </>
                      )}
                    </details>
                    <details className="le-prop-details">
                      <summary>Stroke / Border</summary>
                      <div className="le-prop-color-row">
                        <input className="le-prop-color" type="color" value={(sel.stroke && sel.stroke !== "none") ? sel.stroke : "#000000"} onChange={(e) => updateElement(sel.id, { stroke: e.target.value })} />
                        <input className="le-prop-input" value={sel.stroke && sel.stroke !== "none" ? sel.stroke : ""} onChange={(e) => updateElement(sel.id, { stroke: e.target.value || "none" })} placeholder="none" />
                      </div>
                      {(sel.stroke && sel.stroke !== "none") && (<><label className="le-prop-label">Width</label><input className="le-prop-input" type="number" value={sel.strokeWidth || 2} onChange={(e) => updateElement(sel.id, { strokeWidth: +e.target.value })} min={1} max={20} /></>)}
                    </details>
                    <details className="le-prop-details">
                      <summary>Shadow</summary>
                      <div className="le-prop-color-row">
                        <input className="le-prop-color" type="color" value={sel.shadowColor || "#000000"} onChange={(e) => updateElement(sel.id, { shadowColor: e.target.value })} />
                        <input className="le-prop-input" value={sel.shadowColor || ""} onChange={(e) => updateElement(sel.id, { shadowColor: e.target.value || "" })} placeholder="none" />
                      </div>
                      {sel.shadowColor && (<><label className="le-prop-label">Blur</label><input className="le-prop-input" type="number" value={sel.shadowBlur || 4} onChange={(e) => updateElement(sel.id, { shadowBlur: +e.target.value })} min={0} max={50} /></>)}
                      {sel.shadowColor && (<><label className="le-prop-label">X</label><input className="le-prop-input" type="number" value={sel.shadowOffsetX || 2} onChange={(e) => updateElement(sel.id, { shadowOffsetX: +e.target.value })} /></>)}
                      {sel.shadowColor && (<><label className="le-prop-label">Y</label><input className="le-prop-input" type="number" value={sel.shadowOffsetY || 2} onChange={(e) => updateElement(sel.id, { shadowOffsetY: +e.target.value })} /></>)}
                    </details>
                    <label className="le-prop-label">Opacity</label>
                    <input className="le-prop-range" type="range" min={0.1} max={1} step={0.05} value={sel.opacity} onChange={(e) => updateElement(sel.id, { opacity: +e.target.value })} />
                    {sel.type !== "text" && (<><label className="le-prop-label">Width</label><input className="le-prop-input" type="number" value={sel.width} onChange={(e) => updateElement(sel.id, { width: Math.max(10, +e.target.value) })} min={10} /><label className="le-prop-label">Height</label><input className="le-prop-input" type="number" value={sel.height} onChange={(e) => updateElement(sel.id, { height: Math.max(10, +e.target.value) })} min={10} /></>)}
                    <label className="le-prop-label">Rotation (°)</label>
                    <input className="le-prop-input" type="number" value={sel.rotation} onChange={(e) => updateElement(sel.id, { rotation: +e.target.value })} step={5} />
                    <label className="le-prop-label">Blur</label>
                    <input className="le-prop-range" type="range" min={0} max={20} step={0.5} value={sel.blur || 0} onChange={(e) => updateElement(sel.id, { blur: +e.target.value })} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── TEMPLATE MODAL ── */}
        {showTemplates && (
          <div className="le-overlay" onClick={() => setShowTemplates(false)}>
            <div className="le-modal le-modal-tpl" onClick={(e) => e.stopPropagation()}>
              <div className="le-modal-head">
                <h3>Logo Templates</h3>
                <div className="le-modal-search">
                  <IconSearch />
                  <input className="le-modal-search-input" placeholder="Search templates..." value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)} />
                </div>
                <button className="le-modal-close" onClick={() => setShowTemplates(false)}><IconX /></button>
              </div>
              <div className="le-tpl-categories">
                <button className={`le-tpl-cat${templateCategory === null ? " active" : ""}`} onClick={() => setTemplateCategory(null)}>All</button>
                {["business", "tech", "restaurant", "fashion", "real-estate", "education", "health", "sports"].map((cat) => (
                  <button key={cat} className={`le-tpl-cat${templateCategory === cat ? " active" : ""}`} onClick={() => setTemplateCategory(cat)}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
                ))}
              </div>
              <div className="le-modal-body">
                <div className="le-tpl-grid">
                  {filteredTemplates.map((tpl) => (
                    <div key={tpl.id} className="le-tpl-card" onClick={() => loadTemplate(tpl)}>
                      <div className="le-tpl-preview" style={{ background: tpl.canvasBackground }}>
                        {tpl.elements.slice(0, 3).map((el, i) => (
                          <div key={i} className="le-tpl-el" style={{ position: "absolute", left: `${(el.x / tpl.canvasWidth) * 100}%`, top: `${(el.y / tpl.canvasHeight) * 100}%`, width: `${(el.width / tpl.canvasWidth) * 100}%`, height: `${(el.height / tpl.canvasHeight) * 100}%`, fontSize: el.type === "text" ? `${Math.min(12, (el.fontSize || 32) / 3)}px` : undefined, color: el.fill, fontWeight: el.fontWeight, fontFamily: el.fontFamily, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {el.type === "text" ? el.text : el.type === "icon" ? "I" : el.shapeType === "circle" ? "O" : el.shapeType === "rect" ? "[]" : el.shapeType === "line" ? "—" : "*"}
                          </div>
                        ))}
                      </div>
                      <span className="le-tpl-name">{tpl.name}</span>
                    </div>
                  ))}
                  {filteredTemplates.length === 0 && <div className="le-tpl-empty">No templates match your filters</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPORT MODAL ── */}
        {showExportModal && (
          <div className="le-overlay" onClick={() => setShowExportModal(false)}>
            <div className="le-modal" onClick={(e) => e.stopPropagation()}>
              <div className="le-modal-head">
                <h3>Export Logo</h3>
                <button className="le-modal-close" onClick={() => setShowExportModal(false)}><IconX /></button>
              </div>
              <div className="le-modal-body">
                <div className="le-export-section">
                  <div className="le-export-info">
                    <span className="le-export-size">{project.canvasWidth} × {project.canvasHeight}px</span>
                    <span className="le-export-count">{project.elements.length} elements</span>
                  </div>
                  <div className="le-export-grid">
                    <button className="le-export-card" onClick={() => { exportPNG(); setShowExportModal(false); }}>
                      <IconDownload /> <span>PNG</span>
                      <small>Solid background</small>
                    </button>
                    <button className="le-export-card" onClick={() => { exportPNG(true); setShowExportModal(false); }}>
                      <IconDownload /> <span>PNG (Transparent)</span>
                      <small>No background</small>
                    </button>
                    <button className="le-export-card" onClick={() => { exportPNG(false, 2); setShowExportModal(false); }}>
                      <IconDownload /> <span>PNG @2x</span>
                      <small>High resolution</small>
                    </button>
                    <button className="le-export-card" onClick={() => { exportPNG(false, 3); setShowExportModal(false); }}>
                      <IconDownload /> <span>PNG @3x</span>
                      <small>Highest quality</small>
                    </button>
                    <button className="le-export-card" onClick={() => { exportSVG(); setShowExportModal(false); }}>
                      <IconDownload /> <span>SVG</span>
                      <small>Vector, scalable</small>
                    </button>
                    <button className="le-export-card" onClick={() => { exportFavicon(); setShowExportModal(false); }}>
                      <IconDownload /> <span>Favicon</span>
                      <small>64×64 icon</small>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── INLINE STYLES ── */}
      <style>{`
.le-section { background: linear-gradient(135deg, #0F172A 0%, #1A2A44 100%); padding: 2rem 0; position: relative; min-height: 100vh; }
.le-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 30% 20%, rgba(37,99,235,0.05) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 70% 80%, rgba(22,163,74,0.04) 0%, transparent 70%); pointer-events: none; }
.le-wrap { max-width: 1440px; margin: 0 auto; padding: 0 1rem; position: relative; z-index: 1; }
.le-toast { position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.3); animation: slideIn 0.3s ease; pointer-events: none; }
.le-toast-success { background: #065F46; color: #A7F3D0; }
.le-toast-info { background: #1E3A5F; color: #93C5FD; }
.le-toast-error { background: #7F1D1D; color: #FCA5A5; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.le-topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.le-topbar-left, .le-topbar-center, .le-topbar-right { display: flex; align-items: center; gap: 6px; }
.le-name-input { font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; padding: 5px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; color: #fff; outline: none; width: 140px; }
.le-name-input:focus { border-color: rgba(37,99,235,0.4); }
.le-btn-sm { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; white-space: nowrap; }
.le-btn-sm:hover { background: rgba(255,255,255,0.08); color: #fff; }
.le-btn-sm.active { background: rgba(37,99,235,0.15); color: #60A5FA; }
.le-btn-primary { background: linear-gradient(135deg, #2563EB, #1E40AF); color: #fff; border-color: transparent; }
.le-btn-primary:hover { box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
.le-tool-sep { width: 1px; height: 20px; background: rgba(255,255,255,0.08); margin: 0 4px; }
.le-canvas-preset { font-size: 11px; padding: 3px 8px; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.6); cursor: pointer; }
.le-project-lib { position: relative; }
.le-project-dropdown { position: absolute; top: 100%; left: 0; margin-top: 4px; width: 280px; max-height: 320px; overflow-y: auto; background: #1A2A44; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,0.4); z-index: 100; }
.le-project-dd-head { padding: 10px 14px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(255,255,255,0.05); }
.le-project-dd-empty { padding: 20px; text-align: center; font-size: 12px; color: rgba(255,255,255,0.2); }
.le-project-dd-item { display: flex; align-items: center; gap: 8px; padding: 8px 14px; cursor: pointer; transition: background 0.15s; }
.le-project-dd-item:hover { background: rgba(255,255,255,0.04); }
.le-project-dd-item.active { background: rgba(37,99,235,0.1); }
.le-project-dd-name { flex: 1; font-size: 13px; color: rgba(255,255,255,0.8); }
.le-project-dd-date { font-size: 10px; color: rgba(255,255,255,0.25); }
.le-project-dd-del { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.2); padding: 2px; }
.le-project-dd-del:hover { color: #FCA5A5; }
.le-project-rename-input { font-size: 13px; padding: 2px 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(37,99,235,0.4); border-radius: 4px; color: #fff; outline: none; width: 100%; }
.le-editor { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
.le-toolbar { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
.le-tool-btn { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; border: none; background: transparent; color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s; font-size: 12px; }
.le-tool-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
.le-tool-btn.active { background: rgba(37,99,235,0.15); color: #60A5FA; }
.le-tool-upload { position: relative; }
.le-tool-upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.le-tool-label { font-size: 10px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 2px; }
.le-body { display: grid; grid-template-columns: 220px 1fr 240px; min-height: 500px; }
@media (max-width: 1100px) { .le-body { grid-template-columns: 180px 1fr 200px; } }
@media (max-width: 860px) { .le-body { grid-template-columns: 1fr; } }
.le-sidebar { background: rgba(255,255,255,0.02); border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; }
.le-sidebar-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); }
.le-stab { flex: 1; padding: 8px 4px; font-size: 11px; font-weight: 600; background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.15s; text-align: center; }
.le-stab:hover { color: rgba(255,255,255,0.6); }
.le-stab.active { color: #60A5FA; background: rgba(37,99,235,0.06); border-bottom: 2px solid #2563EB; }
.le-sidebar-body { flex: 1; overflow-y: auto; padding: 8px; }
.le-layers { display: flex; flex-direction: column; gap: 2px; }
.le-layer { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; font-size: 12px; }
.le-layer:hover { background: rgba(255,255,255,0.04); }
.le-layer.active { background: rgba(37,99,235,0.1); }
.le-layer.locked { opacity: 0.5; }
.le-layer.grouped { border-left: 2px solid #2563EB; }
.le-layer-icon { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.06); border-radius: 4px; color: rgba(255,255,255,0.4); flex-shrink: 0; }
.le-layer-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgba(255,255,255,0.7); }
.le-layer-badge { font-size: 8px; background: #2563EB; color: #fff; border-radius: 3px; padding: 1px 4px; }
.le-layer-btn { background: none; border: none; cursor: pointer; font-size: 10px; padding: 2px; opacity: 0.4; transition: opacity 0.15s; }
.le-layer-btn:hover { opacity: 0.9; }
.le-layer-empty { text-align: center; padding: 24px 12px; font-size: 12px; color: rgba(255,255,255,0.15); }
.le-icon-section { display: flex; flex-direction: column; gap: 8px; }
.le-icon-search { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; color: rgba(255,255,255,0.3); }
.le-icon-search-input { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 12px; font-family: 'Inter', sans-serif; }
.le-icon-search-input::placeholder { color: rgba(255,255,255,0.2); }
.le-icon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.le-icon-btn { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; cursor: pointer; color: rgba(255,255,255,0.4); transition: all 0.15s; }
.le-icon-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
.le-icon-empty { text-align: center; padding: 16px; font-size: 11px; color: rgba(255,255,255,0.15); grid-column: 1 / -1; }
.le-shape-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.le-shape-btn { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; cursor: pointer; color: rgba(255,255,255,0.4); transition: all 0.15s; }
.le-shape-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
.le-canvas-area { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; min-height: 400px; background: repeating-conic-gradient(rgba(255,255,255,0.02) 0% 25%, transparent 0% 50%) 50% / 20px 20px; }
.le-canvas-scroll { display: inline-block; }
.le-canvas { cursor: default; border-radius: 4px; box-shadow: 0 4px 24px rgba(0,0,0,0.3); max-width: 100%; }
.le-zoom-bar { display: flex; align-items: center; gap: 4px; margin-top: 12px; }
.le-zoom-btn { padding: 4px 8px; font-size: 12px; font-weight: 600; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; color: rgba(255,255,255,0.5); cursor: pointer; }
.le-zoom-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.le-zoom-label { font-size: 11px; color: rgba(255,255,255,0.3); min-width: 40px; text-align: center; font-family: 'Outfit', sans-serif; }
.le-props { background: rgba(255,255,255,0.02); border-left: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; }
.le-props-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); }
.le-prop-empty { text-align: center; padding: 24px 12px; font-size: 12px; color: rgba(255,255,255,0.15); }
.le-prop-group { display: flex; flex-direction: column; gap: 4px; padding: 4px 0; }
.le-prop-label { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px; }
.le-prop-input { padding: 5px 8px; font-size: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; color: #fff; outline: none; font-family: 'Inter', sans-serif; }
.le-prop-input:focus { border-color: rgba(37,99,235,0.3); }
.le-prop-select { padding: 5px 8px; font-size: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; color: #fff; outline: none; cursor: pointer; width: 100%; }
.le-prop-select option { background: #1A2A44; }
.le-prop-color-row { display: flex; gap: 6px; }
.le-prop-color { width: 32px; height: 32px; border: 1px solid rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer; background: none; padding: 0; }
.le-prop-color::-webkit-color-swatch-wrapper { padding: 2px; }
.le-prop-color::-webkit-color-swatch { border-radius: 3px; border: none; }
.le-prop-presets { display: flex; gap: 5px; flex-wrap: wrap; margin: 4px 0; }
.le-preset-btn { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.15s; }
.le-preset-btn:hover { transform: scale(1.2); }
.le-preset-btn.active { border-color: #60A5FA; box-shadow: 0 0 0 2px rgba(37,99,235,0.3); }
.le-prop-range { width: 100%; height: 4px; -webkit-appearance: none; appearance: none; background: rgba(255,255,255,0.08); border-radius: 4px; outline: none; cursor: pointer; margin: 4px 0; }
.le-prop-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #2563EB; border: 2px solid #fff; cursor: pointer; }
.le-prop-row { display: flex; gap: 6px; }
.le-prop-row > div { flex: 1; }
.le-prop-btn { flex: 1; padding: 4px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 4px; color: rgba(255,255,255,0.4); cursor: pointer; text-align: center; }
.le-prop-btn:hover { background: rgba(255,255,255,0.07); }
.le-prop-btn.active { background: rgba(37,99,235,0.15); color: #60A5FA; border-color: rgba(37,99,235,0.3); }
.le-prop-details { margin-top: 4px; }
.le-prop-details summary { font-size: 11px; color: rgba(255,255,255,0.3); cursor: pointer; padding: 6px 0; font-weight: 600; }
.le-prop-bg-btn { width: 100%; padding: 8px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.1); border-radius: 6px; color: rgba(255,255,255,0.4); cursor: pointer; margin: 8px 0; text-align: center; }
.le-prop-bg-btn:hover { border-color: rgba(37,99,235,0.3); color: #60A5FA; }
.le-bg-presets { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin: 4px 0; }
.le-bg-preset-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.le-bg-preset-btn:hover { background: rgba(255,255,255,0.06); }
.le-bg-preset-btn.active { border-color: #2563EB; background: rgba(37,99,235,0.06); }
.le-bg-preset-swatch { width: 100%; height: 32px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06); }
.le-bg-preset-label { font-size: 9px; color: rgba(255,255,255,0.4); }
.le-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.le-modal { background: #1A2A44; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; max-width: 640px; width: 90%; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.le-modal-tpl { max-width: 800px; }
.le-modal-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.le-modal-head h3 { font-family: 'Outfit', sans-serif; font-size: 16px; color: #fff; margin: 0; flex-shrink: 0; }
.le-modal-search { display: flex; align-items: center; gap: 6px; flex: 1; padding: 6px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; color: rgba(255,255,255,0.3); }
.le-modal-search-input { flex: 1; background: none; border: none; outline: none; color: #fff; font-size: 13px; font-family: 'Inter', sans-serif; }
.le-modal-search-input::placeholder { color: rgba(255,255,255,0.2); }
.le-modal-close { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; padding: 4px; }
.le-modal-close:hover { color: #fff; }
.le-tpl-categories { display: flex; gap: 4px; padding: 10px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); overflow-x: auto; flex-shrink: 0; }
.le-tpl-cat { padding: 4px 12px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.04); border-radius: 14px; color: rgba(255,255,255,0.4); cursor: pointer; white-space: nowrap; transition: all 0.15s; }
.le-tpl-cat:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.6); }
.le-tpl-cat.active { background: rgba(37,99,235,0.15); color: #60A5FA; border-color: rgba(37,99,235,0.2); }
.le-modal-body { flex: 1; overflow-y: auto; padding: 16px 20px; }
.le-tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.le-tpl-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden; cursor: pointer; transition: all 0.2s; }
.le-tpl-card:hover { border-color: rgba(37,99,235,0.3); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.le-tpl-preview { position: relative; height: 80px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.le-tpl-name { display: block; padding: 8px 10px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.6); }
.le-tpl-empty { text-align: center; padding: 40px; font-size: 13px; color: rgba(255,255,255,0.2); grid-column: 1 / -1; }
.le-export-section { display: flex; flex-direction: column; gap: 12px; }
.le-export-info { display: flex; gap: 12px; font-size: 12px; color: rgba(255,255,255,0.3); }
.le-export-size { font-family: 'Outfit', sans-serif; font-weight: 700; color: rgba(255,255,255,0.5); }
.le-export-count { color: rgba(255,255,255,0.2); }
.le-export-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.le-export-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; cursor: pointer; color: rgba(255,255,255,0.6); transition: all 0.15s; font-family: 'Inter', sans-serif; }
.le-export-card:hover { background: rgba(255,255,255,0.06); color: #fff; border-color: rgba(37,99,235,0.3); }
.le-export-card span { font-size: 13px; font-weight: 600; }
.le-export-card small { font-size: 10px; color: rgba(255,255,255,0.25); }
`}</style>
    </section>
  );
}
