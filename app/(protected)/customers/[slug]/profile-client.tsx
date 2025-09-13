"use client"

import useSWR from "swr";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Profile = {
  id: string;
  name: string;
  total: number;
};

type Order = {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

async function fetchProfile(slug: string): Promise<{
  profile: Profile | null;
  orders: Order[];
}> {
  console.log("Fetching profile for slug:", slug);
  
  const { data: customer, error: cErr } = await supabase
    .from("customers")
    .select("id, name")
    .eq("slug", slug)
    .maybeSingle();
  if (cErr) {
    console.error("Error fetching customer by slug:", cErr);
    throw cErr;
  }
  let foundCustomer = customer;

  // Fallback: try to match by name if slug not present in DB yet
  if (!foundCustomer) {
    const fallbackName = slug.replace(/-/g, " ");
    const { data: byName, error: nErr } = await supabase
      .from("customers")
      .select("id, name")
      .ilike("name", fallbackName);
    if (nErr) {
      console.error("Error fetching customer by name:", nErr);
      throw nErr;
    }
    foundCustomer = byName?.[0] ?? null;
  }

  if (!foundCustomer) {
    console.log("No customer found for slug:", slug);
    return { profile: null, orders: [] };
  }

  console.log("Found customer:", foundCustomer);
  
  // Try to fetch orders, but don't fail if table doesn't exist yet
  let orders: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    created_at: string;
    inventory_items?: { name: string };
  }> = [];
  try {
    const { data: ordersData, error: oErr } = await supabase
      .from("orders")
      .select(`id, quantity, unit_price, created_at, inventory_items ( name )`)
      .eq("customer_id", foundCustomer.id)
      .order("created_at", { ascending: false });
    
    if (oErr) {
      console.warn("Orders table may not exist yet or RLS issue:", oErr);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orders = (ordersData ?? []).map((order: any) => ({
        id: order.id,
        quantity: order.quantity,
        unit_price: order.unit_price,
        created_at: order.created_at,
        inventory_items: order.inventory_items
      }));
    }
  } catch (err) {
    console.warn("Orders query failed (table may not exist):", err);
  }

  const normalized: Order[] = (orders ?? []).map((o) => ({
    id: o.id,
    quantity: o.quantity,
    unit_price: o.unit_price,
    created_at: o.created_at,
    item_name: o.inventory_items?.["name"] ?? "Item",
  }));

  const total = normalized.reduce((sum, o) => sum + o.quantity * Number(o.unit_price), 0);

  return { profile: { id: foundCustomer.id, name: foundCustomer.name, total }, orders: normalized };
}

export default function CustomerProfileClient({ slug, name }: { slug: string; name: string }) {
  const { data, error, isLoading } = useSWR(["customer:profile", slug], () => fetchProfile(slug));

  if (isLoading) {
    return (
      <>
        <Card className="rounded-2xl"><CardContent className="p-6 space-y-2"><div className="h-6 bg-muted rounded w-1/2" /><div className="h-8 bg-muted rounded w-24" /></CardContent></Card>
        <Card className="rounded-2xl"><CardContent className="p-6 space-y-2"><div className="h-5 bg-muted rounded w-1/3" /><div className="h-16 bg-muted rounded w-full" /></CardContent></Card>
      </>
    );
  }

  if (error) {
    console.error("Profile error:", error);
    return <div className="text-destructive text-sm">Failed to load profile: {error.message}</div>;
  }
  if (!data?.profile) {
    return <div className="text-sm">Customer not found.</div>;
  }

  const { profile, orders } = data;

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-2">
          <h1 className="text-2xl font-semibold">{profile.name ?? name}</h1>
          <div className="text-xl font-semibold text-primary">${profile.total.toFixed(2)}</div>
        </CardContent>
      </Card>

      <Link href={`/customers/${encodeURIComponent(slug)}/add-item`} className="block">
        <Button className="w-full rounded-2xl text-lg">Add Item Taken</Button>
      </Link>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-3">
          <div className="text-lg font-semibold">History</div>
          {orders.length === 0 ? (
            <div className="text-muted-foreground text-sm">No items yet.</div>
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{o.item_name}</div>
                    <div className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm">{o.quantity} x ${Number(o.unit_price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}


