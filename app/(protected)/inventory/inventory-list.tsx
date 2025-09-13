"use client"

import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type InventoryItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  created_at: string;
};

const fetcher = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, name, price, quantity, created_at")
    .order("name");
  
  if (error) {
    console.warn("Error fetching inventory:", error);
    return [];
  }
  
  return data ?? [];
};

function InventorySkeleton() {
  return (
    <div className="space-y-2">
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryList() {
  const { data, error, isLoading } = useSWR("inventory:list", fetcher);

  if (isLoading) {
    return <InventorySkeleton />;
  }

  if (error) {
    return <div className="text-destructive text-sm">Failed to load inventory.</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No inventory items yet.</p>
        <p className="text-sm">Add your first item to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <Card key={item.id} className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  ${item.price.toFixed(2)} • Stock: {item.quantity}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Total value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
