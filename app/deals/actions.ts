"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DEAL_TYPES = ["deals", "freeship", "underthis", "new"] as const;
type DealType = (typeof DEAL_TYPES)[number];

function redirectWith(message: string, isError = false): never {
  const queryKey = isError ? "err" : "ok";
  redirect(`/deals?${queryKey}=${encodeURIComponent(message)}`);
}

function parseProductId(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function parseTypes(value: unknown) {
  return String(typeof value === "string" ? value : "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueTypes(types: string[]) {
  return [...new Set(types)];
}

function isDealType(value: string): value is DealType {
  return DEAL_TYPES.includes(value as DealType);
}

async function getProductById(productId: number) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id,name,type")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    return { product: null as null, error: error.message };
  }

  if (!data) {
    return { product: null as null, error: `Product with ID ${productId} not found` };
  }

  return { product: data, error: null as string | null };
}

async function updateProductType(productId: number, nextTypes: string[]) {
  const typeValue = nextTypes.length > 0 ? nextTypes.join(",") : null;
  const { error } = await supabaseAdmin.from("products").update({ type: typeValue }).eq("id", productId);
  return error ? error.message : null;
}

export async function addDealTypeByProductIdAction(formData: FormData) {
  await requireAdminSession();

  const productId = parseProductId(formData.get("product_id"));
  if (!productId) {
    redirectWith("Valid product ID is required", true);
  }

  const dealTypeRaw = String(formData.get("deal_type") ?? "").trim().toLowerCase();
  if (!isDealType(dealTypeRaw)) {
    redirectWith("Choose a valid deal type", true);
  }

  const { product, error } = await getProductById(productId);
  if (error || !product) {
    redirectWith(error ?? "Product not found", true);
  }

  const currentTypes = parseTypes(product.type);
  const nextTypes = uniqueTypes([...currentTypes, dealTypeRaw]);

  const updateError = await updateProductType(productId, nextTypes);
  if (updateError) {
    redirectWith(updateError, true);
  }

  revalidatePath("/deals");
  revalidatePath("/products");
  redirectWith(`Added ${dealTypeRaw} to product #${productId}.`);
}

export async function removeDealTypeAction(formData: FormData) {
  await requireAdminSession();

  const productId = parseProductId(formData.get("product_id"));
  if (!productId) {
    redirectWith("Valid product ID is required", true);
  }

  const dealTypeRaw = String(formData.get("deal_type") ?? "").trim().toLowerCase();
  if (!isDealType(dealTypeRaw)) {
    redirectWith("Choose a valid deal type", true);
  }

  const { product, error } = await getProductById(productId);
  if (error || !product) {
    redirectWith(error ?? "Product not found", true);
  }

  const currentTypes = parseTypes(product.type);
  const nextTypes = currentTypes.filter((type) => type !== dealTypeRaw);

  const updateError = await updateProductType(productId, nextTypes);
  if (updateError) {
    redirectWith(updateError, true);
  }

  revalidatePath("/deals");
  revalidatePath("/products");
  redirectWith(`Removed ${dealTypeRaw} from product #${productId}.`);
}

export async function clearProductTypesAction(formData: FormData) {
  await requireAdminSession();

  const productId = parseProductId(formData.get("product_id"));
  if (!productId) {
    redirectWith("Valid product ID is required", true);
  }

  const { error } = await supabaseAdmin.from("products").update({ type: null }).eq("id", productId);
  if (error) {
    redirectWith(error.message, true);
  }

  revalidatePath("/deals");
  revalidatePath("/products");
  redirectWith(`Cleared all types for product #${productId}.`);
}
