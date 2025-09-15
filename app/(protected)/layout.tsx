import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MobileNavigation from "@/components/mobile-navigation";
import DesktopSidebar from "@/components/desktop-sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("auth")?.value === "true";
  if (!isAuthed) redirect("/");

  return (
    <div className="pb-20 lg:pb-0">
      <DesktopSidebar />
      <div className="lg:pl-64">
        {children}
      </div>
      <MobileNavigation />
    </div>
  );
}


