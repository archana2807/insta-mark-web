export const metadata = {
  title: { default: "Admin", template: "%s | Insta Mark Admin" },
  robots: { index: false, follow: false },
};

// Admin pages are always rendered per request (never cached/static).
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }) {
  return <div className="admin-body">{children}</div>;
}
