import { logoutAction } from "@/app/actions/auth";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BoxIcon,
  ChartColumnBig,
  ChevronDown,
  CreditCard,
  FilePenLine,
  Filter,
  House,
  Layers,
  Logs,
  Settings,
  ShoppingCart,
  Star,
  Ticket,
  User,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { bulkProductsAction } from "./actions";
import { SelectAllCheckbox } from "./ui/select-all-checkbox";

type ProductsPageProps = {
  searchParams?: Promise<{
    tab?: string;
    q?: string;
    page?: string;
    category?: string;
    ok?: string;
    err?: string;
  }>;
};

type ProductTab = "all" | "published" | "drafts" | "out-of-stock";

type SidebarItem = {
  href: string;
  icon: ComponentType<{ size?: number }>;
  text: string;
  active?: boolean;
};

type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

type ProductRow = {
  id: number;
  name: string;
  categoryId: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  isActive: boolean;
  stock: number | null;
  sku: string;
  image: string;
};

const PAGE_SIZE = 7;

const sidebarSections: SidebarSection[] = [
  { label: "MAIN", items: [{ href: "/dashboard", icon: House, text: "Dashboard" }] },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/users", icon: Users, text: "Users" },
      { href: "/products", icon: BoxIcon, text: "Products", active: true },
      { href: "/categories", icon: Layers, text: "Categories" },
      { href: "/orders", icon: ShoppingCart, text: "Orders" },
    ],
  },
  {
    label: "TRANSACTIONS",
    items: [
      { href: "/payments", icon: CreditCard, text: "Payments" },
      { href: "/coupons", icon: Ticket, text: "Coupons & Offers" },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { href: "/reviews", icon: Star, text: "Reviews" },
      { href: "/cms", icon: FilePenLine, text: "CMS / Content" },
    ],
  },
  { label: "COMMUNICATION", items: [{ href: "/notifications", icon: Bell, text: "Push Notifications" }] },
  {
    label: "SYSTEM",
    items: [
      { href: "/analytics", icon: ChartColumnBig, text: "Analytics & Reports" },
      { href: "/settings", icon: Settings, text: "System Settings" },
      { href: "/logs", icon: Logs, text: "Logs" },
    ],
  },
];

function statusClasses(status: ProductTab) {
  if (status === "published") return "bg-emerald-100 text-emerald-700";
  if (status === "drafts") return "bg-amber-100 text-amber-700";
  if (status === "out-of-stock") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function statusLabel(status: ProductTab) {
  if (status === "published") return "Published";
  if (status === "drafts") return "Draft";
  if (status === "out-of-stock") return "Out of Stock";
  return "All";
}

function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function stringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function imageFromProduct(value: unknown) {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string");
    return typeof first === "string" ? first : "";
  }
  if (typeof value === "string") return value;
  return "";
}

function toProductTab(value: string): ProductTab {
  if (["all", "published", "drafts", "out-of-stock"].includes(value)) return value as ProductTab;
  return "all";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await requireAdminSession();

  const params = (await searchParams) ?? {};
  const tab = toProductTab(String(params.tab ?? "all").toLowerCase());
  const pageRaw = Number(params.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1;
  const q = String(params.q ?? "").trim();
  const categoryFilterRaw = String(params.category ?? "all").trim();
  const categoryFilter = categoryFilterRaw === "all" ? "all" : String(Number(categoryFilterRaw));

  const categoriesResponse = await supabaseAdmin.from("categories").select("id,name").order("name", { ascending: true });
  const categories = categoriesResponse.error ? [] : categoriesResponse.data ?? [];

  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  let productsQuery = supabaseAdmin
    .from("products")
    .select("*", { count: "exact" })
    .order("id", { ascending: false });

  if (categoryFilter !== "all") {
    productsQuery = productsQuery.eq("category_id", Number(categoryFilter));
  }

  if (q.length > 0) {
    productsQuery = productsQuery.ilike("name", `%${q}%`);
  }

  if (tab === "published") {
    productsQuery = productsQuery.eq("is_active", true);
  } else if (tab === "drafts") {
    productsQuery = productsQuery.eq("is_active", false);
  } else if (tab === "out-of-stock") {
    productsQuery = productsQuery.lte("stock_quantity", 0);
  }

  const productsResult = await productsQuery.range(rangeFrom, rangeTo);
  const rawProducts = productsResult.error ? [] : productsResult.data ?? [];
  const totalEntries = productsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const categoryMap = new Map(categories.map((item) => [item.id, item.name]));

  const products: ProductRow[] = rawProducts.map((item) => {
    const row = item as Record<string, unknown>;
    const regularPrice = numberOrNull(row.regular_price);
    const salePrice = numberOrNull(row.sale_price);
    const effectiveStock = numberOrNull(row.stock_quantity);

    return {
      id: Number(row.id ?? 0),
      name: stringOrEmpty(row.name) || `Product ${String(row.id ?? "")}`,
      categoryId: numberOrNull(row.category_id),
      regularPrice,
      salePrice,
      isActive: Boolean(row.is_active),
      stock: effectiveStock,
      sku: stringOrEmpty(row.sku) || `SKU-${String(row.id ?? "").padStart(4, "0")}`,
      image: imageFromProduct(row.images),
    };
  });

  const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, totalEntries);

  const makeHref = (next: Partial<{ tab: ProductTab; q: string; page: number; category: string }>) => {
    const query = new URLSearchParams();
    query.set("tab", next.tab ?? tab);
    query.set("page", String(next.page ?? currentPage));

    const nextQ = next.q ?? q;
    if (nextQ.trim()) query.set("q", nextQ.trim());

    const nextCategory = next.category ?? categoryFilter;
    if (nextCategory !== "all") query.set("category", nextCategory);

    if (params.ok) query.set("ok", params.ok);
    if (params.err) query.set("err", params.err);

    return `/products?${query.toString()}`;
  };

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <input id="sidebar-toggle" type="checkbox" className="peer sr-only" />

      <aside className="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 peer-checked:translate-x-0 lg:translate-x-0">
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
          <Image
            src="/logo.png"
            alt="DLab Admin"
            width={180}
            height={48}
            className="mx-auto h-10 w-auto object-contain"
            priority
          />
        </div>

        <nav className="space-y-5 overflow-y-auto pb-8">
          {sidebarSections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 text-xs font-semibold tracking-wider text-slate-400">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        item.active
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon size={16} />
                      {item.text}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-[280px] flex-1 items-center gap-3">
              <label
                htmlFor="sidebar-toggle"
                className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-lg leading-none text-slate-700 lg:hidden"
              >
                ☰
              </label>
              <div className="w-full max-w-md">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative rounded-full border border-slate-200 p-2 text-slate-600">
                <Bell size={18} />
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  3
                </span>
              </div>

              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">A</span>
                  Admin User
                  <ChevronDown size={16} className="text-slate-400" />
                </summary>
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                  <Link href="#" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    <User size={14} /> Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <Settings size={14} /> Settings
                  </Link>
                  <div className="my-1 border-t border-slate-200" />
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main className="space-y-6 px-4 py-5 sm:px-6 lg:px-8">
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
            <h2 className="text-2xl font-semibold text-slate-900">Products Management</h2>
            <Link href="/product-form" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              + Add New Product
            </Link>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {(["all", "published", "drafts", "out-of-stock"] as ProductTab[]).map((item) => (
                <Link
                  key={item}
                  href={makeHref({ tab: item, page: 1 })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === item ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item === "all" ? "All Products" : statusLabel(item)}
                </Link>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  name="bulk_action"
                  form="bulk-products-form"
                  className="w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Bulk Actions</option>
                  <option value="delete">Delete Selected</option>
                  <option value="unpublish">Unpublish</option>
                </select>
                <button
                  type="submit"
                  form="bulk-products-form"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Apply
                </button>

                <form action="/products" method="get" className="ml-2 flex items-center gap-2">
                  <input type="hidden" name="tab" value={tab} />
                  <input type="hidden" name="q" value={q} />
                  <select
                    name="category"
                    defaultValue={categoryFilter}
                    className="w-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    <Filter size={16} />
                  </button>
                </form>
              </div>

              <form action="/products" method="get" className="flex items-center gap-2">
                <input type="hidden" name="tab" value={tab} />
                <input type="hidden" name="category" value={categoryFilter} />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by SKU, name..."
                  className="w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  aria-label="Search products"
                >
                  <Filter size={16} />
                </button>
              </form>
            </div>

            <form action={bulkProductsAction} id="bulk-products-form">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-2 py-2">
                        <SelectAllCheckbox checkboxName="selected_product_ids" />
                      </th>
                      <th className="px-2 py-2 font-medium">Product</th>
                      <th className="px-2 py-2 font-medium">Category</th>
                      <th className="px-2 py-2 font-medium">Price</th>
                      <th className="px-2 py-2 font-medium">Stock</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-6 text-center text-slate-500">
                          No products found for this filter.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const currentStatus: ProductTab =
                          product.stock !== null && product.stock <= 0
                            ? "out-of-stock"
                            : product.isActive
                              ? "published"
                              : "drafts";

                        const priceToShow = product.salePrice ?? product.regularPrice;
                        const image =
                          product.image ||
                          "https://images.unsplash.com/photo-1513708927688-890a1e6d33f1?q=80&w=100&auto=format&fit=crop";

                        return (
                          <tr key={product.id} className="border-b border-slate-100">
                            <td className="px-2 py-3">
                              <input
                                type="checkbox"
                                name="selected_product_ids"
                                value={String(product.id)}
                                className="h-4 w-4"
                              />
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center gap-2">
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-md object-cover"
                                />
                                <div>
                                  <div className="font-medium text-slate-800">{product.name}</div>
                                  <div className="text-xs text-slate-500">SKU: {product.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3">{categoryMap.get(product.categoryId ?? -1) ?? "Uncategorized"}</td>
                            <td className="px-2 py-3">{priceToShow !== null ? currencyFormatter.format(priceToShow) : "-"}</td>
                            <td className="px-2 py-3">{product.stock ?? "-"}</td>
                            <td className="px-2 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses(currentStatus)}`}>
                                {statusLabel(currentStatus)}
                              </span>
                            </td>
                            <td className="px-2 py-3">
                              <Link
                                href="/product-form"
                                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                              >
                                Edit
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <p>
                Showing {showingFrom} to {showingTo} of {totalEntries} entries
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href={makeHref({ page: Math.max(currentPage - 1, 1) })}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                    currentPage > 1
                      ? "border-slate-300 bg-white text-slate-700"
                      : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  Prev
                </Link>

                {Array.from({ length: Math.min(3, totalPages) }).map((_, index) => {
                  const number = index + 1;
                  const active = number === currentPage;
                  return (
                    <Link
                      key={number}
                      href={makeHref({ page: number })}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      {number}
                    </Link>
                  );
                })}

                <Link
                  href={makeHref({ page: Math.min(currentPage + 1, totalPages) })}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                    currentPage < totalPages
                      ? "border-slate-300 bg-white text-slate-700"
                      : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}