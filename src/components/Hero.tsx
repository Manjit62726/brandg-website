"use client";

import CountUp from "./CountUp";

export default function Hero() {
  return (
    <section id="hero">
      <div className="hero-bg-glow" />
      <div className="hero-bg-grid" />
      <div className="hero-bg-dot-blob" />

      <div className="hero-in">
        <div>
          <div className="hero-eyebrow">
            <span className="dot" />
            Brand Strategy &amp; Design · Kathmandu
          </div>
          <h1 className="hero-h1">
            Brands<br />
            With<br />
            <span className="highlight">Purpose</span>
          </h1>
          <p className="hero-desc">
            A creative team in Kathmandu combining strategic thinking with original design —
            helping businesses stand out, connect, and scale.
          </p>
          <div className="hero-btns">
            <a href="#services" className="btn btn-primary">Explore Services →</a>
            <a href="#contact" className="btn btn-outline">Start a Project</a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hstat-n"><CountUp target={6} /><span className="accent-blue">+</span></div>
              <div className="hstat-l">Happy Clients</div>
            </div>
            <div>
              <div className="hstat-n"><CountUp target={3} /></div>
              <div className="hstat-l">Expert Teams</div>
            </div>
            <div>
              <div className="hstat-n"><CountUp target={100} /><span className="accent-blue">%</span></div>
              <div className="hstat-l">Client Focused</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-float-badge">
              <div className="big">KTM</div>
              <div className="sub">Based in Nepal</div>
            </div>
            <div className="hero-card-tag">Our Services</div>
            <div className="hero-services-list">
              <div className="hsl-item">
                <div className="hsl-icon">B</div>
                <div>
                  <div className="hsl-name">Brand Identity</div>
                  <div className="hsl-sub">Logos, guidelines, visual systems</div>
                </div>
              </div>
              <div className="hsl-item">
                <div className="hsl-icon">S</div>
                <div>
                  <div className="hsl-name">Social Media</div>
                  <div className="hsl-sub">Content, community, growth</div>
                </div>
              </div>
              <div className="hsl-item">
                <div className="hsl-icon">A</div>
                <div>
                  <div className="hsl-name">Paid Advertising</div>
                  <div className="hsl-sub">Meta Ads, targeted campaigns</div>
                </div>
              </div>
              <div className="hsl-item">
                <div className="hsl-icon">C</div>
                <div>
                  <div className="hsl-name">Content Creation</div>
                  <div className="hsl-sub">Video, photo, copywriting</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
