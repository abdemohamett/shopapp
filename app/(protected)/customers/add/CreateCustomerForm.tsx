"use client"

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function CreateCustomerForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabase.from("customers").insert([{ name, slug }]);

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setName("");
      router.push(`/customers/${encodeURIComponent(slug)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Customer Name
        </label>
        <Input
          id="name"
          placeholder="Enter customer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
          required
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
  );
}


