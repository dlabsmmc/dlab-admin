"use client";

import type { MouseEvent, ReactNode } from "react";

type ConfirmDeleteButtonProps = {
  className?: string;
  title?: string;
  message?: string;
  children: ReactNode;
};

export function ConfirmDeleteButton({
  className,
  title,
  message = "Are you sure you want to delete this category?",
  children,
}: ConfirmDeleteButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      title={title}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}