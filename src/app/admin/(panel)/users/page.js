import * as userService from "@/server/modules/users/user.service";
import { requireAdmin } from "@/server/auth/session";
import { ROLES } from "@/shared/constants";
import { createUser, resetUserPassword, updateUser } from "@/server/modules/users/user.controller";
import { formatDateTime } from "@/lib/format";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireAdmin({ role: ROLES.ADMIN });
  const users = await userService.listForAdmin();

  return (
    <>
      <h1 className="mb-1">Users</h1>
      <p className="text-secondary mb-4">
        <strong>Admin</strong>: everything. <strong>Editor</strong>: enquiries and website content
        (no users, settings or audit log).
      </p>

      <div className="admin-card">
        <h2>Add user</h2>
        <ActionForm action={createUser} resetOnSuccess>
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label htmlFor="u-name" className="form-label small fw-semibold">
                Name
              </label>
              <input id="u-name" name="name" className="form-control form-control-sm" required />
            </div>
            <div className="col-md-3">
              <label htmlFor="u-email" className="form-label small fw-semibold">
                Email
              </label>
              <input
                id="u-email"
                name="email"
                type="email"
                className="form-control form-control-sm"
                required
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="u-role" className="form-label small fw-semibold">
                Role
              </label>
              <select
                id="u-role"
                name="role"
                className="form-select form-select-sm"
                defaultValue="EDITOR"
              >
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="u-pw" className="form-label small fw-semibold">
                Initial password
              </label>
              <input
                id="u-pw"
                name="password"
                type="password"
                minLength={10}
                autoComplete="new-password"
                className="form-control form-control-sm"
                required
              />
            </div>
            <div className="col-md-2">
              <SubmitButton className="btn btn-dark btn-sm w-100">Create</SubmitButton>
            </div>
          </div>
        </ActionForm>
      </div>

      <div className="admin-card">
        <h2>Team ({users.length})</h2>
        {users.map((u) => (
          <div key={u.id} className="border-top py-3">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
              <div>
                <strong>{u.email}</strong>{" "}
                {u.id === me.id && <span className="badge bg-secondary">you</span>}
                {u.lockedUntil && u.lockedUntil > new Date() && (
                  <span className="badge bg-danger ms-1">locked</span>
                )}
              </div>
              <span className="small text-secondary">
                Last sign-in: {formatDateTime(u.lastLoginAt)}
              </span>
            </div>
            <div className="row g-3">
              <div className="col-lg-7">
                <ActionForm action={updateUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <div className="row g-2 align-items-center">
                    <div className="col-md-5">
                      <input
                        name="name"
                        className="form-control form-control-sm"
                        defaultValue={u.name}
                        aria-label="Name"
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <select
                        name="role"
                        className="form-select form-select-sm"
                        defaultValue={u.role}
                        aria-label="Role"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="col-6 col-md-2">
                      <div className="form-check">
                        <input
                          id={`act-${u.id}`}
                          name="isActive"
                          type="checkbox"
                          className="form-check-input"
                          defaultChecked={u.isActive}
                        />
                        <label htmlFor={`act-${u.id}`} className="form-check-label small">
                          Active
                        </label>
                      </div>
                    </div>
                    <div className="col-6 col-md-2">
                      <SubmitButton className="btn btn-outline-ink btn-sm w-100">Save</SubmitButton>
                    </div>
                  </div>
                </ActionForm>
              </div>
              <div className="col-lg-5">
                <ActionForm action={resetUserPassword} resetOnSuccess>
                  <input type="hidden" name="id" value={u.id} />
                  <div className="input-group input-group-sm">
                    <input
                      name="password"
                      type="password"
                      minLength={10}
                      autoComplete="new-password"
                      className="form-control"
                      placeholder="New password (10+ chars)"
                      aria-label={`New password for ${u.email}`}
                      required
                    />
                    <SubmitButton className="btn btn-light">Reset &amp; unlock</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
