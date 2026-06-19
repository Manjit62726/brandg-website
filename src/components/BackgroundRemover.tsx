"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Toast { id: number; msg: string; type: "success" | "info" | "error"; }
let toastId = 0;

function colorDist(a: number[], b: number[]) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function clusterColors(samples: number[][], k: number): number[][] {
  if (!samples.length) return [[0,0,0]];
  const centers: number[][] = [];
  for (let i = 0; i < k; i++) centers.push([...samples[Math.floor(Math.random() * samples.length)]]);
  for (let iter = 0; iter < 8; iter++) {
    const clusters: number[][][] = Array.from({ length: k }, () => []);
    for (const s of samples) {
      let md = Infinity, mi = 0;
      for (let j = 0; j < k; j++) { const d = colorDist(s, centers[j]); if (d < md) { md = d; mi = j; } }
      clusters[mi].push(s);
    }
    for (let j = 0; j < k; j++) {
      if (!clusters[j].length) continue;
      const avg = [0,0,0];
      for (const c of clusters[j]) { avg[0] += c[0]; avg[1] += c[1]; avg[2] += c[2]; }
      centers[j] = [avg[0]/clusters[j].length, avg[1]/clusters[j].length, avg[2]/clusters[j].length];
    }
  }
  return centers;
}

function removeBg(data: Uint8ClampedArray, w: number, h: number, tol: number): Uint8Array {
  const step = Math.max(1, Math.floor(Math.min(w, h) / 50));
  const edgeSamples: number[][] = [];
  for (let x = 0; x < w; x += step) {
    const ti = x*4, bi = ((h-1)*w+x)*4;
    edgeSamples.push([data[ti], data[ti+1], data[ti+2]]);
    edgeSamples.push([data[bi], data[bi+1], data[bi+2]]);
  }
  for (let y = 0; y < h; y += step) {
    const li = y*w*4, ri = (y*w+w-1)*4;
    edgeSamples.push([data[li], data[li+1], data[li+2]]);
    edgeSamples.push([data[ri], data[ri+1], data[ri+2]]);
  }
  const bgColors = clusterColors(edgeSamples, 3);
  const visited = new Uint8Array(w * h);
  const isBg = new Uint8Array(w * h);
  const q: number[] = [];
  for (let x = 0; x < w; x++) { q.push(x); q.push((h-1)*w+x); }
  for (let y = 1; y < h-1; y++) { q.push(y*w); q.push(y*w+w-1); }
  let head = 0;
  while (head < q.length) {
    const i = q[head++];
    if (visited[i]) continue;
    visited[i] = 1;
    const idx = i * 4;
    const px = [data[idx], data[idx+1], data[idx+2]];
    let match = false;
    for (const bg of bgColors) { if (colorDist(px, bg) < tol) { match = true; break; } }
    if (match) {
      isBg[i] = 1;
      const y2 = Math.floor(i / w), x2 = i % w;
      if (x2 > 0 && !visited[i-1]) q.push(i-1);
      if (x2 < w-1 && !visited[i+1]) q.push(i+1);
      if (y2 > 0 && !visited[i-w]) q.push(i-w);
      if (y2 < h-1 && !visited[i+w]) q.push(i+w);
    }
  }
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = isBg[i] ? 0 : 255;
  return mask;
}

export default function BackgroundRemover() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const origDataRef = useRef<ImageData | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState<"auto" | "keep" | "remove">("auto");
  const [brushSize, setBrushSize] = useState(40);
  const [tolerance, setTolerance] = useState(35);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [bgType, setBgType] = useState<"transparent" | "solid" | "gradient">("transparent");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bgGradStart, setBgGradStart] = useState("#3B82F6");
  const [bgGradEnd, setBgGradEnd] = useState("#10B981");
  const [showOrig, setShowOrig] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const isDrawing = useRef(false);

  const toast = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2500);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const orig = origDataRef.current;
    const mask = maskRef.current;
    if (!canvas || !orig) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = dims;
    ctx.clearRect(0, 0, w, h);
    if (bgType === "solid") { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h); }
    else if (bgType === "gradient") { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, bgGradStart); g.addColorStop(1, bgGradEnd); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
    const id = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < w * h; i++) {
      const idx = i * 4;
      id.data[idx] = orig.data[idx];
      id.data[idx + 1] = orig.data[idx + 1];
      id.data[idx + 2] = orig.data[idx + 2];
      id.data[idx + 3] = showOrig ? 255 : (mask ? mask[i] : 255);
    }
    ctx.putImageData(id, 0, 0);
  }, [bgType, bgColor, bgGradStart, bgGradEnd, showOrig, dims]);

  useEffect(() => { render(); }, [render]);

  const doAutoRemove = useCallback(() => {
    const orig = origDataRef.current;
    if (!orig) return;
    setWorking(true);
    setTimeout(() => {
      const mask = removeBg(orig.data, dims.w, dims.h, tolerance);
      maskRef.current = mask;
      setMode("keep");
      render();
      setWorking(false);
      toast("Background removed! Use brush to refine.", "success");
    }, 50);
  }, [dims, tolerance, render, toast]);

  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1200;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > maxDim || h > maxDim) { const s = Math.min(maxDim / w, maxDim / h); w = Math.round(w * s); h = Math.round(h * s); }
      setDims({ w, h });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      origDataRef.current = ctx.getImageData(0, 0, w, h);
      maskRef.current = null;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setLoading(false);
      toast("Image loaded. Click Remove Background.", "info");
    };
    img.src = src;
  }, [toast]);

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Please upload an image", "error"); return; }
    setLoading(true);
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    loadImage(url);
  }, [loadImage, toast]);

  const applyBrush = useCallback((x: number, y: number) => {
    const mask = maskRef.current;
    const { w, h } = dims;
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
        if (mode === "remove") mask[i] = Math.round(Math.min(mask[i], (1 - falloff) * 255));
        else mask[i] = Math.round(Math.max(mask[i], falloff * 255));
      }
    }
    render();
  }, [dims, brushSize, mode, render]);

  const getPos = useCallback((cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: (cx - rect.left - pan.x) / zoom, y: (cy - rect.top - pan.y) / zoom };
  }, [zoom, pan]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = getPos(e.clientX, e.clientY);
    if (!pos || pos.x < 0 || pos.x >= dims.w || pos.y < 0 || pos.y >= dims.h) return;
    if (e.shiftKey || mode === "auto") { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return; }
    if (!maskRef.current) { const m = new Uint8Array(dims.w * dims.h); m.fill(255); maskRef.current = m; }
    isDrawing.current = true;
    applyBrush(pos.x, pos.y);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const pos = getPos(e.clientX, e.clientY);
    if (pos) setCursorPos(pos);
    if (isDrawing.current && pos) applyBrush(pos.x, pos.y);
    if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const onMouseUp = () => { isDrawing.current = false; setIsPanning(false); };

  const reset = () => {
    maskRef.current = null;
    setMode("auto");
    render();
    toast("Reset", "info");
  };

  const download = (fmt: "png" | "jpg") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    if (fmt === "png") { link.download = "background-removed.png"; link.href = canvas.toDataURL("image/png"); }
    else {
      const c2 = document.createElement("canvas");
      c2.width = canvas.width; c2.height = canvas.height;
      const ctx = c2.getContext("2d"); if (!ctx) return;
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, c2.width, c2.height);
      ctx.drawImage(canvas, 0, 0);
      link.href = c2.toDataURL("image/jpeg", 0.92);
      link.download = "background-removed.jpg";
    }
    link.click();
    toast(`Downloaded ${fmt.toUpperCase()}`, "success");
  };

  const step1 = !imageSrc;
  const step2 = !!(imageSrc && !loading && !maskRef.current && !working);
  const step3 = !!(maskRef.current && !working);

  return (
    <section className="br-section">
      <div className="br-wrap">
        <div className="br-header">
          <span className="br-label">Free Tool</span>
          <h2>Background <span>Remover</span></h2>
          <p>Upload an image, click <strong>Remove Background</strong>, then refine with brushes. Download with transparent, solid, or gradient backgrounds.</p>
        </div>

        <div className="br-steps">
          <div className={`br-step${step1 ? " active" : ""}${!step1 ? " done" : ""}`}><span className="br-step-num">1</span> Upload</div>
          <div className="br-step-line" />
          <div className={`br-step${step2 ? " active" : ""}${step3 ? " done" : ""}`}><span className="br-step-num">2</span> Remove</div>
          <div className="br-step-line" />
          <div className={`br-step${step3 ? " active" : ""}`}><span className="br-step-num">3</span> Refine &amp; Export</div>
        </div>

        <div className="br-body">
          <div className="br-canvas-col">
            {step1 ? (
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
                  {(loading || working) && (
                    <div className="br-loading-overlay">
                      <div className="br-spinner" />
                      <span>{working ? "Removing background..." : "Loading..."}</span>
                    </div>
                  )}
                  <div className="br-canvas-stage" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
                    <canvas ref={canvasRef} className="br-canvas" style={{ cursor: isPanning ? "grabbing" : (mode === "auto" ? "grab" : "crosshair") }}
                      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                    />
                    {mode !== "auto" && cursorPos && cursorPos.x >= 0 && cursorPos.x < dims.w && cursorPos.y >= 0 && cursorPos.y < dims.h && (
                      <div className="br-cursor" style={{
                        width: brushSize * zoom, height: brushSize * zoom,
                        left: cursorPos.x * zoom - (brushSize * zoom) / 2,
                        top: cursorPos.y * zoom - (brushSize * zoom) / 2,
                        borderColor: mode === "remove" ? "rgba(239,68,68,0.4)" : "rgba(52,211,153,0.4)",
                        background: mode === "remove" ? "rgba(239,68,68,0.06)" : "rgba(52,211,153,0.06)",
                      }} />
                    )}
                  </div>
                  <div className="br-toolbar">
                    <button className="br-tb" onClick={() => setZoom((z) => Math.min(5, z + 0.25))}>+</button>
                    <span className="br-zoom-lbl">{Math.round(zoom * 100)}%</span>
                    <button className="br-tb" onClick={() => setZoom((z) => Math.max(0.1, z - 0.25))}>&minus;</button>
                    <div className="br-div" />
                    <button className={`br-tb${showOrig ? " active" : ""}`} onClick={() => setShowOrig((s) => !s)}>Orig</button>
                    <div className="br-div" />
                    <button className="br-tb" onClick={reset}>Reset</button>
                  </div>
                </div>
                <div className="br-actions-row">
                  <label className="br-act-btn">Change Image<input type="file" accept="image/*" onChange={(e) => e.target.files && handleFiles(e.target.files)} hidden /></label>
                  <button className="br-act-btn" onClick={doAutoRemove} disabled={working || !origDataRef.current}>Remove Background</button>
                </div>
              </>
            )}
          </div>

          <div className="br-panel">
            {step2 && (
              <div className="br-pg">
                <span className="br-pl">Step 2: Remove Background</span>
                <p className="br-desc">Click the <strong>Remove Background</strong> button above to automatically detect and remove the background.</p>
                <div className="br-slider-row">
                  <span className="br-sl">Sensitivity</span>
                  <input type="range" min="10" max="70" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="br-slider" />
                  <span className="br-sv">{tolerance}</span>
                </div>
                <p className="br-desc">Lower = tighter selection &bull; Higher = removes more</p>
              </div>
            )}
            {step3 && (
              <>
                <div className="br-pg">
                  <span className="br-pl">Brush Mode</span>
                  <div className="br-mode-row">
                    <button className={`br-mb${mode === "keep" ? " active" : ""}`} onClick={() => setMode("keep")}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Keep
                    </button>
                    <button className={`br-mb${mode === "remove" ? " active" : ""}`} onClick={() => setMode("remove")}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Remove
                    </button>
                  </div>
                  <p className="br-desc">{mode === "keep" ? "Paint to restore areas that were removed" : "Paint to remove more areas"}</p>
                </div>
                <div className="br-pg">
                  <span className="br-pl">Brush Size</span>
                  <div className="br-slider-row">
                    <input type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="br-slider" />
                    <span className="br-sv">{brushSize}px</span>
                  </div>
                  <div className="br-presets">
                    {[10, 20, 40, 60, 100].map((s) => (<button key={s} className={`br-pb${brushSize === s ? " active" : ""}`} onClick={() => setBrushSize(s)}>{s}px</button>))}
                  </div>
                </div>
                <div className="br-pg">
                  <span className="br-pl">Background</span>
                  <div className="br-bg-row">
                    {(["transparent", "solid", "gradient"] as const).map((b) => (
                      <button key={b} className={`br-bb${bgType === b ? " active" : ""}`} onClick={() => setBgType(b)}>{b === "transparent" ? "None" : b === "solid" ? "Solid" : "Gradient"}</button>
                    ))}
                  </div>
                  {bgType === "solid" && (<div className="br-clr-row"><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="br-clr" /><span className="br-cv">{bgColor}</span></div>)}
                  {bgType === "gradient" && (<div className="br-grad-row"><input type="color" value={bgGradStart} onChange={(e) => setBgGradStart(e.target.value)} className="br-clr" /><input type="color" value={bgGradEnd} onChange={(e) => setBgGradEnd(e.target.value)} className="br-clr" /></div>)}
                </div>
                <div className="br-pg">
                  <span className="br-pl">Download</span>
                  <div className="br-dl-grid">
                    <button className="br-btn" onClick={() => download("png")}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> PNG</button>
                    <button className="br-btn" onClick={() => download("jpg")}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> JPG</button>
                  </div>
                </div>
                <div className="br-pg br-tips">
                  <span className="br-pl">Tips</span>
                  <ul><li>Adjust <strong>Sensitivity</strong> before clicking Remove</li><li>Use <strong>Keep</strong> to restore cut-out areas</li><li>Use <strong>Remove</strong> to erase leftover background</li><li><strong>Shift+drag</strong> to pan when zoomed</li></ul>
                </div>
              </>
            )}
            {!step1 && !step2 && !step3 && (
              <div className="br-pg"><span className="br-pl">Ready</span><p className="br-desc">Image loaded. Click Remove Background above.</p></div>
            )}
          </div>
        </div>
      </div>

      <div className="br-toasts">
        {toasts.map((t) => <div key={t.id} className={`br-toast br-toast-${t.type}`}>{t.msg}</div>)}
      </div>

      <style>{`
.br-section { background: linear-gradient(135deg,#0B1120 0%,#162044 100%); padding: 4rem 5% 5rem; min-height: 100vh; position: relative; }
.br-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 70% 20%, rgba(37,99,235,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(22,163,74,0.05) 0%, transparent 70%); pointer-events: none; }
.br-wrap { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
.br-header { text-align: center; margin-bottom: 1.5rem; }
.br-label { display: inline-flex; align-items: center; gap: 6px; font-size: .7rem; font-weight: 600; color: #6ee7b7; text-transform: uppercase; letter-spacing: .12em; margin-bottom: .5rem; }
.br-label::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #6ee7b7; }
.br-header h2 { color: #fff; margin: 0 0 .6rem; font-size: 1.8rem; }
.br-header h2 span { background: linear-gradient(135deg,#60a5fa,#34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.br-header p { color: rgba(255,255,255,.4); max-width: 540px; margin: 0 auto; font-size: .82rem; }
.br-header p strong { color: rgba(255,255,255,.5); }

.br-steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 1.5rem; }
.br-step { display: flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 20px; font-size: .72rem; font-weight: 500; color: rgba(255,255,255,.12); background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.03); transition: all .2s; }
.br-step.active { color: #60a5fa; background: rgba(37,99,235,.08); border-color: rgba(37,99,235,.15); }
.br-step.done { color: #34d399; }
.br-step-num { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .55rem; font-weight: 700; background: rgba(255,255,255,.04); }
.br-step.active .br-step-num { background: rgba(37,99,235,.2); }
.br-step.done .br-step-num { background: rgba(52,211,153,.15); }
.br-step-line { width: 40px; height: 1px; background: rgba(255,255,255,.04); margin: 0 4px; }

.br-body { display: grid; grid-template-columns: 1fr 260px; gap: 1.25rem; align-items: start; }

.br-dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 5rem 2rem; border: 2px dashed rgba(255,255,255,.06); border-radius: 14px; cursor: pointer; transition: all .3s; text-align: center; background: rgba(255,255,255,.01); min-height: 400px; }
.br-dropzone:hover { border-color: rgba(37,99,235,.35); background: rgba(37,99,235,.04); }
.br-dropzone-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,.02); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.04); color: rgba(255,255,255,.12); }
.br-dropzone-title { font-size: .9rem; color: rgba(255,255,255,.35); font-weight: 500; }
.br-dropzone-hint { font-size: .65rem; color: rgba(255,255,255,.15); }

.br-canvas-viewport { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,.06); background: repeating-conic-gradient(rgba(255,255,255,.03) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px; min-height: 380px; display: flex; align-items: center; justify-content: center; }
.br-canvas-stage { line-height: 0; }
.br-canvas { max-width: 100%; display: block; }
.br-cursor { position: absolute; border-radius: 50%; border: 2px solid; pointer-events: none; z-index: 5; }
.br-loading-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: rgba(11,17,32,.85); z-index: 20; color: rgba(255,255,255,.35); font-size: .78rem; }
.br-spinner { width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.06); border-top-color: #3b82f6; animation: s .6s linear infinite; }
@keyframes s { to { transform: rotate(360deg); } }
.br-toolbar { position: absolute; top: 8px; left: 8px; display: flex; align-items: center; gap: 3px; background: rgba(11,17,32,.85); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.06); border-radius: 8px; padding: 3px 5px; z-index: 10; }
.br-tb { padding: 4px 8px; font-size: .6rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; background: transparent; color: rgba(255,255,255,.4); transition: all .15s; font-family: inherit; line-height: 1; }
.br-tb:hover { background: rgba(255,255,255,.06); color: #fff; }
.br-tb.active { background: rgba(37,99,235,.15); color: #60a5fa; }
.br-div { width: 1px; height: 14px; background: rgba(255,255,255,.06); margin: 0 2px; }
.br-zoom-lbl { font-size: .58rem; font-weight: 600; color: rgba(255,255,255,.25); min-width: 28px; text-align: center; }
.br-actions-row { display: flex; gap: 8px; margin-top: 8px; }
.br-act-btn { padding: 6px 16px; font-size: .7rem; font-weight: 600; border-radius: 7px; cursor: pointer; border: 1px solid rgba(255,255,255,.06); background: rgba(37,99,235,.12); color: #60a5fa; transition: all .2s; font-family: inherit; }
.br-act-btn:hover { background: rgba(37,99,235,.18); color: #93c5fd; }
.br-act-btn:disabled { opacity: .25; cursor: default; }

.br-panel { display: flex; flex-direction: column; gap: .65rem; }
.br-pg { background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05); border-radius: 10px; padding: .8rem; }
.br-pl { display: block; font-size: .6rem; font-weight: 700; color: rgba(255,255,255,.2); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .55rem; }
.br-desc { font-size: .62rem; color: rgba(255,255,255,.18); margin: 4px 0 0; line-height: 1.4; }
.br-desc strong { color: rgba(255,255,255,.3); }

.br-mb { display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px; flex: 1; border-radius: 6px; border: 1px solid rgba(255,255,255,.04); background: transparent; color: rgba(255,255,255,.25); cursor: pointer; transition: all .15s; font-family: inherit; font-size: .65rem; font-weight: 500; }
.br-mb:hover { background: rgba(255,255,255,.03); color: rgba(255,255,255,.5); }
.br-mb.active { background: rgba(37,99,235,.1); border-color: rgba(37,99,235,.2); color: #60a5fa; }
.br-mode-row { display: flex; gap: 4px; }
.br-mode-row svg { flex-shrink: 0; }

.br-slider-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
.br-sl { font-size: .6rem; color: rgba(255,255,255,.25); min-width: 52px; }
.br-slider { flex: 1; -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,.06); outline: none; }
.br-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: none; }
.br-sv { font-size: .58rem; font-weight: 600; color: rgba(255,255,255,.25); min-width: 26px; text-align: right; }

.br-presets { display: flex; gap: 4px; margin-top: 5px; }
.br-pb { padding: 2px 8px; font-size: .52rem; font-weight: 500; border-radius: 4px; border: 1px solid rgba(255,255,255,.04); background: transparent; color: rgba(255,255,255,.2); cursor: pointer; font-family: inherit; transition: all .15s; }
.br-pb:hover { color: rgba(255,255,255,.4); }
.br-pb.active { background: rgba(37,99,235,.08); border-color: rgba(37,99,235,.15); color: #60a5fa; }

.br-bg-row { display: flex; gap: 4px; margin-bottom: 6px; }
.br-bb { padding: 3px 9px; font-size: .6rem; font-weight: 500; border-radius: 4px; border: 1px solid rgba(255,255,255,.04); background: transparent; color: rgba(255,255,255,.3); cursor: pointer; font-family: inherit; transition: all .15s; }
.br-bb:hover { color: rgba(255,255,255,.5); }
.br-bb.active { background: rgba(37,99,235,.1); border-color: rgba(37,99,235,.2); color: #60a5fa; }
.br-clr-row { display: flex; align-items: center; gap: 8px; }
.br-clr { width: 30px; height: 30px; border-radius: 5px; border: 1px solid rgba(255,255,255,.06); cursor: pointer; background: none; padding: 0; }
.br-clr::-webkit-color-swatch-wrapper { padding: 2px; }
.br-clr::-webkit-color-swatch { border-radius: 3px; border: none; }
.br-cv { font-size: .6rem; font-weight: 600; color: rgba(255,255,255,.2); font-family: 'SF Mono', monospace; }
.br-grad-row { display: flex; align-items: center; gap: 6px; }

.br-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 6px 10px; font-size: .65rem; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,.06); background: rgba(255,255,255,.04); color: rgba(255,255,255,.45); transition: all .2s; font-family: inherit; }
.br-btn:hover { background: rgba(255,255,255,.07); color: #fff; }
.br-dl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.br-dl-grid .br-btn { width: 100%; }

.br-tips ul { margin: 0; padding: 0 0 0 12px; }
.br-tips li { font-size: .6rem; color: rgba(255,255,255,.18); margin-bottom: 3px; line-height: 1.4; }
.br-tips strong { color: rgba(255,255,255,.28); }

.br-toasts { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; flex-direction: column; gap: 6px; z-index: 9999; pointer-events: none; }
.br-toast { padding: 8px 16px; border-radius: 8px; font-size: .72rem; font-weight: 500; backdrop-filter: blur(10px); animation: si .25s ease; pointer-events: auto; }
.br-toast-success { background: rgba(22,163,74,.15); border: 1px solid rgba(22,163,74,.2); color: #34d399; }
.br-toast-info { background: rgba(37,99,235,.12); border: 1px solid rgba(37,99,235,.15); color: #60a5fa; }
.br-toast-error { background: rgba(220,38,38,.12); border: 1px solid rgba(220,38,38,.15); color: #f87171; }
@keyframes si { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

@media (max-width: 860px) {
  .br-body { grid-template-columns: 1fr; }
  .br-header h2 { font-size: 1.4rem; }
  .br-section { padding: 3rem 4% 4rem; }
  .br-steps { gap: 0; flex-wrap: wrap; }
  .br-step-line { display: none; }
}
`}</style>
    </section>
  );
}
