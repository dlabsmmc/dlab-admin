import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";
import {
  bulkCouponsAction,
  createCouponAction,
  deleteCouponAction,
  updateCouponAction,
} from "./actions";

type CouponsPageProps = {
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

type CouponTab = "all" | "active" | "scheduled" | "expired" | "disabled";

type CouponRow = {
  id: number;
  code: string;
  title: string;
  description: string;
  discountPercentage: number;
  usageCount: number;
  usageLimit: number | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  status: Exclude<CouponTab, "all">;
};

const PAGE_SIZE = 10;

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return toNumber(value);
}

function toString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toIsoOrNull(value: unknown) {
  const raw = toString(value).trim();
  return raw.length ? raw : null;
}

function statusFromCoupon(coupon: {
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
}) {
  if (!coupon.isActive) return "disabled" as const;

  const now = Date.now();
  const startsAtMs = coupon.startsAt ? new Date(coupon.startsAt).valueOf() : null;
  const expiresAtMs = coupon.expiresAt ? new Date(coupon.expiresAt).valueOf() : null;

  if (startsAtMs !== null && Number.isFinite(startsAtMs) && startsAtMs > now) return "scheduled" as const;
  if (expiresAtMs !== null && Number.isFinite(expiresAtMs) && expiresAtMs < now) return "expired" as const;
  return "active" as const;
}

function statusPill(status: CouponRow["status"]) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "scheduled") return "bg-sky-100 text-sky-700";
  if (status === "expired") return "bg-rose-100 text-rose-700";
  return "bg-slate-200 text-slate-700";
}

function statusLabel(status: CouponRow["status"]) {
  if (status === "active") return "Active";
  if (status === "scheduled") return "Scheduled";
  if (status === "expired") return "Expired";
  return "Disabled";
}

function dateTimeInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function CouponsPage({ searchParams }: CouponsPageProps) {
  await requireAdminSession();

  const params = (await searchParams) ?? {};
  const q = toString(params.q).trim().toLowerCase();
  const tabRaw = toString(params.tab).toLowerCase();
  const tab: CouponTab = ["all", "active", "scheduled", "expired", "disabled"].includes(tabRaw)
    ? (tabRaw as CouponTab)
    : "all";
  const pageRaw = Number(params.page ?? "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.trunc(pageRaw) : 1;

  const couponsResult = await supabaseAdmin.from("coupons").select("*").order("id", { ascending: false });
  const rawCoupons = couponsResult.error ? [] : couponsResult.data ?? [];

  const coupons: CouponRow[] = rawCoupons.map((item) => {
    const row = item as Record<string, unknown>;
    const mapped = {
      id: toNumber(row.id),
      code: toString(row.code).toUpperCase(),
      title: toString(row.title),
      description: toString(row.description),
      discountPercentage: toNumber(row.discount_percentage),
      usageCount: toNumber(row.usage_count),
      usageLimit: toNullableNumber(row.usage_limit),
      isActive: Boolean(row.is_active),
      startsAt: toIsoOrNull(row.starts_at),
      expiresAt: toIsoOrNull(row.expires_at),
      status: "active" as Exclude<CouponTab, "all">,
    };

    return {
      ...mapped,
      status: statusFromCoupon(mapped),
    };
  });

  const activeCount = coupons.filter((item) => item.status === "active").length;
  const scheduledCount = coupons.filter((item) => item.status === "scheduled").length;
  const expiredCount = coupons.filter((item) => item.status === "expired").length;
  const disabledCount = coupons.filter((item) => item.status === "disabled").length;

  const filtered = coupons
    .filter((item) => (tab === "all" ? true : item.status === tab))
    .filter((item) => {
      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });

  const totalEntries = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(offset, offset + PAGE_SIZE);

  const showingFrom = totalEntries === 0 ? 0 : offset + 1;
  const showingTo = Math.min(offset + PAGE_SIZE, totalEntries);

  const editIdRaw = Number(toString(params.edit));
  const editId = Number.isFinite(editIdRaw) && editIdRaw > 0 ? Math.trunc(editIdRaw) : null;
  const editingCoupon = editId ? coupons.find((item) => item.id === editId) : null;
  const showCreateForm = params.create === "1";
  const usageLimitDefaultValue =
    editingCoupon?.usageLimit === null || editingCoupon?.usageLimit === undefined
      ? ""
      : String(editingCoupon.usageLimit);

  const makeHref = (next: Partial<{ tab: CouponTab; q: string; page: number; create: string; edit: string }>) => {
    const query = new URLSearchParams();
    query.set("tab", next.tab ?? tab);
    query.set("page", String(next.page ?? currentPage));

    const nextQ = next.q ?? q;
    if (nextQ.trim()) query.set("q", nextQ.trim());

    const nextCreate = next.create ?? (showCreateForm ? "1" : "");
    if (nextCreate) query.set("create", nextCreate);

    const nextEdit = next.edit ?? (editingCoupon ? String(editingCoupon.id) : "");
    if (nextEdit) query.set("edit", nextEdit);

    if (params.ok) query.set("ok", params.ok);
    if (params.err) query.set("err", params.err);

    return `/coupons?${query.toString()}`;
  };

  return (
    <AdminShell activePath="/coupons" searchPlaceholder="Search coupons...">
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
        <h2 className="text-2xl font-semibold text-slate-900">Coupons & Offers</h2>
        <Link href={makeHref({ create: "1", edit: "", page: 1 })} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          + Create New Coupon
        </Link>
      </div>

      {(showCreateForm || editingCoupon) && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">
            {editingCoupon ? `Edit Coupon #${editingCoupon.id}` : "Create Coupon"}
          </h3>

          <form action={editingCoupon ? updateCouponAction : createCouponAction} className="grid gap-3 sm:grid-cols-2">
            {editingCoupon ? <input type="hidden" name="coupon_id" value={editingCoupon.id} /> : null}

            <div>
              <label className="mb-1 block text-sm font-medium">Code *</label>
              <input name="code" required defaultValue={editingCoupon?.code ?? ""} placeholder="DLAB12" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Title *</label>
              <input name="title" required defaultValue={editingCoupon?.title ?? ""} placeholder="DLAB12" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <input name="description" defaultValue={editingCoupon?.description ?? ""} placeholder="12% off your first order!" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Discount % *</label>
              <input name="discount_percentage" type="number" min="0" max="100" step="1" required defaultValue={String(editingCoupon?.discountPercentage ?? 0)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Usage Limit</label>
              <input name="usage_limit" type="number" min="0" step="1" defaultValue={usageLimitDefaultValue} placeholder="500" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Starts At</label>
              <input name="starts_at" type="datetime-local" defaultValue={dateTimeInputValue(editingCoupon?.startsAt ?? null)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Expires At</label>
              <input name="expires_at" type="datetime-local" defaultValue={dateTimeInputValue(editingCoupon?.expiresAt ?? null)} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Active</label>
              <select name="is_active" defaultValue={editingCoupon ? (editingCoupon.isActive ? "true" : "false") : "true"}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {editingCoupon ? (
              <div>
                <label className="mb-1 block text-sm font-medium">Usage Count</label>
                <input value={String(editingCoupon.usageCount)} disabled readOnly />
              </div>
            ) : null}

            <div className="sm:col-span-2 flex items-center gap-2">
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                {editingCoupon ? "Update Coupon" : "Create Coupon"}
              </button>
              <Link href={makeHref({ create: "", edit: "" })} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                Cancel
              </Link>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <Link href={makeHref({ tab: "all", page: 1, create: "", edit: "" })} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>All Coupons</Link>
          <Link href={makeHref({ tab: "active", page: 1, create: "", edit: "" })} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "active" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Active ({activeCount})</Link>
          <Link href={makeHref({ tab: "scheduled", page: 1, create: "", edit: "" })} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "scheduled" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Scheduled ({scheduledCount})</Link>
          <Link href={makeHref({ tab: "expired", page: 1, create: "", edit: "" })} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "expired" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Expired ({expiredCount})</Link>
          <Link href={makeHref({ tab: "disabled", page: 1, create: "", edit: "" })} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "disabled" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Disabled ({disabledCount})</Link>
        </div>

        <form id="bulk-coupons-form" action={bulkCouponsAction} />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select name="bulk_action" form="bulk-coupons-form" className="w-[190px] rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Bulk Actions</option>
              <option value="delete">Delete Selected</option>
              <option value="disable">Disable Selected</option>
              <option value="activate">Activate Selected</option>
            </select>
            <button type="submit" form="bulk-coupons-form" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">Apply</button>
          </div>

          <form action="/coupons" method="get" className="flex items-center gap-2">
            <input type="hidden" name="tab" value={tab} />
            <input name="q" defaultValue={q} placeholder="Search by code/title..." className="w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">Search</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="w-[40px] px-2 py-2"><input type="checkbox" disabled className="h-4 w-4" /></th>
                <th className="px-2 py-2 font-medium">Code / Title</th>
                <th className="px-2 py-2 font-medium">Description</th>
                <th className="px-2 py-2 font-medium">Discount</th>
                <th className="px-2 py-2 font-medium">Usage</th>
                <th className="px-2 py-2 font-medium">Starts At</th>
                <th className="px-2 py-2 font-medium">Expires At</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-6 text-center text-slate-500">No coupons found.</td>
                </tr>
              ) : (
                pageRows.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-slate-100">
                    <td className="px-2 py-3">
                      <input type="checkbox" name="selected_coupon_ids" value={coupon.id} form="bulk-coupons-form" className="h-4 w-4" />
                    </td>
                    <td className="px-2 py-3">
                      <div className="font-semibold text-slate-800">{coupon.code}</div>
                      <div className="text-xs text-slate-500">{coupon.title || "-"}</div>
                    </td>
                    <td className="px-2 py-3 text-slate-700">{coupon.description || "-"}</td>
                    <td className="px-2 py-3">{coupon.discountPercentage}%</td>
                    <td className="px-2 py-3">{coupon.usageCount} / {coupon.usageLimit ?? "∞"}</td>
                    <td className="px-2 py-3">{formatDateTime(coupon.startsAt)}</td>
                    <td className="px-2 py-3">{formatDateTime(coupon.expiresAt)}</td>
                    <td className="px-2 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(coupon.status)}`}>{statusLabel(coupon.status)}</span></td>
                    <td className="px-2 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link href={makeHref({ edit: String(coupon.id), create: "" })} className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700">Edit</Link>
                        <form action={deleteCouponAction}>
                          <input type="hidden" name="coupon_id" value={coupon.id} />
                          <button type="submit" className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">Delete</button>
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
          <p>Showing {showingFrom} to {showingTo} of {totalEntries} coupons</p>
          <div className="flex items-center gap-2">
            <Link href={makeHref({ page: Math.max(currentPage - 1, 1), create: "", edit: "" })} className={`rounded-md border px-3 py-1.5 text-sm font-medium ${currentPage > 1 ? "border-slate-300 bg-white text-slate-700" : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"}`}>Prev</Link>
            {Array.from({ length: Math.min(3, totalPages) }).map((_, index) => {
              const number = index + 1;
              const active = number === currentPage;
              return (
                <Link key={number} href={makeHref({ page: number, create: "", edit: "" })} className={`rounded-md border px-3 py-1.5 text-sm font-medium ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
                  {number}
                </Link>
              );
            })}
            <Link href={makeHref({ page: Math.min(currentPage + 1, totalPages), create: "", edit: "" })} className={`rounded-md border px-3 py-1.5 text-sm font-medium ${currentPage < totalPages ? "border-slate-300 bg-white text-slate-700" : "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"}`}>Next</Link>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
