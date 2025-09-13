"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AddInventoryForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("inventory_items")
        .insert([{
          name: name.trim(),
          price: parseFloat(price) || 0,
          quantity: parseInt(quantity) || 0
        }]);

      if (error) {
        alert("Failed to add item: " + error.message);
      } else {
        // Reset form
        setName("");
        setPrice("");
        setQuantity("");
        // Redirect to inventory list
        router.push("/inventory");
      }
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-primary text-center">Add Inventory Item</h1>
        
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name"
              className="rounded-xl"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="rounded-xl"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="rounded-xl"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl text-lg"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
