"use client"

import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { Users, Package, DollarSign, TrendingUp } from "lucide-react";

type Stats = {
  customers: number;
  inventory: number;
  totalDebt: number;
  totalTransactions: number;
  lowStockItems: number;
};

const fetcher = async (): Promise<Stats> => {
  // Fetch customers count
  const { count: customersCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  // Fetch inventory count and low stock items
  const { data: inventoryData } = await supabase
    .from("inventory")
    .select("quantity");
  
  const inventoryCount = inventoryData?.length || 0;
  const lowStockItems = inventoryData?.filter(item => item.quantity <= 5).length || 0;

  // Fetch total debt from transactions and payments
  const [transactionsRes, paymentsRes] = await Promise.all([
    supabase.from("transactions").select("total"),
    supabase.from("payments").select("amount")
  ]);

  const totalTransactions = transactionsRes.data?.reduce((sum, t) => sum + Number(t.total), 0) || 0;
  const totalPayments = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalDebt = totalTransactions - totalPayments;

  return {
    customers: customersCount || 0,
    inventory: inventoryCount,
    totalDebt,
    totalTransactions,
    lowStockItems
  };
};

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      ))}
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
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-gray-400">-</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">-</div>
                <div className="text-xs text-gray-600">Error</div>
            </div>
          </div>
        </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Customers",
      value: data?.customers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      label: "Inventory",
      value: data?.inventory || 0,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      label: "Total Debt",
      value: `$${(data?.totalDebt || 0).toFixed(2)}`,
      icon: DollarSign,
      color: data?.totalDebt && data.totalDebt > 0 ? "text-red-600" : "text-green-600",
      bgColor: data?.totalDebt && data.totalDebt > 0 ? "bg-red-100" : "bg-green-100"
    },
    {
      label: "Low Stock",
      value: data?.lowStockItems || 0,
      icon: TrendingUp,
      color: data?.lowStockItems && data.lowStockItems > 0 ? "text-yellow-600" : "text-gray-600",
      bgColor: data?.lowStockItems && data.lowStockItems > 0 ? "bg-yellow-100" : "bg-gray-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                <Icon className={`size-5 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
