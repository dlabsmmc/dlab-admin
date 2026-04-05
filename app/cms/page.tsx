import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";

export default async function CmsPage() {
  await requireAdminSession();

  return (
    <AdminShell activePath="/cms" searchPlaceholder="Search content...">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">CMS / Content</h2>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Static Content Module</h3>
        <p className="mt-2 text-sm text-slate-600">
          This page is currently static. Dynamic CMS features can be connected when database tables are ready.
        </p>
      </section>
    </AdminShell>
  );
}