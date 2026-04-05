"use client";

import { useState } from "react";

type SelectAllCheckboxProps = {
  checkboxName: string;
};

export function SelectAllCheckbox({ checkboxName }: SelectAllCheckboxProps) {
  const [checked, setChecked] = useState(false);

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => {
        const nextChecked = event.target.checked;
        setChecked(nextChecked);
        const checkboxes = document.querySelectorAll<HTMLInputElement>(`input[name="${checkboxName}"]`);
        checkboxes.forEach((checkbox) => {
          checkbox.checked = nextChecked;
        });
      }}
      aria-label="Select all products"
      className="h-4 w-4"
    />
  );
}