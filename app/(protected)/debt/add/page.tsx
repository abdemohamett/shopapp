import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AddDebtPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("auth")?.value !== "true") redirect("/");

  async function submit(formData: FormData) {
    "use server";
    redirect("/customers");
  }

  return (
    <div className="min-h-dvh p-6 md:p-8 space-y-8 bg-muted/30">
      <div className="max-w-xl mx-auto">
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold text-primary text-center">Add Customer Debt</h1>
            <form action={submit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Customer</Label>
                <Input id="customer" name="customer" placeholder="Customer name" required className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item">Item</Label>
                <Input id="item" name="item" placeholder="Item name" required className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" name="qty" type="number" min={1} defaultValue={1} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl text-lg">Save</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


