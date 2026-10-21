import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import AdminMain from "@/components/admin/AdminMain";
import AdminNav from "@/components/admin/AdminNav";
import SubmitButton from "@/components/admin/SubmitButton";
import { permissionsFor } from "@/server/auth/permissions";
import { requireAuth } from "@/server/auth/session";
import { logout } from "@/server/modules/auth/auth.controller";
import Icon from "@/components/ui/Icon";

/** Authenticated admin shell: sidebar + top bar. */
export default async function PanelLayout({ children }) {
  const user = await requireAuth();
  const permissions = permissionsFor(user.role);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <BrandLogo light />
        <AdminNav permissions={permissions} />
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <details className="d-lg-none">
            <summary className="btn btn-outline-ink btn-sm">Menu</summary>
            <div className="admin-sidebar d-block position-absolute mt-2" style={{ zIndex: 20 }}>
              <AdminNav permissions={permissions} />
            </div>
          </details>
          <Link href="/" className="small text-secondary" target="_blank">
            <Icon name="box-arrow-up-right" className="me-1" />
            View website
          </Link>
          <div className="d-flex align-items-center gap-3 ms-auto">
            <Link href="/admin/account" className="small">
              <Icon name="person-circle" className="me-1" />
              {user.name} <span className="text-secondary">({user.role.toLowerCase()})</span>
            </Link>
            <form action={logout}>
              <SubmitButton className="btn btn-outline-ink btn-sm">Sign out</SubmitButton>
            </form>
          </div>
        </header>
        <AdminMain>{children}</AdminMain>
      </div>
    </div>
  );
}
