"use client";

import { useState, useEffect } from "react";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <nav id="nav" className={scrolled ? "sc" : ""}>
        <a href="/" className="logo">
          Brand<span>G</span> Nepal
        </a>
        <ul className="nav-links">
          <li><a href="/#about">About</a></li>
          <li><a href="/#services">Services</a></li>
          <li className="nav-dropdown">
            <span className="nav-dropdown-trigger">Tools</span>
            <div className="nav-dropdown-menu">
              <a href="/tools/logo-maker">Logo Maker</a>
              <a href="/tools/palette">Palette</a>
            </div>
          </li>
          <li><a href="/#team">Team</a></li>
          <li><a href="/#contact" className="nav-cta">Contact</a></li>
        </ul>
        <button className="ham" id="ham" onClick={() => setOpen(!open)} aria-label="Menu">
          <span style={{ transform: open ? "translateY(6.5px) rotate(45deg)" : "" }} />
          <span style={{ opacity: open ? 0 : 1 }} />
          <span style={{ transform: open ? "translateY(-6.5px) rotate(-45deg)" : "" }} />
        </button>
      </nav>
      <div className={`mob${open ? " open" : ""}`} id="mob">
        <a href="/#about" onClick={close}>About</a>
        <a href="/#services" onClick={close}>Services</a>
        <a href="/tools/logo-maker" onClick={close}>Logo Maker</a>
        <a href="/tools/palette" onClick={close}>Palette</a>
        <a href="/#team" onClick={close}>Team</a>
        <a href="/#contact" onClick={close}>Contact</a>
      </div>
    </>
  );
}
