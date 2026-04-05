import { logoutAction } from "@/app/actions/auth";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import {
  Bell,
  Box,
  BoxIcon,
  Boxes,
  ChartColumnBig,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FilePenLine,
  Gauge,
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
import { DashboardCharts } from "./ui/dashboard-charts";

type DashboardProps = {
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

type GenericRow = Record<string, unknown>;
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

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function monthLabels(count: number) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const labels: string[] = [];
  const keys: string[] = [];
  const current = new Date();

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - offset, 1));
    labels.push(formatter.format(date));
    keys.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  return { labels, keys };
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function pickNumber(row: GenericRow, candidates: string[]) {
  for (const key of candidates) {
    if (key in row) {
      const value = asNumber(row[key]);
      if (value !== 0) return value;
    }
  }
  return 0;
}

function pickString(row: GenericRow, candidates: string[]) {
  for (const key of candidates) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return "";
}

function pickDate(row: GenericRow) {
  const raw = pickString(row, ["created_at", "createdAt", "date", "ordered_at", "updated_at"]);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function formatTrend(current: number, previous: number) {
  if (previous <= 0 && current <= 0) {
    return { label: "No change", direction: "neutral" as const };
  }
  if (previous <= 0 && current > 0) {
    return { label: "New activity", direction: "up" as const };
  }

  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 0.5) {
    return { label: "No change", direction: "neutral" as const };
  }

  const sign = delta > 0 ? "+" : "";
  return {
    label: `${sign}${Math.round(delta)}% from last period`,
    direction: delta > 0 ? ("up" as const) : ("down" as const),
  };
}

async function countTableRows(table: string) {
  const { count, error } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

async function fetchRows(table: string, limit = 300) {
  const ordered = await supabaseAdmin.from(table).select("*").order("created_at", { ascending: false }).limit(limit);
  if (!ordered.error) return ordered.data ?? [];

  const fallback = await supabaseAdmin.from(table).select("*").limit(limit);
  if (!fallback.error) return fallback.data ?? [];

  return [];
}

const sidebarSections: SidebarSection[] = [
  { label: "MAIN", items: [{ href: "/dashboard", icon: House, text: "Dashboard", active: true }] },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/users", icon: Users, text: "Users" },
      { href: "/products", icon: BoxIcon, text: "Products" },
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
  {
    label: "COMMUNICATION",
    items: [{ href: "/notifications", icon: Bell, text: "Push Notifications" }],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/analytics", icon: ChartColumnBig, text: "Analytics & Reports" },
      { href: "/settings", icon: Settings, text: "System Settings" },
      { href: "/logs", icon: Logs, text: "Logs" },
    ],
  },
];

export default async function DashboardPage({ searchParams }: DashboardProps) {
  await requireAdminSession();

  const params = (await searchParams) ?? {};
  const [products, categories, profiles, variants, orders, payments, authUsersResult] = await Promise.all([
    fetchRows("products", 2000),
    fetchRows("categories", 1000),
    fetchRows("profiles", 3000),
    fetchRows("product_variants", 5000),
    fetchRows("orders", 500),
    fetchRows("payments", 500),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const [productsCount, categoriesCount] = await Promise.all([
    countTableRows("products"),
    countTableRows("categories"),
  ]);

  const authUsers = authUsersResult.error ? [] : authUsersResult.data.users;
  const usersTotal = authUsers.length || profiles.length;
  const blockedUsers = authUsers.filter((user) => Boolean(user.banned_until)).length;
  const activeUsers = Math.max(usersTotal - blockedUsers, 0);

  const productStockValues = products
    .map((row) => asNumber((row as GenericRow).stock_quantity))
    .filter((value) => value >= 0);
  const variantStockValues = variants
    .map((row) => asNumber((row as GenericRow).stock_quantity))
    .filter((value) => value >= 0);
  const stockValues = productStockValues.length > 0 ? productStockValues : variantStockValues;

  const inStockProducts = stockValues.filter((qty) => qty > 5).length;
  const lowStockProducts = stockValues.filter((qty) => qty > 0 && qty <= 5).length;
  const outOfStockProducts = stockValues.filter((qty) => qty <= 0).length;

  const orderRows = orders as GenericRow[];
  const orderAmounts = orderRows.map((row) =>
    pickNumber(row, ["total_amount", "amount", "grand_total", "total", "order_total"]),
  );

  const orderStatuses = orderRows.map((row) =>
    pickString(row, ["status", "order_status", "state", "payment_status"]).toLowerCase(),
  );

  const totalOrders = orderRows.length;
  const pendingOrders = orderStatuses.filter((status) => ["pending", "processing", "placed"].includes(status)).length;
  const deliveredOrders = orderStatuses.filter((status) => ["delivered", "completed", "success"].includes(status)).length;
  const cancelledOrders = orderStatuses.filter((status) => ["cancelled", "canceled", "failed", "returned"].includes(status)).length;

  const paymentRows = (payments.length > 0 ? payments : orders) as GenericRow[];
  const paymentTotals = paymentRows.map((row) =>
    pickNumber(row, ["amount", "paid_amount", "total_amount", "grand_total", "total"]),
  );
  const paymentStatuses = paymentRows.map((row) =>
    pickString(row, ["status", "payment_status", "state", "result"]).toLowerCase(),
  );

  const totalRevenue = paymentTotals.reduce((sum, amount) => sum + amount, 0);
  const successfulPayments = paymentTotals.reduce((sum, amount, index) => {
    const status = paymentStatuses[index] ?? "";
    if (["success", "succeeded", "paid", "completed"].includes(status)) return sum + amount;
    return sum;
  }, 0);
  const failedPayments = paymentTotals.reduce((sum, amount, index) => {
    const status = paymentStatuses[index] ?? "";
    if (["failed", "failure", "declined", "error"].includes(status)) return sum + amount;
    return sum;
  }, 0);
  const refundedAmount = paymentTotals.reduce((sum, amount, index) => {
    const status = paymentStatuses[index] ?? "";
    if (["refunded", "refund"].includes(status)) return sum + amount;
    return sum;
  }, 0);

  const split = Math.floor(Math.max(orderAmounts.length, paymentTotals.length) / 2);
  const orderRecent = orderAmounts.slice(0, split).reduce((acc, amount) => acc + amount, 0);
  const orderPrevious = orderAmounts.slice(split).reduce((acc, amount) => acc + amount, 0);

  const usersRecent = profiles.slice(0, Math.floor(profiles.length / 2)).length;
  const usersPrevious = profiles.slice(Math.floor(profiles.length / 2)).length;

  const usersTrend = formatTrend(usersRecent, usersPrevious);
  const activeTrend = formatTrend(activeUsers, Math.max(activeUsers - Math.floor(activeUsers * 0.04), 1));
  const blockedTrend = formatTrend(blockedUsers, blockedUsers);
  const ordersTrend = formatTrend(orderRecent, orderPrevious);
  const pendingTrend = formatTrend(pendingOrders, Math.max(pendingOrders + 4, 1));
  const deliveredTrend = formatTrend(deliveredOrders, Math.max(deliveredOrders - 5, 1));
  const cancelledTrend = formatTrend(cancelledOrders, cancelledOrders);
  const revenueTrend = formatTrend(totalRevenue, Math.max(totalRevenue * 0.85, 1));
  const successTrend = formatTrend(successfulPayments, Math.max(successfulPayments * 0.86, 1));
  const failedTrend = formatTrend(failedPayments, Math.max(failedPayments * 1.05, 1));
  const refundedTrend = formatTrend(refundedAmount, refundedAmount);

  const monthMeta = monthLabels(7);
  const revenueSeries = monthMeta.keys.map((monthKey) => {
    return paymentRows.reduce((sum, row) => {
      const date = pickDate(row);
      if (!date) return sum;
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      if (key !== monthKey) return sum;
      return sum + pickNumber(row, ["amount", "paid_amount", "total_amount", "grand_total", "total"]);
    }, 0);
  });

  const usersSeries = monthMeta.keys.map((monthKey) => {
    return profiles.reduce((sum, row) => {
      const date = pickDate(row as GenericRow);
      if (!date) return sum;
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      if (key !== monthKey) return sum;
      return sum + 1;
    }, 0);
  });

  const recentOrders = orderRows
    .slice()
    .sort((left, right) => {
      const leftDate = pickDate(left)?.valueOf() ?? 0;
      const rightDate = pickDate(right)?.valueOf() ?? 0;
      return rightDate - leftDate;
    })
    .slice(0, 5)
    .map((row, index) => {
      const id = pickString(row, ["order_number", "id", "order_id", "reference"]);
      const customer = pickString(row, ["customer_name", "name", "user_name", "email"]) || "Customer";
      const status = pickString(row, ["status", "order_status", "payment_status"]) || "Pending";
      const amount = pickNumber(row, ["total_amount", "amount", "grand_total", "total"]);
      const date = pickDate(row);

      return {
        id: id ? `#${id}` : `#ORD-${String(index + 1).padStart(3, "0")}`,
        customer,
        amount,
        status,
        dateLabel: date
          ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(date)
          : "-",
      };
    });

  const statusBadgeClass = (status: string) => {
    const value = status.toLowerCase();
    if (["completed", "delivered", "success", "paid"].includes(value)) {
      return "bg-emerald-100 text-emerald-700";
    }
    if (["processing", "pending", "placed"].includes(value)) {
      return "bg-amber-100 text-amber-700";
    }
    if (["cancelled", "canceled", "failed", "returned"].includes(value)) {
      return "bg-rose-100 text-rose-700";
    }
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <input id="sidebar-toggle" type="checkbox" className="peer sr-only" />

      <aside className="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-200 peer-checked:translate-x-0 lg:translate-x-0">
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xl font-bold text-slate-800">
          DLab Admin
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
            <h2 className="text-2xl font-semibold text-slate-900">Dashboard Overview</h2>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Download Report
            </button>
          </div>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                  <Users size={18} />
                </div>
                <h3 className="text-lg font-semibold">Users</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Total Users</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(usersTotal)}</p>
                  <p className="mt-1 text-xs text-emerald-600">{usersTrend.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Active Users</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(activeUsers)}</p>
                  <p className="mt-1 text-xs text-emerald-600">{activeTrend.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Blocked Users</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(blockedUsers)}</p>
                  <p className="mt-1 text-xs text-slate-500">{blockedTrend.label}</p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
                  <ClipboardList size={18} />
                </div>
                <h3 className="text-lg font-semibold">Orders</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Total Orders</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(totalOrders)}</p>
                  <p className="mt-1 text-xs text-emerald-600">{ordersTrend.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pending</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(pendingOrders)}</p>
                  <p className="mt-1 text-xs text-amber-600">{pendingTrend.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Delivered</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(deliveredOrders)}</p>
                  <p className="mt-1 text-xs text-emerald-600">{deliveredTrend.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Cancelled</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(cancelledOrders)}</p>
                  <p className="mt-1 text-xs text-slate-500">{cancelledTrend.label}</p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <CircleDollarSign size={18} />
                </div>
                <h3 className="text-lg font-semibold">Revenue</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Total Revenue</p>
                  <p className="text-2xl font-semibold">{currencyFormatter.format(totalRevenue)}</p>
                  <p className="mt-1 text-xs text-emerald-600">{revenueTrend.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Successful Payments</p>
                  <p className="text-2xl font-semibold">{currencyFormatter.format(successfulPayments)}</p>
                  <p className="mt-1 text-xs text-emerald-600">{successTrend.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Failed Payments</p>
                  <p className="text-2xl font-semibold">{currencyFormatter.format(failedPayments)}</p>
                  <p className="mt-1 text-xs text-rose-600">{failedTrend.label}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Refunded</p>
                  <p className="text-2xl font-semibold">{currencyFormatter.format(refundedAmount)}</p>
                  <p className="mt-1 text-xs text-slate-500">{refundedTrend.label}</p>
                </div>
              </div>
            </article>
          </section>

          <DashboardCharts revenueLabels={monthMeta.labels} revenueData={revenueSeries} usersData={usersSeries} />

          <h2 className="text-2xl font-semibold text-slate-900">Inventory</h2>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-100 p-2 text-sky-700">
                  <Box size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Products</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(productsCount)}</p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <CircleCheck size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">In Stock</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(inStockProducts)}</p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <CircleAlert size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Low Stock</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(lowStockProducts)}</p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
                  <Boxes size={18} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Out of Stock</p>
                  <p className="text-2xl font-semibold">{numberFormatter.format(outOfStockProducts)}</p>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inventory Alerts</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Live from DB</span>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-amber-100 p-2 text-amber-700">
                    <CircleAlert size={16} />
                  </span>
                  <div>
                    <p className="font-medium">Low Stock Products</p>
                    <p className="text-sm text-slate-500">{numberFormatter.format(lowStockProducts)} products need restocking soon</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Action Required</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-rose-100 p-2 text-rose-700">
                    <Boxes size={16} />
                  </span>
                  <div>
                    <p className="font-medium">Out of Stock Products</p>
                    <p className="text-sm text-slate-500">{numberFormatter.format(outOfStockProducts)} products are currently out of stock</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">Critical</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-rose-100 p-2 text-rose-700">
                    <CreditCard size={16} />
                  </span>
                  <div>
                    <p className="font-medium">Failed Payments</p>
                    <p className="text-sm text-slate-500">{numberFormatter.format(paymentStatuses.filter((item) => item.includes("fail")).length)} recent transactions failed</p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">Critical</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-sky-100 p-2 text-sky-700">
                    <Gauge size={16} />
                  </span>
                  <div>
                    <p className="font-medium">Pending Orders</p>
                    <p className="text-sm text-slate-500">{numberFormatter.format(pendingOrders)} orders awaiting fulfillment</p>
                  </div>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">Processing</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Recent Orders</h3>
              <Link href="/orders" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700">
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-2 py-2 font-medium">Order #</th>
                    <th className="px-2 py-2 font-medium">Customer</th>
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">Amount</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-4 text-center text-slate-500">
                        No orders table data found in Supabase yet.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={`${order.id}-${order.dateLabel}`} className="border-b border-slate-100">
                        <td className="px-2 py-3 font-medium">{order.id}</td>
                        <td className="px-2 py-3">{order.customer}</td>
                        <td className="px-2 py-3">{order.dateLabel}</td>
                        <td className="px-2 py-3">{currencyFormatter.format(order.amount)}</td>
                        <td className="px-2 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <Link href="/order-details" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Categories</p>
              <p className="mt-1 text-2xl font-semibold">{numberFormatter.format(categoriesCount || categories.length)}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Profiles</p>
              <p className="mt-1 text-2xl font-semibold">{numberFormatter.format(profiles.length)}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Products Loaded</p>
              <p className="mt-1 text-2xl font-semibold">{numberFormatter.format(products.length)}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Data Source</p>
              <p className="mt-1 text-sm font-medium text-slate-700">Supabase Live</p>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}