"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendPushNotificationWithRedirect } from "@/app/actions/push-notifications";

function numberOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerOrNull(value: FormDataEntryValue | null) {
  const numeric = numberOrNull(value);
  if (numeric === null) return null;
  return Math.trunc(numeric);
}

function stringOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : null;
}

function parseImages(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return [] as string[];

  return raw
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function redirectWith(message: string, isError = false) {
  const queryKey = isError ? "err" : "ok";
  redirect(`/dashboard?${queryKey}=${encodeURIComponent(message)}`);
}

async function getNextProductId() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { id: null as number | null, error: error.message };
  }

  const currentMax = Number(data?.id ?? 0);
  return { id: (Number.isFinite(currentMax) ? currentMax : 0) + 1, error: null as string | null };
}

async function insertProductWithIdFallback(payload: Record<string, unknown>) {
  const firstTry = await supabaseAdmin.from("products").insert(payload).select("id").single();

  if (!firstTry.error) {
    return firstTry;
  }

  const errorMessage = firstTry.error.message.toLowerCase();
  const requiresManualId =
    firstTry.error.code === "23502" ||
    (errorMessage.includes("null value in column \"id\"") &&
      errorMessage.includes("relation \"products\""));

  if (!requiresManualId) {
    return firstTry;
  }

  const nextIdResult = await getNextProductId();
  if (nextIdResult.error || !nextIdResult.id) {
    return {
      data: null,
      error: {
        ...firstTry.error,
        message: nextIdResult.error ?? firstTry.error.message,
      },
    };
  }

  const secondTry = await supabaseAdmin
    .from("products")
    .insert({ ...payload, id: nextIdResult.id })
    .select("id")
    .single();

  if (!secondTry.error) {
    return secondTry;
  }

  const duplicateId = secondTry.error.code === "23505";
  if (!duplicateId) {
    return secondTry;
  }

  const retryIdResult = await getNextProductId();
  if (retryIdResult.error || !retryIdResult.id) {
    return secondTry;
  }

  return supabaseAdmin
    .from("products")
    .insert({ ...payload, id: retryIdResult.id })
    .select("id")
    .single();
}

export async function addProductAction(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirectWith("Product name is required", true);
  const variantName = String(formData.get("variant_name") ?? "").trim();

  const payload = {
    name,
    short_description: stringOrNull(formData.get("short_description")),
    description: stringOrNull(formData.get("description")),
    weight: numberOrNull(formData.get("weight")),
    length: numberOrNull(formData.get("length")),
    width: numberOrNull(formData.get("width")),
    height: numberOrNull(formData.get("height")),
    category_id: integerOrNull(formData.get("category_id")),
    images: parseImages(formData.get("images")),
    is_variable: formData.get("is_variable") === "on" || variantName.length > 0,
    sale_price: numberOrNull(formData.get("sale_price")),
    regular_price: numberOrNull(formData.get("regular_price")),
    is_active: formData.get("is_active") === "on",
  };

  const { data: createdProduct, error } = await insertProductWithIdFallback(payload);
  if (error) redirectWith(error.message, true);

  if (variantName.length > 0 && createdProduct?.id) {
    const variantPayload = {
      product_id: createdProduct.id,
      variant_name: variantName,
      sale_price: numberOrNull(formData.get("variant_sale_price")),
      regular_price: numberOrNull(formData.get("variant_regular_price")),
      weight: numberOrNull(formData.get("variant_weight")),
      length: numberOrNull(formData.get("variant_length")),
      width: numberOrNull(formData.get("variant_width")),
      height: numberOrNull(formData.get("variant_height")),
      images: parseImages(formData.get("variant_images")),
      stock_quantity: integerOrNull(formData.get("variant_stock_quantity")),
      is_active: formData.get("variant_is_active") === "on",
    };

    const { error: variantError } = await supabaseAdmin
      .from("product_variants")
      .insert(variantPayload);

    if (variantError) {
      redirectWith(
        `Product created (ID ${createdProduct.id}) but variant failed: ${variantError.message}`,
        true,
      );
    }
  }

  revalidatePath("/dashboard");
  redirectWith(variantName.length > 0 ? "Product and variant added" : "Product added");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdminSession();

  const id = integerOrNull(formData.get("product_id"));
  if (!id) redirectWith("Valid product ID is required", true);

  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
  if (error) redirectWith(error.message, true);

  revalidatePath("/dashboard");
  redirectWith("Product deleted");
}

export async function createCategoryAction(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!name || !slug) redirectWith("Category name and slug are required", true);

  const { error } = await supabaseAdmin.from("categories").insert({ name, slug });
  if (error) redirectWith(error.message, true);

  revalidatePath("/dashboard");
  redirectWith("Category created");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdminSession();

  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) redirectWith("User ID is required", true);

  const authDelete = await supabaseAdmin.auth.admin.deleteUser(userId);
  const profileDelete = await supabaseAdmin.from("profiles").delete().eq("id", userId);

  if (authDelete.error && profileDelete.error) {
    redirectWith(
      `Delete failed. auth: ${authDelete.error.message}; profile: ${profileDelete.error.message}`,
      true,
    );
  }

  revalidatePath("/dashboard");
  redirectWith("User deleted");
}

export async function sendNotificationAction(formData: FormData) {
  return sendPushNotificationWithRedirect(formData, "/dashboard");
}
