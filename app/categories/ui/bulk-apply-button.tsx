"use client";

import type { MouseEvent } from "react";

type BulkApplyButtonProps = {
  formId: string;
  className?: string;
};

export function BulkApplyButton({ formId, className }: BulkApplyButtonProps) {
  return (
    <button
      type="submit"
      form={formId}
      className={className}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        const actionSelect = document.querySelector<HTMLSelectElement>(
          `select[name="bulk_action"][form="${formId}"]`,
        );
        const action = actionSelect?.value ?? "";

        if (action === "delete") {
          const confirmed = window.confirm(
            "Are you sure you want to delete selected categories? This action cannot be undone.",
          );
          if (!confirmed) {
            event.preventDefault();
          }
        }
      }}
    >
      Apply
    </button>
  );
}