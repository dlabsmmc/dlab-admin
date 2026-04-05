import { logoutAction } from "@/app/actions/auth";
import {
  addProductAction,
  createCategoryAction,
  deleteProductAction,
  deleteUserAction,
  sendNotificationAction,
} from "@/app/dashboard/actions";
import { requireAdminSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Image from "next/image";
import Link from "next/link";

type DashboardProps = {
  searchParams?: Promise<{ ok?: string; err?: string; page?: string }>;
};

type AuthUserMap = Record<string, { email?: string; created_at?: string }>;

const PRODUCTS_PAGE_SIZE = 30;

export default async function Dashboard({ searchParams }: DashboardProps) {
  await requireAdminSession();

  const params = (await searchParams) ?? {};
  const currentPageRaw = Number(params.page ?? "1");
  const currentPage = Number.isFinite(currentPageRaw) && currentPageRaw > 0 ? Math.trunc(currentPageRaw) : 1;
  const rangeFrom = (currentPage - 1) * PRODUCTS_PAGE_SIZE;
  const rangeTo = rangeFrom + PRODUCTS_PAGE_SIZE - 1;

  const [productsResult, { data: categories }, { data: profiles }, authUsersResult] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id,name,category_id,regular_price,sale_price,is_active,updated_at", {
          count: "exact",
        })
        .order("id", { ascending: false })
        .range(rangeFrom, rangeTo),
      supabaseAdmin.from("categories").select("id,name,slug").order("name", { ascending: true }),
      supabaseAdmin
        .from("profiles")
        .select(
          "id,display_name,phone,birthday,gender,avatar_url,receives_offers,created_at,updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

  const products = productsResult.data ?? [];
  const totalProducts = productsResult.count ?? 0;
  const totalProductPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PAGE_SIZE));
  const hasPrevProductsPage = currentPage > 1;
  const hasNextProductsPage = currentPage < totalProductPages;

  const makeProductsPageHref = (page: number) => {
    const query = new URLSearchParams();
    query.set("page", String(page));
    if (params.ok) query.set("ok", params.ok);
    if (params.err) query.set("err", params.err);
    return `/dashboard?${query.toString()}`;
  };

  const authUsers: AuthUserMap = {};
  if (!authUsersResult.error) {
    for (const user of authUsersResult.data.users) {
      authUsers[user.id] = {
        email: user.email,
        created_at: user.created_at,
      };
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Image
            src="/logo.png"
            alt="DLab Admin"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
          <p className="mt-2 text-sm text-slate-600">Manage products, categories, and user profiles.</p>
        </div>
        <form action={logoutAction}>
          <button type="submit">Logout</button>
        </form>
      </header>

      {params.ok ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {params.ok}
        </p>
      ) : null}
      {params.err ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {params.err}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Products</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalProducts}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Categories</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{categories?.length ?? 0}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Users (Profiles)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{profiles?.length ?? 0}</p>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Send Push Notification</h2>
          <p className="mt-1 text-xs text-slate-500">
            Send broadcast offers to all users or order updates to a specific user ID.
          </p>

          <form action={sendNotificationAction} className="mt-4 grid gap-3 sm:grid-cols-2">
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
              <input
                name="image_url"
                placeholder="https://your-cdn.com/offer-banner.jpg"
                type="url"
              />
            </div>

            <div className="sm:col-span-2">
              <button type="submit" className="w-full sm:w-auto">
                Send Notification
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Add Product</h2>
          <p className="mt-1 text-xs text-slate-500">
            Based on your `products` schema: name, descriptions, pricing, dimensions, category, images, and status.
          </p>

          <form action={addProductAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Name *</label>
              <input name="name" required />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Short Description</label>
              <textarea name="short_description" rows={2} />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea name="description" rows={3} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Weight</label>
              <input name="weight" type="number" step="any" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Length</label>
              <input name="length" type="number" step="any" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Width</label>
              <input name="width" type="number" step="any" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Height</label>
              <input name="height" type="number" step="any" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Category ID</label>
              <input name="category_id" type="number" step="1" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Regular Price</label>
              <input name="regular_price" type="number" step="any" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sale Price</label>
              <input name="sale_price" type="number" step="any" />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                Images (comma or new line separated URLs)
              </label>
              <textarea name="images" rows={3} />
            </div>

            <div className="sm:col-span-2 mt-2 rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Optional Product Variant</p>
              <p className="mb-3 text-xs text-slate-500">
                If `variant_name` is filled, one row is added to `product_variants` after product creation.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">Variant Name</label>
                  <input name="variant_name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Variant Regular Price</label>
                  <input name="variant_regular_price" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Variant Sale Price</label>
                  <input name="variant_sale_price" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Variant Weight</label>
                  <input name="variant_weight" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Variant Length</label>
                  <input name="variant_length" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Variant Width</label>
                  <input name="variant_width" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Variant Height</label>
                  <input name="variant_height" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Variant Stock Quantity</label>
                  <input name="variant_stock_quantity" type="number" step="1" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Variant Images (comma or new line separated URLs)
                  </label>
                  <textarea name="variant_images" rows={2} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input name="variant_is_active" type="checkbox" className="h-4 w-4" defaultChecked />
                  Variant Is Active
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input name="is_variable" type="checkbox" className="h-4 w-4" />
              Is Variable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="is_active" type="checkbox" className="h-4 w-4" defaultChecked />
              Is Active
            </label>

            <div className="sm:col-span-2">
              <button type="submit" className="w-full sm:w-auto">
                Add Product
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Create Category</h2>
          <form action={createCategoryAction} className="mt-4 grid gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Category Name *</label>
              <input name="name" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Slug *</label>
              <input name="slug" required />
            </div>
            <div>
              <button type="submit" className="w-full sm:w-auto">
                Create Category
              </button>
            </div>
          </form>

          <h3 className="mt-8 text-base font-semibold text-slate-900">Delete Product</h3>
          <form action={deleteProductAction} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Product ID</label>
              <input name="product_id" type="number" required />
            </div>
            <button type="submit" className="bg-red-700 hover:bg-red-800">
              Delete Product
            </button>
          </form>

          <div className="mt-8 overflow-x-auto">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Categories</h3>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Slug</th>
                </tr>
              </thead>
              <tbody>
                {(categories ?? []).map((category) => (
                  <tr key={category.id} className="border-b border-slate-100">
                    <td className="px-3 py-2">{category.id}</td>
                    <td className="px-3 py-2">{category.name}</td>
                    <td className="px-3 py-2">{category.slug}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Products</h2>
            <p className="text-xs text-slate-600">
              Page {currentPage} of {totalProductPages}
            </p>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Regular</th>
                <th className="px-3 py-2">Sale</th>
                <th className="px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((product) => (
                <tr key={product.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{product.id}</td>
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2">{product.category_id ?? "-"}</td>
                  <td className="px-3 py-2">{product.regular_price ?? "-"}</td>
                  <td className="px-3 py-2">{product.sale_price ?? "-"}</td>
                  <td className="px-3 py-2">{product.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between gap-3">
            {hasPrevProductsPage ? (
              <Link
                href={makeProductsPageHref(currentPage - 1)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                Previous Page
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-400">
                Previous Page
              </span>
            )}

            {hasNextProductsPage ? (
              <Link
                href={makeProductsPageHref(currentPage + 1)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              >
                Next Page
              </Link>
            ) : (
              <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-400">
                Next Page
              </span>
            )}
          </div>
        </article>

        <article className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">User Details</h2>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2">User ID</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {(profiles ?? []).map((profile) => (
                <tr key={profile.id} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-2 text-xs">{profile.id}</td>
                  <td className="px-3 py-2">{authUsers[profile.id]?.email ?? "-"}</td>
                  <td className="px-3 py-2">{profile.display_name ?? "-"}</td>
                  <td className="px-3 py-2">{profile.phone ?? "-"}</td>
                  <td className="px-3 py-2">
                    <form action={deleteUserAction}>
                      <input type="hidden" name="user_id" value={profile.id} />
                      <button type="submit" className="bg-red-700 hover:bg-red-800">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}