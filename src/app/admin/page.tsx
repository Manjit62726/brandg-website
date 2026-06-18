"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

const bizFields: { key: keyof BizInfo; icon: string; label: string }[] = [
  { key: "phone", icon: "📞", label: "Phone" },
  { key: "email", icon: "✉️", label: "Email" },
  { key: "location", icon: "📍", label: "Location" },
  { key: "hours", icon: "⏰", label: "Hours" },
];

const defaultBiz: BizInfo = {
  phone: "+977 9801048019",
  email: "brandgnepal@gmail.com",
  location: "Koteshwor, Kathmandu, Nepal",
  hours: "Sunday – Friday: 9 AM – 6 PM",
};

export default function AdminDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now] = useState(new Date());

  const [biz, setBiz] = useState<BizInfo>(defaultBiz);

  useEffect(() => {
    fetch("/api/contact")
      .then((r) => {
        if (!r.ok) throw new Error("fail");
        return r.json();
      })
      .then((d) => { setContacts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d && d.phone) setBiz(d);
      })
      .catch(() => {});
  }, []);

  const total = contacts.length;
  const recent = contacts.slice(0, 5);

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const newThisWeek = contacts.filter((c) => new Date(c.created_at) >= weekAgo).length;

  const metrics = [
    { value: total, label: "Inquiries" },
    { value: newThisWeek, label: "New This Week" },
    { value: "6", label: "Services" },
    { value: "4", label: "Team Members" },
  ];

  const actions = [
    { href: "/admin/contacts", icon: "✉", label: "Contacts", desc: `${total} submission${total !== 1 ? "s" : ""}`, color: "#2563EB" },
    { href: "/admin/services", icon: "⚙", label: "Services", desc: "6 service listings", color: "#16A34A" },
    { href: "/", icon: "→", label: "View Site", desc: "Open public website", color: "#2563EB", external: true },
  ];

  return (
    <div className="page-fade-in">
      {/* Metrics */}
      <div className="dash-metrics">
        {metrics.map((m, i) => (
          <div key={i} className="dash-metric">
            <div className="dash-metric-value">
              {loading || error && i === 0 ? "—" : m.value}
            </div>
            <div className="dash-metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Business contact info */}
      <div className="dash-section" style={{ marginBottom: "1rem" }}>
        <div className="dash-section-head">
          <div className="dash-section-head-left">
            <span className="dash-section-dot" style={{ background: "#16A34A" }} />
            <h3 className="dash-section-title">BrandG Contact</h3>
          </div>
          <Link href="/admin/contacts" className="dash-section-link">Manage →</Link>
        </div>
        <div className="dash-section-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", padding: "0.75rem 1.15rem" }}>
            {bizFields.map((f) => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-muted)", marginBottom: "1px" }}>{f.label}</div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--ink)" }}>{biz[f.key]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="dash-actions">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            target={a.external ? "_blank" : undefined}
            rel={a.external ? "noopener" : undefined}
            className="dash-action"
          >
            <span className="dash-action-icon" style={{ background: `${a.color}14`, color: a.color }}>
              {a.icon}
            </span>
            <div className="dash-action-text">
              <span className="dash-action-label">{a.label}</span>
              <span className="dash-action-desc">{a.desc}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent contacts */}
      <div className="dash-section">
        <div className="dash-section-head">
          <div className="dash-section-head-left">
            <span className="dash-section-dot" style={{ background: "#2563EB" }} />
            <h3 className="dash-section-title">Recent Contacts</h3>
          </div>
          <Link href="/admin/contacts" className="dash-section-link">View all →</Link>
        </div>
        <div className="dash-section-body">
          {loading ? (
            <div className="dash-null">
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="dash-null">
              <span className="dash-null-icon">⚡</span>
              <p className="dash-null-title">Database Offline</p>
              <span className="dash-null-sub">Connect your Neon database to see contacts</span>
            </div>
          ) : recent.length === 0 ? (
            <div className="dash-null">
              <p className="dash-null-title">No contacts yet</p>
              <span className="dash-null-sub">Submissions from the contact form will appear here</span>
            </div>
          ) : (
            <div className="dash-rows">
              {recent.map((c) => (
                <div key={c.id} className="dash-row">
                  <div className="dash-row-av" style={{ background: "linear-gradient(135deg, #2563EB, #16A34A)" }}>
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div className="dash-row-body">
                    <span className="dash-row-name">{c.first_name} {c.last_name}</span>
                    <span className="dash-row-sub">{c.email}</span>
                  </div>
                  <div className="dash-row-tail">
                    {c.service && <span className="tag-sm">{c.service}</span>}
                    <span className="dash-row-date">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
