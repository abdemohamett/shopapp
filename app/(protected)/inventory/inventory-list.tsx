"use client"

import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function isAdmin(): boolean {
  if (typeof document === "undefined") return false;
  const role = document.cookie.match(/ui_role=([^;]+)/)?.[1];
  return role === "admin";
}
import { Package } from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  created_at: string;
};

const fetcher = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from("inventory")
    .select("id, name, price, cost, quantity, created_at")
    .order("name");
  
  if (error) {
    console.warn("Error fetching inventory:", error);
    return [];
  }
  
  return data ?? [];
};

function InventoryCardSkeleton() {
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        </CardContent>
      </Card>
  );
}

export default function InventoryList() {
  const { data, error, isLoading } = useSWR("inventory:list", fetcher);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <InventoryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl shadow-sm border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-destructive text-sm">Failed to load inventory.</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg border border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="size-8 text-orange-600" />
      </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory items yet</h3>
          <p className="text-gray-600 mb-6">Add your first item to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      {data.map((item) => {
        const admin = isAdmin();
        const profit = item.price - item.cost;
        const profitMargin = item.cost > 0 ? ((profit / item.cost) * 100) : 0;
        const totalValue = item.price * item.quantity;

        return (
          <Card key={item.id} className="rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                  <Package className="size-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Stock: {item.quantity}</span>
                    <span>•</span>
                    <span>Added {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-600 mb-1">Selling Price</div>
                  <div className="font-bold text-gray-900 text-lg">${item.price.toFixed(2)}</div>
                </div>
                {isAdmin() && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-600 mb-1">Cost Price</div>
                    <div className="font-bold text-gray-900 text-lg">${item.cost.toFixed(2)}</div>
                  </div>
                )}
              </div>

              {admin ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Total Value</div>
                    <div className="font-semibold text-gray-900">${totalValue.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Profit</div>
                    <div className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${profit.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Margin</div>
                    <Badge 
                      variant={profitMargin >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {profitMargin.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-1">Total Value</div>
                    <div className="font-semibold text-gray-900">${totalValue.toFixed(2)}</div>
                  </div>
                </div>
              )}

              {item.quantity === 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                    <Package className="size-4" />
                    Out of Stock
              </div>
            </div>
              )}
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
