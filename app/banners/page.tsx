import { AdminShell } from "@/app/ui/admin-shell";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { addBannerProductAction, removeBannerProductAction, updateBannerImagesAction } from "./actions";

type BannersPageProps = {
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

type BannerCategory = "banners" | "promo1" | "promo2" | "deals";

const bannerMeta: Record<BannerCategory, { title: string; count: number; ratio: string; helper: string }> = {
  banners: {
    title: "Main Banners",
    count: 3,
    ratio: "389:216",
    helper: "Add exactly 3 image URLs. These URLs are saved comma-separated in `banners.image_urls`.",
  },
  promo1: {
    title: "Promo 1",
    count: 1,
    ratio: "390:134",
    helper: "Add exactly 1 image URL.",
  },
  promo2: {
    title: "Promo 2",
    count: 1,
    ratio: "388:142",
    helper: "Add exactly 1 image URL.",
  },
  deals: {
    title: "Deals Banner",
    count: 2,
    ratio: "184:190",
    helper: "Add exactly 2 image URLs.",
  },
};

function parseStoredUrls(value: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return [] as string[];

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTypeTokens(value: unknown) {
  return String(typeof value === "string" ? value : "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function hasBannerType(value: unknown) {
  return parseTypeTokens(value).includes("banner");
}

function productImage(value: unknown) {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim().length > 0);
    return typeof first === "string" ? first : "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

export default async function BannersPage({ searchParams }: BannersPageProps) {
  await requireAdminSession();
  const params = (await searchParams) ?? {};

  const { data, error } = await supabaseAdmin
    .from("banners")
    .select("id,category,image_urls,updated_at")
    .in("category", ["banners", "promo1", "promo2", "deals"])
    .order("id", { ascending: true });

  const rows = error ? [] : data ?? [];
  const rowByCategory = new Map<string, (typeof rows)[number]>(rows.map((row) => [String(row.category), row]));

  const bannerProductsQuery = await supabaseAdmin
    .from("products")
    .select("id,name,type,images")
    .ilike("type", "%banner%")
    .order("id", { ascending: false })
    .limit(200);

  const bannerProducts = (bannerProductsQuery.error ? [] : bannerProductsQuery.data ?? [])
    .filter((item) => hasBannerType(item.type))
    .map((item) => ({
      id: Number(item.id ?? 0),
      name: typeof item.name === "string" && item.name.trim().length > 0 ? item.name : `Product #${String(item.id ?? "")}`,
      type: typeof item.type === "string" ? item.type : "",
      image: productImage(item.images),
    }));

  const categories: BannerCategory[] = ["banners", "promo1", "promo2", "deals"];

  return (
    <AdminShell activePath="/banners" searchPlaceholder="Search banners...">
      {(params.ok || params.err) && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            params.err
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {params.err ?? params.ok}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Banners Management</h2>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm text-slate-600">
          Configure banner image URLs for the app. Banner blocks redirect to your Flutter pages.
        </p>

        <div className="mt-4 space-y-4">
          {categories.map((category) => {
            const meta = bannerMeta[category];
            const row = rowByCategory.get(category);
            const initialValue = parseStoredUrls((row?.image_urls as string | null) ?? null).join("\n");
            const updatedAt = row?.updated_at ? new Date(String(row.updated_at)) : null;

            return (
              <form
                key={category}
                action={updateBannerImagesAction}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <input type="hidden" name="category" value={category} />

                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{meta.title}</h3>
                  <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                    Size ratio {meta.ratio}
                  </span>
                </div>

                <p className="mb-2 text-xs text-slate-500">{meta.helper}</p>
                <p className="mb-2 text-xs text-slate-500">Required URL count: {meta.count}</p>

                <textarea
                  name="image_urls"
                  rows={meta.count === 3 ? 4 : 2}
                  required
                  defaultValue={initialValue}
                  placeholder="https://cdn.example.com/banner-1.jpg"
                />

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {updatedAt
                      ? `Updated: ${new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(updatedAt)}`
                      : "Not updated yet"}
                  </p>

                  <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white">
                    Save {meta.title}
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Banner Products</h3>
          <p className="text-xs text-slate-500">Products with type containing banner appear in the app banner page.</p>
        </div>

        <form action={addBannerProductAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Add by Product ID</label>
            <input name="product_id" type="number" step="1" min="1" required placeholder="Enter product ID" />
          </div>
          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            Add to Banner
          </button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2 font-medium">Product</th>
                <th className="px-2 py-2 font-medium">ID</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {bannerProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-6 text-center text-slate-500">
                    No products currently tagged with banner.
                  </td>
                </tr>
              ) : (
                bannerProducts.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            product.image ||
                            "https://images.unsplash.com/photo-1513708927688-890a1e6d33f1?q=80&w=100&auto=format&fit=crop"
                          }
                          alt={product.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <span className="font-medium text-slate-800">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-slate-700">#{product.id}</td>
                    <td className="px-2 py-3 text-slate-700">{product.type || "-"}</td>
                    <td className="px-2 py-3 text-right">
                      <form action={removeBannerProductAction}>
                        <input type="hidden" name="product_id" value={product.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700"
                        >
                          Remove from Banner
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}