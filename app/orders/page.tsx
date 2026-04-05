import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";

export default async function OrdersPage() {
  await requireAdminSession();

  return (
    <AdminShell activePath="/orders" searchPlaceholder="Search orders...">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Orders</h2>
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Static Screen</span>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Orders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">1,284</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">72</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Shipped</p>
          <p className="mt-2 text-2xl font-semibold text-sky-600">341</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Delivered</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">871</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">All Orders</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Pending</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Shipped</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Delivered</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Cancelled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2 font-medium">Order</th>
                <th className="px-2 py-2 font-medium">Customer</th>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Items</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3 font-medium">#ORD-1001</td>
                <td className="px-2 py-3">Aarav Patel</td>
                <td className="px-2 py-3">Apr 04, 2026</td>
                <td className="px-2 py-3">3</td>
                <td className="px-2 py-3">$149.00</td>
                <td className="px-2 py-3"><span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Pending</span></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3 font-medium">#ORD-1000</td>
                <td className="px-2 py-3">Neha Sharma</td>
                <td className="px-2 py-3">Apr 04, 2026</td>
                <td className="px-2 py-3">1</td>
                <td className="px-2 py-3">$39.00</td>
                <td className="px-2 py-3"><span className="rounded bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">Shipped</span></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3 font-medium">#ORD-0999</td>
                <td className="px-2 py-3">Rohan Gupta</td>
                <td className="px-2 py-3">Apr 03, 2026</td>
                <td className="px-2 py-3">2</td>
                <td className="px-2 py-3">$84.00</td>
                <td className="px-2 py-3"><span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Delivered</span></td>
              </tr>
              <tr>
                <td className="px-2 py-3 font-medium">#ORD-0998</td>
                <td className="px-2 py-3">Priya Mehta</td>
                <td className="px-2 py-3">Apr 03, 2026</td>
                <td className="px-2 py-3">4</td>
                <td className="px-2 py-3">$210.00</td>
                <td className="px-2 py-3"><span className="rounded bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">Cancelled</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
