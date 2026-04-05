"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

function redirectWithProducts(message: string, isError = false) {
  const queryKey = isError ? "err" : "ok";
  redirect(`/products?${queryKey}=${encodeURIComponent(message)}`);
}

function selectedProductIds(formData: FormData) {
  return formData
    .getAll("selected_product_ids")
    .map((value) => Number(String(value).trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export async function bulkProductsAction(formData: FormData) {
  await requireAdminSession();

  const action = String(formData.get("bulk_action") ?? "").trim();
  const selectedIds = selectedProductIds(formData);

  if (!selectedIds.length) {
    redirectWithProducts("Select at least one product", true);
  }

  if (action === "delete") {
    const { error } = await supabaseAdmin.from("products").delete().in("id", selectedIds);
    if (error) redirectWithProducts(error.message, true);

    revalidatePath("/products");
    redirectWithProducts(`Deleted ${selectedIds.length} products.`);
  }

  if (action === "unpublish") {
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_active: false })
      .in("id", selectedIds);

    if (error) redirectWithProducts(error.message, true);

    revalidatePath("/products");
    redirectWithProducts(`Unpublished ${selectedIds.length} products.`);
  }

  redirectWithProducts("Choose a valid bulk action", true);
}

export async function deleteSingleProductAction(formData: FormData) {
  await requireAdminSession();

  const rawId = Number(String(formData.get("product_id") ?? "").trim());
  if (!Number.isFinite(rawId) || rawId <= 0) {
    redirectWithProducts("Invalid product ID", true);
  }

  const { error } = await supabaseAdmin.from("products").delete().eq("id", rawId);
  if (error) redirectWithProducts(error.message, true);

  revalidatePath("/products");
  redirectWithProducts("Product deleted.");
}