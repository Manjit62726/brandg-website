"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { removeBackground } from "@imgly/background-removal";

interface Toast { id: number; msg: string; type: "success" | "info" | "error"; }
let toastId = 0;

export default function BackgroundRemover() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const origImgRef = useRef<HTMLImageElement | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<"keep" | "remove">("keep");
  const [brushSize, setBrushSize] = useState(30);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [bgType, setBgType] = useState<"transparent" | "solid" | "gradient">("transparent");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bgGradStart, setBgGradStart] = useState("#3B82F6");
  const [bgGradEnd, setBgGradEnd] = useState("#10B981");
  const [showOriginal, setShowOriginal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [imageDims, setImageDims] = useState({ w: 0, h: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const toast = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2500);
  }, []);

  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = origImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = imageDims;
    ctx.clearRect(0, 0, w, h);

    // Draw background
    if (bgType === "solid") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
    } else if (bgType === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, bgGradStart);
      grad.addColorStop(1, bgGradEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Apply mask
    const mask = maskRef.current;
    if (mask) {
      const id = ctx.getImageData(0, 0, w, h);
      const origCanvas = document.createElement("canvas");
      origCanvas.width = w;
      origCanvas.height = h;
      const octx = origCanvas.getContext("2d");
      if (!octx) return;
      octx.drawImage(img, 0, 0, w, h);
      const origData = octx.getImageData(0, 0, w, h);
      for (let i = 0; i < w * h; i++) {
        const idx = i * 4;
        const alpha = showOriginal ? 255 : mask[i];
        id.data[idx] = origData.data[idx];
        id.data[idx + 1] = origData.data[idx + 1];
        id.data[idx + 2] = origData.data[idx + 2];
        id.data[idx + 3] = alpha;
      }
      ctx.putImageData(id, 0, 0);
    } else {
      ctx.drawImage(img, 0, 0, w, h);
    }
  }, [bgType, bgColor, bgGradStart, bgGradEnd, showOriginal, imageDims]);

  useEffect(() => { renderImage(); }, [renderImage]);

  const applyBgRemoval = useCallback(async () => {
    const img = origImgRef.current;
    if (!img) return;
    setProcessing(true);
    try {
      const blob = await removeBackground(img.src);
      const url = URL.createObjectURL(blob);
      const resultImg = new Image();
      resultImg.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { w, h } = imageDims;
        canvas.width = w;
        canvas.height = h;
        // Draw result and extract mask
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(resultImg, 0, 0, w, h);
        const id = ctx.getImageData(0, 0, w, h);
        const mask = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) mask[i] = id.data[i * 4 + 3];
        maskRef.current = mask;
        URL.revokeObjectURL(url);
        renderImage();
        setProcessing(false);
        toast("Background removed", "success");
      };
      resultImg.src = url;
    } catch (e) {
      setProcessing(false);
      toast("Background removal failed. Try a different image.", "error");
    }
  }, [imageDims, renderImage, toast]);

  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.onload = async () => {
      origImgRef.current = img;
      const maxDim = 1200;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > maxDim || h > maxDim) { const s = Math.min(maxDim / w, maxDim / h); w = Math.round(w * s); h = Math.round(h * s); }
      setImageDims({ w, h });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;
      maskRef.current = null;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      renderImage();
      setLoading(false);
      toast("Image loaded — removing background...", "info");
      // Auto-remove immediately
      await applyBgRemoval();
    };
    img.src = src;
  }, [renderImage, toast, applyBgRemoval]);

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Please upload an image", "error"); return; }
    setLoading(true);
    setImageSrc(URL.createObjectURL(file));
    loadImage(URL.createObjectURL(file));
  }, [loadImage, toast]);

  const applyBrush = useCallback((x: number, y: number) => {
    const mask = maskRef.current;
    const { w, h } = imageDims;
    if (!mask) return;
    const r = brushSize / 2;
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        const px = Math.round(x + dx), py = Math.round(y + dy);
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > r) continue;
        const i = py * w + px;
        const falloff = 1 - Math.min(1, d / r) * 0.5;
        if (mode === "remove") {
          mask[i] = Math.round(Math.min(mask[i], (1 - falloff) * 255));
        } else {
          mask[i] = Math.round(Math.max(mask[i], falloff * 255));
        }
      }
    }
    renderImage();
  }, [imageDims, brushSize, mode, renderImage]);

  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [zoom, pan]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (!pos || pos.x < 0 || pos.x >= imageDims.w || pos.y < 0 || pos.y >= imageDims.h) return;
    if (e.shiftKey) { setIsPanning(true); panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; isPanningRef.current = true; return; }
    isDrawingRef.current = true;
    setIsDrawing(true);
    applyBrush(pos.x, pos.y);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e.clientX, e.clientY);
    if (pos) setCursorPos(pos);
    if (isDrawingRef.current && pos) applyBrush(pos.x, pos.y);
    if (isPanningRef.current) setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
  };

  const handleCanvasMouseUp = () => { setIsDrawing(false); isDrawingRef.current = false; setIsPanning(false); isPanningRef.current = false; };

  const handleReset = () => {
    const { w, h } = imageDims;
    if (!w) return;
    const mask = new Uint8Array(w * h);
    mask.fill(255);
    maskRef.current = mask;
    renderImage();
    toast("Reset", "info");
  };

  const handleDownload = (format: "png" | "jpg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    if (format === "png") {
      link.download = "background-removed.png";
      link.href = canvas.toDataURL("image/png");
    } else {
      const jpgCanvas = document.createElement("canvas");
      jpgCanvas.width = canvas.width;
      jpgCanvas.height = canvas.height;
      const jctx = jpgCanvas.getContext("2d");
      if (!jctx) return;
      jctx.fillStyle = bgColor;
      jctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
      jctx.drawImage(canvas, 0, 0);
      link.href = jpgCanvas.toDataURL("image/jpeg", 0.92);
    }
    link.click();
    toast(`Downloaded as ${format.toUpperCase()}`, "success");
  };

  const handleReRemove = async () => {
    if (processing) return;
    await applyBgRemoval();
  };

  return (
    <section className="br-section">
      <div className="br-wrap">
        <div className="br-header">
          <span className="br-label">Free Tool</span>
          <h2>Background <span>Remover</span></h2>
          <p>Upload any image and remove its background automatically using AI. Refine with brushes and export with transparent, solid, or gradient backgrounds.</p>
        </div>

        <div className="br-body">
          {/* Canvas area */}
          <div className="br-canvas-col">
            {!imageSrc ? (
              <div className="br-dropzone" onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
              >
                <div className="br-dropzone-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                <span className="br-dropzone-title">Drop an image here</span>
                <span className="br-dropzone-hint">or click to browse &bull; PNG, JPG, WEBP</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files && handleFiles(e.target.files)} hidden />
              </div>
            ) : (
              <>
                <div className="br-canvas-viewport">
                  {(loading || processing) && (
                    <div className="br-loading-overlay">
                      <div className="br-loading-spinner" />
                      <span>{loading ? "Loading image..." : processing ? "Removing background with AI..." : ""}</span>
                    </div>
                  )}
                  <div className="br-canvas-stage" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
                    <canvas ref={canvasRef} className="br-canvas" style={{ cursor: isPanning ? "grabbing" : "crosshair" }}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    />
                    {!processing && cursorPos && cursorPos.x >= 0 && cursorPos.x < imageDims.w && cursorPos.y >= 0 && cursorPos.y < imageDims.h && (
                      <div className="br-brush-cursor" style={{
                        width: brushSize * zoom,
                        height: brushSize * zoom,
                        left: cursorPos.x * zoom - (brushSize * zoom) / 2,
                        top: cursorPos.y * zoom - (brushSize * zoom) / 2,
                        borderColor: mode === "remove" ? "rgba(239,68,68,0.4)" : "rgba(52,211,153,0.4)",
                        background: mode === "remove" ? "rgba(239,68,68,0.06)" : "rgba(52,211,153,0.06)",
                      }} />
                    )}
                  </div>
                  {/* Toolbar over canvas */}
                  <div className="br-canvas-toolbar">
                    <button className="br-tb-btn" onClick={() => setZoom((z) => Math.min(5, z + 0.25))} title="Zoom in"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>
                    <span className="br-zoom-lbl">{Math.round(zoom * 100)}%</span>
                    <button className="br-tb-btn" onClick={() => setZoom((z) => Math.max(0.1, z - 0.25))} title="Zoom out"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>
                    <div className="br-tb-divider" />
                    <button className={`br-tb-btn${showOriginal ? " active" : ""}`} onClick={() => setShowOriginal((s) => !s)} title="Toggle original vs result">Original</button>
                    <div className="br-tb-divider" />
                    <button className="br-tb-btn" onClick={handleReRemove} disabled={processing} title="Re-remove background"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>
                    <button className="br-tb-btn" onClick={handleReset} title="Reset mask"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                  </div>
                </div>
                <div className="br-actions-row">
                  <label className="br-action-btn">Change Image<input type="file" accept="image/*" onChange={(e) => e.target.files && handleFiles(e.target.files)} hidden /></label>
                  <button className="br-action-btn" onClick={handleReRemove} disabled={processing}>Re-remove</button>
                </div>
              </>
            )}
          </div>

          {/* Tools panel */}
          <div className="br-panel-col">
            {/* Mode selector */}
            <div className="br-panel-group">
              <span className="br-panel-label">Refine Mode</span>
              <div className="br-mode-row">
                <button className={`br-mode-btn${mode === "keep" ? " active" : ""}`} onClick={() => setMode("keep")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Keep
                </button>
                <button className={`br-mode-btn${mode === "remove" ? " active" : ""}`} onClick={() => setMode("remove")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Remove
                </button>
              </div>
              <div className="br-mode-hint">{mode === "keep" ? "Paint to restore areas" : "Paint to remove areas"}</div>
            </div>

            {/* Brush */}
            <div className="br-panel-group">
              <span className="br-panel-label">Brush Size</span>
              <div className="br-slider-row">
                <input type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="br-slider" />
                <span className="br-slider-val">{brushSize}px</span>
              </div>
              <div className="br-size-presets">
                {[10, 25, 50, 80, 120].map((s) => (
                  <button key={s} className={`br-size-btn${brushSize === s ? " active" : ""}`} onClick={() => setBrushSize(s)}>{s}px</button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="br-panel-group">
              <span className="br-panel-label">Background</span>
              <div className="br-bg-options">
                {[
                  { key: "transparent" as const, label: "Transparent" },
                  { key: "solid" as const, label: "Solid" },
                  { key: "gradient" as const, label: "Gradient" },
                ].map((b) => (
                  <button key={b.key} className={`br-bg-btn${bgType === b.key ? " active" : ""}`} onClick={() => setBgType(b.key)}>{b.label}</button>
                ))}
              </div>
              {bgType === "solid" && (
                <div className="br-color-input-row">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="br-color-input" />
                  <span className="br-color-val">{bgColor}</span>
                </div>
              )}
              {bgType === "gradient" && (
                <div className="br-grad-row">
                  <input type="color" value={bgGradStart} onChange={(e) => setBgGradStart(e.target.value)} className="br-color-input" />
                  <span className="br-grad-arrow">&rarr;</span>
                  <input type="color" value={bgGradEnd} onChange={(e) => setBgGradEnd(e.target.value)} className="br-color-input" />
                </div>
              )}
            </div>

            {/* Download */}
            <div className="br-panel-group">
              <span className="br-panel-label">Download</span>
              <div className="br-download-grid">
                <button className="br-btn" onClick={() => handleDownload("png")} disabled={!imageSrc}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PNG
                </button>
                <button className="br-btn" onClick={() => handleDownload("jpg")} disabled={!imageSrc}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  JPG
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="br-panel-group br-tips">
              <span className="br-panel-label">Tips</span>
              <ul>
                <li>Background is removed automatically using AI</li>
                <li>Use <strong>Keep</strong> brush to restore anything removed</li>
                <li>Use <strong>Remove</strong> brush to erase more areas</li>
                <li><strong>Shift+drag</strong> to pan when zoomed in</li>
                <li>Click <strong>Re-remove</strong> to run AI again after edits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="br-toasts">
        {toasts.map((t) => <div key={t.id} className={`br-toast br-toast-${t.type}`}>{t.msg}</div>)}
      </div>

      <style>{`
.br-section { background: linear-gradient(135deg, #0B1120 0%, #162044 100%); padding: 5rem 5% 6rem; min-height: 100vh; position: relative; }
.br-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 70% 20%, rgba(37,99,235,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(22,163,74,0.05) 0%, transparent 70%); pointer-events: none; }
.br-wrap { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
.br-header { text-align: center; margin-bottom: 2.5rem; }
.br-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 600; color: #6ee7b7; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
.br-label::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #6ee7b7; }
.br-header h2 { color: #fff; margin: 0 0 0.6rem; font-size: 2rem; }
.br-header h2 span { background: linear-gradient(135deg, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.br-header p { color: rgba(255,255,255,0.4); max-width: 560px; margin: 0 auto; font-size: 0.85rem; }
.br-body { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; align-items: start; }

.br-canvas-col { }
.br-dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 5rem 2rem; border: 2px dashed rgba(255,255,255,0.06); border-radius: 14px; cursor: pointer; transition: all 0.3s ease; text-align: center; background: rgba(255,255,255,0.01); min-height: 400px; }
.br-dropzone:hover { border-color: rgba(37,99,235,0.35); background: rgba(37,99,235,0.04); }
.br-dropzone-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.12); }
.br-dropzone-title { font-size: 0.9rem; color: rgba(255,255,255,0.35); font-weight: 500; }
.br-dropzone-hint { font-size: 0.65rem; color: rgba(255,255,255,0.15); }

.br-canvas-viewport { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); background: repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px; min-height: 400px; display: flex; align-items: center; justify-content: center; }
.br-canvas-stage { line-height: 0; }
.br-canvas { max-width: 100%; display: block; image-rendering: auto; }
.br-brush-cursor { position: absolute; border-radius: 50%; border: 2px solid; pointer-events: none; z-index: 5; }
.br-loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(11,17,32,0.85); z-index: 20; color: rgba(255,255,255,0.4); font-size: 0.8rem; }
.br-loading-spinner { width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,0.06); border-top-color: #3b82f6; animation: brSpin 0.6s linear infinite; }
@keyframes brSpin { to { transform: rotate(360deg); } }
.br-actions-row { display: flex; gap: 8px; margin-top: 8px; }
.br-action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 14px; font-size: 0.68rem; font-weight: 500; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); transition: all 0.2s ease; font-family: inherit; }
.br-action-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
.br-action-btn:disabled { opacity: 0.25; cursor: default; }

.br-canvas-toolbar { position: absolute; top: 8px; left: 8px; display: flex; align-items: center; gap: 4px; background: rgba(11,17,32,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 4px 6px; z-index: 10; }
.br-tb-btn { display: flex; align-items: center; gap: 3px; padding: 4px 7px; font-size: 0.6rem; font-weight: 600; border: none; border-radius: 4px; cursor: pointer; background: transparent; color: rgba(255,255,255,0.4); transition: all 0.15s; font-family: inherit; }
.br-tb-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
.br-tb-btn.active { background: rgba(37,99,235,0.15); color: #60a5fa; }
.br-tb-btn:disabled { opacity: 0.2; cursor: default; }
.br-tb-divider { width: 1px; height: 16px; background: rgba(255,255,255,0.06); margin: 0 2px; }
.br-zoom-lbl { font-size: 0.6rem; font-weight: 600; color: rgba(255,255,255,0.25); min-width: 30px; text-align: center; }

.br-panel-col { display: flex; flex-direction: column; gap: 0.75rem; }
.br-panel-group { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 0.85rem; }
.br-panel-label { display: block; font-size: 0.6rem; font-weight: 700; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.6rem; }

.br-mode-row { display: flex; gap: 4px; }
.br-mode-btn { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; flex: 1; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); background: transparent; color: rgba(255,255,255,0.25); cursor: pointer; transition: all 0.15s; font-family: inherit; font-size: 0.65rem; font-weight: 500; }
.br-mode-btn:hover { background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5); }
.br-mode-btn.active { background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.2); color: #60a5fa; }
.br-mode-hint { font-size: 0.6rem; color: rgba(255,255,255,0.2); margin-top: 6px; }

.br-slider-row { display: flex; align-items: center; gap: 8px; }
.br-slider { flex: 1; -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.06); outline: none; }
.br-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: none; }
.br-slider-val { font-size: 0.6rem; font-weight: 600; color: rgba(255,255,255,0.3); min-width: 28px; text-align: right; }

.br-size-presets { display: flex; gap: 4px; margin-top: 6px; }
.br-size-btn { padding: 3px 8px; font-size: 0.55rem; font-weight: 500; border-radius: 4px; border: 1px solid rgba(255,255,255,0.04); background: transparent; color: rgba(255,255,255,0.2); cursor: pointer; font-family: inherit; transition: all 0.15s; }
.br-size-btn:hover { color: rgba(255,255,255,0.4); }
.br-size-btn.active { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.15); color: #60a5fa; }

.br-bg-options { display: flex; gap: 4px; margin-bottom: 8px; }
.br-bg-btn { padding: 4px 10px; font-size: 0.62rem; font-weight: 500; border-radius: 4px; border: 1px solid rgba(255,255,255,0.04); background: transparent; color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.15s; font-family: inherit; }
.br-bg-btn:hover { color: rgba(255,255,255,0.5); }
.br-bg-btn.active { background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.2); color: #60a5fa; }
.br-color-input-row { display: flex; align-items: center; gap: 8px; }
.br-color-input { width: 32px; height: 32px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; background: none; padding: 0; }
.br-color-input::-webkit-color-swatch-wrapper { padding: 2px; }
.br-color-input::-webkit-color-swatch { border-radius: 3px; border: none; }
.br-color-val { font-size: 0.62rem; font-weight: 600; color: rgba(255,255,255,0.25); font-family: 'SF Mono', monospace; }
.br-grad-row { display: flex; align-items: center; gap: 6px; }
.br-grad-arrow { color: rgba(255,255,255,0.15); font-size: 0.85rem; }

.br-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 7px 12px; font-size: 0.68rem; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45); transition: all 0.2s ease; font-family: inherit; }
.br-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
.br-btn:disabled { opacity: 0.25; cursor: default; }

.br-download-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.br-download-grid .br-btn { width: 100%; }

.br-tips ul { margin: 0; padding: 0 0 0 14px; }
.br-tips li { font-size: 0.62rem; color: rgba(255,255,255,0.2); margin-bottom: 4px; line-height: 1.4; }
.br-tips strong { color: rgba(255,255,255,0.3); }

.br-toasts { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; flex-direction: column; gap: 6px; z-index: 9999; pointer-events: none; }
.br-toast { padding: 8px 16px; border-radius: 8px; font-size: 0.72rem; font-weight: 500; backdrop-filter: blur(10px); animation: brSlideIn 0.25s ease; pointer-events: auto; }
.br-toast-success { background: rgba(22,163,74,0.15); border: 1px solid rgba(22,163,74,0.2); color: #34d399; }
.br-toast-info { background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.15); color: #60a5fa; }
.br-toast-error { background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.15); color: #f87171; }
@keyframes brSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

@media (max-width: 900px) {
  .br-body { grid-template-columns: 1fr; }
  .br-header h2 { font-size: 1.5rem; }
  .br-section { padding: 4rem 4% 5rem; }
}
`}</style>
    </section>
  );
}
