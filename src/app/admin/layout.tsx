"use client";

import "./admin.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const subNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/services", label: "Services" },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <p>Verifying session…</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <div className="admin-root">
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <span className="topbar-brand-text">BrandG Admin</span>
          </div>
          <div className="topbar-right">
            <button className="topbar-logout" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>

        <nav className="subnav">
          {subNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`subnav-link ${active ? "active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AuthProvider>
  );
}
