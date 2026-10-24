"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ClientIcon from "@/components/ui/ClientIcon";
import { NavPending } from "./AdminMain";

const SECTIONS = [
  {
    items: [{ href: "/admin", label: "Dashboard", icon: "speedometer2", exact: true }],
  },
  {
    title: "Leads",
    items: [{ href: "/admin/enquiries", label: "Enquiries", icon: "inbox" }],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/categories", label: "Categories & photos", icon: "grid" },
      { href: "/admin/clients", label: "Client logos", icon: "award" },
      { href: "/admin/faqs", label: "FAQs", icon: "question-circle" },
      { href: "/admin/banner", label: "Home banner", icon: "card-image" },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        href: "/admin/settings",
        label: "Site settings",
        icon: "gear",
        permission: "settings:write",
      },
      { href: "/admin/users", label: "Users", icon: "people", permission: "user:manage" },
      { href: "/admin/audit", label: "Audit log", icon: "journal-text", permission: "audit:read" },
    ],
  },
];

/**
 * Admin sidebar. Shows only the items the user's permissions allow.
 * @param {{ permissions: readonly string[] }} props
 */
export default function AdminNav({ permissions }) {
  const pathname = usePathname();
  const isActive = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const sections = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((item) => !item.permission || permissions.includes(item.permission)),
  })).filter((s) => s.items.length > 0);

  return (
    <nav aria-label="Admin">
      {sections.map((section, i) => (
        <div key={section.title ?? i}>
          {section.title && <div className="admin-sidebar__section">{section.title}</div>}
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive(item) ? "active" : ""}`}
              aria-current={isActive(item) ? "page" : undefined}
            >
              <ClientIcon name={item.icon} />
              {item.label}
              <NavPending />
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

export { SECTIONS };
