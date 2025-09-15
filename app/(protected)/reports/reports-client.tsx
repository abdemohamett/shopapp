"use client"

import { useState, useEffect } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wallet, TrendingUp, Package, DollarSign, CreditCard, AlertTriangle, Clock } from "lucide-react";

type ReportData = {
  totalCustomers: number;
  totalDebt: number;
  totalInventory: number;
  totalTransactions: number;
  totalPayments: number;
  lowStockItems: number;
  topDebtors: Array<{
    id: string;
    name: string;
    total_debt: number;
  }>;
  recentTransactions: Array<{
    id: string;
    customer_name: string;
    item_name: string;
    quantity: number;
    total: number;
    created_at: string;
  }>;
};

const fetcher = async (): Promise<ReportData> => {
  // Get customers count
  const { count: customersCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  // Get inventory data and count
  const { data: inventoryData } = await supabase
    .from("inventory")
    .select("quantity");
  
  const inventoryCount = inventoryData?.length || 0;
  const lowStockItems = inventoryData?.filter(item => item.quantity <= 5).length || 0;

  // Get transactions and payments data
  const [transactionsRes, paymentsRes] = await Promise.all([
    supabase.from("transactions").select("total"),
    supabase.from("payments").select("amount")
  ]);

  const totalTransactions = transactionsRes.data?.reduce((sum, t) => sum + Number(t.total), 0) || 0;
  const totalPayments = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalDebt = totalTransactions - totalPayments;

  // Get customers with their transactions and payments for debt calculation
  const { data: customers } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      transactions (
        total
      ),
      payments (
        amount
      )
    `);

  // Calculate debt for each customer
  const customersWithDebt = (customers || []).map(customer => {
    const customerTransactions = customer.transactions?.reduce((sum: number, t: { total: number }) => 
      sum + Number(t.total), 0
    ) || 0;
    
    const customerPayments = customer.payments?.reduce((sum: number, p: { amount: number }) => 
      sum + Number(p.amount), 0
    ) || 0;
    
    const customerDebt = customerTransactions - customerPayments;
    
    return {
      id: customer.id,
      name: customer.name,
      total_debt: customerDebt
    };
  });

  // Sort by debt and get top 5
  const topDebtors = customersWithDebt
    .filter(c => c.total_debt > 0)
    .sort((a, b) => b.total_debt - a.total_debt)
    .slice(0, 5);

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select(`
      id,
      quantity,
      total,
      created_at,
      customers (
        name
      ),
      inventory (
        name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  const formattedRecentTransactions = (recentTransactions || []).map(t => ({
    id: t.id,
    customer_name: t.customers?.name || "Unknown",
    item_name: t.inventory?.name || "Unknown Item",
    quantity: t.quantity,
    total: t.total,
    created_at: t.created_at
  }));

  return {
    totalCustomers: customersCount || 0,
    totalDebt,
    totalInventory: inventoryCount,
    totalTransactions,
    totalPayments,
    lowStockItems,
    topDebtors,
    recentTransactions: formattedRecentTransactions
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
    refreshInterval: 10000, // Refresh every 10 seconds for real-time updates
    revalidateOnFocus: true, // Refresh when user focuses the tab
    revalidateOnReconnect: true, // Refresh when connection is restored
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Update last updated time when data changes
  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

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
      {/* Real-time Indicator */}
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">Live Data</span>
        </div>
        <span className="text-xs text-green-600">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
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

        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <DollarSign className="size-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Sales</div>
                <div className="text-3xl font-bold text-gray-900">${(data?.totalTransactions || 0).toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                <CreditCard className="size-6 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Payments</div>
                <div className="text-3xl font-bold text-gray-900">${(data?.totalPayments || 0).toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {data?.lowStockItems && data.lowStockItems > 0 && (
          <Card className="rounded-2xl border border-yellow-200 shadow-sm bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="size-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Low Stock Alert</div>
                  <div className="text-3xl font-bold text-yellow-600">{data.lowStockItems} items</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
                <div key={debtor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
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

      {/* Recent Transactions */}
      <Card className="rounded-2xl border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          
          {data?.recentTransactions && data.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {data.recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                      <DollarSign className="size-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{transaction.customer_name}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.quantity} × {transaction.item_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">${transaction.total.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-600">Start selling items to see transaction history</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
