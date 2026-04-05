"use client";

import { Filter } from "lucide-react";
import { useMemo, useState } from "react";

type CouponStatus = "active" | "scheduled" | "expired" | "disabled";

type Coupon = {
  code: string;
  discountType: string;
  usage: number;
  limit: number | null;
  validUntil: string;
  status: CouponStatus;
};

const seedCoupons: Coupon[] = [
  { code: "WELCOME10", discountType: "10% Off (Cart)", usage: 145, limit: 500, validUntil: "Dec 31, 2026", status: "active" },
  { code: "FREESHIP", discountType: "Free Shipping", usage: 1024, limit: null, validUntil: "No Expiry", status: "active" },
  { code: "SUMMER50", discountType: "$50 Fixed Off", usage: 200, limit: 200, validUntil: "Aug 31, 2025", status: "expired" },
  { code: "FESTIVE20", discountType: "20% Off", usage: 0, limit: 600, validUntil: "Nov 10, 2026", status: "scheduled" },
];

function statusPill(status: CouponStatus) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "scheduled") return "bg-sky-100 text-sky-700";
  if (status === "expired") return "bg-rose-100 text-rose-700";
  return "bg-slate-200 text-slate-700";
}

function statusLabel(status: CouponStatus) {
  if (status === "active") return "Active";
  if (status === "scheduled") return "Scheduled";
  if (status === "expired") return "Expired";
  return "Disabled";
}

export function CouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>(seedCoupons);
  const [tab, setTab] = useState<"all" | CouponStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [bulkAction, setBulkAction] = useState("");

  const filtered = useMemo(() => {
    return coupons.filter((item) => {
      const matchesTab = tab === "all" ? true : item.status === tab;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || item.code.toLowerCase().includes(q) || item.discountType.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [coupons, tab, search]);

  const activeCount = coupons.filter((item) => item.status === "active").length;

  const applyBulk = () => {
    if (selected.length === 0) {
      window.alert("Select at least one coupon.");
      return;
    }

    if (bulkAction === "delete") {
      setCoupons((current) => current.filter((item) => !selected.includes(item.code)));
      setSelected([]);
      return;
    }

    if (bulkAction === "disable") {
      setCoupons((current) =>
        current.map((item) => (selected.includes(item.code) ? { ...item, status: "disabled" } : item)),
      );
      setSelected([]);
      return;
    }

    if (bulkAction === "activate") {
      setCoupons((current) =>
        current.map((item) => (selected.includes(item.code) ? { ...item, status: "active" } : item)),
      );
      setSelected([]);
      return;
    }

    window.alert("Choose a bulk action.");
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Coupons & Offers</h2>
        <button
          type="button"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            const code = window.prompt("Coupon code (e.g. NEW20)");
            if (!code) return;
            setCoupons((current) => [
              {
                code: code.toUpperCase(),
                discountType: "10% Off",
                usage: 0,
                limit: 100,
                validUntil: "No Expiry",
                status: "active",
              },
              ...current,
            ]);
          }}
        >
          + Create New Coupon
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button type="button" onClick={() => setTab("all")} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>All Coupons</button>
          <button type="button" onClick={() => setTab("active")} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "active" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Active ({activeCount})</button>
          <button type="button" onClick={() => setTab("scheduled")} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "scheduled" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Scheduled</button>
          <button type="button" onClick={() => setTab("expired")} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "expired" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Expired</button>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} className="w-[190px] rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Bulk Actions</option>
              <option value="delete">Delete Selected</option>
              <option value="disable">Disable Selected</option>
              <option value="activate">Activate Selected</option>
            </select>
            <button type="button" onClick={applyBulk} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">Apply</button>
          </div>

          <div className="flex items-center gap-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by coupon code..." className="w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" aria-label="Filter">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2"><input type="checkbox" checked={filtered.length > 0 && filtered.every((item) => selected.includes(item.code))} onChange={(event) => setSelected(event.target.checked ? filtered.map((item) => item.code) : [])} className="h-4 w-4" /></th>
                <th className="px-2 py-2 font-medium">Code</th>
                <th className="px-2 py-2 font-medium">Discount Type</th>
                <th className="px-2 py-2 font-medium">Usage / Limit</th>
                <th className="px-2 py-2 font-medium">Valid Until</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-2 py-6 text-center text-slate-500">No coupons found.</td></tr>
              ) : (
                filtered.map((coupon) => {
                  const limitText = coupon.limit === null ? "∞" : coupon.limit;
                  const usageWidth = coupon.limit === null ? 25 : Math.min(100, Math.round((coupon.usage / Math.max(coupon.limit, 1)) * 100));

                  return (
                    <tr key={coupon.code} className="border-b border-slate-100">
                      <td className="px-2 py-3"><input type="checkbox" checked={selected.includes(coupon.code)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, coupon.code] : current.filter((item) => item !== coupon.code))} className="h-4 w-4" /></td>
                      <td className="px-2 py-3"><span className="rounded border border-dashed border-slate-300 bg-slate-50 px-2 py-1 font-semibold text-slate-800">{coupon.code}</span></td>
                      <td className="px-2 py-3">{coupon.discountType}</td>
                      <td className="px-2 py-3"><div className="mb-1 text-xs text-slate-500">{coupon.usage} / {limitText}</div><div className="h-1.5 w-full rounded bg-slate-200"><div className="h-1.5 rounded bg-sky-500" style={{ width: `${usageWidth}%` }} /></div></td>
                      <td className="px-2 py-3">{coupon.validUntil}</td>
                      <td className="px-2 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(coupon.status)}`}>{statusLabel(coupon.status)}</span></td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <button type="button" className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700" onClick={() => {
                            const updatedType = window.prompt("Update discount type", coupon.discountType);
                            if (!updatedType) return;
                            setCoupons((current) => current.map((item) => item.code === coupon.code ? { ...item, discountType: updatedType } : item));
                          }}>Edit</button>
                          {coupon.status === "active" ? (
                            <button type="button" className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700" onClick={() => setCoupons((current) => current.map((item) => item.code === coupon.code ? { ...item, status: "disabled" } : item))}>Disable</button>
                          ) : (
                            <button type="button" className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" onClick={() => setCoupons((current) => current.map((item) => item.code === coupon.code ? { ...item, status: "active" } : item))}>Activate</button>
                          )}
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
    </>
  );
}
