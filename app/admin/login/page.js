import { redirect } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import LoginForm from "@/components/admin/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  if (await getCurrentUser()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <main className="login-wrap">
      <div className="admin-card">
        <div className="mb-4">
          <BrandLogo />
        </div>
        <h1 className="h2 mb-1">Admin sign in</h1>
        <p className="text-secondary mb-4">Manage enquiries, photos and website content.</p>
        <LoginForm next={typeof next === "string" ? next : ""} />
      </div>
    </main>
  );
}
