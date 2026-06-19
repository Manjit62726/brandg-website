"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LogoElement, LogoProject, CanvasViewport, CanvasSettings, CANVAS_PRESETS } from "./types";
import { genId, createTextElement, createShapeElement, createIconElement, saveProjects, loadProjects, clamp, deepCloneProject, snapValue, getAlignedGuides } from "./utils";
import { getIconPaths, getIconPath } from "./icons";
import { TEMPLATES } from "./templates";

const DEFAULT_PROJECT: LogoProject = {
  id: genId(), name: "Untitled", elements: [],
  canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF",
  createdAt: Date.now(), updatedAt: Date.now(),
};

const DEFAULT_CANVAS: CanvasSettings = {
  showGrid: false, gridSize: 20, snapToGrid: false, showRulers: false, showGuides: true,
};

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
  const [history, setHistory] = useState<LogoProject[]>(() => [deepCloneProject(DEFAULT_PROJECT)]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const historyRef = useRef<LogoProject[]>([]);
  const historyIdxRef = useRef(0);
  const skipHistoryRef = useRef(false);

  const sel = selectedIds.length === 1 ? project.elements.find((e) => e.id === selectedIds[0]) : null;

  useEffect(() => {
    historyRef.current = history;
    historyIdxRef.current = historyIdx;
  }, [history, historyIdx]);

  useEffect(() => {
    if (!skipHistoryRef.current && project.elements.length > 0) {
      const h = historyRef.current;
      const hi = historyIdxRef.current;
      const newH = h.slice(0, hi + 1);
      newH.push(deepCloneProject(project));
      if (newH.length > 50) newH.shift();
      setHistory(newH);
      setHistoryIdx(newH.length - 1);
    }
    skipHistoryRef.current = false;
  }, [project]);

  useEffect(() => {
    saveProjects([project]);
  }, [project]);

  useEffect(() => { renderCanvas(); });

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    const newIdx = historyIdxRef.current - 1;
    const prev = historyRef.current[newIdx];
    if (prev) {
      skipHistoryRef.current = true;
      setProject(deepCloneProject(prev));
      setHistoryIdx(newIdx);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    const newIdx = historyIdxRef.current + 1;
    const next = historyRef.current[newIdx];
    if (next) {
      skipHistoryRef.current = true;
      setProject(deepCloneProject(next));
      setHistoryIdx(newIdx);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === " " || e.code === "Space") { e.preventDefault(); setSpaceHeld(true); }
      if (e.key === "Delete" || e.key === "Backspace") { removeSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); duplicateSelected(); }
      if (e.key === "g" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); groupSelected(); }
      if (e.key === "g" && (e.shiftKey) && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ungroupSelected(); }
    };
    const upHandler = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", upHandler);
    return () => { window.removeEventListener("keydown", handler); window.removeEventListener("keyup", upHandler); };
  }, [selectedIds]);

  const updateProject = useCallback((updater: (p: LogoProject) => void) => {
    setProject((prev) => {
      const next = { ...prev, elements: [...prev.elements], updatedAt: Date.now() };
      updater(next);
      return next;
    });
  }, []);

  const addElement = useCallback((el: LogoElement) => {
    updateProject((p) => {
      el.zIndex = p.elements.length;
      p.elements.push(el);
      setSelectedIds([el.id]);
    });
  }, [updateProject]);

  const updateElement = useCallback((id: string, changes: Partial<LogoElement>) => {
    updateProject((p) => {
      const idx = p.elements.findIndex((e) => e.id === id);
      if (idx >= 0) p.elements[idx] = { ...p.elements[idx], ...changes };
    });
  }, [updateProject]);

  const removeSelected = useCallback(() => {
    updateProject((p) => {
      p.elements = p.elements.filter((e) => !selectedIds.includes(e.id));
      setSelectedIds([]);
    });
  }, [selectedIds, updateProject]);

  const duplicateSelected = useCallback(() => {
    updateProject((p) => {
      const newIds: string[] = [];
      for (const el of p.elements) {
        if (selectedIds.includes(el.id)) {
          const copy = { ...el, id: genId(), x: el.x + 10, y: el.y + 10, zIndex: p.elements.length };
          p.elements.push(copy);
          newIds.push(copy.id);
        }
      }
      setSelectedIds(newIds);
    });
  }, [selectedIds, updateProject]);

  const sendBackward = useCallback(() => {
    updateProject((p) => {
      for (const id of selectedIds) {
        const i = p.elements.findIndex((e) => e.id === id);
        if (i > 0) {
          const tmp = p.elements[i];
          p.elements[i] = { ...p.elements[i - 1], zIndex: i };
          p.elements[i - 1] = { ...tmp, zIndex: i - 1 };
        }
      }
    });
  }, [selectedIds, updateProject]);

  const bringForward = useCallback(() => {
    updateProject((p) => {
      for (const id of selectedIds) {
        const i = p.elements.findIndex((e) => e.id === id);
        if (i < p.elements.length - 1) {
          const tmp = p.elements[i];
          p.elements[i] = { ...p.elements[i + 1], zIndex: i };
          p.elements[i + 1] = { ...tmp, zIndex: i + 1 };
        }
      }
    });
  }, [selectedIds, updateProject]);

  const sendToBack = useCallback(() => {
    updateProject((p) => {
      const sorted = [...p.elements].sort((a, b) => a.zIndex - b.zIndex);
      const selected = p.elements.filter((e) => selectedIds.includes(e.id));
      const rest = p.elements.filter((e) => !selectedIds.includes(e.id));
      p.elements = [...selected, ...rest].map((e, i) => ({ ...e, zIndex: i }));
    });
  }, [selectedIds, updateProject]);

  const bringToFront = useCallback(() => {
    updateProject((p) => {
      const selected = p.elements.filter((e) => selectedIds.includes(e.id));
      const rest = p.elements.filter((e) => !selectedIds.includes(e.id));
      p.elements = [...rest, ...selected].map((e, i) => ({ ...e, zIndex: i }));
    });
  }, [selectedIds, updateProject]);

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const gid = genId();
    updateProject((p) => {
      for (const el of p.elements) {
        if (selectedIds.includes(el.id)) el.groupId = gid;
      }
    });
  }, [selectedIds, updateProject]);

  const ungroupSelected = useCallback(() => {
    updateProject((p) => {
      for (const el of p.elements) {
        if (selectedIds.includes(el.id) || (el.groupId && selectedIds.some((sid) => {
          const se = p.elements.find((e) => e.id === sid);
          return se && se.groupId === el.groupId;
        }))) {
          el.groupId = undefined;
        }
      }
    });
  }, [selectedIds, updateProject]);

  const alignElements = useCallback((dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (selectedIds.length < 2) return;
    updateProject((p) => {
      const els = p.elements.filter((e) => selectedIds.includes(e.id));
      if (dir === "left") { const mx = Math.min(...els.map((e) => e.x)); els.forEach((e) => e.x = mx); }
      else if (dir === "center") { const mx = Math.min(...els.map((e) => e.x + e.width / 2)); const mr = Math.max(...els.map((e) => e.x + e.width / 2)); const avg = (mx + mr) / 2; els.forEach((e) => e.x = avg - e.width / 2); }
      else if (dir === "right") { const mx = Math.max(...els.map((e) => e.x + e.width)); els.forEach((e) => e.x = mx - e.width); }
      else if (dir === "top") { const my = Math.min(...els.map((e) => e.y)); els.forEach((e) => e.y = my); }
      else if (dir === "middle") { const my = Math.min(...els.map((e) => e.y + e.height / 2)); const mr = Math.max(...els.map((e) => e.y + e.height / 2)); const avg = (my + mr) / 2; els.forEach((e) => e.y = avg - e.height / 2); }
      else if (dir === "bottom") { const my = Math.max(...els.map((e) => e.y + e.height)); els.forEach((e) => e.y = my - e.height); }
    });
  }, [selectedIds, updateProject]);

  const alignToCanvas = useCallback((dir: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (selectedIds.length === 0) return;
    updateProject((p) => {
      for (const id of selectedIds) {
        const el = p.elements.find((e) => e.id === id);
        if (!el) continue;
        if (dir === "left") el.x = 0;
        else if (dir === "center") el.x = (p.canvasWidth - el.width) / 2;
        else if (dir === "right") el.x = p.canvasWidth - el.width;
        else if (dir === "top") el.y = 0;
        else if (dir === "middle") el.y = (p.canvasHeight - el.height) / 2;
        else if (dir === "bottom") el.y = p.canvasHeight - el.height;
      }
    });
  }, [selectedIds, updateProject]);

  const lockSelected = useCallback(() => {
    updateProject((p) => {
      for (const id of selectedIds) {
        const el = p.elements.find((e) => e.id === id);
        if (el) el.locked = !el.locked;
      }
    });
  }, [selectedIds, updateProject]);

  const loadTemplate = useCallback((tpl: LogoProject) => {
    const fresh = {
      ...tpl,
      id: genId(),
      name: tpl.name + " (copy)",
      elements: tpl.elements.map((e) => ({ ...e, id: genId() })),
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setProject(fresh);
    setProjectName(fresh.name);
    setSelectedIds([]);
    setShowTemplates(false);
  }, []);

  const newProject = useCallback(() => {
    const fresh = { ...DEFAULT_PROJECT, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
    setProject(fresh);
    setProjectName("Untitled");
    setSelectedIds([]);
    setShowTemplates(true);
  }, []);

  const saveProject = useCallback(() => {
    const p = { ...project, name: projectName, updatedAt: Date.now() };
    setProject(p);
    const all = loadProjects().filter((x) => x.id !== p.id);
    saveProjects([p, ...all].slice(0, 20));
  }, [project, projectName]);

  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = (projectName || "logo") + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [projectName]);

  const exportTransparentPNG = useCallback(() => {
    const canvas = document.createElement("canvas");
    const W = project.canvasWidth, H = project.canvasHeight;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      if (!el.visible) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-el.width / 2, -el.height / 2);
      drawElement(ctx, el);
      ctx.restore();
    }
    const link = document.createElement("a");
    link.download = (projectName || "logo") + "-transparent.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [project, projectName]);

  const exportHighResPNG = useCallback(() => {
    const scale = 3;
    const canvas = document.createElement("canvas");
    const W = project.canvasWidth * scale, H = project.canvasHeight * scale;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    if (project.canvasBackground && project.canvasBackground !== "transparent") {
      ctx.fillStyle = project.canvasBackground;
      ctx.fillRect(0, 0, project.canvasWidth, project.canvasHeight);
    }
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      if (!el.visible) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-el.width / 2, -el.height / 2);
      drawElement(ctx, el);
      ctx.restore();
    }
    const link = document.createElement("a");
    link.download = (projectName || "logo") + "@3x.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [project, projectName]);

  const exportSVG = useCallback(() => {
    const W = project.canvasWidth, H = project.canvasHeight;
    const bg = project.canvasBackground;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    if (bg && bg !== "transparent") svg += `<rect width="${W}" height="${H}" fill="${bg}"/>`;
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      if (!el.visible) continue;
      svg += `<g transform="translate(${el.x},${el.y}) rotate(${el.rotation})" opacity="${el.opacity}">`;
      if (el.type === "text") {
        svg += `<text x="${el.width / 2}" y="${el.height / 2}" font-family="${el.fontFamily}" font-size="${el.fontSize}px" font-weight="${el.fontWeight}" font-style="${el.fontStyle}" fill="${el.fill}" text-anchor="${el.textAlign === "center" ? "middle" : el.textAlign === "right" ? "end" : "start"}" dominant-baseline="central">${escXml(el.text || "")}</text>`;
      } else if (el.type === "icon") {
        const d = getIconPath(el.iconName || "star");
        svg += `<g transform="translate(${el.width / 2},${el.height / 2}) scale(${Math.min(el.width, el.height) / 24}) translate(-12,-12)"><path d="${d}" fill="${el.fill}"/></g>`;
      } else if (el.type === "shape") {
        const cx = el.width / 2, cy = el.height / 2, r = Math.min(cx, cy);
        if (el.shapeType === "rect") svg += `<rect width="${el.width}" height="${el.height}" fill="${el.fill}" rx="2"/>`;
        else if (el.shapeType === "circle") svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${el.fill}"/>`;
        else if (el.shapeType === "triangle") svg += `<polygon points="${cx},0 ${el.width},${el.height} 0,${el.height}" fill="${el.fill}"/>`;
        else if (el.shapeType === "diamond") svg += `<polygon points="${cx},0 ${el.width},${cy} ${cx},${el.height} 0,${cy}" fill="${el.fill}"/>`;
        else if (el.shapeType === "hexagon") {
          const p = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(" ");
          svg += `<polygon points="${p}" fill="${el.fill}"/>`;
        } else if (el.shapeType === "star") {
          const p = Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rad = i % 2 === 0 ? r : r * 0.4; return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`; }).join(" ");
          svg += `<polygon points="${p}" fill="${el.fill}"/>`;
        } else if (el.shapeType === "line") svg += `<line x1="0" y1="${cy}" x2="${el.width}" y2="${cy}" stroke="${el.fill}" stroke-width="3"/>`;
      }
      svg += `</g>`;
    }
    svg += `</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = (projectName || "logo") + ".svg";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [project, projectName]);

  const exportFavicon = useCallback(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const scale = size / Math.max(project.canvasWidth, project.canvasHeight);
    ctx.scale(scale, scale);
    const ox = (project.canvasWidth - project.canvasWidth) / 2;
    const oy = (project.canvasHeight - project.canvasHeight) / 2;
    ctx.translate(ox, oy);
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      if (!el.visible) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-el.width / 2, -el.height / 2);
      drawElement(ctx, el);
      ctx.restore();
    }
    const link = document.createElement("a");
    link.download = (projectName || "logo") + "-favicon.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [project, projectName]);

  function escXml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function drawElement(ctx: CanvasRenderingContext2D, el: LogoElement) {
    if (el.blur && el.blur > 0) {
      ctx.filter = `blur(${el.blur}px)`;
    }
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
      ctx.fillStyle = el.fill || "#0B192C";
      ctx.fillText(el.text || "", el.width / 2, el.height / 2);
      ctx.shadowColor = "transparent";
      ctx.filter = "none";
    } else if (el.type === "icon") {
      ctx.fillStyle = el.fill || "#2563EB";
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
      ctx.fillStyle = el.fill || "#2563EB";
      if (el.stroke && el.stroke !== "none") {
        ctx.strokeStyle = el.stroke;
        ctx.lineWidth = el.strokeWidth || 2;
      }
      const cx = el.width / 2, cy = el.height / 2, r = Math.min(cx, cy);
      if (el.shapeType === "rect") { ctx.fillRect(0, 0, el.width, el.height); if (el.stroke && el.stroke !== "none") ctx.strokeRect(0, 0, el.width, el.height); }
      else if (el.shapeType === "circle") { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); if (el.stroke && el.stroke !== "none") ctx.stroke(); }
      else if (el.shapeType === "triangle") { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(el.width, el.height); ctx.lineTo(0, el.height); ctx.closePath(); ctx.fill(); if (el.stroke && el.stroke !== "none") ctx.stroke(); }
      else if (el.shapeType === "diamond") { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(el.width, cy); ctx.lineTo(cx, el.height); ctx.lineTo(0, cy); ctx.closePath(); ctx.fill(); if (el.stroke && el.stroke !== "none") ctx.stroke(); }
      else if (el.shapeType === "hexagon") {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 6; const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
        ctx.closePath(); ctx.fill(); if (el.stroke && el.stroke !== "none") ctx.stroke();
      } else if (el.shapeType === "star") {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const rad = i % 2 === 0 ? r : r * 0.4; const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
        ctx.closePath(); ctx.fill(); if (el.stroke && el.stroke !== "none") ctx.stroke();
      } else if (el.shapeType === "line") {
        ctx.strokeStyle = el.fill || "#2563EB";
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(el.width, cy); ctx.stroke();
      }
      ctx.filter = "none";
    }
  }

  function renderCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = project.canvasWidth, H = project.canvasHeight;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    if (project.canvasBackground && project.canvasBackground !== "transparent") {
      ctx.fillStyle = project.canvasBackground;
      ctx.fillRect(0, 0, W, H);
    }
    if (canvasSettings.showGrid) {
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += canvasSettings.gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += canvasSettings.gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    }
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      if (!el.visible) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-el.width / 2, -el.height / 2);
      drawElement(ctx, el);
      ctx.restore();
      if (selectedIds.includes(el.id)) {
        ctx.save();
        ctx.strokeStyle = "#2563EB";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(el.x - 2, el.y - 2, el.width + 4, el.height + 4);
        ctx.setLineDash([]);
        const hs = 6;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#2563EB";
        ctx.lineWidth = 1.5;
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const hx = el.x + (dx > 0 ? el.width : 0);
          const hy = el.y + (dy > 0 ? el.height : 0);
          ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
          ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
        }
        ctx.restore();
      }
    }
    for (const g of guides) {
      ctx.save();
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      if (g.type === "v") { ctx.beginPath(); ctx.moveTo(g.pos, 0); ctx.lineTo(g.pos, H); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(0, g.pos); ctx.lineTo(W, g.pos); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (marquee) {
      ctx.save();
      ctx.strokeStyle = "#2563EB";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.fillStyle = "rgba(37,99,235,0.08)";
      ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>): { cx: number; cy: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const scaleX = project.canvasWidth / rect.width;
    const scaleY = project.canvasHeight / rect.height;
    return { cx: mx * scaleX, cy: my * scaleY };
  }

  function handleCanvasDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (e.button === 1 || spaceHeld) {
      setDragMode("pan");
      setDragData({ sx: e.clientX, sy: e.clientY, px: view.panX, py: view.panY });
      return;
    }
    const { cx, cy } = getCanvasCoords(e);
    const sorted = [...project.elements].sort((a, b) => b.zIndex - a.zIndex);
    for (const el of sorted) {
      if (!el.visible || el.locked) continue;
      if (cx >= el.x && cx <= el.x + el.width && cy >= el.y && cy <= el.y + el.height) {
        let newSel: string[];
        if (e.shiftKey) {
          newSel = selectedIds.includes(el.id) ? selectedIds.filter((id) => id !== el.id) : [...selectedIds, el.id];
        } else {
          newSel = selectedIds.includes(el.id) && selectedIds.length > 1 ? selectedIds : [el.id];
        }
        setSelectedIds(newSel);
        setDragMode("move");
        const origs: Record<string, { x: number; y: number }> = {};
        for (const id of newSel) {
          const ee = project.elements.find((x) => x.id === id);
          if (ee) origs[id] = { x: ee.x, y: ee.y };
        }
        setDragData({ mx: cx, my: cy, origs });
        return;
      }
    }
    setDragMode("marquee");
    setDragData({ mx: cx, my: cy });
    if (!e.shiftKey) setSelectedIds([]);
  }

  function handleCanvasMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragMode === "pan" && dragData) {
      const dx = e.clientX - dragData.sx, dy = e.clientY - dragData.sy;
      setView((v) => ({ ...v, panX: dragData.px + dx, panY: dragData.py + dy }));
      return;
    }
    if (dragMode === "move" && dragData) {
      const { cx, cy } = getCanvasCoords(e);
      let dx = cx - dragData.mx, dy = cy - dragData.my;
      if (canvasSettings.snapToGrid) {
        const selEl = project.elements.find((el) => selectedIds.includes(el.id));
        if (selEl) {
          const targetX = selEl.x + dx, targetY = selEl.y + dy;
          const snappedX = snapValue(targetX, canvasSettings.gridSize);
          const snappedY = snapValue(targetY, canvasSettings.gridSize);
          dx = snappedX - selEl.x;
          dy = snappedY - selEl.y;
        }
      }
      if (canvasSettings.showGuides && selectedIds.length === 1) {
        const result = getAlignedGuides(selectedIds[0], project.elements, dx, dy);
        setGuides(result.guides);
        if (result.hx !== undefined) dx = result.hx;
        if (result.hy !== undefined) dy = result.hy;
      }
      updateProject((p) => {
        for (const id of selectedIds) {
          const el = p.elements.find((x) => x.id === id);
          if (el && dragData.origs[id]) {
            el.x = dragData.origs[id].x + dx;
            el.y = dragData.origs[id].y + dy;
            if (el.groupId) {
              for (const ge of p.elements) {
                if (ge.groupId === el.groupId && !selectedIds.includes(ge.id)) {
                  ge.x = ge.x + dx;
                  ge.y = ge.y + dy;
                }
              }
            }
          }
        }
      });
      return;
    }
    if (dragMode === "marquee" && dragData) {
      const { cx, cy } = getCanvasCoords(e);
      const x = Math.min(dragData.mx, cx), y = Math.min(dragData.my, cy);
      const w = Math.abs(cx - dragData.mx), h = Math.abs(cy - dragData.my);
      setMarquee({ x, y, w, h });
    }
  }

  function handleCanvasUp() {
    if (dragMode === "marquee" && marquee) {
      const m = marquee;
      const ids = project.elements.filter((el) => {
        if (!el.visible) return false;
        return el.x + el.width > m.x && el.x < m.x + m.w && el.y + el.height > m.y && el.y < m.y + m.h;
      }).map((el) => el.id);
      setSelectedIds(ids);
      setMarquee(null);
    }
    setDragMode("none");
    setDragData(null);
    setGuides([]);
  }

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setView((v) => ({ ...v, zoom: clamp(v.zoom - e.deltaY * 0.001, 0.25, 4) }));
    } else {
      setView((v) => ({ ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY }));
    }
  };

  return (
    <section className="le-section">
      <div className="le-wrap" ref={wrapRef}>
        <div className="le-topbar">
          <div className="le-topbar-left">
            <input className="le-name-input" value={projectName} onChange={(e) => setProjectName(e.target.value)} onBlur={saveProject} />
            <button className="le-btn-sm" onClick={newProject} title="New">+ New</button>
            <button className="le-btn-sm" onClick={() => setShowTemplates(true)} title="Templates">Templates</button>
          </div>
          <div className="le-topbar-center">
            <button className="le-btn-sm" onClick={undo} title="Undo (Ctrl+Z)">↩</button>
            <button className="le-btn-sm" onClick={redo} title="Redo (Ctrl+Shift+Z)">↪</button>
            <span className="le-tool-sep" />
            <button className={`le-btn-sm${canvasSettings.showGrid ? " active" : ""}`} onClick={() => setCanvasSettings((s) => ({ ...s, showGrid: !s.showGrid }))} title="Toggle Grid">Grid</button>
            <button className={`le-btn-sm${canvasSettings.snapToGrid ? " active" : ""}`} onClick={() => setCanvasSettings((s) => ({ ...s, snapToGrid: !s.snapToGrid }))} title="Snap to Grid">Snap</button>
            <button className={`le-btn-sm${canvasSettings.showGuides ? " active" : ""}`} onClick={() => setCanvasSettings((s) => ({ ...s, showGuides: !s.showGuides }))} title="Alignment Guides">Guides</button>
            <span className="le-tool-sep" />
            <select className="le-canvas-preset" value={`${project.canvasWidth}x${project.canvasHeight}`} onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") return;
              const [w, h] = val.split("x").map(Number);
              updateProject((p) => { p.canvasWidth = w; p.canvasHeight = h; });
            }}>
              {CANVAS_PRESETS.map((p) => (
                <option key={`${p.w}x${p.h}`} value={`${p.w}x${p.h}`}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="le-topbar-right">
            <button className="le-btn-sm" onClick={saveProject}>Save</button>
            <div className="le-export-group">
              <button className="le-btn-sm le-btn-primary" onClick={exportPNG}>PNG</button>
              <button className="le-btn-sm le-btn-primary" onClick={exportTransparentPNG}>PNG (T)</button>
              <button className="le-btn-sm le-btn-primary" onClick={exportHighResPNG}>PNG (HD)</button>
              <button className="le-btn-sm le-btn-primary" onClick={exportSVG}>SVG</button>
              <button className="le-btn-sm" onClick={exportFavicon} title="Favicon">Fav</button>
            </div>
          </div>
        </div>

        <div className="le-editor">
          <div className="le-toolbar">
            <button className="le-tool-btn" onClick={() => addElement(createTextElement("Text", 100, 100))} title="Add Text">T</button>
            <button className="le-tool-btn" onClick={() => addElement(createShapeElement("rect", 100, 100))} title="Add Shape">
              <svg width="16" height="16" viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button className="le-tool-btn" onClick={() => addElement(createIconElement("star", 100, 100))} title="Add Icon">
              <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1 10.5,5.5 15.5,6 12,9.5 13,14.5 8,12 3,14.5 4,9.5 0.5,6 5.5,5.5" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <span className="le-tool-sep" />
            {selectedIds.length > 0 && (
              <>
                {selectedIds.length >= 2 && (
                  <>
                    <button className="le-tool-btn" onClick={groupSelected} title="Group (Ctrl+G)">Grp</button>
                    <button className="le-tool-btn" onClick={ungroupSelected} title="Ungroup (Ctrl+Shift+G)">Ugp</button>
                    <span className="le-tool-sep" />
                  </>
                )}
                <button className="le-tool-btn" onClick={duplicateSelected} title="Duplicate (Ctrl+D)">Dup</button>
                <button className="le-tool-btn" onClick={removeSelected} title="Delete (Del)">Del</button>
                <button className={`le-tool-btn${sel?.locked ? " active" : ""}`} onClick={lockSelected} title="Toggle Lock">Lock</button>
                <span className="le-tool-sep" />
                <button className="le-tool-btn" onClick={bringForward} title="Bring Forward">Up</button>
                <button className="le-tool-btn" onClick={sendBackward} title="Send Backward">Dn</button>
                <button className="le-tool-btn" onClick={bringToFront} title="Bring to Front">Top</button>
                <button className="le-tool-btn" onClick={sendToBack} title="Send to Back">Bot</button>
                <span className="le-tool-sep" />
                {selectedIds.length >= 2 && (
                  <>
                    <span className="le-tool-label">Align:</span>
                    <button className="le-tool-btn" onClick={() => alignElements("left")} title="Align Left">L</button>
                    <button className="le-tool-btn" onClick={() => alignElements("center")} title="Align Center">CH</button>
                    <button className="le-tool-btn" onClick={() => alignElements("right")} title="Align Right">R</button>
                    <button className="le-tool-btn" onClick={() => alignElements("top")} title="Align Top">T</button>
                    <button className="le-tool-btn" onClick={() => alignElements("middle")} title="Align Middle">CV</button>
                    <button className="le-tool-btn" onClick={() => alignElements("bottom")} title="Align Bottom">B</button>
                    <span className="le-tool-sep" />
                  </>
                )}
                <span className="le-tool-label">Canvas:</span>
                <button className="le-tool-btn" onClick={() => alignToCanvas("center")} title="Center H">CH</button>
                <button className="le-tool-btn" onClick={() => alignToCanvas("middle")} title="Center V">CV</button>
              </>
            )}
          </div>

          <div className="le-body">
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
                        <button className="le-layer-btn" onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }); }} title="Lock">
                          {el.locked ? "🔒" : "🔓"}
                        </button>
                        <button className="le-layer-btn" onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }} title="Toggle visibility">
                          {el.visible ? "👁" : "—"}
                        </button>
                      </div>
                    ))}
                    {project.elements.length === 0 && <div className="le-layer-empty">No elements yet</div>}
                  </div>
                )}
                {activeTab === "icons" && (
                  <div className="le-icon-grid">
                    {getIconPaths().map((name) => (
                      <button key={name} className="le-icon-btn" onClick={() => addElement(createIconElement(name, 100, 100))} title={name}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={getIconPath(name)} /></svg>
                      </button>
                    ))}
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

            <div className="le-canvas-area">
              <div className="le-canvas-scroll" style={{
                transform: `scale(${view.zoom}) translate(${view.panX / view.zoom}px, ${view.panY / view.zoom}px)`,
                transformOrigin: "0 0",
              }}>
                <canvas
                  ref={canvasRef}
                  className="le-canvas"
                  onMouseDown={handleCanvasDown}
                  onMouseMove={handleCanvasMove}
                  onMouseUp={handleCanvasUp}
                  onMouseLeave={handleCanvasUp}
                  onWheel={handleCanvasWheel}
                />
              </div>
              <div className="le-zoom-bar">
                <button className="le-zoom-btn" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom - 0.1, 0.25, 4) }))}>-</button>
                <span className="le-zoom-label">{Math.round(view.zoom * 100)}%</span>
                <button className="le-zoom-btn" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom + 0.1, 0.25, 4) }))}>+</button>
                <button className="le-zoom-btn" onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })}>Fit</button>
                <span className="le-zoom-label">{project.canvasWidth}×{project.canvasHeight}</span>
              </div>
            </div>

            <div className="le-props">
              <div className="le-props-tabs">
                <button className={`le-stab${activeTab === "text" ? " active" : ""}`} onClick={() => setActiveTab("text")}>Text</button>
                <button className={`le-stab${activeTab === "color" ? " active" : ""}`} onClick={() => setActiveTab("color")}>Color</button>
              </div>
              <div className="le-sidebar-body">
                {!sel && <div className="le-prop-empty">Select an element</div>}
                {sel && sel.type === "text" && activeTab === "text" && (
                  <div className="le-prop-group">
                    <label className="le-prop-label">Text</label>
                    <input className="le-prop-input" value={sel.text || ""} onChange={(e) => updateElement(sel.id, { text: e.target.value })} />
                    <label className="le-prop-label">Font</label>
                    <select className="le-prop-select" value={sel.fontFamily} onChange={(e) => updateElement(sel.id, { fontFamily: e.target.value })}>
                      {["Outfit", "Inter", "Georgia", "Playfair Display", "Arial Black", "Courier New", "Trebuchet MS", "Impact", "Garamond", "Roboto", "Montserrat", "Poppins", "Merriweather", "Space Grotesk", "Oswald", "Lora", "Nunito", "DM Sans"].map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <label className="le-prop-label">Size</label>
                    <input className="le-prop-input" type="number" value={sel.fontSize} onChange={(e) => updateElement(sel.id, { fontSize: +e.target.value })} min={8} max={200} />
                    <div className="le-prop-row">
                      <div><label className="le-prop-label">Weight</label><select className="le-prop-select" value={sel.fontWeight} onChange={(e) => updateElement(sel.id, { fontWeight: +e.target.value })}><option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={700}>Bold</option><option value={800}>Extra Bold</option><option value={900}>Black</option></select></div>
                      <div><label className="le-prop-label">Style</label><select className="le-prop-select" value={sel.fontStyle} onChange={(e) => updateElement(sel.id, { fontStyle: e.target.value as any })}><option value="normal">Normal</option><option value="italic">Italic</option></select></div>
                    </div>
                    <label className="le-prop-label">Decoration</label>
                    <select className="le-prop-select" value={sel.textDecoration || "none"} onChange={(e) => updateElement(sel.id, { textDecoration: e.target.value as any })}>
                      <option value="none">None</option>
                      <option value="underline">Underline</option>
                    </select>
                    <label className="le-prop-label">Alignment</label>
                    <div className="le-prop-row">
                      {(["left", "center", "right"] as const).map((a) => (
                        <button key={a} className={`le-prop-btn${sel.textAlign === a ? " active" : ""}`} onClick={() => updateElement(sel.id, { textAlign: a })}>
                          {a === "left" ? "L" : a === "center" ? "C" : "R"}
                        </button>
                      ))}
                    </div>
                    <label className="le-prop-label">Letter Spacing</label>
                    <input className="le-prop-input" type="number" value={sel.letterSpacing || 0} onChange={(e) => updateElement(sel.id, { letterSpacing: +e.target.value })} step={0.5} />
                    <label className="le-prop-label">Line Height</label>
                    <input className="le-prop-input" type="number" value={sel.lineHeight || 1.2} onChange={(e) => updateElement(sel.id, { lineHeight: +e.target.value })} step={0.1} min={0.5} max={3} />
                  </div>
                )}
                {(activeTab === "color" || (sel && sel.type !== "text")) && sel && (
                  <div className="le-prop-group">
                    <label className="le-prop-label">Fill Color</label>
                    <div className="le-prop-color-row">
                      <input className="le-prop-color" type="color" value={sel.fill || "#2563EB"} onChange={(e) => updateElement(sel.id, { fill: e.target.value })} />
                      <input className="le-prop-input" value={sel.fill || ""} onChange={(e) => updateElement(sel.id, { fill: e.target.value })} placeholder="#HEX" />
                    </div>
                    <div className="le-prop-presets">
                      {["#2563EB", "#16A34A", "#DC2626", "#D97706", "#7C3AED", "#0891B2", "#0F766E", "#1C1C1E", "#FFFFFF", "#0B192C", "#F59E0B", "#EC4899"].map((c) => (
                        <button key={c} className={`le-preset-btn${sel.fill === c ? " active" : ""}`} style={{ background: c, border: c === "#FFFFFF" ? "1px solid rgba(255,255,255,0.15)" : "none" }} onClick={() => updateElement(sel.id, { fill: c })} />
                      ))}
                    </div>
                    <label className="le-prop-label">Stroke / Border</label>
                    <div className="le-prop-color-row">
                      <input className="le-prop-color" type="color" value={(sel.stroke && sel.stroke !== "none") ? sel.stroke : "#000000"} onChange={(e) => updateElement(sel.id, { stroke: e.target.value })} />
                      <input className="le-prop-input" value={sel.stroke && sel.stroke !== "none" ? sel.stroke : ""} onChange={(e) => updateElement(sel.id, { stroke: e.target.value || "none" })} placeholder="none" />
                    </div>
                    {(sel.stroke && sel.stroke !== "none") && (
                      <><label className="le-prop-label">Stroke Width</label><input className="le-prop-input" type="number" value={sel.strokeWidth || 2} onChange={(e) => updateElement(sel.id, { strokeWidth: +e.target.value })} min={1} max={20} /></>
                    )}
                    <label className="le-prop-label">Opacity</label>
                    <input className="le-prop-range" type="range" min={0.1} max={1} step={0.05} value={sel.opacity} onChange={(e) => updateElement(sel.id, { opacity: +e.target.value })} />
                    {sel.type !== "text" && (
                      <>
                        <label className="le-prop-label">Width</label>
                        <input className="le-prop-input" type="number" value={sel.width} onChange={(e) => updateElement(sel.id, { width: Math.max(10, +e.target.value) })} min={10} />
                        <label className="le-prop-label">Height</label>
                        <input className="le-prop-input" type="number" value={sel.height} onChange={(e) => updateElement(sel.id, { height: Math.max(10, +e.target.value) })} min={10} />
                      </>
                    )}
                    <label className="le-prop-label">Rotation (°)</label>
                    <input className="le-prop-input" type="number" value={sel.rotation} onChange={(e) => updateElement(sel.id, { rotation: +e.target.value })} step={5} />
                    <label className="le-prop-label">Blur</label>
                    <input className="le-prop-range" type="range" min={0} max={20} step={0.5} value={sel.blur || 0} onChange={(e) => updateElement(sel.id, { blur: +e.target.value })} />
                    <details className="le-prop-details">
                      <summary>Shadow</summary>
                      <label className="le-prop-label">Color</label>
                      <div className="le-prop-color-row">
                        <input className="le-prop-color" type="color" value={sel.shadowColor || "#000000"} onChange={(e) => updateElement(sel.id, { shadowColor: e.target.value })} />
                        <input className="le-prop-input" value={sel.shadowColor || ""} onChange={(e) => updateElement(sel.id, { shadowColor: e.target.value })} placeholder="none" />
                      </div>
                      {sel.shadowColor && <><label className="le-prop-label">Blur</label><input className="le-prop-input" type="number" value={sel.shadowBlur || 4} onChange={(e) => updateElement(sel.id, { shadowBlur: +e.target.value })} min={0} max={50} /></>}
                      {sel.shadowColor && <><label className="le-prop-label">X Offset</label><input className="le-prop-input" type="number" value={sel.shadowOffsetX || 2} onChange={(e) => updateElement(sel.id, { shadowOffsetX: +e.target.value })} /></>}
                      {sel.shadowColor && <><label className="le-prop-label">Y Offset</label><input className="le-prop-input" type="number" value={sel.shadowOffsetY || 2} onChange={(e) => updateElement(sel.id, { shadowOffsetY: +e.target.value })} /></>}
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showTemplates && (
          <div className="le-overlay" onClick={() => setShowTemplates(false)}>
            <div className="le-modal" onClick={(e) => e.stopPropagation()}>
              <div className="le-modal-head">
                <h3>Logo Templates</h3>
                <button className="le-modal-close" onClick={() => setShowTemplates(false)}>x</button>
              </div>
              <div className="le-modal-body">
                <div className="le-tpl-grid">
                  {TEMPLATES.map((tpl) => (
                    <div key={tpl.id} className="le-tpl-card" onClick={() => loadTemplate(tpl)}>
                      <div className="le-tpl-preview" style={{ background: tpl.canvasBackground }}>
                        {tpl.elements.slice(0, 3).map((el, i) => (
                          <div key={i} className="le-tpl-el" style={{
                            position: "absolute",
                            left: `${(el.x / tpl.canvasWidth) * 100}%`,
                            top: `${(el.y / tpl.canvasHeight) * 100}%`,
                            width: `${(el.width / tpl.canvasWidth) * 100}%`,
                            height: `${(el.height / tpl.canvasHeight) * 100}%`,
                            fontSize: el.type === "text" ? `${Math.min(12, (el.fontSize || 32) / 3)}px` : undefined,
                            color: el.fill,
                            fontWeight: el.fontWeight,
                            fontFamily: el.fontFamily,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}>
                            {el.type === "text" ? el.text : el.type === "icon" ? "I" : el.shapeType === "circle" ? "O" : el.shapeType === "rect" ? "[]" : el.shapeType === "line" ? "—" : "*"}
                          </div>
                        ))}
                      </div>
                      <span className="le-tpl-name">{tpl.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .le-canvas-scroll { display: inline-block; }
        .le-canvas { cursor: default; }
        .le-btn-sm.active { background: rgba(37,99,235,0.15); color: #2563EB; }
        .le-tool-btn.active { background: rgba(37,99,235,0.15); color: #2563EB; }
        .le-tool-label { font-size: 11px; color: #64748B; margin: 0 2px; }
        .le-layer.locked { opacity: 0.6; }
        .le-layer.grouped { border-left: 2px solid #2563EB; }
        .le-layer-badge { font-size: 9px; background: #2563EB; color: #fff; border-radius: 3px; padding: 0 4px; margin-right: 4px; }
        .le-layer-btn { background: none; border: none; cursor: pointer; font-size: 11px; padding: 0 3px; opacity: 0.5; }
        .le-layer-btn:hover { opacity: 1; }
        .le-canvas-preset { font-size: 11px; padding: 2px 6px; border: 1px solid rgba(255,255,255,0.15); border-radius: 5px; background: rgba(255,255,255,0.06); color: inherit; cursor: pointer; }
        .le-export-group { display: flex; gap: 4px; }
        .le-prop-details { margin-top: 8px; }
        .le-prop-details summary { font-size: 11px; color: #64748B; cursor: pointer; padding: 4px 0; }
      `}</style>
    </section>
  );
}
