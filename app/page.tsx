import { loginAction } from "@/app/actions/auth";
import { hasValidAdminSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

type HomeProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  if (await hasValidAdminSession()) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const error = params.error;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">DLab Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in with admin credentials to manage products, categories, and users.</p>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input id="email" name="email" type="email" defaultValue="admin@dlab.com" required />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input id="password" name="password" type="password" defaultValue="MMCAdmin@Dlab" required />
          </div>

          <button type="submit" className="w-full">
            Sign In
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Need config values? see <Link className="font-medium text-slate-700 underline" href="https://supabase.com/dashboard/project/zzqeibxwasikdmdoijfb/settings/api" target="_blank">Supabase API Settings</Link>.
        </p>
      </section>
    </main>
  );
}
