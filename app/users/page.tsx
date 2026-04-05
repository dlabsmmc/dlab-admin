import { logoutAction } from "@/app/actions/auth";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import {
  Bell,
  BoxIcon,
  ChartColumnBig,
  ChevronDown,
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
  CreditCard,
} from "lucide-react";
import type { ComponentType } from "react";
import { bulkUsersAction } from "./actions";
import { SelectAllCheckbox } from "./ui/select-all-checkbox";

type UsersPageProps = {
  searchParams?: Promise<{
    tab?: string;
    q?: string;
    page?: string;
    ok?: string;
    err?: string;
  }>;
};

type FilterTab = "all" | "active" | "pending" | "blocked";
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

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  registrationDate: Date | null;
  status: FilterTab;
  initials: string;
};

const PAGE_SIZE = 20;

function toInitials(name: string, email: string) {
  const base = name.trim() || email.trim() || "User";
  const chunks = base.split(/\s+/).filter(Boolean);
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();
  return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
}

function statusBadgeClasses(status: FilterTab) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "blocked") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function statusLabel(status: FilterTab) {
  if (status === "active") return "Active";
  if (status === "pending") return "Pending";
  if (status === "blocked") return "Blocked";
  return "All";
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(value);
}

const sidebarSections: SidebarSection[] = [
  { label: "MAIN", items: [{ href: "/dashboard", icon: House, text: "Dashboard" }] },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/users", icon: Users, text: "Users", active: true },
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

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requireAdminSession();

  const params = (await searchParams) ?? {};
  const tabRaw = String(params.tab ?? "all").toLowerCase();
  const tab: FilterTab = ["all", "active", "pending", "blocked"].includes(tabRaw)
    ? (tabRaw as FilterTab)
    : "all";
  const searchQuery = String(params.q ?? "").trim().toLowerCase();
  const pageRaw = Number(params.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1;

  const [profilesResponse, authUsersResponse] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }).limit(5000),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const profiles = profilesResponse.error ? [] : profilesResponse.data ?? [];
  const authUsers = authUsersResponse.error ? [] : authUsersResponse.data.users;

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  const users: UserRecord[] = authUsers.map((authUser) => {
    const profile = profileMap.get(authUser.id);
    const name = String(
      profile?.display_name ?? authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? "",
    ).trim();
    const email = String(authUser.email ?? "-").trim();
    const role = String(authUser.app_metadata?.role ?? profile?.role ?? "Customer").trim();
    const registrationDate = parseDate(authUser.created_at ?? null);
    const explicitStatus = String(authUser.user_metadata?.admin_status ?? "").toLowerCase();

    let status: FilterTab = "active";
    if (explicitStatus === "blocked") {
      status = "blocked";
    } else if (!authUser.email_confirmed_at) {
      status = "pending";
    }

    return {
      id: authUser.id,
      name: name.length ? name : "Unnamed User",
      email,
      role,
      registrationDate,
      status,
      initials: toInitials(name, email),
    };
  });

  const filteredUsers = users
    .filter((user) => (tab === "all" ? true : user.status === tab))
    .filter((user) => {
      if (!searchQuery) return true;
      return (
        user.name.toLowerCase().includes(searchQuery) ||
        user.email.toLowerCase().includes(searchQuery) ||
        user.role.toLowerCase().includes(searchQuery)
      );
    });

  const totalEntries = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = totalEntries === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, totalEntries);

  const makeHref = (next: Partial<{ tab: FilterTab; q: string; page: number }>) => {
    const query = new URLSearchParams();
    query.set("tab", next.tab ?? tab);
    if ((next.q ?? searchQuery).trim()) query.set("q", (next.q ?? searchQuery).trim());
    query.set("page", String(next.page ?? currentPage));
    if (params.ok) query.set("ok", params.ok);
    if (params.err) query.set("err", params.err);
    return `/users?${query.toString()}`;
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
            <h2 className="text-2xl font-semibold text-slate-900">Users Management</h2>
            <button type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              + Add New User
            </button>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {(["all", "active", "pending", "blocked"] as FilterTab[]).map((item) => (
                <Link
                  key={item}
                  href={makeHref({ tab: item, page: 1 })}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    tab === item ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {item === "all" ? "All Users" : statusLabel(item)}
                </Link>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  name="bulk_action"
                  form="bulk-users-form"
                  className="w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                    <option value="">Bulk Actions</option>
                    <option value="delete">Delete Selected</option>
                    <option value="block">Block Selected</option>
                </select>
                <button
                  type="submit"
                  form="bulk-users-form"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Apply
                </button>
              </div>

              <form action="/users" method="get" className="flex items-center gap-2">
                <input type="hidden" name="tab" value={tab} />
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search by name, email, or role..."
                  className="w-[280px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                  aria-label="Search"
                >
                  <Filter size={16} />
                </button>
              </form>
            </div>

            <form action={bulkUsersAction} id="bulk-users-form">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-2 py-2">
                        <SelectAllCheckbox checkboxName="selected_user_ids" />
                      </th>
                      <th className="px-2 py-2 font-medium">Name</th>
                      <th className="px-2 py-2 font-medium">Email</th>
                      <th className="px-2 py-2 font-medium">Role</th>
                      <th className="px-2 py-2 font-medium">Reg. Date</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-6 text-center text-slate-500">
                          No users found for this filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100">
                          <td className="px-2 py-3">
                            <input type="checkbox" name="selected_user_ids" value={user.id} className="h-4 w-4" />
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-2">
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                {user.initials}
                              </div>
                              {user.name}
                            </div>
                          </td>
                          <td className="px-2 py-3">{user.email}</td>
                          <td className="px-2 py-3">{user.role}</td>
                          <td className="px-2 py-3">{formatDate(user.registrationDate)}</td>
                          <td className="px-2 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(user.status)}`}>
                              {statusLabel(user.status)}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                href="/user-details"
                                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                              >
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
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