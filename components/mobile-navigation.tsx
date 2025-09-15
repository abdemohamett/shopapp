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

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-orange-100 z-50 lg:hidden">
      <div className="max-w-md mx-auto">
        <nav className="flex items-center justify-around py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-600 hover:text-orange-600 hover:bg-orange-50/50"
                )}
              >
                <Icon className={cn("size-5", isActive && "text-orange-600")} />
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-orange-600" : "text-gray-600"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
