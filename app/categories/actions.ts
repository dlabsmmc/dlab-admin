"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

function redirectWith(message: string, isError = false) {
  const key = isError ? "err" : "ok";
  redirect(`/categories?${key}=${encodeURIComponent(message)}`);
}

function parseSelectedIds(formData: FormData) {
  return formData
    .getAll("selected_category_ids")
    .map((value) => Number(String(value).trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

async function countProductsForCategory(categoryId: number) {
  const { count, error } = await supabaseAdmin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0, error: null as string | null };
}

export async function createCategoryAction(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!name || !slug) {
    redirectWith("Category name and slug are required", true);
  }

  const { error } = await supabaseAdmin.from("categories").insert({ name, slug });
  if (error) {
    redirectWith(error.message, true);
  }

  revalidatePath("/categories");
  redirectWith("Category created successfully.");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdminSession();

  const id = Number(String(formData.get("category_id") ?? "").trim());
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!Number.isFinite(id) || id <= 0 || !name || !slug) {
    redirectWith("Valid category ID, name, and slug are required", true);
  }

  const { error } = await supabaseAdmin.from("categories").update({ name, slug }).eq("id", id);
  if (error) {
    redirectWith(error.message, true);
  }

  revalidatePath("/categories");
  redirectWith("Category updated successfully.");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminSession();

  const id = Number(String(formData.get("category_id") ?? "").trim());
  if (!Number.isFinite(id) || id <= 0) {
    redirectWith("Valid category ID is required", true);
  }

  const linkedProducts = await countProductsForCategory(id);
  if (linkedProducts.error) {
    redirectWith(linkedProducts.error, true);
  }

  if (linkedProducts.count > 0) {
    redirectWith(
      `Cannot delete category. ${linkedProducts.count} product(s) are still linked to it. Move those products to another category first.`,
      true,
    );
  }

  const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
  if (error) {
    redirectWith(error.message, true);
  }

  revalidatePath("/categories");
  redirectWith("Category deleted successfully.");
}

export async function bulkCategoryAction(formData: FormData) {
  await requireAdminSession();

  const action = String(formData.get("bulk_action") ?? "").trim();
  const ids = parseSelectedIds(formData);

  if (!ids.length) {
    redirectWith("Select at least one category", true);
  }

  if (action === "delete") {
    const deletableIds: number[] = [];
    const blockedIds: number[] = [];

    for (const id of ids) {
      const linkedProducts = await countProductsForCategory(id);
      if (linkedProducts.error) {
        redirectWith(linkedProducts.error, true);
      }

      if (linkedProducts.count > 0) {
        blockedIds.push(id);
      } else {
        deletableIds.push(id);
      }
    }

    if (deletableIds.length === 0) {
      redirectWith(
        `No categories deleted. Selected categories are linked to products: ${blockedIds.join(", ")}.`,
        true,
      );
    }

    const { error } = await supabaseAdmin.from("categories").delete().in("id", deletableIds);
    if (error) redirectWith(error.message, true);

    revalidatePath("/categories");
    if (blockedIds.length > 0) {
      redirectWith(
        `Deleted ${deletableIds.length} categories. Skipped linked categories: ${blockedIds.join(", ")}.`,
      );
    }

    redirectWith(`Deleted ${deletableIds.length} categories.`);
  }

  if (action === "unpublish") {
    const { error } = await supabaseAdmin.from("categories").update({ is_active: false }).in("id", ids);

    if (error) {
      redirectWith(
        "Unpublish failed. Ensure `categories.is_active` exists in your DB schema before using this action.",
        true,
      );
    }

    revalidatePath("/categories");
    redirectWith(`Unpublished ${ids.length} categories.`);
  }

  redirectWith("Choose a valid bulk action", true);
}