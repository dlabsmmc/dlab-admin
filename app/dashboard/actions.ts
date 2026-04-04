"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

  const { data: createdProduct, error } = await supabaseAdmin
    .from("products")
    .insert(payload)
    .select("id")
    .single();
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
  await requireAdminSession();

  const targetType = String(formData.get("target_type") ?? "all").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = stringOrNull(formData.get("image_url"));
  const deepLink = stringOrNull(formData.get("deep_link"));
  const orderId = stringOrNull(formData.get("order_id"));

  if (!["all", "user", "topic"].includes(targetType)) {
    redirectWith("Invalid target type", true);
  }

  if (!title || !body) {
    redirectWith("Title and body are required", true);
  }

  if (targetType === "user" && !userId) {
    redirectWith("User ID is required for user notifications", true);
  }

  if (targetType === "topic" && !topic) {
    redirectWith("Topic is required for topic notifications", true);
  }

  const backendBaseUrl =
    process.env.NOTIFICATION_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://app.dezign-lab.com:3000";
  const adminKey = process.env.NOTIFICATION_ADMIN_KEY;

  console.log("[notify] backendBaseUrl:", backendBaseUrl);

  if (!adminKey) {
    redirectWith("NOTIFICATION_ADMIN_KEY is missing in admin env", true);
  }

  const payload = {
    targetType,
    ...(targetType === "user" ? { userId } : {}),
    ...(targetType === "topic" ? { topic } : {}),
    title,
    body,
    ...(imageUrl ? { imageUrl } : {}),
    ...(deepLink ? { deepLink } : {}),
    data: {
      ...(orderId ? { order_id: orderId } : {}),
    },
  };

  const response = await fetch(`${backendBaseUrl}/api/notifications/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-notification-admin-key": adminKey!,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const rawText = await response.text();
  console.log("[notify] response status:", response.status);
  console.log("[notify] response body:", rawText);

  if (!response.ok) {
    let details = "Failed to send notification";
    try {
      const data = JSON.parse(rawText) as { message?: string };
      if (data?.message) details = data.message;
    } catch {
      // ignore json parse errors
    }
    redirectWith(details, true);
  }

  redirectWith("Notification sent successfully");
}
