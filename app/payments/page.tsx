import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "@/app/ui/admin-shell";
import { PaymentsClient } from "./ui/payments-client";

export default async function PaymentsPage() {
  await requireAdminSession();

  return (
    <AdminShell activePath="/payments" searchPlaceholder="Search transactions...">
      <PaymentsClient />
    </AdminShell>
  );
}
