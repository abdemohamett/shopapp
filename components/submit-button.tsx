"use client"

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function SubmitButton({
  children,
  className,
  pendingText = "Signing in...",
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className} aria-busy={pending} aria-live="polite">
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {pendingText}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}


