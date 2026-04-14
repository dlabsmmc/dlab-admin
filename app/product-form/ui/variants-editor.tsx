"use client";

import { useState } from "react";

type VariantRow = {
  id: number;
  variantId: number | null;
  name: string;
  regularPrice: string;
  salePrice: string;
  stockQuantity: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  status: "true" | "false";
  images: string;
};

type InitialVariant = {
  id: number;
  variant_name: string;
  regular_price: number | null;
  sale_price: number | null;
  stock: number | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  is_active: boolean;
  images: string[];
};

type VariantsEditorProps = {
  initialVariants?: InitialVariant[];
};

function numberToInput(value: number | null) {
  return value === null ? "" : String(value);
}

export function VariantsEditor({ initialVariants = [] }: VariantsEditorProps) {
  const [rows, setRows] = useState<VariantRow[]>(
    initialVariants.map((item, index) => ({
      id: index + 1,
      variantId: item.id,
      name: item.variant_name,
      regularPrice: numberToInput(item.regular_price),
      salePrice: numberToInput(item.sale_price),
      stockQuantity: numberToInput(item.stock),
      weight: numberToInput(item.weight),
      length: numberToInput(item.length),
      width: numberToInput(item.width),
      height: numberToInput(item.height),
      status: item.is_active ? "true" : "false",
      images: item.images.join("\n"),
    })),
  );

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
            setRows((current) => [
              ...current,
              {
                id: nextId,
                variantId: null,
                name: "",
                regularPrice: "",
                salePrice: "",
                stockQuantity: "",
                weight: "",
                length: "",
                width: "",
                height: "",
                status: "true",
                images: "",
              },
            ]);
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
              <input name="variant_id[]" value={row.variantId === null ? "" : String(row.variantId)} readOnly hidden />
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
                  <input name="variant_name[]" placeholder="Small / 1kg / Blue" defaultValue={row.name} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Regular Price</label>
                  <input name="variant_regular_price[]" type="number" step="any" defaultValue={row.regularPrice} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Sale Price</label>
                  <input name="variant_sale_price[]" type="number" step="any" defaultValue={row.salePrice} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Stock</label>
                  <input name="variant_stock[]" type="number" step="1" defaultValue={row.stockQuantity} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Weight</label>
                  <input name="variant_weight[]" type="number" step="any" defaultValue={row.weight} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Length</label>
                  <input name="variant_length[]" type="number" step="any" defaultValue={row.length} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Width</label>
                  <input name="variant_width[]" type="number" step="any" defaultValue={row.width} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Height</label>
                  <input name="variant_height[]" type="number" step="any" defaultValue={row.height} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Status</label>
                  <select name="variant_status[]" defaultValue={row.status}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="sm:col-span-2 xl:col-span-3">
                  <label className="mb-1 block text-sm font-medium">Variant Images (comma/newline URLs)</label>
                  <textarea name="variant_images[]" rows={2} defaultValue={row.images} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}