import { sendPushNotificationAction } from "@/app/actions/push-notifications";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";

type NotificationsPageProps = {
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  await requireAdminSession();
  const params = (await searchParams) ?? {};

  return (
    <AdminShell activePath="/notifications" searchPlaceholder="Search push notifications...">
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
        <h2 className="text-2xl font-semibold text-slate-900">Push Notifications</h2>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-semibold text-slate-900">Send Push Notification</h3>
        <p className="mt-1 text-xs text-slate-500">
          Uses the legacy FCM backend logic. Configure target type, content, and optional deep link.
        </p>

        <form action={sendPushNotificationAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Target Type *</label>
            <select name="target_type" defaultValue="all">
              <option value="all">All users</option>
              <option value="user">Single user (by user ID)</option>
              <option value="topic">Custom topic</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">User ID (for single user)</label>
            <input name="user_id" placeholder="Supabase user UUID" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Custom Topic (optional)</label>
            <input name="topic" placeholder="offers" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Order ID (optional)</label>
            <input name="order_id" placeholder="12345" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Title *</label>
            <input name="title" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Deep Link (optional)</label>
            <input name="deep_link" placeholder="/orders/12345" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Body *</label>
            <textarea name="body" rows={3} required />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Image URL (optional)</label>
            <input name="image_url" placeholder="https://your-cdn.com/banner.jpg" type="url" />
          </div>

          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Send Push Notification
            </button>
          </div>
        </form>
      </section>
    </AdminShell>
  );
}