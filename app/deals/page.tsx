import { AdminShell } from "@/app/ui/admin-shell";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  addDealTypeByProductIdAction,
  clearProductTypesAction,
  removeDealTypeAction,
} from "./actions";

type DealsPageProps = {
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

const DEAL_TYPES = ["deals", "freeship", "underthis", "new"] as const;
type DealType = (typeof DEAL_TYPES)[number];

type ProductItem = {
  id: number;
  name: string;
  image: string;
  types: DealType[];
};

const sectionMeta: Array<{ key: DealType; title: string }> = [
  { key: "deals", title: "Deals" },
  { key: "freeship", title: "Free Shipping" },
  { key: "underthis", title: "under 999" },
  { key: "new", title: "Latest" },
];

function parseTypes(value: unknown) {
  return String(typeof value === "string" ? value : "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function toDealTypes(value: unknown) {
  return parseTypes(value).filter((type): type is DealType => DEAL_TYPES.includes(type as DealType));
}

function productImage(value: unknown) {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim().length > 0);
    return typeof first === "string" ? first : "";
  }

  if (typeof value === "string") return value.trim();
  return "";
}

function titleForType(type: DealType) {
  if (type === "deals") return "Deals";
  if (type === "freeship") return "Free Shipping";
  if (type === "underthis") return "under 999";
  return "Latest";
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  await requireAdminSession();

  const params = (await searchParams) ?? {};

  const query = await supabaseAdmin
    .from("products")
    .select("id,name,type,images")
    .or("type.ilike.%deals%,type.ilike.%freeship%,type.ilike.%underthis%,type.ilike.%new%")
    .order("id", { ascending: false })
    .limit(500);

  const products: ProductItem[] = (query.error ? [] : query.data ?? [])
    .map((item) => ({
      id: Number(item.id ?? 0),
      name: typeof item.name === "string" && item.name.trim().length > 0 ? item.name : `Product #${String(item.id ?? "")}`,
      image: productImage(item.images),
      types: toDealTypes(item.type),
    }))
    .filter((item) => item.id > 0 && item.types.length > 0);

  return (
    <AdminShell activePath="/deals" searchPlaceholder="Search deal products...">
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
        <h2 className="text-2xl font-semibold text-slate-900">Deals Management</h2>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Add Product by ID</h3>
          <p className="text-xs text-slate-500">Assign one of: deals, freeship, underthis, new</p>
        </div>

        <form action={addDealTypeByProductIdAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Product ID</label>
            <input name="product_id" type="number" min="1" step="1" required placeholder="Enter product ID" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select name="deal_type" defaultValue="deals">
              <option value="deals">Deals</option>
              <option value="freeship">Free Shipping</option>
              <option value="underthis">under 999</option>
              <option value="new">Latest</option>
            </select>
          </div>
          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
            Add
          </button>
        </form>
      </section>

      {sectionMeta.map((section) => {
        const sectionProducts = products.filter((product) => product.types.includes(section.key));

        return (
          <section key={section.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {sectionProducts.length} products
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-2 py-2 font-medium">Product</th>
                    <th className="px-2 py-2 font-medium">ID</th>
                    <th className="px-2 py-2 font-medium">Types</th>
                    <th className="px-2 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-6 text-center text-slate-500">
                        No products tagged as {section.title}.
                      </td>
                    </tr>
                  ) : (
                    sectionProducts.map((product) => {
                      const availableAddTypes = DEAL_TYPES.filter((type) => !product.types.includes(type));

                      return (
                        <tr key={`${section.key}-${product.id}`} className="border-b border-slate-100">
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
                          <td className="px-2 py-3">
                            <div className="flex flex-wrap gap-2">
                              {product.types.map((type) => (
                                <form key={`${product.id}-${type}`} action={removeDealTypeAction} className="inline-flex">
                                  <input type="hidden" name="product_id" value={product.id} />
                                  <input type="hidden" name="deal_type" value={type} />
                                  <button
                                    type="submit"
                                    className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
                                    title={`Remove ${type}`}
                                  >
                                    {titleForType(type)}
                                    <span aria-hidden>✕</span>
                                  </button>
                                </form>
                              ))}
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex justify-end gap-2">
                              <form action={addDealTypeByProductIdAction} className="flex items-center gap-2">
                                <input type="hidden" name="product_id" value={product.id} />
                                <select name="deal_type" defaultValue={availableAddTypes[0] ?? ""} disabled={availableAddTypes.length === 0}>
                                  {availableAddTypes.length === 0 ? (
                                    <option value="">No more types</option>
                                  ) : (
                                    availableAddTypes.map((type) => (
                                      <option key={type} value={type}>
                                        {titleForType(type)}
                                      </option>
                                    ))
                                  )}
                                </select>
                                <button
                                  type="submit"
                                  disabled={availableAddTypes.length === 0}
                                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Add Type
                                </button>
                              </form>

                              <form action={clearProductTypesAction}>
                                <input type="hidden" name="product_id" value={product.id} />
                                <button
                                  type="submit"
                                  className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700"
                                >
                                  Delete All
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </AdminShell>
  );
}
