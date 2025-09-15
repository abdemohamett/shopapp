"use client"

import { useEffect } from "react";
import { toast } from "sonner";

export function LoginAlerts({ error }: { error?: string }) {
  useEffect(() => {
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [error]);

  return null;
}


