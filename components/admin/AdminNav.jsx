"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ClientIcon from "@/components/ui/ClientIcon";

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
      { href: "/admin/projects", label: "Projects", icon: "buildings" },
      { href: "/admin/clients", label: "Client logos", icon: "award" },
      { href: "/admin/faqs", label: "FAQs", icon: "question-circle" },
    ],
  },
  {
    title: "Administration",
    adminOnly: true,
    items: [
      { href: "/admin/settings", label: "Site settings", icon: "gear" },
      { href: "/admin/users", label: "Users", icon: "people" },
      { href: "/admin/audit", label: "Audit log", icon: "journal-text" },
    ],
  },
];

export default function AdminNav({ role }) {
  const pathname = usePathname();
  const isActive = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <nav aria-label="Admin">
      {SECTIONS.filter((s) => !s.adminOnly || role === "ADMIN").map((section, i) => (
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
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

export { SECTIONS };
