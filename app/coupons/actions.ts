"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

function redirectWith(message: string, isError = false): never {
  const key = isError ? "err" : "ok";
  redirect(`/coupons?${key}=${encodeURIComponent(message)}`);
}

function asString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function asNumber(value: FormDataEntryValue | null) {
  const parsed = Number(asString(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function asInteger(value: FormDataEntryValue | null) {
  const numeric = asNumber(value);
  return numeric === null ? null : Math.trunc(numeric);
}

function asIsoOrNull(value: FormDataEntryValue | null) {
  const raw = asString(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString();
}

function asBoolean(value: FormDataEntryValue | null) {
  return ["true", "1", "yes", "on"].includes(asString(value).toLowerCase());
}

function selectedIds(formData: FormData) {
  return formData
    .getAll("selected_coupon_ids")
    .map((value) => Number(String(value).trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.trunc(value));
}

export async function createCouponAction(formData: FormData) {
  await requireAdminSession();

  const code = asString(formData.get("code")).toUpperCase();
  const title = asString(formData.get("title"));
  const description = asString(formData.get("description"));
  const discountPercentage = asInteger(formData.get("discount_percentage"));
  const usageLimit = asInteger(formData.get("usage_limit"));
  const startsAt = asIsoOrNull(formData.get("starts_at"));
  const expiresAt = asIsoOrNull(formData.get("expires_at"));
  const isActive = asBoolean(formData.get("is_active"));

  if (!code || !title || discountPercentage === null) {
    redirectWith("Code, title, and discount percentage are required", true);
  }

  if (discountPercentage < 0 || discountPercentage > 100) {
    redirectWith("Discount percentage must be between 0 and 100", true);
  }

  const { error } = await supabaseAdmin.from("coupons").insert({
    code,
    title,
    description,
    discount_percentage: discountPercentage,
    usage_limit: usageLimit,
    starts_at: startsAt,
    expires_at: expiresAt,
    is_active: isActive,
  });

  if (error) {
    redirectWith(error.message, true);
  }

  revalidatePath("/coupons");
  redirectWith("Coupon created successfully.");
}

export async function updateCouponAction(formData: FormData) {
  await requireAdminSession();

  const couponId = asInteger(formData.get("coupon_id"));
  const code = asString(formData.get("code")).toUpperCase();
  const title = asString(formData.get("title"));
  const description = asString(formData.get("description"));
  const discountPercentage = asInteger(formData.get("discount_percentage"));
  const usageLimit = asInteger(formData.get("usage_limit"));
  const startsAt = asIsoOrNull(formData.get("starts_at"));
  const expiresAt = asIsoOrNull(formData.get("expires_at"));
  const isActive = asBoolean(formData.get("is_active"));

  if (!couponId || !code || !title || discountPercentage === null) {
    redirectWith("Valid coupon ID, code, title, and discount percentage are required", true);
  }

  if (discountPercentage < 0 || discountPercentage > 100) {
    redirectWith("Discount percentage must be between 0 and 100", true);
  }

  const { error } = await supabaseAdmin
    .from("coupons")
    .update({
      code,
      title,
      description,
      discount_percentage: discountPercentage,
      usage_limit: usageLimit,
      starts_at: startsAt,
      expires_at: expiresAt,
      is_active: isActive,
    })
    .eq("id", couponId);

  if (error) {
    redirectWith(error.message, true);
  }

  revalidatePath("/coupons");
  redirectWith("Coupon updated successfully.");
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdminSession();

  const couponId = asInteger(formData.get("coupon_id"));
  if (!couponId) {
    redirectWith("Valid coupon ID is required", true);
  }

  const { error } = await supabaseAdmin.from("coupons").delete().eq("id", couponId);
  if (error) {
    redirectWith(error.message, true);
  }

  revalidatePath("/coupons");
  redirectWith("Coupon deleted.");
}

export async function bulkCouponsAction(formData: FormData) {
  await requireAdminSession();

  const action = asString(formData.get("bulk_action")).toLowerCase();
  const ids = selectedIds(formData);

  if (!ids.length) {
    redirectWith("Select at least one coupon", true);
  }

  if (action === "delete") {
    const { error } = await supabaseAdmin.from("coupons").delete().in("id", ids);
    if (error) redirectWith(error.message, true);

    revalidatePath("/coupons");
    redirectWith(`Deleted ${ids.length} coupons.`);
  }

  if (action === "disable") {
    const { error } = await supabaseAdmin.from("coupons").update({ is_active: false }).in("id", ids);
    if (error) redirectWith(error.message, true);

    revalidatePath("/coupons");
    redirectWith(`Disabled ${ids.length} coupons.`);
  }

  if (action === "activate") {
    const { error } = await supabaseAdmin.from("coupons").update({ is_active: true }).in("id", ids);
    if (error) redirectWith(error.message, true);

    revalidatePath("/coupons");
    redirectWith(`Activated ${ids.length} coupons.`);
  }

  redirectWith("Choose a valid bulk action", true);
}
