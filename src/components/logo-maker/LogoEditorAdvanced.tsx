"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { LogoElement, LogoProject, CanvasViewport } from "./types";
import { genId, createTextElement, createShapeElement, createIconElement, saveProjects, loadProjects, clamp } from "./utils";
import { getIconPaths, getIconPath } from "./icons";
import { TEMPLATES } from "./templates";

const DEFAULT_PROJECT: LogoProject = {
  id: genId(), name: "Untitled", elements: [],
  canvasWidth: 600, canvasHeight: 300, canvasBackground: "#FFFFFF",
  createdAt: Date.now(), updatedAt: Date.now(),
};

export default function LogoEditorAdvanced() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [project, setProject] = useState<LogoProject>(() => {
    const saved = loadProjects();
    return saved.length > 0 ? saved[0] : { ...DEFAULT_PROJECT, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [view, setView] = useState<CanvasViewport>({ zoom: 1, panX: 0, panY: 0 });
  const [dragMode, setDragMode] = useState<"none" | "move" | "resize" | "rotate">("none");
  const [dragStart, setDragStart] = useState<{ mx: number; my: number; orig: any } | null>(null);
  const [activeTab, setActiveTab] = useState<"layers" | "text" | "color" | "icons" | "shapes" | "templates">("layers");
  const [showTemplates, setShowTemplates] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [copied, setCopied] = useState(false);

  const sel = selectedIds.length === 1 ? project.elements.find((e) => e.id === selectedIds[0]) : null;

  useEffect(() => { saveProjects([project]); }, [project]);

  useEffect(() => { renderCanvas(); });

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
        svg += `<text x="0" y="0" font-family="${el.fontFamily}" font-size="${el.fontSize}px" font-weight="${el.fontWeight}" font-style="${el.fontStyle}" fill="${el.fill}" text-anchor="${el.textAlign === "center" ? "middle" : el.textAlign === "right" ? "end" : "start"}" dominant-baseline="central">${escXml(el.text || "")}</text>`;
      } else if (el.type === "icon") {
        const d = getIconPath(el.iconName || "star");
        svg += `<path d="${d}" fill="${el.fill}" transform="translate(${el.width / 2},${el.height / 2}) scale(${Math.min(el.width, el.height) / 24}) translate(-12,-12)"/>`;
      } else if (el.type === "shape") {
        const cx = el.width / 2, cy = el.height / 2, r = Math.min(cx, cy);
        if (el.shapeType === "rect") svg += `<rect width="${el.width}" height="${el.height}" fill="${el.fill}" rx="2"/>`;
        else if (el.shapeType === "circle") svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${el.fill}"/>`;
        else if (el.shapeType === "triangle") svg += `<polygon points="${cx},0 ${el.width},${el.height} 0,${el.height}" fill="${el.fill}"/>`;
        else if (el.shapeType === "diamond") svg += `<polygon points="${cx},0 ${el.width},${cy} ${cx},${el.height} 0,${cy}" fill="${el.fill}"/>`;
        else if (el.shapeType === "hexagon") {
          const p = Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
          }).join(" ");
          svg += `<polygon points="${p}" fill="${el.fill}"/>`;
        } else if (el.shapeType === "star") {
          const p = Array.from({ length: 10 }, (_, i) => {
            const a = (Math.PI / 5) * i - Math.PI / 2;
            const rad = i % 2 === 0 ? r : r * 0.4;
            return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
          }).join(" ");
          svg += `<polygon points="${p}" fill="${el.fill}"/>`;
        } else if (el.shapeType === "line") {
          svg += `<line x1="0" y1="${cy}" x2="${el.width}" y2="${cy}" stroke="${el.fill}" stroke-width="3"/>`;
        }
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

  function escXml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function renderCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = project.canvasWidth, H = project.canvasHeight;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    if (project.canvasBackground && project.canvasBackground !== "transparent") {
      ctx.fillStyle = project.canvasBackground;
      ctx.fillRect(0, 0, W, H);
    }
    const sorted = [...project.elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      if (!el.visible) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-el.width / 2, -el.height / 2);
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
      } else if (el.type === "shape") {
        ctx.fillStyle = el.fill || "#2563EB";
        const cx = el.width / 2, cy = el.height / 2, r = Math.min(cx, cy);
        if (el.shapeType === "rect") ctx.fillRect(0, 0, el.width, el.height);
        else if (el.shapeType === "circle") { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
        else if (el.shapeType === "triangle") { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(el.width, el.height); ctx.lineTo(0, el.height); ctx.closePath(); ctx.fill(); }
        else if (el.shapeType === "diamond") { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(el.width, cy); ctx.lineTo(cx, el.height); ctx.lineTo(0, cy); ctx.closePath(); ctx.fill(); }
        else if (el.shapeType === "hexagon") {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill();
        } else if (el.shapeType === "star") {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const a = (Math.PI / 5) * i - Math.PI / 2;
            const rad = i % 2 === 0 ? r : r * 0.4;
            const px = cx + rad * Math.cos(a), py = cy + rad * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill();
        } else if (el.shapeType === "line") {
          ctx.strokeStyle = el.fill || "#2563EB";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, cy);
          ctx.lineTo(el.width, cy);
          ctx.stroke();
        }
      }
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
  }

  function handleCanvasDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const scaleX = project.canvasWidth / rect.width;
    const scaleY = project.canvasHeight / rect.height;
    const cx = mx * scaleX, cy = my * scaleY;
    const sorted = [...project.elements].sort((a, b) => b.zIndex - a.zIndex);
    for (const el of sorted) {
      if (!el.visible || el.locked) continue;
      if (cx >= el.x && cx <= el.x + el.width && cy >= el.y && cy <= el.y + el.height) {
        if (!e.shiftKey) setSelectedIds([el.id]);
        else setSelectedIds((p) => p.includes(el.id) ? p : [...p, el.id]);
        setDragMode("move");
        setDragStart({ mx: cx, my: cy, orig: { x: el.x, y: el.y } });
        return;
      }
    }
    if (!e.shiftKey) setSelectedIds([]);
  }

  function handleCanvasMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragMode === "none" || !dragStart) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = project.canvasWidth / rect.width;
    const scaleY = project.canvasHeight / rect.height;
    const mx = (e.clientX - rect.left) * scaleX, my = (e.clientY - rect.top) * scaleY;
    const dx = mx - dragStart.mx, dy = my - dragStart.my;
    updateProject((p) => {
      for (const id of selectedIds) {
        const el = p.elements.find((e) => e.id === id);
        if (el) { el.x = dragStart.orig.x + dx; el.y = dragStart.orig.y + dy; }
      }
    });
  }

  function handleCanvasUp() {
    setDragMode("none");
    setDragStart(null);
  }

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setView((v) => ({ ...v, zoom: clamp(v.zoom - e.deltaY * 0.001, 0.25, 4) }));
    }
  };

  return (
    <section className="le-section">
      <div className="le-wrap">
        {/* Top bar */}
        <div className="le-topbar">
          <div className="le-topbar-left">
            <input className="le-name-input" value={projectName} onChange={(e) => setProjectName(e.target.value)} onBlur={saveProject} />
            <button className="le-btn-sm" onClick={newProject} title="New">+ New</button>
            <button className="le-btn-sm" onClick={() => setShowTemplates(true)} title="Templates">Templates</button>
          </div>
          <div className="le-topbar-right">
            <button className="le-btn-sm" onClick={saveProject}>Save</button>
            <button className="le-btn-sm le-btn-primary" onClick={exportPNG}>PNG</button>
            <button className="le-btn-sm le-btn-primary" onClick={exportSVG}>SVG</button>
          </div>
        </div>

        {/* Main editor area */}
        <div className="le-editor">
          {/* Toolbar — add elements */}
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
                <button className="le-tool-btn" onClick={duplicateSelected} title="Duplicate">Dup</button>
                <button className="le-tool-btn" onClick={removeSelected} title="Delete">Del</button>
                <button className="le-tool-btn" onClick={bringForward} title="Bring Forward">Up</button>
                <button className="le-tool-btn" onClick={sendBackward} title="Send Backward">Dn</button>
              </>
            )}
          </div>

          <div className="le-body">
            {/* Left — Layers */}
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
                      <div key={el.id} className={`le-layer${selectedIds.includes(el.id) ? " active" : ""}`} onClick={() => setSelectedIds([el.id])}>
                        <span className="le-layer-icon">{el.type === "text" ? "T" : el.type === "icon" ? "I" : el.type === "shape" ? "S" : "M"}</span>
                        <span className="le-layer-name">{el.text || el.iconName || el.shapeType || el.type}</span>
                        <button className="le-layer-vis" onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }}>
                          {el.visible ? "H" : "S"}
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

            {/* Center — Canvas */}
            <div className="le-canvas-area">
              <canvas
                ref={canvasRef}
                className="le-canvas"
                onMouseDown={handleCanvasDown}
                onMouseMove={handleCanvasMove}
                onMouseUp={handleCanvasUp}
                onMouseLeave={handleCanvasUp}
                onWheel={handleCanvasWheel}
              />
              <div className="le-zoom-bar">
                <button className="le-zoom-btn" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom - 0.1, 0.25, 4) }))}>-</button>
                <span className="le-zoom-label">{Math.round(view.zoom * 100)}%</span>
                <button className="le-zoom-btn" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom + 0.1, 0.25, 4) }))}>+</button>
              </div>
            </div>

            {/* Right — Properties */}
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
                      {["Outfit", "Inter", "Georgia", "Playfair Display", "Arial Black", "Courier New", "Trebuchet MS", "Impact", "Garamond", "Roboto", "Montserrat", "Poppins", "Merriweather", "Space Grotesk"].map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <label className="le-prop-label">Size</label>
                    <input className="le-prop-input" type="number" value={sel.fontSize} onChange={(e) => updateElement(sel.id, { fontSize: +e.target.value })} min={8} max={200} />
                    <div className="le-prop-row">
                      <div><label className="le-prop-label">Weight</label><select className="le-prop-select" value={sel.fontWeight} onChange={(e) => updateElement(sel.id, { fontWeight: +e.target.value })}><option value={300}>Light</option><option value={400}>Regular</option><option value={500}>Medium</option><option value={700}>Bold</option><option value={800}>Extra Bold</option><option value={900}>Black</option></select></div>
                      <div><label className="le-prop-label">Style</label><select className="le-prop-select" value={sel.fontStyle} onChange={(e) => updateElement(sel.id, { fontStyle: e.target.value as any })}><option value="normal">Normal</option><option value="italic">Italic</option></select></div>
                    </div>
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
                      {["#2563EB", "#16A34A", "#DC2626", "#D97706", "#7C3AED", "#0891B2", "#0F766E", "#1C1C1E", "#FFFFFF", "#0B192C"].map((c) => (
                        <button key={c} className={`le-preset-btn${sel.fill === c ? " active" : ""}`} style={{ background: c, border: c === "#FFFFFF" ? "1px solid rgba(255,255,255,0.15)" : "none" }} onClick={() => updateElement(sel.id, { fill: c })} />
                      ))}
                    </div>
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
                    <label className="le-prop-label">Rotation</label>
                    <input className="le-prop-input" type="number" value={sel.rotation} onChange={(e) => updateElement(sel.id, { rotation: +e.target.value })} step={5} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Template modal */}
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
    </section>
  );
}
