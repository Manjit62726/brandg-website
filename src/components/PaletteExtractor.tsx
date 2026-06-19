"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface PaletteColor {
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  count: number;
}

interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  createdAt: number;
}

interface Toast {
  id: number;
  msg: string;
  type: "success" | "info" | "error";
}

let toastId = 0;
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return rgbToHex(f(0), f(8), f(4));
}
function hexToHsl(hex: string): [number, number, number] {
  const rgb = hexToRgb(hex);
  if (!rgb) return [0, 0, 0];
  return rgbToHsl(rgb[0], rgb[1], rgb[2]);
}
function complementary(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex);
  return [hslToHex((h + 180) % 360, s, l)];
}
function triadic(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex);
  return [hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
}
function analogous(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex);
  return [hslToHex((h - 30 + 360) % 360, s, l), hslToHex(h, s, l), hslToHex((h + 30) % 360, s, l)];
}
function splitComplementary(hex: string): string[] {
  const [h, s, l] = hexToHsl(hex);
  return [hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
}

function generateShades(hex: string, steps: number = 5): { lighter: string[]; darker: string[] } {
  const [h, s, l] = hexToHsl(hex);
  const lighter: string[] = [];
  const darker: string[] = [];
  for (let i = 1; i <= steps; i++) {
    const lightL = Math.min(100, l + Math.round((100 - l) * (i / (steps + 1))));
    lighter.push(hslToHex(h, s, lightL));
    const darkL = Math.max(0, Math.round(l * (1 - i / (steps + 1))));
    darker.push(hslToHex(h, s, darkL));
  }
  return { lighter, darker };
}

function extractPalette(imageData: ImageData, maxColors: number): PaletteColor[] {
  const data = imageData.data;
  const total = data.length / 4;
  const step = Math.max(1, Math.floor(total / 8000));
  const bucket = new Map<string, { rgb: [number, number, number]; count: number }>();

  for (let i = 0; i < total; i += step) {
    const idx = i * 4;
    const r = Math.round(data[idx] / 16) * 16;
    const g = Math.round(data[idx + 1] / 16) * 16;
    const b = Math.round(data[idx + 2] / 16) * 16;
    const key = `${r},${g},${b}`;
    const existing = bucket.get(key);
    if (existing) existing.count++;
    else bucket.set(key, { rgb: [r, g, b], count: 1 });
  }

  const sorted = Array.from(bucket.values()).sort((a, b) => b.count - a.count);
  const totalCount = sorted.reduce((s, x) => s + x.count, 0);
  const merged: PaletteColor[] = [];
  for (const item of sorted) {
    let added = false;
    for (const m of merged) {
      const dr = m.rgb[0] - item.rgb[0], dg = m.rgb[1] - item.rgb[1], db = m.rgb[2] - item.rgb[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) < 40) { added = true; break; }
    }
    if (!added) {
      merged.push({ hex: rgbToHex(...item.rgb), rgb: item.rgb, hsl: rgbToHsl(...item.rgb), count: item.count });
      if (merged.length >= maxColors) break;
    }
  }
  const mc = merged.reduce((s, x) => s + x.count, 0);
  return merged.map((c) => ({ ...c, count: Math.round((c.count / mc) * 100) }));
}

export default function PaletteExtractor() {
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState<"palette" | "harmonies" | "shades" | "export" | "saved">("palette");
  const [history, setHistory] = useState<PaletteColor[][]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [selectedHarmonyColor, setSelectedHarmonyColor] = useState<string | null>(null);
  const [selectedShadeColor, setSelectedShadeColor] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copyFormat, setCopyFormat] = useState<"hex" | "rgb" | "hsl">("hex");

  const toast = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2500);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("brandg-palettes");
      if (saved) setSavedPalettes(JSON.parse(saved));
    } catch {}
  }, []);

  const pushHistory = useCallback((p: PaletteColor[]) => {
    setHistory((h) => {
      const nh = h.slice(0, historyIdx + 1);
      nh.push(JSON.parse(JSON.stringify(p)));
      return nh.slice(-50);
    });
    setHistoryIdx((i) => Math.min(i + 1, 49));
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    setHistoryIdx((i) => i - 1);
    setPalette(JSON.parse(JSON.stringify(history[historyIdx - 1])));
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    setHistoryIdx((i) => i + 1);
    setPalette(JSON.parse(JSON.stringify(history[historyIdx + 1])));
  }, [history, historyIdx]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo]);

  const handleFiles = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Please upload an image file", "error"); return; }
    setLoading(true);
    setPalette([]);
    setHoverPos(null);
    setHoverColor(null);
    setActiveTab("palette");
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setImageSrc(src);
      loadImage(src);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const loadImage = (src: string) => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      renderImage(img);
      autoExtract(img);
      setLoading(false);
    };
    img.src = src;
  };

  const renderImage = (img: HTMLImageElement) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const maxDim = 480;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const scale = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
  };

  const autoExtract = (img: HTMLImageElement) => {
    const hc = hiddenCanvasRef.current;
    if (!hc) return;
    const hctx = hc.getContext("2d");
    if (!hctx) return;
    const maxDim = 200;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const scale = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    hc.width = w;
    hc.height = h;
    hctx.drawImage(img, 0, 0, w, h);
    const id = hctx.getImageData(0, 0, w, h);
    const p = extractPalette(id, 6);
    setPalette(p);
    pushHistory(p);
  };

  const getPixelColor = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(clientX - rect.left);
    const y = Math.round(clientY - rect.top);
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    return rgbToHex(pixel[0], pixel[1], pixel[2]);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setHoverPos({ x, y });
    setHoverColor(getPixelColor(e.clientX, e.clientY));
  };

  const handleMouseLeave = () => { setHoverPos(null); setHoverColor(null); };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const color = getPixelColor(e.clientX, e.clientY);
    if (!color) return;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const exists = palette.some((p) => p.hex === color);
    if (!exists && palette.length < 12) {
      const hsl = rgbToHsl(r, g, b);
      const np = [...palette, { hex: color, rgb: [r, g, b] as [number, number, number], hsl, count: 0 }];
      setPalette(np);
      pushHistory(np);
      toast("Color picked from image", "success");
    } else if (exists) {
      toast("Color already in palette", "info");
    } else {
      toast("Max 12 colors", "error");
    }
  };

  const copyHex = (hex: string, i: number, fmt: string = "hex") => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    let text = hex;
    if (fmt === "rgb") text = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    else if (fmt === "hsl") {
      const h = hexToHsl(hex);
      text = `hsl(${h[0]}, ${h[1]}%, ${h[2]}%)`;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 1500);
      toast(`Copied ${text}`, "success");
    }).catch(() => {});
  };

  const removeColor = (hex: string) => {
    const np = palette.filter((c) => c.hex !== hex);
    setPalette(np);
    pushHistory(np);
  };

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDropIdx(i); };
  const handleDrop = () => {
    if (dragIdx === null || dropIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDropIdx(null); return; }
    const np = [...palette];
    const [moved] = np.splice(dragIdx, 1);
    np.splice(dropIdx, 0, moved);
    setPalette(np);
    pushHistory(np);
    setDragIdx(null);
    setDropIdx(null);
  };

  const savePalette = () => {
    if (palette.length === 0) { toast("No colors to save", "error"); return; }
    const name = prompt("Palette name:", `Palette ${savedPalettes.length + 1}`);
    if (!name) return;
    const sp: SavedPalette = { id: Date.now().toString(), name, colors: palette.map((c) => c.hex), createdAt: Date.now() };
    const updated = [...savedPalettes, sp];
    setSavedPalettes(updated);
    localStorage.setItem("brandg-palettes", JSON.stringify(updated));
    toast("Palette saved", "success");
  };

  const loadSavedPalette = (sp: SavedPalette) => {
    const loaded: PaletteColor[] = sp.colors.map((hex) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return null;
      return { hex: hex.toUpperCase(), rgb, hsl: rgbToHsl(...rgb), count: 0 };
    }).filter(Boolean) as PaletteColor[];
    setPalette(loaded);
    pushHistory(loaded);
    toast(`Loaded "${sp.name}"`, "success");
  };

  const deleteSavedPalette = (id: string) => {
    const updated = savedPalettes.filter((sp) => sp.id !== id);
    setSavedPalettes(updated);
    localStorage.setItem("brandg-palettes", JSON.stringify(updated));
    toast("Palette deleted", "info");
  };

  const renameSavedPalette = (id: string) => {
    const sp = savedPalettes.find((p) => p.id === id);
    if (!sp) return;
    const name = prompt("New name:", sp.name);
    if (!name) return;
    const updated = savedPalettes.map((p) => p.id === id ? { ...p, name } : p);
    setSavedPalettes(updated);
    localStorage.setItem("brandg-palettes", JSON.stringify(updated));
    toast("Renamed", "success");
  };

  const exportCss = () => palette.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join("\n");
  const exportTailwind = () => {
    const colors = palette.map((c, i) => `    '${i + 1}': '${c.hex}'`).join(",\n");
    return `colors: {\n${colors}\n  }`;
  };
  const exportScss = () => palette.map((c, i) => `$color-${i + 1}: ${c.hex};`).join("\n");
  const exportList = () => palette.map((c) => c.hex).join(", ");

  const copyExport = (content: string, label: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedFormat(label);
      setTimeout(() => setCopiedFormat(null), 2000);
      toast(`Copied ${label}`, "success");
    }).catch(() => {});
  };

  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleReExtract = () => {
    if (!imageRef.current) return;
    setLoading(true);
    setPalette([]);
    autoExtract(imageRef.current);
    toast("Re-extracting colors...", "info");
  };

  const tabs = [
    { key: "palette" as const, label: "Palette" },
    { key: "harmonies" as const, label: "Harmonies" },
    { key: "shades" as const, label: "Shades" },
    { key: "export" as const, label: "Export" },
    { key: "saved" as const, label: "Saved" },
  ];

  const formatColor = (hex: string, fmt: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    if (fmt === "rgb") return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    if (fmt === "hsl") { const h = rgbToHsl(...rgb); return `hsl(${h[0]}, ${h[1]}%, ${h[2]}%)`; }
    return hex;
  };

  return (
    <section className="pe-section">
      <div className="pe-wrap">
        <div className="pe-header">
          <span className="pe-label">Free Tool</span>
          <h2>Color Palette <span>Extractor</span></h2>
          <p>Upload any image to automatically extract a color palette. Click on the image to pick specific colors.</p>
        </div>

        <div className="pe-body">
          {/* Left — Image area */}
          <div className="pe-image-col">
            {imageSrc ? (
              <div className="pe-canvas-wrap">
                <div className="pe-canvas-area">
                  <canvas
                    ref={displayCanvasRef}
                    className="pe-canvas"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleCanvasClick}
                  />
                  {hoverPos && hoverColor && (
                    <div className="pe-preview" style={{ left: hoverPos.x + 18, top: Math.max(-40, hoverPos.y - 44) }}>
                      <span className="pe-preview-swatch" style={{ background: hoverColor }} />
                      <span className="pe-preview-hex">{hoverColor}</span>
                    </div>
                  )}
                </div>
                <div className="pe-canvas-actions">
                  <label className="pe-btn-sm">Change Image<input type="file" accept="image/*" onChange={(e) => e.target.files && handleFiles(e.target.files)} hidden /></label>
                  <button className="pe-btn-sm" onClick={handleReExtract}>Re-extract</button>
                </div>
              </div>
            ) : (
              <div
                className={`pe-dropzone${isDragging ? " pe-dropzone-active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDropEvent}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="pe-dropzone-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <span className="pe-dropzone-title">Drop an image here</span>
                <span className="pe-dropzone-hint">or click to browse &bull; PNG, JPG, WEBP</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files && handleFiles(e.target.files)} hidden />
              </div>
            )}
            <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />
          </div>

          {/* Right — Tabs */}
          <div className="pe-panel-col">
            {/* Loading overlay */}
            {loading && (
              <div className="pe-loading">
                <div className="pe-spinner" />
                <span>Extracting colors...</span>
              </div>
            )}

            {!loading && !imageSrc && (
              <div className="pe-empty">
                <div className="pe-empty-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg></div>
                <h3>Upload an image to begin</h3>
                <p>Drop an image or click to browse, then click on the image to pick colors</p>
              </div>
            )}

            {!loading && imageSrc && (
              <>
                {/* Tabs */}
                <div className="pe-tabs">
                  {tabs.map((t) => (
                    <button key={t.key} className={`pe-tab${activeTab === t.key ? " active" : ""}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                  ))}
                </div>

                {/* Tab: Palette */}
                {activeTab === "palette" && (
                  <div className="pe-tab-content">
                    {palette.length === 0 ? (
                      <div className="pe-empty">
                        <div className="pe-empty-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                        <h3>Click the image to pick colors</h3>
                        <p>Click anywhere on your image to add colors to the palette</p>
                      </div>
                    ) : (
                      <>
                        {/* Spectrum bar */}
                        <div className="pe-spectrum">
                          {palette.map((c, i) => (
                            <div key={c.hex + i} className="pe-spectrum-bar" style={{ background: c.hex, flex: Math.max(1, c.count) }} title={`${c.hex} — ${c.count}%`} />
                          ))}
                        </div>

                        {/* Format toggle */}
                        <div className="pe-format-toggle">
                          {["hex", "rgb", "hsl"].map((f) => (
                            <button key={f} className={`pe-fmt-btn${copyFormat === f ? " active" : ""}`} onClick={() => setCopyFormat(f as typeof copyFormat)}>{f.toUpperCase()}</button>
                          ))}
                        </div>

                        {/* Swatches */}
                        <div className="pe-swatches">
                          {palette.map((c, i) => (
                            <div
                              key={c.hex + i}
                                              className={`pe-swatch${dragIdx === i ? " pe-dragging" : ""}${dropIdx === i ? " pe-drop-target" : ""}`}
                              draggable
                              onDragStart={() => handleDragStart(i)}
                              onDragOver={(e) => handleDragOver(e, i)}
                              onDragEnd={handleDrop}
                            >
                              <div className="pe-swatch-color" style={{ background: c.hex }} onClick={() => copyHex(c.hex, i, copyFormat)}>
                                {copiedIndex === i && <span className="pe-copied-badge">Copied!</span>}
                              </div>
                              <div className="pe-swatch-body">
                                <div className="pe-swatch-row">
                                  <span className="pe-swatch-hex">{formatColor(c.hex, copyFormat)}</span>
                                  <button className="pe-swatch-del" onClick={() => removeColor(c.hex)} title="Remove">&times;</button>
                                </div>
                                <div className="pe-swatch-bar-wrap">
                                  <div className="pe-swatch-bar" style={{ width: `${Math.max(3, c.count)}%` }} />
                                  <span className="pe-swatch-pct">{c.count}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="pe-actions">
                          <button className="pe-btn" onClick={savePalette}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save</button>
                          <button className="pe-btn" onClick={() => { navigator.clipboard.writeText(exportList()); toast("Copied all hex codes", "success"); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy All
                          </button>
                          {history.length > 1 && (
                            <>
                              <button className="pe-btn pe-btn-icon" onClick={undo} disabled={historyIdx <= 0} title="Undo (Ctrl+Z)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                              </button>
                              <button className="pe-btn pe-btn-icon" onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (Ctrl+Y)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Tab: Harmonies */}
                {activeTab === "harmonies" && (
                  <div className="pe-tab-content">
                    {palette.length === 0 ? (
                      <div className="pe-empty"><h3>No colors in palette</h3><p>Pick colors from your image first</p></div>
                    ) : (
                      <>
                        <p className="pe-tab-desc">Select a base color to see harmony combinations</p>
                        <div className="pe-harmony-select">
                          {palette.map((c) => (
                            <button key={c.hex} className={`pe-harmony-btn${selectedHarmonyColor === c.hex ? " active" : ""}`} onClick={() => setSelectedHarmonyColor(c.hex)} style={{ background: c.hex }} title={c.hex} />
                          ))}
                        </div>
                        {selectedHarmonyColor && (
                          <div className="pe-harmony-results">
                            {[
                              { label: "Complementary", colors: complementary(selectedHarmonyColor) },
                              { label: "Triadic", colors: triadic(selectedHarmonyColor) },
                              { label: "Analogous", colors: analogous(selectedHarmonyColor) },
                              { label: "Split Complementary", colors: splitComplementary(selectedHarmonyColor) },
                            ].map((h) => (
                              <div key={h.label} className="pe-harmony-group">
                                <span className="pe-harmony-label">{h.label}</span>
                                <div className="pe-harmony-colors">
                                  {h.colors.map((ch) => (
                                    <div key={ch} className="pe-harmony-swatch" onClick={() => { navigator.clipboard.writeText(ch); toast(`Copied ${ch}`, "success"); }} style={{ background: ch }} title={ch} />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Tab: Shades */}
                {activeTab === "shades" && (
                  <div className="pe-tab-content">
                    {palette.length === 0 ? (
                      <div className="pe-empty"><h3>No colors in palette</h3><p>Pick colors from your image first</p></div>
                    ) : (
                      <>
                        <p className="pe-tab-desc">Select a color to generate lighter and darker shades</p>
                        <div className="pe-harmony-select">
                          {palette.map((c) => (
                            <button key={c.hex} className={`pe-harmony-btn${selectedShadeColor === c.hex ? " active" : ""}`} onClick={() => setSelectedShadeColor(c.hex)} style={{ background: c.hex }} title={c.hex} />
                          ))}
                        </div>
                        {selectedShadeColor && (() => {
                          const { lighter, darker } = generateShades(selectedShadeColor);
                          return (
                            <div className="pe-shades-results">
                              <div className="pe-shade-group">
                                <span className="pe-harmony-label">Lighter</span>
                                <div className="pe-shade-row">
                                  {[...lighter].reverse().map((sh) => (
                                    <div key={sh} className="pe-shade-swatch" onClick={() => { navigator.clipboard.writeText(sh); toast(`Copied ${sh}`, "success"); }} style={{ background: sh }} title={sh}>
                                      <span className="pe-shade-hex">{sh}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="pe-shade-divider" />
                              <div className="pe-shade-group">
                                <span className="pe-harmony-label">Original</span>
                                <div className="pe-shade-row">
                                  <div className="pe-shade-swatch pe-shade-swatch-lg" style={{ background: selectedShadeColor }} title={selectedShadeColor}>
                                    <span className="pe-shade-hex">{selectedShadeColor}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="pe-shade-divider" />
                              <div className="pe-shade-group">
                                <span className="pe-harmony-label">Darker</span>
                                <div className="pe-shade-row">
                                  {darker.map((sh) => (
                                    <div key={sh} className="pe-shade-swatch" onClick={() => { navigator.clipboard.writeText(sh); toast(`Copied ${sh}`, "success"); }} style={{ background: sh }} title={sh}>
                                      <span className="pe-shade-hex">{sh}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* Tab: Export */}
                {activeTab === "export" && (
                  <div className="pe-tab-content">
                    {palette.length === 0 ? (
                      <div className="pe-empty"><h3>No colors to export</h3><p>Build a palette first</p></div>
                    ) : (
                      <div className="pe-export-formats">
                        {[
                          { label: "CSS Variables", code: exportCss(), lang: "css" },
                          { label: "Tailwind Config", code: exportTailwind(), lang: "js" },
                          { label: "SCSS Variables", code: exportScss(), lang: "scss" },
                          { label: "Comma Separated", code: exportList(), lang: "text" },
                        ].map((fmt) => (
                          <div key={fmt.label} className="pe-export-item">
                            <div className="pe-export-header">
                              <span className="pe-harmony-label">{fmt.label}</span>
                              <button className={`pe-btn-sm${copiedFormat === fmt.label ? " copied" : ""}`} onClick={() => copyExport(fmt.code, fmt.label)}>
                                {copiedFormat === fmt.label ? "Copied!" : "Copy"}
                              </button>
                            </div>
                            <pre className="pe-export-code">{fmt.code}</pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Saved */}
                {activeTab === "saved" && (
                  <div className="pe-tab-content">
                    {savedPalettes.length === 0 ? (
                      <div className="pe-empty"><h3>No saved palettes</h3><p>Save a palette to access it here later</p></div>
                    ) : (
                      <div className="pe-saved-list">
                        {savedPalettes.map((sp) => (
                          <div key={sp.id} className="pe-saved-item">
                            <div className="pe-saved-colors">
                              {sp.colors.map((c, i) => (
                                <div key={c + i} className="pe-saved-color" style={{ background: c }} title={c} />
                              ))}
                            </div>
                            <div className="pe-saved-body">
                              <span className="pe-saved-name">{sp.name}</span>
                              <span className="pe-saved-meta">{sp.colors.length} colors</span>
                            </div>
                            <div className="pe-saved-actions">
                              <button className="pe-btn-sm" onClick={() => loadSavedPalette(sp)}>Load</button>
                              <button className="pe-btn-sm" onClick={() => renameSavedPalette(sp.id)}>Rename</button>
                              <button className="pe-btn-sm pe-btn-danger" onClick={() => deleteSavedPalette(sp.id)}>Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="pe-toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`pe-toast pe-toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>

      <style>{`
.pe-section { background: linear-gradient(135deg, #0B1120 0%, #162044 100%); padding: 5rem 5% 6rem; min-height: 100vh; position: relative; }
.pe-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 70% 20%, rgba(37,99,235,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(22,163,74,0.05) 0%, transparent 70%); pointer-events: none; }
.pe-wrap { max-width: 1120px; margin: 0 auto; position: relative; z-index: 1; }
.pe-header { text-align: center; margin-bottom: 2.5rem; }
.pe-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 600; color: #6ee7b7; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; }
.pe-label::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #6ee7b7; }
.pe-header h2 { color: #fff; margin: 0 0 0.6rem; font-size: 2rem; }
.pe-header h2 span { background: linear-gradient(135deg, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pe-header p { color: rgba(255,255,255,0.4); max-width: 560px; margin: 0 auto; font-size: 0.85rem; }

.pe-body { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }

/* Image column */
.pe-image-col { }
.pe-dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 4.5rem 2rem; border: 2px dashed rgba(255,255,255,0.06); border-radius: 14px; cursor: pointer; transition: all 0.3s ease; text-align: center; background: rgba(255,255,255,0.01); min-height: 320px; }
.pe-dropzone:hover, .pe-dropzone-active { border-color: rgba(37,99,235,0.35); background: rgba(37,99,235,0.04); }
.pe-dropzone-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.12); }
.pe-dropzone-title { font-size: 0.9rem; color: rgba(255,255,255,0.35); font-weight: 500; }
.pe-dropzone-hint { font-size: 0.65rem; color: rgba(255,255,255,0.15); }
.pe-canvas-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.pe-canvas-area { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); line-height: 0; width: 100%; display: flex; justify-content: center; }
.pe-canvas { max-width: 100%; cursor: crosshair; display: block; }
.pe-preview { position: absolute; display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.75); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 3px 8px 3px 3px; pointer-events: none; white-space: nowrap; backdrop-filter: blur(8px); z-index: 5; }
.pe-preview-swatch { width: 16px; height: 16px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.12); flex-shrink: 0; }
.pe-preview-hex { font-size: 0.6rem; font-weight: 600; color: #fff; letter-spacing: 0.02em; }
.pe-canvas-actions { display: flex; gap: 8px; }
.pe-btn-sm { display: inline-flex; align-items: center; gap: 4px; padding: 5px 14px; font-size: 0.68rem; font-weight: 500; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.4); transition: all 0.2s ease; font-family: inherit; }
.pe-btn-sm:hover { background: rgba(255,255,255,0.07); color: #fff; }
.pe-btn-sm.copied { background: rgba(37,99,235,0.12); border-color: rgba(37,99,235,0.2); color: #60a5fa; }

/* Panel column */
.pe-panel-col { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 1.25rem; min-height: 360px; display: flex; flex-direction: column; position: relative; }
.pe-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.85rem; flex: 1; color: rgba(255,255,255,0.35); font-size: 0.85rem; }
.pe-spinner { width: 24px; height: 24px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,0.06); border-top-color: rgba(37,99,235,0.5); animation: peSpin 0.6s linear infinite; }
@keyframes peSpin { to { transform: rotate(360deg); } }

.pe-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; text-align: center; gap: 6px; padding: 2rem 0; }
.pe-empty-icon { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.02); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.03); color: rgba(255,255,255,0.08); margin-bottom: 4px; }
.pe-empty h3 { font-size: 0.82rem; font-weight: 700; color: rgba(255,255,255,0.25); margin: 0; }
.pe-empty p { font-size: 0.68rem; color: rgba(255,255,255,0.12); margin: 0; max-width: 200px; }

/* Tabs */
.pe-tabs { display: flex; gap: 2px; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 0; }
.pe-tab { padding: 0.45rem 0; font-size: 0.72rem; font-weight: 500; color: rgba(255,255,255,0.2); background: none; border: none; cursor: pointer; font-family: inherit; transition: all 0.2s; position: relative; margin-right: 1rem; }
.pe-tab:hover { color: rgba(255,255,255,0.5); }
.pe-tab.active { color: #60a5fa; }
.pe-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #3b82f6; border-radius: 1px; }
.pe-tab-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; max-height: 480px; }

/* Spectrum */
.pe-spectrum { display: flex; border-radius: 8px; overflow: hidden; height: 28px; margin-bottom: 0.75rem; border: 1px solid rgba(255,255,255,0.03); }
.pe-spectrum-bar { transition: flex 0.3s ease; position: relative; cursor: pointer; }
.pe-spectrum-bar:first-child { border-radius: 8px 0 0 8px; }
.pe-spectrum-bar:last-child { border-radius: 0 8px 8px 0; }

/* Format toggle */
.pe-format-toggle { display: flex; gap: 3px; margin-bottom: 0.75rem; background: rgba(255,255,255,0.02); border-radius: 6px; padding: 2px; width: fit-content; }
.pe-fmt-btn { padding: 3px 10px; font-size: 0.6rem; font-weight: 600; border: none; border-radius: 4px; cursor: pointer; background: transparent; color: rgba(255,255,255,0.2); font-family: inherit; transition: all 0.15s; }
.pe-fmt-btn.active { background: rgba(37,99,235,0.15); color: #60a5fa; }
.pe-fmt-btn:hover { color: rgba(255,255,255,0.5); }

/* Swatches */
.pe-swatches { display: flex; flex-direction: column; gap: 5px; }
.pe-swatch { display: flex; align-items: center; gap: 10px; padding: 5px 8px; border-radius: 8px; transition: all 0.15s; cursor: grab; border: 1px solid transparent; }
.pe-swatch:hover { background: rgba(255,255,255,0.03); }
.pe-swatch.pe-dragging { opacity: 0.4; }
.pe-swatch.pe-drop-target { border-color: rgba(37,99,235,0.3); background: rgba(37,99,235,0.04); }
.pe-swatch-color { width: 32px; height: 32px; border-radius: 6px; border: 1.5px solid rgba(255,255,255,0.06); flex-shrink: 0; position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.12s; }
.pe-swatch-color:hover { transform: scale(1.12); }
.pe-copied-badge { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); color: #fff; font-size: 0.45rem; font-weight: 700; border-radius: 5px; }
.pe-swatch-body { flex: 1; min-width: 0; }
.pe-swatch-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.pe-swatch-hex { font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.75); letter-spacing: 0.02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pe-swatch-del { width: 18px; height: 18px; border-radius: 4px; border: none; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.15); cursor: pointer; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; flex-shrink: 0; }
.pe-swatch-del:hover { background: rgba(220,38,38,0.15); color: #ef4444; }
.pe-swatch-bar-wrap { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.pe-swatch-bar { height: 3px; border-radius: 2px; background: linear-gradient(90deg, rgba(59,130,246,0.4), rgba(52,211,153,0.3)); transition: width 0.3s ease; }
.pe-swatch-pct { font-size: 0.55rem; font-weight: 600; color: rgba(255,255,255,0.15); }

/* Actions */
.pe-actions { display: flex; gap: 5px; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.04); flex-wrap: wrap; }
.pe-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; font-size: 0.68rem; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45); transition: all 0.2s ease; font-family: inherit; }
.pe-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
.pe-btn:disabled { opacity: 0.25; cursor: default; }
.pe-btn-icon { padding: 6px 7px; }

/* Harmonies */
.pe-tab-desc { font-size: 0.68rem; color: rgba(255,255,255,0.2); margin: 0 0 0.75rem; }
.pe-harmony-select { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1rem; }
.pe-harmony-btn { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
.pe-harmony-btn.active { border-color: #60a5fa; transform: scale(1.15); }
.pe-harmony-btn:hover { transform: scale(1.1); }
.pe-harmony-results { display: flex; flex-direction: column; gap: 0.85rem; }
.pe-harmony-group { }
.pe-harmony-label { display: block; font-size: 0.6rem; font-weight: 600; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
.pe-harmony-colors { display: flex; gap: 6px; }
.pe-harmony-swatch { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.06); cursor: pointer; transition: transform 0.12s; }
.pe-harmony-swatch:hover { transform: scale(1.15); }

/* Shades */
.pe-shades-results { display: flex; flex-direction: column; gap: 0.75rem; }
.pe-shade-group { }
.pe-shade-row { display: flex; gap: 4px; flex-wrap: wrap; }
.pe-shade-swatch { width: 44px; height: 44px; border-radius: 8px; border: 1.5px solid rgba(255,255,255,0.06); cursor: pointer; transition: transform 0.12s; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 3px; position: relative; }
.pe-shade-swatch:hover { transform: scale(1.1); }
.pe-shade-swatch-lg { width: 52px; height: 52px; }
.pe-shade-hex { font-size: 0.45rem; font-weight: 700; color: rgba(255,255,255,0.5); text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
.pe-shade-divider { height: 1px; background: rgba(255,255,255,0.04); }

/* Export */
.pe-export-formats { display: flex; flex-direction: column; gap: 0.85rem; }
.pe-export-item { }
.pe-export-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
.pe-export-code { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; padding: 8px 10px; font-size: 0.62rem; color: rgba(255,255,255,0.55); overflow-x: auto; white-space: pre; margin: 0; font-family: 'SF Mono', 'Fira Code', monospace; line-height: 1.5; }

/* Saved palettes */
.pe-saved-list { display: flex; flex-direction: column; gap: 8px; }
.pe-saved-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); }
.pe-saved-colors { display: flex; gap: 2px; }
.pe-saved-color { width: 18px; height: 18px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.04); }
.pe-saved-body { flex: 1; min-width: 0; }
.pe-saved-name { display: block; font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pe-saved-meta { font-size: 0.6rem; color: rgba(255,255,255,0.15); }
.pe-saved-actions { display: flex; gap: 4px; flex-shrink: 0; }
.pe-btn-danger { }
.pe-btn-danger:hover { background: rgba(220,38,38,0.15) !important; color: #ef4444 !important; border-color: rgba(220,38,38,0.2) !important; }

.pe-toasts { position: fixed; bottom: 1.5rem; right: 1.5rem; display: flex; flex-direction: column; gap: 6px; z-index: 9999; pointer-events: none; }
.pe-toast { padding: 8px 16px; border-radius: 8px; font-size: 0.72rem; font-weight: 500; backdrop-filter: blur(10px); animation: peSlideIn 0.25s ease; pointer-events: auto; }
.pe-toast-success { background: rgba(22,163,74,0.15); border: 1px solid rgba(22,163,74,0.2); color: #34d399; }
.pe-toast-info { background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.15); color: #60a5fa; }
.pe-toast-error { background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.15); color: #f87171; }
@keyframes peSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

@media (max-width: 768px) {
  .pe-body { grid-template-columns: 1fr; }
  .pe-header h2 { font-size: 1.5rem; }
  .pe-section { padding: 4rem 4% 5rem; }
}
`}</style>
    </section>
  );
}
