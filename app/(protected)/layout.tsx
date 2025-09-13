import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("auth")?.value === "true";
  if (!isAuthed) redirect("/");

  return <>{children}</>;
}


