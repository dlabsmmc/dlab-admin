"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

type BannerCategory = "banners" | "promo1" | "promo2";

const BANNER_RULES: Record<BannerCategory, { count: number; width: number; height: number }> = {
  banners: { count: 3, width: 389, height: 216 },
  promo1: { count: 1, width: 390, height: 134 },
  promo2: { count: 1, width: 388, height: 142 },
};

function redirectWith(message: string, isError = false) {
  const queryKey = isError ? "err" : "ok";
  redirect(`/banners?${queryKey}=${encodeURIComponent(message)}`);
}

function parseImageUrls(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return [] as string[];

  return raw
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function isBannerCategory(value: string): value is BannerCategory {
  return ["banners", "promo1", "promo2"].includes(value);
}

function parseAndValidateUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

async function readImageSize(imageUrl: string) {
  const response = await fetch(imageUrl, { cache: "no-store" });
  if (!response.ok) {
    return { width: 0, height: 0, error: `Could not load image: ${imageUrl}` };
  }

  const contentType = String(response.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.startsWith("image/")) {
    return { width: 0, height: 0, error: `URL is not an image: ${imageUrl}` };
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  const pngSignature = "89504e470d0a1a0a";
  const jpegSignature = "ffd8";
  const webpSignature = "52494646";
  const avifBrand = "61766966";
  const signature = buffer.subarray(0, 16).toString("hex");

  if (signature.startsWith(pngSignature) && buffer.length >= 24) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      error: null as string | null,
    };
  }

  if (signature.startsWith(jpegSignature)) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      const size = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return {
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5),
          error: null as string | null,
        };
      }

      if (!Number.isFinite(size) || size < 2) break;
      offset += 2 + size;
    }
  }

  if (signature.startsWith(webpSignature) && buffer.length >= 30) {
    const format = buffer.subarray(12, 16).toString("ascii");
    if (format === "VP8X" && buffer.length >= 30) {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height, error: null as string | null };
    }
  }

  if (signature.includes(avifBrand)) {
    return { width: 0, height: 0, error: `Unsupported image format for size detection: ${imageUrl}` };
  }

  return { width: 0, height: 0, error: `Could not detect image size for: ${imageUrl}` };
}

function hasExpectedRatio(width: number, height: number, expectedWidth: number, expectedHeight: number) {
  return width * expectedHeight === height * expectedWidth;
}

function parseProductId(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function splitTypes(rawType: string | null) {
  return String(rawType ?? "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function mergeUniqueTypes(types: string[]) {
  return [...new Set(types)];
}

export async function updateBannerImagesAction(formData: FormData) {
  await requireAdminSession();

  const categoryRaw = String(formData.get("category") ?? "").trim().toLowerCase();
  if (!isBannerCategory(categoryRaw)) {
    redirectWith("Invalid banner category", true);
  }

  const rules = BANNER_RULES[categoryRaw];
  const rawUrls = parseImageUrls(formData.get("image_urls"));
  if (rawUrls.length !== rules.count) {
    redirectWith(
      `${categoryRaw} needs exactly ${rules.count} image URL${rules.count > 1 ? "s" : ""}.`,
      true,
    );
  }

  const normalizedUrls: string[] = [];
  for (const rawUrl of rawUrls) {
    const parsed = parseAndValidateUrl(rawUrl);
    if (!parsed) {
      redirectWith(`Invalid image URL: ${rawUrl}`, true);
    }
    normalizedUrls.push(parsed);
  }

  for (const imageUrl of normalizedUrls) {
    const sizeResult = await readImageSize(imageUrl);
    if (sizeResult.error) {
      redirectWith(sizeResult.error, true);
    }

    const isValidRatio = hasExpectedRatio(sizeResult.width, sizeResult.height, rules.width, rules.height);
    if (!isValidRatio) {
      redirectWith(
        `${categoryRaw} image ratio must be ${rules.width}:${rules.height}. Received ${sizeResult.width}:${sizeResult.height}.`,
        true,
      );
    }
  }

  const imageUrlsValue = normalizedUrls.join(",");

  const updateResult = await supabaseAdmin
    .from("banners")
    .update({ image_urls: imageUrlsValue })
    .eq("category", categoryRaw)
    .select("id");

  if (updateResult.error) {
    redirectWith(updateResult.error.message, true);
  }

  if (!updateResult.data || updateResult.data.length === 0) {
    const { error: insertError } = await supabaseAdmin
      .from("banners")
      .insert({ category: categoryRaw, image_urls: imageUrlsValue });

    if (insertError) {
      redirectWith(insertError.message, true);
    }
  }

  revalidatePath("/banners");
  redirectWith(`${categoryRaw} images updated.`);
}

export async function addBannerProductAction(formData: FormData) {
  await requireAdminSession();

  const productId = parseProductId(formData.get("product_id"));
  if (!productId) {
    redirectWith("Valid product ID is required", true);
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id,name,type")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    redirectWith(productError.message, true);
  }

  if (!product) {
    redirectWith(`Product with ID ${productId} not found`, true);
  }

  const currentTypes = splitTypes(typeof product.type === "string" ? product.type : null);
  const nextTypes = mergeUniqueTypes([...currentTypes, "banner"]);

  const { error: updateError } = await supabaseAdmin
    .from("products")
    .update({ type: nextTypes.join(",") })
    .eq("id", productId);

  if (updateError) {
    redirectWith(updateError.message, true);
  }

  revalidatePath("/banners");
  revalidatePath("/products");
  redirectWith(`Product #${productId} added to banner items.`);
}

export async function removeBannerProductAction(formData: FormData) {
  await requireAdminSession();

  const productId = parseProductId(formData.get("product_id"));
  if (!productId) {
    redirectWith("Valid product ID is required", true);
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id,type")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    redirectWith(productError.message, true);
  }

  if (!product) {
    redirectWith(`Product with ID ${productId} not found`, true);
  }

  const currentTypes = splitTypes(typeof product.type === "string" ? product.type : null);
  const nextTypes = currentTypes.filter((type) => type !== "banner");
  const nextTypeValue = nextTypes.length > 0 ? nextTypes.join(",") : null;

  const { error: updateError } = await supabaseAdmin
    .from("products")
    .update({ type: nextTypeValue })
    .eq("id", productId);

  if (updateError) {
    redirectWith(updateError.message, true);
  }

  revalidatePath("/banners");
  revalidatePath("/products");
  redirectWith(`Product #${productId} removed from banner items.`);
}