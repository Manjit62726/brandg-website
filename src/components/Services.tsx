"use client";

export default function Services() {
  return (
    <section id="services">
      <div className="si">
        <div className="sh rev">
          <span className="label">What We Do</span>
          <h2>Everything You Need<br />to <span className="gradient-text">Stand Out</span></h2>
          <p>From brand identity to paid campaigns — we handle the full spectrum of brand building and marketing.</p>
        </div>
        <div className="services-grid">
          <div className="svc-card rev d1">
            <div className="svc-num">01 — IDENTITY</div>
            <div className="svc-icon">Bi</div>
            <h3>Brand Identity Creation</h3>
            <p>Logos, brand guidelines, and design systems that communicate your values and make you instantly recognisable.</p>
            <div className="svc-tags"><span className="tag">Logo Design</span><span className="tag">Brand Guidelines</span><span className="tag">Visual Identity</span></div>
          </div>
          <div className="svc-card rev d2">
            <div className="svc-num">02 — STRATEGY</div>
            <div className="svc-icon">SM</div>
            <h3>Strategic Marketing</h3>
            <p>Market analysis and customer behaviour research translated into actionable strategies that drive measurable growth.</p>
            <div className="svc-tags"><span className="tag">Market Analysis</span><span className="tag">Research</span><span className="tag">Growth Strategy</span></div>
          </div>
          <div className="svc-card rev d3">
            <div className="svc-num">03 — SOCIAL</div>
            <div className="svc-icon">SM</div>
            <h3>Social Media Mastery</h3>
            <p>Building engaged communities and growing your audience across all major platforms with high-quality content.</p>
            <div className="svc-tags"><span className="tag">Community</span><span className="tag">Engagement</span><span className="tag">Platform Strategy</span></div>
          </div>
          <div className="svc-card rev d1">
            <div className="svc-num">04 — CONTENT</div>
            <div className="svc-icon">CC</div>
            <h3>Content Creation &amp; Curation</h3>
            <p>Compelling multimedia storytelling — videos, photography, and written content that resonates with your audience.</p>
            <div className="svc-tags"><span className="tag">Video</span><span className="tag">Photography</span><span className="tag">Copywriting</span></div>
          </div>
          <div className="svc-card rev d2">
            <div className="svc-num">05 — ADVERTISING</div>
            <div className="svc-icon">PA</div>
            <h3>Social Media Advertising</h3>
            <p>Targeted paid campaigns across Facebook and Instagram that maximise ROI, drive conversions, and reach the right audience.</p>
            <div className="svc-tags"><span className="tag">Meta Ads</span><span className="tag">Paid Campaigns</span><span className="tag">Conversion</span></div>
          </div>
          <div className="svc-card rev d3">
            <div className="svc-num">06 — PRINT</div>
            <div className="svc-icon">PM</div>
            <h3>Print Media Solutions</h3>
            <p>Professional print collateral — business cards, brochures, and banners — that leave a lasting impression offline.</p>
            <div className="svc-tags"><span className="tag">Business Cards</span><span className="tag">Brochures</span><span className="tag">Banners</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
