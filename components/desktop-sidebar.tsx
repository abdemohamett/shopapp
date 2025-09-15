"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Package, BarChart3, Home } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-orange-100">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-orange-100">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-lg font-bold text-white">S</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shop Manager</h1>
          <p className="text-sm text-gray-600">Business Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "text-orange-600 bg-orange-50 border border-orange-200"
                  : "text-gray-600 hover:text-orange-600 hover:bg-orange-50/50"
              )}
            >
              <Icon className={cn("size-5", isActive && "text-orange-600")} />
              <span className={cn(
                "font-medium",
                isActive ? "text-orange-600" : "text-gray-600"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
