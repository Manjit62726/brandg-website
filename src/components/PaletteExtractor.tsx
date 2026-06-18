"use client";

import { useRef, useState } from "react";

interface PaletteColor {
  hex: string;
  rgb: [number, number, number];
  count: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function labDistance(c1: [number, number, number], c2: [number, number, number]): number {
  const dr = c1[0] - c2[0], dg = c1[1] - c2[1], db = c1[2] - c2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function extractPalette(imageData: ImageData, maxColors: number): PaletteColor[] {
  const data = imageData.data;
  const total = data.length / 4;
  const step = Math.max(1, Math.floor(total / 8000));
  const bucket = new Map<string, { rgb: [number, number, number]; count: number }>();

  for (let i = 0; i < total; i += step) {
    const idx = i * 4;
    const r = Math.round(data[idx] / 12) * 12;
    const g = Math.round(data[idx + 1] / 12) * 12;
    const b = Math.round(data[idx + 2] / 12) * 12;
    const key = `${r},${g},${b}`;
    const existing = bucket.get(key);
    if (existing) {
      existing.count++;
    } else {
      bucket.set(key, { rgb: [r, g, b], count: 1 });
    }
  }

  let sorted = Array.from(bucket.values()).sort((a, b) => b.count - a.count);

  const merged: PaletteColor[] = [];
  const threshold = 40;

  for (const item of sorted) {
    let added = false;
    for (const m of merged) {
      if (labDistance(m.rgb, item.rgb) < threshold) {
        m.count += item.count;
        added = true;
        break;
      }
    }
    if (!added) {
      merged.push({ hex: rgbToHex(...item.rgb), rgb: item.rgb, count: item.count });
    }
    if (merged.length >= maxColors) break;
  }

  merged.sort((a, b) => b.count - a.count);
  return merged.slice(0, maxColors);
}

export default function PaletteExtractor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setPalette([]);
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setImageSrc(src);
      processImage(src);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const processImage = (src: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxDim = 400;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const colors = extractPalette(imageData, 6);
      setPalette(colors);
      setLoading(false);
    };
    img.src = src;
  };

  const copyHex = (hex: string, i: number) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 1500);
    }).catch(() => {});
  };

  return (
    <section id="palette-extractor" className="palette-section">
      <div className="palette-wrap">
        <div className="palette-header rev">
          <span className="label">Free Tool</span>
          <h2>Color Palette <span>Extractor</span></h2>
          <p>Upload any image and instantly get a cohesive brand color palette. Perfect for branding, design, and inspiration.</p>
        </div>

        <div className="palette-body rev d2">
          <div className="palette-upload-col">
            <div className="palette-upload-area">
              <input type="file" id="palette-file-input" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
              {imageSrc ? (
                <div className="palette-image-wrap">
                  <img src={imageSrc} alt="Uploaded" className="palette-image" />
                  <label htmlFor="palette-file-input" className="palette-reupload">Change Image</label>
                </div>
              ) : (
                <label htmlFor="palette-file-input" className="palette-upload-placeholder">
                  <span className="palette-upload-icon">+</span>
                  <span>Upload an image</span>
                  <span className="palette-upload-hint">PNG, JPG, WEBP</span>
                </label>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          <div className="palette-result-col">
            {loading && (
              <div className="palette-loading">
                <div className="palette-spinner" />
                <span>Extracting colors…</span>
              </div>
            )}

            {!loading && palette.length > 0 && (
              <div className="palette-output">
                <div className="palette-swatches">
                  {palette.map((c, i) => (
                    <div key={i} className="palette-swatch-wrap">
                      <div className="palette-swatch" style={{ background: c.hex }} onClick={() => copyHex(c.hex, i)} title="Click to copy">
                        {copiedIndex === i && <span className="palette-copied">Copied!</span>}
                      </div>
                      <div className="palette-swatch-info">
                        <span className="palette-swatch-hex">{c.hex}</span>
                        <span className="palette-swatch-rgb">{c.rgb.join(", ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="palette-hint">Click a color swatch to copy its hex code.</p>
              </div>
            )}

            {!loading && !imageSrc && (
              <div className="palette-empty">
                <span className="palette-empty-icon">🎨</span>
                <h3>No palette yet</h3>
                <p>Upload an image to extract its brand colors</p>
              </div>
            )}

            {!loading && imageSrc && palette.length === 0 && (
              <div className="palette-empty">
                <span className="palette-empty-icon">⚠️</span>
                <h3>Could not extract</h3>
                <p>Try a different image with more color variety</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
