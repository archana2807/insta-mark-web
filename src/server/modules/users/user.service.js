// Admin users: list, create, role / active changes, password resets, and the
// account lookups the auth module needs.
import "server-only";
import { hashPassword } from "@/server/auth/password";
import { revalidatePage } from "@/server/cache";
import * as auditService from "@/server/modules/audit/audit.service";
import * as userRepository from "./user.repository";

export async function listForAdmin() {
  return userRepository.findAllForAdmin();
}

/** Active users who can own an enquiry. */
export async function listAssignable() {
  return userRepository.findActiveOptions();
}

/** @param {string} email */
export async function findByEmail(email) {
  return userRepository.findByEmail(email);
}

/** @param {string} id */
export async function findById(id) {
  return userRepository.findById(id);
}

/** @param {string} id */
export async function findForSession(id) {
  return userRepository.findForSession(id);
}

/**
 * @param {string} id
 * @param {object} data login counters, lock, last login
 */
export async function updateLoginState(id, data) {
  return userRepository.update(id, data);
}

/**
 * @param {string} id
 * @param {string} password new plain password
 * @returns {Promise<object>} the updated user
 */
export async function setPassword(id, password) {
  return userRepository.update(id, { passwordHash: await hashPassword(password) });
}

/**
 * @param {import("@/shared/schemas/user.schema").UserCreateInput} input
 * @param {{ id: string }} actor
 */
export async function createUser(input, actor) {
  const { password, ...data } = input;
  if (await userRepository.findByEmail(data.email)) {
    return { fieldErrors: { email: ["A user with this email already exists."] } };
  }
  const user = await userRepository.create({ ...data, passwordHash: await hashPassword(password) });
  await auditService.log(actor, "CREATE", "AdminUser", user.id, {
    email: [null, user.email],
    role: [null, user.role],
  });
  revalidatePage("/admin/users");
  return {
    ok: true,
    message: `User ${user.email} created. Share the password with them securely.`,
    reset: Date.now(),
  };
}

/**
 * Name, role and active flag. Nobody can lock themselves out, and one active admin must remain.
 * @param {import("@/shared/schemas/user.schema").UserUpdateInput} input
 * @param {{ id: string }} actor
 */
export async function updateUser(input, actor) {
  const { id, ...data } = input;
  if (id === actor.id && (!data.isActive || data.role !== "ADMIN")) {
    return { error: "You cannot deactivate yourself or remove your own admin role." };
  }
  const before = await userRepository.findById(id);
  if (!before) return { error: "User not found." };

  const losesAdmin =
    before.role === "ADMIN" && before.isActive && (data.role !== "ADMIN" || !data.isActive);
  if (losesAdmin && (await userRepository.countActiveAdmins()) <= 1) {
    return { error: "At least one active administrator is required." };
  }

  await userRepository.update(id, data);
  await auditService.log(actor, "UPDATE", "AdminUser", id, auditService.diff(before, data));
  revalidatePage("/admin/users");
  return { ok: true, message: "Saved." };
}

/**
 * Admin sets a new password for a user (also unlocks the account).
 * @param {string} id
 * @param {string} password
 * @param {{ id: string }} actor
 */
export async function resetPassword(id, password, actor) {
  await userRepository.update(id, {
    passwordHash: await hashPassword(password),
    failedLoginCount: 0,
    lockedUntil: null,
  });
  await auditService.log(actor, "PASSWORD_RESET", "AdminUser", id);
  return {
    ok: true,
    message: "Password reset. Their existing sessions are signed out.",
    reset: Date.now(),
  };
}
