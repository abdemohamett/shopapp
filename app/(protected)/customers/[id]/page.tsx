"use client"

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Phone, DollarSign, Plus, CreditCard, Package, ShoppingCart, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  total_debt: number;
  created_at: string;
};

type Transaction = {
  id: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  inventory: {
    name: string;
  };
};

type Payment = {
  id: string;
  amount: number;
  created_at: string;
};

type InventoryItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

const customerFetcher = async (id: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.warn("Error fetching customer:", error);
    return null;
  }
  
  return data;
};

type RawTransactionRow = {
  id: unknown;
  quantity: unknown;
  price: unknown;
  total: unknown;
  created_at: unknown;
  inventory: unknown;
};

const transactionsFetcher = async (id: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      quantity,
      price,
      total,
      created_at,
      inventory (
        name
      )
    `)
    .eq("customer_id", id)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.warn("Error fetching transactions:", error);
    return [];
  }

  const rows: RawTransactionRow[] = (data ?? []) as RawTransactionRow[];
  const normalized: Transaction[] = rows.map((row) => {
    const invCandidate = row.inventory as unknown;
    const inv = Array.isArray(invCandidate)
      ? ((invCandidate[0] as { name?: unknown }) ?? null)
      : ((invCandidate as { name?: unknown }) ?? null);
    return {
      id: String(row.id),
      quantity: Number(row.quantity),
      price: Number(row.price),
      total: Number(row.total),
      created_at: String(row.created_at),
      inventory: { name: String(inv?.name ?? "") },
    };
  });

  return normalized;
};

const paymentsFetcher = async (id: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.warn("Error fetching payments:", error);
    return [];
  }
  
  return data ?? [];
};

const inventoryFetcher = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from("inventory")
    .select("id, name, price, quantity")
    .order("name");
  
  if (error) {
    console.warn("Error fetching inventory:", error);
    return [];
  }
  
  return data ?? [];
};

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  
  const { data: customer, error: customerError, isLoading: customerLoading } = useSWR(
    customerId ? `customer:${customerId}` : null,
    () => customerFetcher(customerId)
  );
  
  const { data: transactions, isLoading: transactionsLoading } = useSWR(
    customerId ? `transactions:${customerId}` : null,
    () => transactionsFetcher(customerId)
  );
  
  const { data: payments, isLoading: paymentsLoading } = useSWR(
    customerId ? `payments:${customerId}` : null,
    () => paymentsFetcher(customerId)
  );
  
  const { data: inventory, isLoading: inventoryLoading } = useSWR(
    "inventory:list",
    inventoryFetcher
  );

  const [paymentAmount, setPaymentAmount] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  
  // Add debt form state
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isAddingDebt, setIsAddingDebt] = useState(false);

  const totalTransactions = transactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0;
  const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const currentDebt = totalTransactions - totalPayments;

  const handleRecordPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setIsRecordingPayment(true);
    try {
      const { error } = await supabase
        .from("payments")
        .insert([{
          customer_id: customerId,
          amount: Number(paymentAmount)
        }]);

      if (error) {
        toast.error("Failed to record payment: " + error.message);
      } else {
        toast.success("Payment recorded successfully!");
        setPaymentAmount("");
        // Refresh data
        window.location.reload();
      }
    } catch (err) {
      toast.error("Error: " + (err as Error).message);
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleAddDebt = async () => {
    if (!selectedItemId || !quantity || Number(quantity) <= 0) {
      toast.error("Please select an item and enter a valid quantity");
      return;
    }

    const selectedItem = inventory?.find(item => item.id === selectedItemId);
    if (!selectedItem) {
      toast.error("Selected item not found");
      return;
    }

    if (Number(quantity) > selectedItem.quantity) {
      toast.error(`Only ${selectedItem.quantity} items available in stock`);
      return;
    }

    setIsAddingDebt(true);
    try {
      const total = selectedItem.price * Number(quantity);
      
      // Create transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert([{
          customer_id: customerId,
          item_id: selectedItemId,
          quantity: Number(quantity),
          price: selectedItem.price,
          total: total
        }]);

      if (transactionError) {
        toast.error("Failed to add debt: " + transactionError.message);
        return;
      }

      // Update inventory quantity
      const { error: inventoryError } = await supabase
        .from("inventory")
        .update({ quantity: selectedItem.quantity - Number(quantity) })
        .eq("id", selectedItemId);

      if (inventoryError) {
        toast.error("Failed to update inventory: " + inventoryError.message);
        return;
      }

      toast.success(`Added $${total.toFixed(2)} debt for ${selectedItem.name}`);
      setSelectedItemId("");
      setQuantity("");
      // Refresh data
      window.location.reload();
    } catch (err) {
      toast.error("Error: " + (err as Error).message);
    } finally {
      setIsAddingDebt(false);
    }
  };

  if (customerLoading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
          <div className="max-w-md mx-auto lg:max-w-none lg:px-8 px-6 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="max-w-md mx-auto lg:max-w-7xl lg:px-8 p-6 space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
          <div className="max-w-md mx-auto lg:max-w-none lg:px-8 px-6 py-4">
            <Link href="/customers" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ArrowLeft className="size-4 text-gray-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Back to Customers</span>
            </Link>
          </div>
        </div>
        <div className="max-w-md mx-auto p-6">
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="text-destructive text-sm">Customer not found.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-md mx-auto lg:max-w-none lg:px-8 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/customers" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                <ArrowLeft className="size-4 text-gray-600" />
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
                <p className="text-sm text-gray-600">Customer Details</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl lg:px-8 p-6 space-y-6">
        {/* Customer Info */}
        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-700">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Phone className="size-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-1">
                  Joined {new Date(customer.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Current Debt</div>
                <div className="text-2xl font-bold text-gray-900">${currentDebt.toFixed(2)}</div>
              </div>
              <Badge 
                variant={currentDebt > 0 ? "destructive" : "secondary"}
                className="text-lg px-4 py-2"
              >
                <DollarSign className="size-4 mr-2" />
                {currentDebt > 0 ? "Outstanding" : "Paid Up"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Add Debt - Quick and Easy */}
        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-orange-600" />
              Add Debt (Quick Sale)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-select" className="text-sm font-semibold text-gray-700">
                  Select Item
                </Label>
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                    <SelectValue placeholder="Choose an item to sell" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryLoading ? (
                      <SelectItem value="loading" disabled>Loading items...</SelectItem>
                    ) : inventory && inventory.length > 0 ? (
                      inventory.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{item.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              ${item.price.toFixed(2)} • Stock: {item.quantity}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-items" disabled>No items available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              
              {selectedItemId && quantity && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                    <span className="text-lg font-bold text-orange-600">
                      ${((inventory?.find(item => item.id === selectedItemId)?.price || 0) * Number(quantity)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleAddDebt}
                disabled={isAddingDebt || !selectedItemId || !quantity || Number(quantity) <= 0}
                className="w-full h-12 rounded-xl text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
              >
                {isAddingDebt ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Adding Debt...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add Debt
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Record Payment */}
        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-orange-600" />
              Record Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="flex-1 h-12 px-4 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 shadow-sm"
              />
              <Button
                onClick={handleRecordPayment}
                disabled={isRecordingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {isRecordingPayment ? "Recording..." : "Record"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5 text-orange-600" />
              Transactions ({transactions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-xl">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-orange-50/50 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-900">{transaction.inventory.name}</div>
                      <div className="text-sm text-gray-600">
                        {transaction.quantity} × ${transaction.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${transaction.total.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                <Separator className="my-3" />
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                  <div className="font-bold text-gray-900">Total Transactions</div>
                  <div className="font-bold text-gray-900">${totalTransactions.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="size-12 mx-auto mb-3 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm">Transactions will appear here when items are sold</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card className="rounded-2xl shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-orange-600" />
              Payments ({payments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-xl">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-green-50/50 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-900">Payment</div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+${payment.amount.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
                <Separator className="my-3" />
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <div className="font-bold text-gray-900">Total Payments</div>
                  <div className="font-bold text-green-600">${totalPayments.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="size-12 mx-auto mb-3 text-gray-300" />
                <p>No payments yet</p>
                <p className="text-sm">Payments will appear here when recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
