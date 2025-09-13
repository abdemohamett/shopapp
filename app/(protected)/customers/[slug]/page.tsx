import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import CustomerProfileClient from "./profile-client";

export default async function CustomerProfile({ params }: { params: Promise<{ slug: string }> }) {
  const cookieStore = await cookies();
  if (cookieStore.get("auth")?.value !== "true") redirect("/");
  const { slug } = await params;

  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-dvh p-6 md:p-8 space-y-8 bg-muted/30">
      <div className="max-w-md mx-auto w-full space-y-6">
        <CustomerProfileClient slug={slug} name={name} />
      </div>
    </div>
  );
}


