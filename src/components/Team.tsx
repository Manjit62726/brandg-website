"use client";

import Image from "next/image";

export default function Team() {
  const team = [
    {
      name: "Nirjala Khanal",
      role: "Chief Executive Officer",
      bio: "Leading BrandG Nepal with vision and purpose, Nirjala drives strategic direction and fosters a culture of creativity, collaboration, and client excellence.",
      image: "/ceo.jpeg",
      initials: "NK",
      links: ["in", "em"],
    },
    {
      name: "Gaurav Dhakal",
      role: "Graphics Team Lead",
      bio: "Gaurav heads the creative design team, translating brand strategies into compelling visual identities and campaign creatives that captivate audiences.",
      image: "/lead.jpeg",
      initials: "GD",
      links: ["in", "Be", "em"],
    },
    {
      name: "Sukarat Luitel",
      role: "IT Lead",
      bio: "Sukarat leads all technology initiatives, ensuring campaigns are backed by robust infrastructure, analytics, and data-driven optimisation strategies.",
      image: "/it.jpeg",
      initials: "SL",
      links: ["in", "GH", "em"],
    },
  ];

  return (
    <section id="team">
      <div className="si">
        <div className="sh rev">
          <span className="label">The Team</span>
          <h2>Meet the<br/>People Behind <span className="gradient-text">BrandG</span></h2>
          <p>A passionate team combining creative talent with technical expertise to deliver outstanding results.</p>
        </div>
        <div className="team-grid">
          {team.map((m, i) => (
            <div key={i} className={`team-card rev d${i + 1}`}>
              <div className="team-img-wrap">
                <Image src={m.image} alt={m.name} width={400} height={220} className="w-full h-full object-cover object-top" />
              </div>
              <div className="team-body">
                <h3>{m.name}</h3>
                <div className="team-role">{m.role}</div>
                <p>{m.bio}</p>
                <div className="team-links">
                  {m.links.map((l) => (
                    <a key={l} href="#" className="team-link" aria-label={l}>{l}</a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
