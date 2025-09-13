import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get("auth")?.value === "true") {
    redirect("/dashboard");
  }
  const params = (await searchParams) || {};
  const errorParam = typeof params.error === "string" ? params.error : undefined;

  async function loginAction(formData: FormData) {
    "use server";

    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    // Basic check; envs exist only on server
    const isValid = Boolean(adminUser && adminPass && username === adminUser && password === adminPass);

    if (!isValid) {
      redirect("/?error=Invalid%20credentials");
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: "auth",
      value: "true",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Manager</h1>
          <p className="text-gray-600">Welcome back, please sign in</p>
        </div>

        {/* Login Form */}
        <Card className="rounded-3xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <form action={loginAction} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                <Input 
                  id="username" 
                  name="username" 
                  placeholder="Enter your username" 
                  required 
                  className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="Enter your password" 
                  required 
                  className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200" 
                />
              </div>
              {errorParam ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600" aria-live="polite">{errorParam}</p>
                </div>
              ) : null}
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Secure shop management system
        </div>
      </div>
    </div>
  );
}