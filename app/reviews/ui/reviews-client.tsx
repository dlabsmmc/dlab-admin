"use client";

import { Filter } from "lucide-react";
import { useMemo, useState } from "react";

type ReviewStatus = "pending" | "approved" | "rejected";

type Review = {
  id: string;
  customer: string;
  product: string;
  rating: number;
  feedback: string;
  date: string;
  status: ReviewStatus;
};

const seedReviews: Review[] = [
  {
    id: "rvw-1",
    customer: "John Doe",
    product: "Smartphone X",
    rating: 4,
    feedback: "Great phone, but the battery life could be a little better under heavy usage.",
    date: "Oct 20, 2023",
    status: "pending",
  },
  {
    id: "rvw-2",
    customer: "Sarah White",
    product: "Wireless Earbuds",
    rating: 5,
    feedback: "Amazing sound quality and they fit perfectly. Highly recommend.",
    date: "Oct 19, 2023",
    status: "pending",
  },
  {
    id: "rvw-3",
    customer: "Mark Red",
    product: "Cotton T-Shirt",
    rating: 1,
    feedback: "Shrank after first wash, very disappointed with the quality.",
    date: "Oct 15, 2023",
    status: "pending",
  },
  {
    id: "rvw-4",
    customer: "Jane Smith",
    product: "Laptop Pro 15",
    rating: 5,
    feedback: "Excellent device and fast shipping.",
    date: "Oct 11, 2023",
    status: "approved",
  },
];

function stars(value: number) {
  return "★".repeat(value) + "☆".repeat(Math.max(5 - value, 0));
}

function statusPill(status: ReviewStatus) {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function statusLabel(status: ReviewStatus) {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Pending";
  return "Rejected";
}

export function ReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [tab, setTab] = useState<"all" | ReviewStatus>("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return reviews.filter((item) => {
      const matchesTab = tab === "all" ? true : item.status === tab;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.customer.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q) ||
        item.feedback.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [reviews, tab, search]);

  const pendingCount = reviews.filter((item) => item.status === "pending").length;

  const applyBulk = () => {
    if (selected.length === 0) {
      window.alert("Select at least one review.");
      return;
    }

    if (bulkAction === "approve") {
      setReviews((current) =>
        current.map((item) => (selected.includes(item.id) ? { ...item, status: "approved" } : item)),
      );
      setSelected([]);
      return;
    }

    if (bulkAction === "delete") {
      setReviews((current) => current.filter((item) => !selected.includes(item.id)));
      setSelected([]);
      return;
    }

    window.alert("Choose a bulk action.");
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Customer Reviews</h2>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button type="button" onClick={() => setTab("all")} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>All Reviews</button>
          <button type="button" onClick={() => setTab("pending")} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "pending" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Pending Moderation ({pendingCount})</button>
          <button type="button" onClick={() => setTab("approved")} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "approved" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Approved</button>
          <button type="button" onClick={() => setTab("rejected")} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === "rejected" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Rejected</button>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} className="w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Bulk Actions</option>
              <option value="approve">Approve Selected</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button type="button" onClick={applyBulk} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">Apply</button>
          </div>

          <div className="flex items-center gap-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by customer or product..." className="w-[280px] rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" aria-label="Filter"><Filter size={16} /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2"><input type="checkbox" checked={filtered.length > 0 && filtered.every((item) => selected.includes(item.id))} onChange={(event) => setSelected(event.target.checked ? filtered.map((item) => item.id) : [])} className="h-4 w-4" /></th>
                <th className="px-2 py-2 font-medium">Customer & Product</th>
                <th className="px-2 py-2 font-medium">Rating</th>
                <th className="px-2 py-2 font-medium">Feedback</th>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-2 py-6 text-center text-slate-500">No reviews found.</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-2 py-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} className="h-4 w-4" /></td>
                    <td className="px-2 py-3"><div className="font-medium">{item.customer}</div><div className="text-xs text-slate-500">{item.product}</div></td>
                    <td className="px-2 py-3 text-amber-500">{stars(item.rating)}</td>
                    <td className="px-2 py-3 text-slate-600">{item.feedback}</td>
                    <td className="px-2 py-3">{item.date}</td>
                    <td className="px-2 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(item.status)}`}>{statusLabel(item.status)}</span></td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" onClick={() => setReviews((current) => current.map((row) => row.id === item.id ? { ...row, status: "approved" } : row))}>Approve</button>
                        <button type="button" className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700" onClick={() => setReviews((current) => current.map((row) => row.id === item.id ? { ...row, status: "rejected" } : row))}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
