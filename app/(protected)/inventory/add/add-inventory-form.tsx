"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AddInventoryForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("inventory")
        .insert([{
          name: name.trim(),
          price: parseFloat(price) || 0,
          cost: parseFloat(cost) || 0,
          quantity: parseInt(quantity) || 0
        }]);

      if (error) {
        toast.error("Failed to add item: " + error.message);
      } else {
        toast.success("Item added successfully!");
        // Reset form
        setName("");
        setPrice("");
        setCost("");
        setQuantity("");
        // Redirect to inventory list
        router.push("/inventory");
      }
    } catch (err) {
      toast.error("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl shadow-lg border border-gray-200">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Inventory Item</h1>
          <p className="text-gray-600">Add a new item to your inventory</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Item Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
              className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 shadow-sm"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                Selling Price *
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 shadow-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-sm font-semibold text-gray-700">
                Cost Price
              </Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
              Initial Quantity *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 shadow-sm"
              required
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading || !name.trim() || !price || !quantity}
            className="w-full h-12 rounded-xl text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Adding...
              </div>
            ) : (
              "Add Item"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
