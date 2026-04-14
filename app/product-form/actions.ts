"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

function redirectWith(message: string, isError = false, productId?: number | null) {
  const queryKey = isError ? "err" : "ok";
  const query = new URLSearchParams();
  query.set(queryKey, message);
  if (productId) {
    query.set("id", String(productId));
  }
  redirect(`/product-form?${query.toString()}`);
}

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
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isTruthy(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "on"].includes(raw);
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

export async function saveProductWithVariantsAction(formData: FormData) {
  await requireAdminSession();

  const productId = integerOrNull(formData.get("product_id"));
  const isEditing = productId !== null && productId > 0;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirectWith("Product name is required", true, productId);
  }

  const variantNames = formData.getAll("variant_name[]").map((value) => String(value ?? "").trim());
  const variantIds = formData.getAll("variant_id[]");
  const variantRegularPrices = formData.getAll("variant_regular_price[]");
  const variantSalePrices = formData.getAll("variant_sale_price[]");
  const variantWeights = formData.getAll("variant_weight[]");
  const variantLengths = formData.getAll("variant_length[]");
  const variantWidths = formData.getAll("variant_width[]");
  const variantHeights = formData.getAll("variant_height[]");
  const variantStocks = formData.getAll("variant_stock[]");
  const variantImages = formData.getAll("variant_images[]");
  const variantStatuses = formData.getAll("variant_status[]").map((value) => String(value ?? "true"));

  const variantsPayload = variantNames
    .map((variantName, index) => {
      if (!variantName) return null;

      return {
        id: integerOrNull(variantIds[index] ?? null),
        variant_name: variantName,
        regular_price: numberOrNull(variantRegularPrices[index] ?? null),
        sale_price: numberOrNull(variantSalePrices[index] ?? null),
        weight: numberOrNull(variantWeights[index] ?? null),
        length: numberOrNull(variantLengths[index] ?? null),
        width: numberOrNull(variantWidths[index] ?? null),
        height: numberOrNull(variantHeights[index] ?? null),
        stock: integerOrNull(variantStocks[index] ?? null),
        images: parseImages(variantImages[index] ?? null),
        is_active: isTruthy(variantStatuses[index] ?? "true"),
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  const productPayload = {
    name,
    type: (() => {
      const value = stringOrNull(formData.get("type"));
      return value ? value.toLowerCase() : null;
    })(),
    short_description: stringOrNull(formData.get("short_description")),
    description: stringOrNull(formData.get("description")),
    weight: numberOrNull(formData.get("weight")),
    length: numberOrNull(formData.get("length")),
    width: numberOrNull(formData.get("width")),
    height: numberOrNull(formData.get("height")),
    category_id: integerOrNull(formData.get("category_id")),
    images: parseImages(formData.get("images")),
    is_variable: variantsPayload.length > 0 || isTruthy(formData.get("is_variable")),
    sale_price: numberOrNull(formData.get("sale_price")),
    regular_price: numberOrNull(formData.get("regular_price")),
    stock: integerOrNull(formData.get("stock")),
    is_active: isTruthy(formData.get("is_active")),
  };

  if (isEditing && productId) {
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update(productPayload)
      .eq("id", productId);

    if (updateError) {
      redirectWith(updateError.message, true, productId);
    }

    const { data: currentVariantRows, error: currentVariantsError } = await supabaseAdmin
      .from("product_variants")
      .select("id")
      .eq("product_id", productId);

    if (currentVariantsError) {
      redirectWith(currentVariantsError.message, true, productId);
    }

    const retainedIds = new Set(
      variantsPayload
        .map((item) => item.id)
        .filter((id): id is number => typeof id === "number" && id > 0),
    );
    const currentIds = (currentVariantRows ?? []).map((row) => Number(row.id ?? 0)).filter((id) => id > 0);
    const idsToDelete = currentIds.filter((id) => !retainedIds.has(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("product_variants")
        .delete()
        .eq("product_id", productId)
        .in("id", idsToDelete);

      if (deleteError) {
        redirectWith(deleteError.message, true, productId);
      }
    }

    for (const variant of variantsPayload) {
      const variantPayload = {
        variant_name: variant.variant_name,
        regular_price: variant.regular_price,
        sale_price: variant.sale_price,
        weight: variant.weight,
        length: variant.length,
        width: variant.width,
        height: variant.height,
        stock: variant.stock,
        images: variant.images,
        is_active: variant.is_active,
      };

      if (variant.id && variant.id > 0) {
        const { error: updateVariantError } = await supabaseAdmin
          .from("product_variants")
          .update(variantPayload)
          .eq("id", variant.id)
          .eq("product_id", productId);

        if (updateVariantError) {
          redirectWith(updateVariantError.message, true, productId);
        }
        continue;
      }

      const { error: insertVariantError } = await supabaseAdmin.from("product_variants").insert({
        ...variantPayload,
        product_id: productId,
      });

      if (insertVariantError) {
        redirectWith(insertVariantError.message, true, productId);
      }
    }

    revalidatePath("/products");
    revalidatePath("/dashboard");
    redirect(`/products?ok=${encodeURIComponent("Product updated successfully")}`);
  }

  const { data: createdProduct, error: productError } = await insertProductWithIdFallback(productPayload);

  if (productError) {
    redirectWith(productError.message, true);
  }

  const createdProductId = createdProduct?.id;
  if (!createdProductId) {
    redirectWith("Product created response missing ID", true);
  }

  if (variantsPayload.length > 0) {
    const insertPayload = variantsPayload.map((item) => ({
      variant_name: item.variant_name,
      regular_price: item.regular_price,
      sale_price: item.sale_price,
      weight: item.weight,
      length: item.length,
      width: item.width,
      height: item.height,
      stock: item.stock,
      images: item.images,
      is_active: item.is_active,
      product_id: createdProductId,
    }));

    const { error: variantError } = await supabaseAdmin.from("product_variants").insert(insertPayload);
    if (variantError) {
      redirectWith(
        `Product created (ID ${createdProductId}) but variants failed: ${variantError.message}`,
        true,
      );
    }
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");
  redirect(`/products?ok=${encodeURIComponent("Product created successfully")}`);
}

export const createProductWithVariantsAction = saveProductWithVariantsAction;