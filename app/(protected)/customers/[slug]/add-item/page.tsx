import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AddItemForm from "./add-item-form";

export default async function AddItemTakenPage({ params }: { params: Promise<{ slug: string }> }) {
  const cookieStore = await cookies();
  if (cookieStore.get("auth")?.value !== "true") redirect("/");
  const { slug } = await params;

  return (
    <div className="min-h-dvh p-6 md:p-8 space-y-8 bg-muted/30">
      <div className="max-w-md mx-auto w-full">
        <AddItemForm slug={slug} />
      </div>
    </div>
  );
}


