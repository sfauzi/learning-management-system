"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className = "btn-brand",
  pendingLabel = "Menyimpan…",
  confirm,
  name,
  value,
  formNoValidate,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  confirm?: string;
  name?: string;
  value?: string;
  formNoValidate?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      formNoValidate={formNoValidate}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(className, pending && "opacity-70")}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
