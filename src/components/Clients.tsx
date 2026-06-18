"use client";

export default function Clients() {
  const clients = [
    { name: "GIBL", industry: "Financial Services", tag: "Partner", featured: false },
    { name: "Bandipur Cable Car", industry: "Tourism & Travel", tag: "Featured", featured: true },
    { name: "Bandipur Hill", industry: "Hospitality", tag: "Partner", featured: false },
    { name: "Lumbini Cable Car", industry: "Tourism", tag: "Partner", featured: false },
    { name: "Prasadi", industry: "Wellness & Lifestyle", tag: "Partner", featured: false },
    { name: "RKD", industry: "Real Estate", tag: "Partner", featured: false },
    { name: "Annapurna Treks", industry: "Adventure Tourism", tag: "New", featured: false },
    { name: "Himalayan Herbs", industry: "Organic Products", tag: "New", featured: false },
  ];

  return (
    <section id="clients">
      <div className="si">
        <div className="sh rev">
          <span className="label">Our Clients</span>
          <h2>Brands We&apos;ve<br />Worked <span className="gradient-text">With</span></h2>
          <p>We partner with forward-thinking organisations across tourism, hospitality, and services in Nepal.</p>
        </div>
        <div className="clients-grid">
          {clients.map((c, i) => (
            <div key={i} className={`client-card rev d${(i % 4) + 1}${c.featured ? " featured" : ""}`}>
              <div className="client-name" style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.03em" }}>{c.name.slice(0, 2).toUpperCase()}</div>
              <div className="client-name">{c.name}</div>
              <div className="client-sub">{c.industry}</div>
              <span className="client-tag">{c.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
