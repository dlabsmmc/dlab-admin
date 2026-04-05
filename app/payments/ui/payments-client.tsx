"use client";

import { CheckCircle2, CircleX, Clock3, CreditCard, Download, Filter, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type PaymentStatus = "success" | "pending" | "refund" | "failed";

type Payment = {
  id: string;
  method: string;
  customer: string;
  orderId: string;
  date: string;
  amount: number;
  status: PaymentStatus;
};

const seedPayments: Payment[] = [
  {
    id: "TXN-982347120",
    method: "Credit Card (**** 4242)",
    customer: "John Doe",
    orderId: "#ORD-00123",
    date: "Oct 24, 2023 10:30 AM",
    amount: 129,
    status: "success",
  },
  {
    id: "TXN-982347121",
    method: "PayPal",
    customer: "Jane Smith",
    orderId: "#ORD-00124",
    date: "Oct 24, 2023 11:16 AM",
    amount: 84.5,
    status: "success",
  },
  {
    id: "TXN-982347122",
    method: "Credit Card (**** 5555)",
    customer: "Robert Johnson",
    orderId: "#ORD-00125",
    date: "Oct 23, 2023 02:45 PM",
    amount: -249.99,
    status: "failed",
  },
  {
    id: "TXN-982347123",
    method: "UPI",
    customer: "Sarah White",
    orderId: "#ORD-00126",
    date: "Oct 23, 2023 03:02 PM",
    amount: 59.99,
    status: "pending",
  },
  {
    id: "TXN-982347124",
    method: "Credit Card (**** 9090)",
    customer: "Ankit Rai",
    orderId: "#ORD-00127",
    date: "Oct 22, 2023 09:12 AM",
    amount: -49,
    status: "refund",
  },
];

function statusPill(status: PaymentStatus) {
  if (status === "success") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "refund") return "bg-sky-100 text-sky-700";
  return "bg-rose-100 text-rose-700";
}

function statusLabel(status: PaymentStatus) {
  if (status === "success") return "Success";
  if (status === "pending") return "Pending";
  if (status === "refund") return "Refund";
  return "Failed";
}

export function PaymentsClient() {
  const [payments, setPayments] = useState<Payment[]>(seedPayments);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | PaymentStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  const filtered = useMemo(() => {
    return payments.filter((item) => {
      const matchesTab = tab === "all" ? true : item.status === tab;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [payments, search, tab]);

  const totalVolume = payments.reduce((sum, item) => sum + Math.max(item.amount, 0), 0);
  const successCount = payments.filter((item) => item.status === "success").length;
  const failedRefundCount = payments.filter((item) => item.status === "failed" || item.status === "refund").length;
  const pendingCount = payments.filter((item) => item.status === "pending").length;

  const applyBulk = () => {
    if (selected.length === 0) {
      window.alert("Select at least one transaction.");
      return;
    }

    if (bulkAction === "download") {
      window.alert(`Downloading ${selected.length} receipt(s).`);
      return;
    }

    if (bulkAction === "refund") {
      setPayments((current) =>
        current.map((item) =>
          selected.includes(item.id)
            ? {
                ...item,
                status: "refund",
                amount: -Math.abs(item.amount),
              }
            : item,
        ),
      );
      setSelected([]);
      window.alert("Selected transactions marked as refunded.");
      return;
    }

    window.alert("Choose a bulk action.");
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Transactions & Payments</h2>
        <button type="button" className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          <Download size={14} className="mr-2" />
          Download Statement
        </button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600"><CreditCard size={16} /></div>
            <div><p className="text-sm text-slate-500">Total Volume</p><p className="text-xl font-semibold">${totalVolume.toFixed(2)}</p></div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600"><CheckCircle2 size={16} /></div>
            <div><p className="text-sm text-slate-500">Successful</p><p className="text-xl font-semibold">{successCount}</p></div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-100 p-2 text-rose-600"><RotateCcw size={16} /></div>
            <div><p className="text-sm text-slate-500">Failed/Refunds</p><p className="text-xl font-semibold">{failedRefundCount}</p></div>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600"><Clock3 size={16} /></div>
            <div><p className="text-sm text-slate-500">Pending</p><p className="text-xl font-semibold">{pendingCount}</p></div>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {["all", "success", "pending", "refund", "failed"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item as "all" | PaymentStatus)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                tab === item ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item === "all" ? "All Transactions" : statusLabel(item as PaymentStatus)}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(event) => setBulkAction(event.target.value)}
              className="w-[180px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Bulk Actions</option>
              <option value="download">Download Receipts</option>
              <option value="refund">Refund Selected</option>
            </select>
            <button type="button" onClick={applyBulk} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
              Apply
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions..."
              className="w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" aria-label="Filter">
              <Filter size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2"><input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((item) => selected.includes(item.id))}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelected(filtered.map((item) => item.id));
                    } else {
                      setSelected([]);
                    }
                  }}
                  className="h-4 w-4"
                /></th>
                <th className="px-2 py-2 font-medium">Transaction ID</th>
                <th className="px-2 py-2 font-medium">Method</th>
                <th className="px-2 py-2 font-medium">Customer / Order</th>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-6 text-center text-slate-500">No transactions found.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-2 py-3"><input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelected((current) => [...current, item.id]);
                        } else {
                          setSelected((current) => current.filter((id) => id !== item.id));
                        }
                      }}
                      className="h-4 w-4"
                    /></td>
                    <td className="px-2 py-3"><span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs">{item.id}</span></td>
                    <td className="px-2 py-3">{item.method}</td>
                    <td className="px-2 py-3"><div className="font-medium">{item.customer}</div><div className="text-xs text-slate-500">{item.orderId}</div></td>
                    <td className="px-2 py-3 text-slate-500">{item.date}</td>
                    <td className={`px-2 py-3 font-semibold ${item.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{item.amount >= 0 ? "+" : ""}${Math.abs(item.amount).toFixed(2)}</td>
                    <td className="px-2 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusPill(item.status)}`}>
                        {item.status === "success" ? <CheckCircle2 size={12} className="mr-1" /> : item.status === "failed" ? <CircleX size={12} className="mr-1" /> : null}
                        {statusLabel(item.status)}
                      </span>
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
