"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

function redirectWithUsers(message: string, isError = false) {
  const queryKey = isError ? "err" : "ok";
  redirect(`/users?${queryKey}=${encodeURIComponent(message)}`);
}

function parseSelectedIds(formData: FormData) {
  return formData
    .getAll("selected_user_ids")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

async function markUserStatus(userId: string, status: "active" | "blocked") {
  const userResponse = await supabaseAdmin.auth.admin.getUserById(userId);
  const userMeta = userResponse.data.user?.user_metadata ?? {};

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...userMeta,
      admin_status: status,
    },
  });

  return error;
}

export async function bulkUsersAction(formData: FormData) {
  await requireAdminSession();

  const action = String(formData.get("bulk_action") ?? "").trim();
  const selectedIds = parseSelectedIds(formData);

  if (!selectedIds.length) {
    redirectWithUsers("Select at least one user", true);
  }

  if (action === "delete") {
    let failed = 0;
    for (const userId of selectedIds) {
      const authDelete = await supabaseAdmin.auth.admin.deleteUser(userId);
      const profileDelete = await supabaseAdmin.from("profiles").delete().eq("id", userId);
      if (authDelete.error && profileDelete.error) {
        failed += 1;
      }
    }

    revalidatePath("/users");
    if (failed > 0) {
      redirectWithUsers(`Deleted ${selectedIds.length - failed} users. Failed for ${failed}.`, true);
    }
    redirectWithUsers(`Deleted ${selectedIds.length} users successfully.`);
  }

  if (action === "block") {
    let failed = 0;
    for (const userId of selectedIds) {
      const error = await markUserStatus(userId, "blocked");
      if (error) failed += 1;
    }

    revalidatePath("/users");
    if (failed > 0) {
      redirectWithUsers(`Blocked ${selectedIds.length - failed} users. Failed for ${failed}.`, true);
    }
    redirectWithUsers(`Blocked ${selectedIds.length} users successfully.`);
  }

  redirectWithUsers("Choose a valid bulk action", true);
}

export async function deleteSingleUserAction(formData: FormData) {
  await requireAdminSession();

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) redirectWithUsers("User ID is required", true);

  const authDelete = await supabaseAdmin.auth.admin.deleteUser(userId);
  const profileDelete = await supabaseAdmin.from("profiles").delete().eq("id", userId);

  if (authDelete.error && profileDelete.error) {
    redirectWithUsers(`Delete failed. ${authDelete.error.message}`, true);
  }

  revalidatePath("/users");
  redirectWithUsers("User deleted");
}

export async function toggleUserStatusAction(formData: FormData) {
  await requireAdminSession();

  const userId = String(formData.get("user_id") ?? "").trim();
  const nextStatus = String(formData.get("next_status") ?? "").trim() as "active" | "blocked";

  if (!userId || !["active", "blocked"].includes(nextStatus)) {
    redirectWithUsers("Invalid user status update", true);
  }

  const error = await markUserStatus(userId, nextStatus);
  if (error) {
    redirectWithUsers(error.message, true);
  }

  revalidatePath("/users");
  redirectWithUsers(`User marked as ${nextStatus}.`);
}