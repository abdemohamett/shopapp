"use client"

import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { Users, Package, Wallet } from "lucide-react";

type Stats = {
  customers: number;
  inventory: number;
  totalDebt: number;
};

const fetcher = async (): Promise<Stats> => {
  // Fetch customers count
  const { count: customersCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  // Fetch inventory count
  const { count: inventoryCount } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true });

  // Fetch total debt from orders
  const { data: orders } = await supabase
    .from("orders")
    .select("quantity, unit_price");

  const totalDebt = orders?.reduce((sum, order) => 
    sum + (order.quantity * Number(order.unit_price)), 0
  ) || 0;

  return {
    customers: customersCount || 0,
    inventory: inventoryCount || 0,
    totalDebt
  };
};

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Users className="size-4 text-orange-600" />
          </div>
          <div>
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="text-xs text-gray-600 mt-1">Customers</div>
          </div>
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Package className="size-4 text-orange-600" />
          </div>
          <div>
            <div className="h-6 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="text-xs text-gray-600 mt-1">Items</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats() {
  const { data, error, isLoading } = useSWR("dashboard:stats", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <StatsSkeleton />;
  }

  if (error) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="size-4 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-xs text-gray-600">Customers</div>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="size-4 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">-</div>
              <div className="text-xs text-gray-600">Items</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Users className="size-4 text-orange-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{data?.customers || 0}</div>
            <div className="text-xs text-gray-600">Customers</div>
          </div>
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Package className="size-4 text-orange-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{data?.inventory || 0}</div>
            <div className="text-xs text-gray-600">Items</div>
          </div>
        </div>
      </div>
    </div>
  );
}
