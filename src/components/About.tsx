"use client";

import CountUp from "./CountUp";

export default function About() {
  return (
    <section id="about">
      <div className="si">
        <div className="about-grid">
          <div className="about-text rev">
            <span className="label label-white">Who We Are</span>
            <h2>We Make Brands<br />Worth <em>Talking About</em></h2>
            <p style={{ marginTop: "1.25rem" }}>
              BrandG Nepal is a Kathmandu-based brand studio. We help businesses find their voice,
              build visual identities that stick, and connect with the people who matter.
            </p>
            <p>
              Strategy without fluff. Design with purpose. We work with founders and teams who
              care about how they show up — and we make sure the world notices.
            </p>
            <div className="about-pillars">
              <div className="ap">
                <div className="ap-icon">01</div>
                <div>
                  <h4>Creativity</h4>
                  <p>Original ideas that create memorable brand experiences and set you apart.</p>
                </div>
              </div>
              <div className="ap">
                <div className="ap-icon">02</div>
                <div>
                  <h4>Innovation</h4>
                  <p>Staying ahead with cutting-edge marketing solutions and emerging digital trends.</p>
                </div>
              </div>
              <div className="ap">
                <div className="ap-icon">03</div>
                <div>
                  <h4>Client-First</h4>
                  <p>A collaborative approach built around your specific goals and growth milestones.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="about-stats rev d2">
            <div className="ast">
              <div className="ast-n"><CountUp target={6} /></div>
              <div className="ast-l">Clients in Tourism &amp; Hospitality</div>
            </div>
            <div className="ast">
              <div className="ast-n"><CountUp target={3} /></div>
              <div className="ast-l">Expert Departments</div>
            </div>
            <div className="ast wide">
              <div className="ast-n">KTM</div>
              <div className="ast-l">Koteshwor, Kathmandu, Nepal</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
