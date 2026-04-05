import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";
import { CouponsClient } from "./ui/coupons-client";

export default async function CouponsPage() {
  await requireAdminSession();

  return (
    <AdminShell activePath="/coupons" searchPlaceholder="Search coupons...">
      <CouponsClient />
    </AdminShell>
  );
}
