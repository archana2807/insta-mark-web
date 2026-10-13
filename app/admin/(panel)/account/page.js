import { requireAdmin } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/admin/actions/auth";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <>
      <h1 className="mb-4">My account</h1>
      <div className="admin-card" style={{ maxWidth: 520 }}>
        <p className="mb-1">
          <strong>{me.name}</strong>
        </p>
        <p className="text-secondary">
          {me.email} · {me.role.toLowerCase()}
        </p>
        <h2 className="mt-4">Change password</h2>
        <ActionForm action={changeOwnPassword} resetOnSuccess>
          {[
            ["current", "Current password", "current-password"],
            ["password", "New password (10+ characters)", "new-password"],
            ["confirm", "Repeat new password", "new-password"],
          ].map(([name, label, ac]) => (
            <div className="mb-3" key={name}>
              <label htmlFor={name} className="form-label small fw-semibold">
                {label}
              </label>
              <input
                id={name}
                name={name}
                type="password"
                autoComplete={ac}
                className="form-control"
                required
              />
            </div>
          ))}
          <SubmitButton>Update password</SubmitButton>
        </ActionForm>
      </div>
    </>
  );
}
