"use client";

import { useState } from "react";

type VariantRow = {
  id: number;
};

export function VariantsEditor() {
  const [rows, setRows] = useState<VariantRow[]>([]);

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Product Variants (optional)</h3>
          <p className="text-xs text-slate-500">Add one or more variants for this product.</p>
        </div>

        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          onClick={() => {
            const nextId = rows.length ? rows[rows.length - 1].id + 1 : 1;
            setRows((current) => [...current, { id: nextId }]);
          }}
        >
          + Add Variant
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500">
          No variants added yet.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900">Variant #{index + 1}</h4>
                <button
                  type="button"
                  className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700"
                  onClick={() => {
                    setRows((current) => current.filter((item) => item.id !== row.id));
                  }}
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="sm:col-span-2 xl:col-span-3">
                  <label className="mb-1 block text-sm font-medium">Variant Name *</label>
                  <input name="variant_name[]" placeholder="Small / 1kg / Blue" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Regular Price</label>
                  <input name="variant_regular_price[]" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Sale Price</label>
                  <input name="variant_sale_price[]" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Stock Quantity</label>
                  <input name="variant_stock_quantity[]" type="number" step="1" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Weight</label>
                  <input name="variant_weight[]" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Length</label>
                  <input name="variant_length[]" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Width</label>
                  <input name="variant_width[]" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Height</label>
                  <input name="variant_height[]" type="number" step="any" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Status</label>
                  <select name="variant_status[]" defaultValue="true">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2 xl:col-span-3">
                  <label className="mb-1 block text-sm font-medium">Variant Images (comma/newline URLs)</label>
                  <textarea name="variant_images[]" rows={2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}