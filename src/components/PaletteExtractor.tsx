"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface PaletteColor {
  hex: string;
  rgb: [number, number, number];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
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
  const merged: PaletteColor[] = [];
  for (const item of sorted) {
    let added = false;
    for (const m of merged) {
      const dr = m.rgb[0] - item.rgb[0], dg = m.rgb[1] - item.rgb[1], db = m.rgb[2] - item.rgb[2];
      if (Math.sqrt(dr * dr + dg * dg + db * db) < 40) { added = true; break; }
    }
    if (!added) {
      merged.push({ hex: rgbToHex(...item.rgb), rgb: item.rgb });
      if (merged.length >= maxColors) break;
    }
  }
  return merged;
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
  const [copiedAll, setCopiedAll] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setPalette([]);
    setHoverPos(null);
    setHoverColor(null);
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setImageSrc(src);
      loadImage(src);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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
    const maxDim = 420;
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
    setPalette(extractPalette(id, 6));
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
    const color = getPixelColor(e.clientX, e.clientY);
    setHoverColor(color);
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
    setHoverColor(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const color = getPixelColor(e.clientX, e.clientY);
    if (!color) return;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const exists = palette.some((p) => p.hex === color);
    if (!exists && palette.length < 12) {
      setPalette((prev) => [...prev, { hex: color, rgb: [r, g, b] }]);
    }
  };

  const removeColor = (hex: string) => {
    setPalette((prev) => prev.filter((c) => c.hex !== hex));
  };

  const copyHex = (hex: string, i: number) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 1500);
    }).catch(() => {});
  };

  const copyAll = () => {
    navigator.clipboard.writeText(palette.map((c) => c.hex).join(", ")).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }).catch(() => {});
  };

  return (
    <section id="palette-extractor" className="palette-section">
      <div className="palette-wrap">
        <div className="palette-header rev">
          <span className="label">Free Tool</span>
          <h2>Color Palette <span>Extractor</span></h2>
          <p>Upload an image, then click anywhere on it to pick colors. Build your perfect brand palette.</p>
        </div>

        <div className="palette-body rev d2">
          <div className="palette-upload-col">
            <input type="file" id="palette-file-input" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
            {imageSrc ? (
              <div className="palette-canvas-wrap">
                <div className="palette-canvas-area">
                  <canvas
                    ref={displayCanvasRef}
                    className="palette-display-canvas"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleCanvasClick}
                  />
                  {hoverPos && hoverColor && (
                    <div className="palette-preview" style={{ left: hoverPos.x + 18, top: hoverPos.y - 30 }}>
                      <div className="palette-preview-swatch" style={{ background: hoverColor }} />
                      <span className="palette-preview-hex">{hoverColor}</span>
                    </div>
                  )}
                </div>
                <label htmlFor="palette-file-input" className="palette-reupload">Change Image</label>
              </div>
            ) : (
              <label htmlFor="palette-file-input" className="palette-upload-placeholder">
                <div className="palette-upload-icon">+</div>
                <span>Upload an image</span>
                <span className="palette-upload-hint">PNG, JPG, WEBP</span>
              </label>
            )}
            <canvas ref={hiddenCanvasRef} style={{ display: "none" }} />
          </div>

          <div className="palette-result-col">
            {loading && (
              <div className="palette-loading">
                <div className="palette-spinner" />
                <span>Extracting colors...</span>
              </div>
            )}

            {!loading && palette.length > 0 && (
              <div>
                <div className="palette-spectrum">
                  {palette.map((c, i) => (
                    <div key={c.hex + i} className="palette-spectrum-bar" style={{ background: c.hex }} />
                  ))}
                </div>
                <div className="palette-swatches">
                  {palette.map((c, i) => (
                    <div key={c.hex + i} className="palette-swatch-wrap" onClick={() => copyHex(c.hex, i)}>
                      <div className="palette-swatch" style={{ background: c.hex }}>
                        {copiedIndex === i && <span className="palette-copied">Copied!</span>}
                      </div>
                      <div className="palette-swatch-info">
                        <span className="palette-swatch-hex">{c.hex}</span>
                        <span className="palette-swatch-rgb">{c.rgb.join(", ")}</span>
                      </div>
                      <button className="palette-swatch-remove" onClick={(e) => { e.stopPropagation(); removeColor(c.hex); }} title="Remove color">x</button>
                    </div>
                  ))}
                </div>
                <div className="palette-copy-all-wrap">
                  <button className={`palette-copy-all${copiedAll ? " copied" : ""}`} onClick={copyAll}>
                    {copiedAll ? "Copied!" : "Copy all hex codes"}
                  </button>
                </div>
              </div>
            )}

            {!loading && !imageSrc && (
              <div className="palette-empty">
                <div className="palette-empty-visual">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                </div>
                <h3>Pick colors from your image</h3>
                <p>Upload an image, then click anywhere to pick colors</p>
              </div>
            )}

            {!loading && imageSrc && palette.length === 0 && (
              <div className="palette-empty">
                <div className="palette-empty-visual">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h3>Click the image to pick colors</h3>
                <p>Click anywhere on your image to add colors to the palette</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
