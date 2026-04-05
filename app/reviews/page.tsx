import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";

export default async function ReviewsPage() {
  await requireAdminSession();

  return (
    <AdminShell activePath="/reviews" searchPlaceholder="Search reviews...">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">Customer Reviews</h2>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">All Reviews</span>
          <span className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Pending Moderation (3)</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Approved</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">Rejected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-2 py-2 font-medium">Customer & Product</th>
                <th className="px-2 py-2 font-medium">Rating</th>
                <th className="px-2 py-2 font-medium">Feedback</th>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3"><div className="font-medium">John Doe</div><div className="text-xs text-slate-500">Smartphone X</div></td>
                <td className="px-2 py-3 text-amber-500">★★★★☆</td>
                <td className="px-2 py-3 text-slate-600">Great phone, but battery life could be better under heavy usage.</td>
                <td className="px-2 py-3">Oct 20, 2023</td>
                <td className="px-2 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Static</span></td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-2 py-3"><div className="font-medium">Sarah White</div><div className="text-xs text-slate-500">Wireless Earbuds</div></td>
                <td className="px-2 py-3 text-amber-500">★★★★★</td>
                <td className="px-2 py-3 text-slate-600">Amazing sound quality and fit. Highly recommended.</td>
                <td className="px-2 py-3">Oct 19, 2023</td>
                <td className="px-2 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Static</span></td>
              </tr>
              <tr>
                <td className="px-2 py-3"><div className="font-medium">Mark Red</div><div className="text-xs text-slate-500">Cotton T-Shirt</div></td>
                <td className="px-2 py-3 text-amber-500">★☆☆☆☆</td>
                <td className="px-2 py-3 text-slate-600">Shrank after first wash, disappointed with quality.</td>
                <td className="px-2 py-3">Oct 15, 2023</td>
                <td className="px-2 py-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Static</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
