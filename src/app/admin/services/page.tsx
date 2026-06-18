"use client";

import { useState } from "react";

interface Service {
  id: string;
  icon: string;
  label: string;
  title: string;
  desc: string;
  tags: string[];
}

const defaults: Service[] = [
  { id: "1", icon: "🎨", label: "IDENTITY", title: "Brand Identity Creation", desc: "Logos, brand guidelines, and design systems that communicate your values.", tags: ["Logo Design", "Brand Guidelines", "Visual Identity"] },
  { id: "2", icon: "📈", label: "STRATEGY", title: "Strategic Marketing", desc: "Market analysis and customer behaviour research translated into actionable strategies.", tags: ["Market Analysis", "Research", "Growth Strategy"] },
  { id: "3", icon: "📱", label: "SOCIAL", title: "Social Media Mastery", desc: "Building engaged communities and growing your audience across all major platforms.", tags: ["Community", "Engagement", "Platform Strategy"] },
  { id: "4", icon: "✍️", label: "CONTENT", title: "Content Creation & Curation", desc: "Compelling multimedia storytelling that resonates with your audience.", tags: ["Video", "Photography", "Copywriting"] },
  { id: "5", icon: "📣", label: "ADVERTISING", title: "Social Media Advertising", desc: "Targeted paid campaigns that maximise ROI and reach the right audience.", tags: ["Meta Ads", "Paid Campaigns", "Conversion"] },
  { id: "6", icon: "🖨️", label: "PRINT", title: "Print Media Solutions", desc: "Professional print collateral that leaves a lasting impression offline.", tags: ["Business Cards", "Brochures", "Banners"] },
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>(defaults);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [form, setForm] = useState({ icon: "✨", label: "", title: "", desc: "", tags: "" });

  const resetForm = () => setForm({ icon: "✨", label: "", title: "", desc: "", tags: "" });

  const handleAdd = () => {
    if (!form.title || !form.desc) return;
    const svc: Service = {
      id: `s_${Date.now()}`,
      icon: form.icon,
      label: form.label || form.title.toUpperCase().slice(0, 8),
      title: form.title,
      desc: form.desc,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    setServices((prev) => [svc, ...prev]);
    resetForm();
    setShowForm(false);
  };

  const handleEdit = () => {
    if (!editing || !editing.title) return;
    setServices((prev) => prev.map((s) => (s.id === editing.id ? editing : s)));
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    setServices((prev) => prev.filter((s) => s.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div className="page-fade-in">
      <div className="services-bar">
        <span className="services-count">{services.length} service{services.length !== 1 ? "s" : ""}</span>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Service"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="form-card">
          <h3 className="form-card-title">New Service</h3>
          <div className="form-grid two">
            <div className="form-field">
              <label>Icon (emoji)</label>
              <input className="f-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Label</label>
              <input className="f-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="IDENTITY" />
            </div>
            <div className="form-field span-2">
              <label>Title</label>
              <input className="f-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Service name" />
            </div>
            <div className="form-field span-2">
              <label>Description</label>
              <textarea className="f-input" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={2} placeholder="Describe the service" />
            </div>
            <div className="form-field span-2">
              <label>Tags (comma separated)</label>
              <input className="f-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Logo Design, Brand Guidelines" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleAdd}>Save</button>
            <button className="btn-ghost" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="services-grid">
        {services.map((s) => (
          <div key={s.id} className="svc-card">
            <div className="svc-card-head">
              <span className="svc-card-icon">{s.icon}</span>
              <span className="svc-card-label">{s.label}</span>
            </div>
            <h3 className="svc-card-title">{s.title}</h3>
            <p className="svc-card-desc">{s.desc}</p>
            <div className="svc-card-tags">
              {s.tags.map((t) => <span key={t} className="tag-sm">{t}</span>)}
            </div>
            <div className="svc-card-actions">
              <button className="btn-ghost" onClick={() => setEditing({ ...s })}>Edit</button>
              <button className="btn-ghost danger" onClick={() => setDeleting(s)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit slide */}
      {editing && (
        <>
          <div className="overlay" onClick={() => setEditing(null)} />
          <div className="slide-panel">
            <div className="slide-head">
              <h3 className="slide-name">Edit Service</h3>
              <button className="slide-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="slide-body">
              <div className="form-field">
                <label>Icon</label>
                <input className="f-input" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Label</label>
                <input className="f-input" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Title</label>
                <input className="f-input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Description</label>
                <textarea className="f-input" value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} rows={3} />
              </div>
              <div className="form-field">
                <label>Tags (comma separated)</label>
                <input className="f-input" value={editing.tags.join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()) })} />
              </div>
              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button className="btn-primary" onClick={handleEdit}>Save Changes</button>
                <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleting && (
        <>
          <div className="overlay" onClick={() => setDeleting(null)} />
          <div className="modal-sm">
            <h3 className="modal-title">Delete this service?</h3>
            <p className="modal-desc">This action cannot be undone. <strong>{deleting.title}</strong> will be permanently removed.</p>
            <div className="form-actions" style={{ justifyContent: "flex-end", marginTop: "1.5rem" }}>
              <button className="btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
