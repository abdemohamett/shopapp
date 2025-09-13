import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import CustomerProfileClient from "./profile-client";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export default async function CustomerProfile({ params }: { params: Promise<{ slug: string }> }) {
  const cookieStore = await cookies();
  if (cookieStore.get("auth")?.value !== "true") redirect("/");
  const { slug } = await params;

  async function addItem(formData: FormData) {
    "use server";
    // For now, just redirect back to the same profile
    redirect(`/customers/${encodeURIComponent(slug)}`);
  }

  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-dvh p-6 md:p-8 space-y-8 bg-muted/30">
      <div className="max-w-md mx-auto w-full space-y-6">
        <CustomerProfileClient slug={slug} name={name} />
      </div>
    </div>
  );
}


