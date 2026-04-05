import { logoutAction } from "@/app/actions/auth";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BoxIcon,
  ChartColumnBig,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FilePenLine,
  Filter,
  House,
  Layers,
  Logs,
  Pencil,
  Settings,
  ShoppingCart,
  Star,
  Ticket,
  Trash2,
  User,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import {
  bulkCategoryAction,
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "./actions";
import { BulkApplyButton } from "./ui/bulk-apply-button";
import { ConfirmDeleteButton } from "./ui/confirm-delete-button";
import { SelectAllCheckbox } from "./ui/select-all-checkbox";

type CategoriesPageProps = {
  searchParams?: Promise<{
    tab?: string;
    q?: string;
    page?: string;
    create?: string;
    edit?: string;
    ok?: string;
    err?: string;
  }>;
};

type CategoryStatus = "published" | "draft" | "archived";
type CategoryTab = "all" | CategoryStatus;

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

type CategoryRecord = Record<string, unknown>;

const PAGE_SIZE = 5;

const sidebarSections: SidebarSection[] = [
  { label: "MAIN", items: [{ href: "/dashboard", icon: House, text: "Dashboard" }] },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/users", icon: Users, text: "Users" },
      { href: "/products", icon: BoxIcon, text: "Products" },
      { href: "/categories", icon: Layers, text: "Categories", active: true },
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

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getCategoryStatus(category: CategoryRecord): CategoryStatus {
  if ("archived_at" in category && category.archived_at) {
    return "archived";
  }

  if ("is_active" in category) {
    return category.is_active ? "published" : "draft";
  }

  return "published";
}

function statusBadgeClass(status: CategoryStatus) {
  if (status === "published") return "bg-emerald-100 text-emerald-700";
  if (status === "draft") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-700";
}

function statusLabel(status: CategoryStatus) {
  if (status === "published") return "Active";
  if (status === "draft") return "Draft";
  return "Archived";
}

function categoryImage(category: CategoryRecord) {
  const directImage = asString(category.image_url) || asString(category.image);
  if (directImage) return directImage;

  const slug = asString(category.slug) || `category-${String(category.id ?? "0")}`;
  return `https://picsum.photos/seed/${encodeURIComponent(slug)}/88/88`;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  await requireAdminSession();

  const params = (await searchParams) ?? {};
  const q = String(params.q ?? "").trim().toLowerCase();
  const tabRaw = String(params.tab ?? "all").toLowerCase();
  const tab: CategoryTab = ["all", "published", "draft", "archived"].includes(tabRaw)
    ? (tabRaw as CategoryTab)
    : "all";
  const pageRaw = Number(params.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1;

  const [categoriesResponse, totalProductsResponse] = await Promise.all([
    supabaseAdmin.from("categories").select("*").order("id", { ascending: false }),
    supabaseAdmin.from("products").select("*", { count: "exact", head: true }),
  ]);

  const allCategories = (categoriesResponse.error ? [] : categoriesResponse.data ?? []) as CategoryRecord[];
  const totalProducts = totalProductsResponse.count ?? 0;

  const categoryWithStatus = allCategories.map((category) => ({
    raw: category,
    id: asNumber(category.id),
    name: asString(category.name) || "Unnamed Category",
    slug: asString(category.slug),
    description: asString(category.description),
    status: getCategoryStatus(category),
    image: categoryImage(category),
  }));

  const publishedCount = categoryWithStatus.filter((item) => item.status === "published").length;
  const draftCount = categoryWithStatus.filter((item) => item.status === "draft").length;
  const archivedCount = categoryWithStatus.filter((item) => item.status === "archived").length;

  const filtered = categoryWithStatus
    .filter((item) => (tab === "all" ? true : item.status === tab))
    .filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        String(item.id).includes(q)
      );
    });

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(offset, offset + PAGE_SIZE);

  const productCountEntries = await Promise.all(
    pageRows.map(async (category) => {
      const { count } = await supabaseAdmin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id);
      return [category.id, count ?? 0] as const;
    }),
  );
  const productCountMap = new Map<number, number>(productCountEntries);

  const showingFrom = totalEntries === 0 ? 0 : offset + 1;
  const showingTo = Math.min(offset + PAGE_SIZE, totalEntries);

  const editIdRaw = Number(String(params.edit ?? ""));
  const editId = Number.isFinite(editIdRaw) && editIdRaw > 0 ? editIdRaw : null;
  const editingCategory = editId ? categoryWithStatus.find((item) => item.id === editId) : null;
  const showCreateForm = params.create === "1";

  const makeHref = (next: Partial<{ tab: CategoryTab; q: string; page: number; create: string; edit: string }>) => {
    const query = new URLSearchParams();
    query.set("tab", next.tab ?? tab);
    query.set("page", String(next.page ?? currentPage));

    const nextQ = next.q ?? q;
    if (nextQ.trim()) query.set("q", nextQ.trim());

    const nextCreate = next.create ?? (showCreateForm ? "1" : "");
    if (nextCreate) query.set("create", nextCreate);

    const nextEdit = next.edit ?? (editingCategory ? String(editingCategory.id) : "");
    if (nextEdit) query.set("edit", nextEdit);

    if (params.ok) query.set("ok", params.ok);
    if (params.err) query.set("err", params.err);
    return `/categories?${query.toString()}`;
  };

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
            <h2 className="text-2xl font-semibold text-slate-900">Categories Management</h2>
            <Link href={makeHref({ create: "1", edit: "", page: 1 })} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              + Add New Category
            </Link>
          </div>

          {(showCreateForm || editingCategory) && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-slate-900">
                {editingCategory ? `Edit Category #${editingCategory.id}` : "Create Category"}
              </h3>

              <form action={editingCategory ? updateCategoryAction : createCategoryAction} className="grid gap-3 sm:grid-cols-2">
                {editingCategory ? <input type="hidden" name="category_id" value={editingCategory.id} /> : null}

                <div>
                  <label className="mb-1 block text-sm font-medium">Category Name *</label>
                  <input name="name" required defaultValue={editingCategory?.name ?? ""} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Slug *</label>
                  <input name="slug" required defaultValue={editingCategory?.slug ?? ""} />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                    {editingCategory ? "Update Category" : "Create Category"}
                  </button>
                  <Link href={makeHref({ create: "", edit: "" })} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                    Cancel
                  </Link>
                </div>
              </form>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                  <Layers size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Categories</p>
                  <p className="text-2xl font-semibold">{allCategories.length}</p>
                </div>
              </div>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Published</p>
                  <p className="text-2xl font-semibold">{publishedCount}</p>
                </div>
              </div>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <BoxIcon size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Products</p>
                  <p className="text-2xl font-semibold">{totalProducts}</p>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <Link
                href={makeHref({ tab: "all", page: 1, create: "", edit: "" })}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                All Categories
              </Link>
              <Link
                href={makeHref({ tab: "published", page: 1, create: "", edit: "" })}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "published" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Published ({publishedCount})
              </Link>
              <Link
                href={makeHref({ tab: "draft", page: 1, create: "", edit: "" })}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "draft" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Draft ({draftCount})
              </Link>
              <Link
                href={makeHref({ tab: "archived", page: 1, create: "", edit: "" })}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "archived" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                Archived ({archivedCount})
              </Link>
            </div>

            <form id="bulk-categories-form" action={bulkCategoryAction} />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  name="bulk_action"
                  form="bulk-categories-form"
                  className="w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Bulk Actions</option>
                  <option value="delete">Delete Selected</option>
                  <option value="unpublish">Unpublish</option>
                </select>
                <BulkApplyButton
                  formId="bulk-categories-form"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                />
              </div>

              <form action="/categories" method="get" className="flex items-center gap-2">
                <input type="hidden" name="tab" value={tab} />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by name, ID..."
                  className="w-[240px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  aria-label="Search categories"
                >
                  <Filter size={16} />
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="w-[40px] px-2 py-2">
                      <SelectAllCheckbox checkboxName="selected_category_ids" />
                    </th>
                    <th className="px-2 py-2 font-medium">Category Details</th>
                    <th className="px-2 py-2 font-medium">Slug</th>
                    <th className="px-2 py-2 font-medium">Product Count</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-6 text-center text-slate-500">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((category) => (
                      <tr key={category.id} className="border-b border-slate-100 hover:bg-black/5">
                        <td className="px-2 py-3">
                          <input
                            type="checkbox"
                            name="selected_category_ids"
                            value={String(category.id)}
                            form="bulk-categories-form"
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-11 w-11 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-semibold text-slate-800">{category.name}</div>
                              <div className="text-xs text-slate-500">
                                {category.description || `${category.name} category`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-slate-700">/{category.slug}</td>
                        <td className="px-2 py-3">
                          <span className="font-semibold">{productCountMap.get(category.id) ?? 0}</span> Products
                        </td>
                        <td className="px-2 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(category.status)}`}>
                            {statusLabel(category.status)}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <div className="inline-flex items-center gap-2 text-slate-500">
                            <Link href={makeHref({ edit: String(category.id), create: "" })} className="rounded p-1 hover:text-slate-900" title="Edit">
                              <Pencil size={16} />
                            </Link>
                            <form action={deleteCategoryAction}>
                              <input type="hidden" name="category_id" value={category.id} />
                              <ConfirmDeleteButton
                                className="rounded p-1 text-slate-500 hover:text-rose-600"
                                title="Delete"
                                message={`Delete category \"${category.name}\"?`}
                              >
                                <Trash2 size={16} />
                              </ConfirmDeleteButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <p>
                Showing {showingFrom} to {showingTo} of {totalEntries} categories
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={makeHref({ page: Math.max(currentPage - 1, 1), create: "", edit: "" })}
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
                      href={makeHref({ page: number, create: "", edit: "" })}
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
                  href={makeHref({ page: Math.min(currentPage + 1, totalPages), create: "", edit: "" })}
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