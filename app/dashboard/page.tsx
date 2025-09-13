import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Package, UserPlus, BarChart3 } from "lucide-react";
import DashboardStats from "./dashboard-stats";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("auth")?.value === "true";
  if (!isAuthed) redirect("/");

  async function logoutAction() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.set({ name: "auth", value: "", path: "/", maxAge: 0 });
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shop Manager</h1>
                <p className="text-sm text-gray-600">Welcome back!</p>
              </div>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm" className="rounded-lg border-gray-200 hover:bg-gray-50">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Quick Stats */}
        <DashboardStats />

        {/* Action Cards */}
        <div className="space-y-3">
          <Link href="/customers/add" className="block group">
            <Card className="rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02] bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <UserPlus className="size-6" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Add Customer</div>
                    <div className="text-sm text-orange-100">Create new customer profile</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/customers" className="block group">
            <Card className="rounded-2xl border border-gray-200 hover:border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.01] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Users className="size-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">View Customers</div>
                    <div className="text-sm text-gray-600">Manage customer accounts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/inventory" className="block group">
            <Card className="rounded-2xl border border-gray-200 hover:border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.01] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Package className="size-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Inventory</div>
                    <div className="text-sm text-gray-600">Manage stock and items</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports" className="block group">
            <Card className="rounded-2xl border border-gray-200 hover:border-orange-200 shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.01] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="size-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Reports</div>
                    <div className="text-sm text-gray-600">View analytics and insights</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}


