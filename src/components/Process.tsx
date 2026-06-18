"use client";

export default function Process() {
  return (
    <section id="process">
      <div className="si">
        <div className="sh rev">
          <span className="label">How We Work</span>
          <h2>How We<br />Bring Ideas to <span className="gradient-text">Life</span></h2>
          <p>From the first conversation to launch — clear, collaborative, and results-focused.</p>
        </div>
        <div className="process-grid">
          <div className="process-line" />
          <div className="pstep rev d1">
            <div className="pstep-num">01</div>
            <h3>Discovery</h3>
            <p>We learn about your brand, goals, target audience, and competitive landscape through in-depth consultation.</p>
          </div>
          <div className="pstep rev d2">
            <div className="pstep-num">02</div>
            <h3>Strategy</h3>
            <p>A customised marketing plan with clear milestones, timelines, and deliverables aligned to your objectives.</p>
          </div>
          <div className="pstep rev d3">
            <div className="pstep-num">03</div>
            <h3>Execution</h3>
            <p>High-quality creative output, rigorous campaign management, and continuous optimisation.</p>
          </div>
          <div className="pstep rev d4">
            <div className="pstep-num">04</div>
            <h3>Results</h3>
            <p>We track, analyse, and report on performance — then iterate to keep improving and growing your brand.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
