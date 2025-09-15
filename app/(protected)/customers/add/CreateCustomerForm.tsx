"use client"

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateCustomerForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("customers").insert([{ 
        name: name.trim(), 
        phone: phone.trim() || null 
      }]);

      if (error) {
        toast.error("Failed to create customer: " + error.message);
      } else {
        toast.success("Customer created successfully!");
        setName("");
        setPhone("");
        router.push("/customers");
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Customer</h1>
          <p className="text-gray-600">Create a customer profile to start tracking orders</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Customer Name *
            </label>
            <Input
              id="name"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
              Phone Number
            </label>
            <Input
              id="phone"
              placeholder="Enter phone number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 shadow-sm"
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full h-12 rounded-xl text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating...
              </div>
            ) : (
              "Create Customer"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


