"use client";

import { useEffect, useState, useCallback } from "react";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string | null;
  created_at: string;
}

interface BizInfo {
  phone: string;
  email: string;
  location: string;
  hours: string;
}

const PER_PAGE = 10;

const defaultBiz: BizInfo = {
  phone: "+977 9801048019",
  email: "brandgnepal@gmail.com",
  location: "Koteshwor, Kathmandu, Nepal",
  hours: "Sunday – Friday: 9 AM – 6 PM",
};

const bizFields: { key: keyof BizInfo; icon: string; label: string }[] = [
  { key: "phone", icon: "📞", label: "Phone" },
  { key: "email", icon: "✉️", label: "Email" },
  { key: "location", icon: "📍", label: "Location" },
  { key: "hours", icon: "⏰", label: "Hours" },
];

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", service: "", message: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [biz, setBiz] = useState<BizInfo>(defaultBiz);
  const [bizEdit, setBizEdit] = useState<BizInfo>(defaultBiz);
  const [editingBiz, setEditingBiz] = useState(false);
  const [bizSaving, setBizSaving] = useState(false);

  const fetchContacts = useCallback(() => {
    fetch("/api/contact")
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then((d) => { setContacts(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const fetchBiz = useCallback(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d && d.phone) {
          setBiz(d);
          setBizEdit(d);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchContacts(); fetchBiz(); }, [fetchContacts, fetchBiz]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return !q ||
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.message?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  useEffect(() => { setPage(1); }, [search]);

  const openEdit = (c: Contact) => {
    setEditing(c);
    setEditForm({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone || "",
      service: c.service || "",
      message: c.message || "",
    });
    setSaveMsg("");
  };

  const handleSave = async () => {
    if (!editForm.first_name || !editForm.last_name || !editForm.email) {
      setSaveMsg("First name, last name, and email are required.");
      return;
    }
    if (!editing) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/contact/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editForm.first_name.trim(),
          last_name: editForm.last_name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
          service: editForm.service.trim() || null,
          message: editForm.message.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditing(null);
      fetchContacts();
    } catch {
      setSaveMsg("Failed to save. Check database connection.");
    }
    setSaving(false);
  };

  const saveBiz = async () => {
    setBizSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bizEdit),
      });
      if (!res.ok) throw new Error("fail");
      setBiz(bizEdit);
      setEditingBiz(false);
    } catch {
      alert("Failed to save contact info.");
    }
    setBizSaving(false);
  };

  return (
    <div className="page-fade-in">
      {contacts.length > 0 && (
        <div className="contacts-toolbar">
          <div className="search-box">
            <span className="search-box-icon">🔍</span>
            <input
              type="text"
              placeholder="Search name, email, or message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-box-input"
            />
            {search && <button className="search-box-clear" onClick={() => setSearch("")}>✕</button>}
          </div>

        </div>
      )}

      {/* Business contact info card */}
      <div className="form-card" style={{ marginBottom: "0.85rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h3 className="form-card-title" style={{ margin: 0 }}>BrandG Contact Information</h3>
          <button
            className="btn-ghost"
            onClick={() => {
              if (editingBiz) {
                setBizEdit(biz);
                setEditingBiz(false);
              } else {
                setEditingBiz(true);
              }
            }}
          >
            {editingBiz ? "Cancel" : "Edit"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
          {bizFields.map((f) => (
            <div key={f.key} style={{ background: "var(--bg)", borderRadius: "var(--radius)", padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.7rem" }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{f.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-muted)", marginBottom: "1px" }}>{f.label}</div>
                {editingBiz ? (
                  <input
                    className="f-input"
                    value={bizEdit[f.key]}
                    onChange={(e) => setBizEdit({ ...bizEdit, [f.key]: e.target.value })}
                    style={{ fontSize: "0.78rem", padding: "0.25rem 0.5rem" }}
                  />
                ) : f.key === "phone" || f.key === "email" ? (
                  <a href={f.key === "phone" ? `tel:${biz[f.key].replace(/\D/g, "")}` : `mailto:${biz[f.key]}`} style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent)", textDecoration: "none", wordBreak: "break-all" }}>{biz[f.key]}</a>
                ) : (
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink)" }}>{biz[f.key]}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        {editingBiz && (
          <div className="form-actions" style={{ marginTop: "0.75rem" }}>
            <button className="btn-primary" onClick={saveBiz} disabled={bizSaving}>
              {bizSaving ? "Saving…" : "Save Changes"}
            </button>
            <button className="btn-ghost" onClick={() => { setBizEdit(biz); setEditingBiz(false); }}>Cancel</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="table-state">
            <div className="spinner" />
            <p className="table-state-title">Loading contacts…</p>
          </div>
        ) : error ? (
          <div className="table-state error">
            <div className="table-state-icon err">!</div>
            <p className="table-state-title">Connection Error</p>
            <p className="table-state-sub">Check that your Neon database is connected.</p>
          </div>
        ) : filtered.length === 0 ? null : (
          <>
            <div className="table-scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Service</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th className="col-act" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="cell-name">
                          <div className="cell-avatar">{c.first_name?.[0]}{c.last_name?.[0]}</div>
                          <span className="cell-fullname">{c.first_name} {c.last_name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-contact">
                          <span className="cell-email">{c.email}</span>
                          {c.phone && <span className="cell-phone">{c.phone}</span>}
                        </div>
                      </td>
                      <td>{c.service ? <span className="tag-sm">{c.service}</span> : <span className="text-dim">—</span>}</td>
                      <td className="col-msg">
                        <span className="msg-trunc">
                          {c.message ? (c.message.length > 70 ? c.message.slice(0, 70) + "…" : c.message) : "—"}
                        </span>
                      </td>
                      <td className="col-date">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td>
                        <button className="btn-view" onClick={() => openEdit(c)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-pagination">
              <span className="pagination-info">Page {safePage} of {totalPages}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1).map((p, idx, arr) => (
                  <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="page-ellipsis">…</span>}
                    <button className={`page-btn ${safePage === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                  </span>
                ))}
                <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit slide */}
      {editing && (
        <>
          <div className="overlay" onClick={() => setEditing(null)} />
          <div className="slide-panel">
            <div className="slide-head">
              <div className="slide-head-left">
                <div className="slide-avatar">{editing.first_name?.[0]}{editing.last_name?.[0]}</div>
                <h3 className="slide-name">Edit Contact</h3>
              </div>
              <button className="slide-close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="slide-body">
              {saveMsg && (
                <div className={`form-toast ${saveMsg.includes("Failed") ? "err" : ""}`}>
                  {saveMsg}
                </div>
              )}
              <div className="form-grid two">
                <div className="form-field">
                  <label>First name *</label>
                  <input className="f-input" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Last name *</label>
                  <input className="f-input" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Email *</label>
                  <input className="f-input" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Phone</label>
                  <input className="f-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+1 234 567 890" />
                </div>
                <div className="form-field span-2">
                  <label>Service</label>
                  <input className="f-input" value={editForm.service} onChange={(e) => setEditForm({ ...editForm, service: e.target.value })} placeholder="e.g. Brand Identity" />
                </div>
                <div className="form-field span-2">
                  <label>Message</label>
                  <textarea className="f-input" rows={4} value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
