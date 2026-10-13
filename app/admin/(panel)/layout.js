import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import AdminNav from "@/components/admin/AdminNav";
import SubmitButton from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/admin/actions/auth";
import Icon from "@/components/ui/Icon";

/** Authenticated admin shell: sidebar + top bar. */
export default async function PanelLayout({ children }) {
  const user = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <BrandLogo light />
        <AdminNav role={user.role} />
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <details className="d-lg-none">
            <summary className="btn btn-outline-ink btn-sm">Menu</summary>
            <div className="admin-sidebar d-block position-absolute mt-2" style={{ zIndex: 20 }}>
              <AdminNav role={user.role} />
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
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
