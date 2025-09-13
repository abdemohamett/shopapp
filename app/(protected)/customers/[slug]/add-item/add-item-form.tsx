"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function AddItemForm({ slug }: { slug: string }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const router = useRouter();

  const selectedItem = items.find(item => item.id === selectedItemId);
  const total = selectedItem ? selectedItem.price * quantity : 0;

  useEffect(() => {
    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from("inventory_items")
          .select("id, name, price, quantity")
          .order("name");
        
        if (error) {
          console.warn("No inventory items found:", error);
          setItems([]);
        } else {
          setItems(data || []);
        }
      } catch (err) {
        console.warn("Failed to fetch inventory:", err);
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    }

    fetchItems();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId || !selectedItem) return;

    setLoading(true);

    try {
      // Get customer ID
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .select("id")
        .eq("slug", slug)
        .single();

      if (cErr || !customer) {
        alert("Customer not found");
        return;
      }

      // Insert order
      const { error: oErr } = await supabase
        .from("orders")
        .insert([{
          customer_id: customer.id,
          item_id: selectedItemId,
          quantity: quantity,
          unit_price: selectedItem.price
        }]);

      if (oErr) {
        alert("Failed to add item: " + oErr.message);
      } else {
        router.push(`/customers/${encodeURIComponent(slug)}`);
      }
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingItems) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-12 bg-muted rounded w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-primary text-center">Add Item</h1>
        
        {items.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No inventory items found.</p>
            <p className="text-sm">Add some items to inventory first.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="item">Item</Label>
              <select
                id="item"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 rounded-xl"
                required
              >
                <option value="">Select an item</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - ${item.price.toFixed(2)} (Stock: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-xl"
                required
              />
            </div>
            
            {selectedItem && (
              <div className="text-sm text-muted-foreground">
                Unit price: ${selectedItem.price.toFixed(2)} • Total: ${total.toFixed(2)}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading || !selectedItemId}
              className="w-full rounded-xl text-lg"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Item"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
