"use client"

import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wallet, TrendingUp, Package } from "lucide-react";

type ReportData = {
  totalCustomers: number;
  totalDebt: number;
  totalInventory: number;
  topDebtors: Array<{
    name: string;
    slug: string;
    total_debt: number;
  }>;
};

const fetcher = async (): Promise<ReportData> => {
  // Get customers count
  const { count: customersCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  // Get inventory count
  const { count: inventoryCount } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true });

  // Get all customers with their orders to calculate debt
  const { data: customers } = await supabase
    .from("customers")
    .select(`
      name,
      slug,
      orders (
        quantity,
        unit_price
      )
    `);

  // Calculate total debt and top debtors
  let totalDebt = 0;
  const customersWithDebt = (customers || []).map(customer => {
    const customerDebt = customer.orders?.reduce((sum: number, order: any) => 
      sum + (order.quantity * Number(order.unit_price)), 0
    ) || 0;
    
    totalDebt += customerDebt;
    
    return {
      name: customer.name,
      slug: customer.slug,
      total_debt: customerDebt
    };
  });

  // Sort by debt and get top 5
  const topDebtors = customersWithDebt
    .filter(c => c.total_debt > 0)
    .sort((a, b) => b.total_debt - a.total_debt)
    .slice(0, 5);

  return {
    totalCustomers: customersCount || 0,
    totalDebt,
    totalInventory: inventoryCount || 0,
    topDebtors
  };
};

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsClient() {
  const { data, error, isLoading } = useSWR("reports:data", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <ReportsSkeleton />;
  }

  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-center">
          <div className="text-destructive text-sm">Failed to load reports.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4">
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <Users className="size-6 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Customers</div>
                <div className="text-3xl font-bold text-gray-900">{data?.totalCustomers || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                <Wallet className="size-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Debt</div>
                <div className="text-3xl font-bold text-gray-900">${(data?.totalDebt || 0).toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <Package className="size-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Inventory Items</div>
                <div className="text-3xl font-bold text-gray-900">{data?.totalInventory || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Debtors */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Top Debtors</h2>
          </div>
          
          {data?.topDebtors && data.topDebtors.length > 0 ? (
            <div className="space-y-3">
              {data.topDebtors.map((debtor, index) => (
                <div key={debtor.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-orange-700">
                        {debtor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{debtor.name}</div>
                      <div className="text-sm text-gray-500">#{index + 1} debtor</div>
                    </div>
                  </div>
                  <Badge variant="destructive" className="font-semibold">
                    ${debtor.total_debt.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No debtors yet</h3>
              <p className="text-gray-600">Start adding items to customers to see debt tracking</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
