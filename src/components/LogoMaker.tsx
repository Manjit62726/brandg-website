"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface LogoState {
  brand: string;
  tagline: string;
  font: string;
  layout: string;
  uploadedImage: string | null;
  color: string;
  bg: string;
  imageSize: number;
  textSize: number;
}

const bgColors: Record<string, string | null> = {
  white: "#FFFFFF",
  light: "#F8F6F1",
  dark: "#1C1C1E",
  transparent: null,
};

const colors = [
  { hex: "#2563EB", name: "Blue" },
  { hex: "#16A34A", name: "Green" },
  { hex: "#1C1C1E", name: "Ink" },
  { hex: "#7C3AED", name: "Violet" },
  { hex: "#DC2626", name: "Crimson" },
  { hex: "#0891B2", name: "Teal" },
  { hex: "#D97706", name: "Amber" },
  { hex: "#0D9488", name: "Mint" },
];
const layouts = ["image-above", "image-left", "text-only", "stacked", "badge", "minimal"];
const layoutLabels: Record<string, string> = {
  "image-above": "Image Above",
  "image-left": "Image Left",
  "text-only": "Text Only",
  stacked: "Stacked",
  badge: "Badge",
  minimal: "Minimal",
};

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

export default function LogoMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [state, setState] = useState<LogoState>({
    brand: "YourBrand",
    tagline: "",
    font: "Outfit",
    layout: "image-above",
    uploadedImage: null,
    color: "#2563EB",
    bg: "white",
    imageSize: 64,
    textSize: 32,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 600, H = 300;
    ctx.clearRect(0, 0, W, H);

    const bgC = bgColors[state.bg];
    if (bgC) {
      ctx.fillStyle = bgC;
      roundRect(ctx, 0, 0, W, H, 12);
      ctx.fill();
    }

    const isDark = state.bg === "dark";
    const textColor = isDark ? "#FFFFFF" : "#0B192C";
    const subColor = isDark ? "rgba(255,255,255,0.5)" : "#64748B";
    const cx = W / 2, cy = H / 2;
    const { imageSize, textSize } = state;
    const tagSize = Math.max(11, textSize * 0.38);
    const gap = 14;
    const img = imageRef.current;
    const hasImage = img !== null && state.uploadedImage !== null;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (state.layout === "image-above") {
      const imgH = hasImage ? imageSize : 0;
      let totalH = (hasImage ? imgH + gap : 0) + textSize + (state.tagline ? tagSize + 6 : 0);
      let y = cy - totalH / 2;
      if (hasImage) {
        drawImg(ctx, img!, cx, y + imgH / 2, imgH);
        y += imgH + gap;
      }
      ctx.fillStyle = textColor;
      ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
      ctx.fillText(state.brand, cx, y + textSize / 2);
      y += textSize + 6;
      if (state.tagline) {
        ctx.fillStyle = subColor;
        ctx.font = `400 ${tagSize}px Inter, sans-serif`;
        ctx.fillText(state.tagline, cx, y + tagSize / 2);
      }
    } else if (state.layout === "image-left") {
      const imgW = hasImage ? imageSize : 0;
      ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
      const brandW = ctx.measureText(state.brand).width;
      let totalW = (hasImage ? imgW + gap : 0) + brandW;
      let x = cx - totalW / 2;
      if (hasImage) {
        drawImg(ctx, img!, x + imgW / 2, cy, imgW);
        x += imgW + gap;
      }
      ctx.fillStyle = textColor;
      ctx.textAlign = "left";
      ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
      ctx.fillText(state.brand, x, state.tagline ? cy - tagSize / 2 - 4 : cy);
      if (state.tagline) {
        ctx.fillStyle = subColor;
        ctx.font = `400 ${tagSize}px Inter, sans-serif`;
        ctx.fillText(state.tagline, x, cy + textSize / 2 - 2);
      }
      ctx.textAlign = "center";
    } else if (state.layout === "text-only") {
      ctx.fillStyle = textColor;
      ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
      ctx.fillText(state.brand, cx, state.tagline ? cy - tagSize / 2 - 4 : cy);
      if (state.tagline) {
        ctx.fillStyle = subColor;
        ctx.font = `400 ${tagSize}px Inter, sans-serif`;
        ctx.fillText(state.tagline, cx, cy + textSize / 2 - 2);
      }
    } else if (state.layout === "stacked") {
      if (hasImage) {
        ctx.fillStyle = state.color;
        const bw = imageSize * 1.6, bh = imageSize * 1.2;
        const bx = cx - bw / 2, by = cy - bh / 2 - textSize / 2 - gap;
        roundRect(ctx, bx, by, bw, bh, 8);
        ctx.fill();
        drawImg(ctx, img!, cx, by + bh / 2, imageSize * 0.75);
      }
      ctx.fillStyle = textColor;
      ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
      ctx.fillText(state.brand, cx, cy + (hasImage ? textSize / 2 : 0));
      if (state.tagline) {
        ctx.fillStyle = subColor;
        ctx.font = `400 ${tagSize}px Inter, sans-serif`;
        ctx.fillText(state.tagline, cx, cy + textSize + (hasImage ? textSize / 2 - 2 : 0));
      }
    } else if (state.layout === "badge") {
      const pad = 24;
      ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
      const tw = ctx.measureText(state.brand).width;
      const iw = hasImage ? imageSize * 0.7 + gap : 0;
      const bw = tw + iw + pad * 2, bh = textSize + pad;
      ctx.fillStyle = state.color;
      roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, bh / 2);
      ctx.fill();
      if (hasImage) {
        drawImg(ctx, img!, cx - tw / 2 - gap / 2, cy, imageSize * 0.5);
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
      ctx.fillText(state.brand, cx + (hasImage ? iw / 2 : 0), cy);
    } else if (state.layout === "minimal") {
      const letter = state.brand.charAt(0).toUpperCase();
      const circR = textSize * 0.75;
      ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
      const nw = ctx.measureText(state.brand).width;
      const totalW2 = (hasImage ? imageSize + 16 : circR * 2 + 16) + nw;
      const startX = cx - totalW2 / 2;
      if (hasImage) {
        drawImg(ctx, img!, startX + imageSize / 2, cy, imageSize);
      } else {
        ctx.beginPath();
        ctx.arc(startX + circR, cy, circR, 0, Math.PI * 2);
        ctx.fillStyle = state.color;
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `800 ${textSize}px "${state.font}", sans-serif`;
        ctx.fillText(letter, startX + circR, cy);
      }
      ctx.fillStyle = textColor;
      ctx.textAlign = "left";
      ctx.fillText(state.brand, startX + (hasImage ? imageSize + 16 : circR * 2 + 16), cy);
      ctx.textAlign = "center";
    }

    ctx.fillStyle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
    ctx.font = "500 10px Inter, sans-serif";
    ctx.fillText("brandgnepal.com", W - 72, H - 10);
  }, [state]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    if (state.uploadedImage) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        draw();
      };
      img.src = state.uploadedImage;
    } else {
      imageRef.current = null;
    }
  }, [state.uploadedImage]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (partial: Partial<LogoState>) => setState((prev) => ({ ...prev, ...partial }));

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update({ uploadedImage: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "logo-brandgnepal.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  function drawImg(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, maxSize: number) {
    const aspect = img.naturalWidth / img.naturalHeight;
    let w: number, h: number;
    if (aspect > 1) { w = maxSize; h = maxSize / aspect; }
    else { h = maxSize; w = maxSize * aspect; }
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  }

  return (
    <section id="logo-maker">
      <div className="lm-wrap">
        <div className="lm-header rev">
          <span className="label">Free Tool</span>
          <h2>Design Your Logo — <span>Free</span></h2>
          <p>Create a logo for your business in minutes. No sign-up, no design skills needed. Download with a small watermark, or contact us for a clean professional version.</p>
        </div>
        <div className="lm-layout rev d2">
          <div className="lm-controls">
            <div className="lm-section-title">Brand Text</div>
            <div className="lm-field">
              <label className="lm-label">Company Name</label>
              <input className="lm-input" type="text" placeholder="YourBrand" value={state.brand} onChange={(e) => update({ brand: e.target.value || " " })} />
            </div>
            <div className="lm-field">
              <label className="lm-label">Tagline</label>
              <input className="lm-input" type="text" placeholder="Your tagline here" value={state.tagline} onChange={(e) => update({ tagline: e.target.value })} />
            </div>

            <div className="lm-section-title">Style</div>
            <div className="lm-field">
              <label className="lm-label">Font</label>
              <select className="lm-select" value={state.font} onChange={(e) => update({ font: e.target.value })}>
                <option value="Outfit">Outfit — Modern Bold</option>
                <option value="Georgia">Georgia — Classic Serif</option>
                <option value="Playfair Display">Playfair — Elegant Serif</option>
                <option value="Arial Black">Arial Black — Strong</option>
                <option value="Courier New">Courier New — Retro Mono</option>
                <option value="Trebuchet MS">Trebuchet — Clean Sans</option>
                <option value="Impact">Impact — Powerful</option>
                <option value="Garamond">Garamond — Refined</option>
              </select>
            </div>
            <div className="lm-field">
              <label className="lm-label">Layout</label>
              <div className="lm-layout-grid">
                {layouts.map((l) => (
                  <button key={l} className={`lm-layout-btn${state.layout === l ? " active" : ""}`} onClick={() => update({ layout: l })}>
                    {layoutLabels[l]}
                  </button>
                ))}
              </div>
            </div>

            <div className="lm-section-title">Image</div>
            <div className="lm-upload-area">
              <input type="file" id="lm-file-input" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
              {state.uploadedImage ? (
                <div className="lm-upload-preview">
                  <img src={state.uploadedImage} alt="Uploaded logo" className="lm-upload-thumb" />
                  <div className="lm-upload-actions">
                    <label htmlFor="lm-file-input" className="lm-upload-btn">Change</label>
                    <button className="lm-upload-btn lm-upload-btn-remove" onClick={() => update({ uploadedImage: null })}>Remove</button>
                  </div>
                </div>
              ) : (
                <label htmlFor="lm-file-input" className="lm-upload-placeholder">
                  <span className="lm-upload-icon">+</span>
                  <span>Upload your logo or image</span>
                  <span className="lm-upload-hint">PNG, JPG, SVG</span>
                </label>
              )}
            </div>

            <div className="lm-section-title">Accent Colour</div>
            <div className="lm-colors">
              {colors.map((c) => (
                <button key={c.hex} className={`lm-color-btn${state.color === c.hex ? " active" : ""}`} style={{ background: c.hex }} title={c.name} onClick={() => update({ color: c.hex })} />
              ))}
            </div>
            <div className="lm-field" style={{ marginTop: "0.85rem" }}>
              <label className="lm-label">Background</label>
              <select className="lm-select" value={state.bg} onChange={(e) => update({ bg: e.target.value })}>
                <option value="white">White</option>
                <option value="light">Light Warm</option>
                <option value="dark">Dark</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>

            <div className="lm-section-title">Size</div>
            <div className="lm-field">
              <label className="lm-label">Image Size</label>
              <div className="lm-range-row">
                <input className="lm-range" type="range" min="24" max="140" value={state.imageSize} onChange={(e) => update({ imageSize: +e.target.value })} />
                <span className="lm-range-val">{state.imageSize}</span>
              </div>
            </div>
            <div className="lm-field">
              <label className="lm-label">Text Size</label>
              <div className="lm-range-row">
                <input className="lm-range" type="range" min="16" max="64" value={state.textSize} onChange={(e) => update({ textSize: +e.target.value })} />
                <span className="lm-range-val">{state.textSize}</span>
              </div>
            </div>
          </div>

          <div className="lm-canvas-wrap">
            <div className="lm-canvas-area">
              <canvas ref={canvasRef} id="logoCanvas" width="600" height="300" />
            </div>
            <div className="lm-canvas-actions">
              <button className="lm-btn lm-btn-primary" onClick={download}>↓ Download PNG</button>
              <button className="lm-btn lm-btn-ghost" onClick={draw}>↺ Reset Preview</button>
            </div>
            <p className="lm-wm-note">Free version includes a brandgnepal.com watermark. <a href="#contact">Get in touch</a> for an unmarked, print-ready version.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
