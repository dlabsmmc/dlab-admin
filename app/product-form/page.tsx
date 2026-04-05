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
import { createProductWithVariantsAction } from "./actions";
import { VariantsEditor } from "./ui/variants-editor";

type ProductFormPageProps = {
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

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

export default async function ProductFormPage({ searchParams }: ProductFormPageProps) {
  await requireAdminSession();

  const params = (await searchParams) ?? {};
  const categoriesResponse = await supabaseAdmin
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });
  const categories = categoriesResponse.error ? [] : categoriesResponse.data ?? [];

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
            <h2 className="text-2xl font-semibold text-slate-900">Add New Product</h2>
            <Link href="/products" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Back to Products
            </Link>
          </div>

          <form action={createProductWithVariantsAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="sm:col-span-2 xl:col-span-3">
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <input name="name" required />
              </div>

              <div className="sm:col-span-2 xl:col-span-3">
                <label className="mb-1 block text-sm font-medium">Short Description</label>
                <textarea name="short_description" rows={2} />
              </div>

              <div className="sm:col-span-2 xl:col-span-3">
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea name="description" rows={4} />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Category *</label>
                <select name="category_id" required>
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Regular Price</label>
                <input name="regular_price" type="number" step="any" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Sale Price</label>
                <input name="sale_price" type="number" step="any" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Weight</label>
                <input name="weight" type="number" step="any" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Length</label>
                <input name="length" type="number" step="any" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Width</label>
                <input name="width" type="number" step="any" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Height</label>
                <input name="height" type="number" step="any" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select name="is_active" defaultValue="true">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Is Variable Product</label>
                <select name="is_variable" defaultValue="false">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="sm:col-span-2 xl:col-span-3">
                <label className="mb-1 block text-sm font-medium">Images (comma/newline URLs)</label>
                <textarea name="images" rows={3} />
              </div>
            </section>

            <VariantsEditor />

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Save Product
              </button>
              <Link href="/products" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                Cancel
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}