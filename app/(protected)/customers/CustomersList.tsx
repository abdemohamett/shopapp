"use client"

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, ArrowRight, DollarSign, Plus } from "lucide-react";

type Customer = { 
  id: string; 
  name: string; 
  phone: string | null;
  total_debt: number;
  created_at: string;
  transactions?: Array<{ total: number }>;
  payments?: Array<{ amount: number }>;
};

const fetcher = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id, 
      name, 
      phone,
      total_debt,
      created_at,
      transactions (
        total
      ),
      payments (
        amount
      )
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.warn("Error fetching customers:", error);
    return [];
  }
  
  // Calculate totals for each customer
  const customersWithDebt = (data ?? []).map(customer => {
    const totalTransactions = customer.transactions?.reduce((sum: number, transaction: { total: number }) => 
      sum + Number(transaction.total), 0
    ) || 0;
    const totalPayments = customer.payments?.reduce((sum: number, payment: { amount: number }) => 
      sum + Number(payment.amount), 0
    ) || 0;
    const calculatedDebt = totalTransactions - totalPayments;
    return {
      ...customer,
      total_debt: calculatedDebt,
      _transactions_sum: totalTransactions as number,
      _payments_sum: totalPayments as number,
    } as Customer & { _transactions_sum: number; _payments_sum: number };
  });
  
  return customersWithDebt;
};

function CustomerCardSkeleton() {
  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
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

export default function CustomersList() {
  const { data, error, isLoading } = useSWR("customers:list", fetcher);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "debt_desc" | "debt_asc" | "recent">("debt_desc");

  // Derived data: filter + sort (must run before any returns)
  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = (data ?? []) as (Customer & { _transactions_sum: number; _payments_sum: number })[];
    let items = source.filter(c =>
      !q || c.name.toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q)
    );
    switch (sortBy) {
      case "name":
        items = items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "debt_asc":
        items = items.sort((a, b) => a.total_debt - b.total_debt);
        break;
      case "debt_desc":
        items = items.sort((a, b) => b.total_debt - a.total_debt);
        break;
      case "recent":
        items = items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    return items;
  }, [data, query, sortBy]);

  const totals = useMemo(() => {
    const totalCustomers = filteredSorted.length;
    const totalOutstanding = filteredSorted.reduce((sum, c) => sum + c.total_debt, 0);
    return { totalCustomers, totalOutstanding };
  }, [filteredSorted]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CustomerCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl shadow-sm border border-gray-200">
        <CardContent className="p-6 text-center">
          <div className="text-destructive text-sm">Failed to load customers.</div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredSorted || filteredSorted.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg border border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first customer</p>
          <Link href="/customers/add">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl px-6 py-3">
              Add Customer
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary + Controls */}
      <Card className="rounded-2xl border border-gray-200">
        <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm font-semibold">Customers: {totals.totalCustomers}</Badge>
            <Badge variant={totals.totalOutstanding > 0 ? "destructive" : "secondary"} className="text-sm font-semibold">
              <DollarSign className="size-3 mr-1" />{totals.totalOutstanding.toFixed(2)}
            </Badge>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search customer or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 rounded-xl"
            />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="h-10 rounded-xl min-w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debt_desc">Debt (High → Low)</SelectItem>
                <SelectItem value="debt_asc">Debt (Low → High)</SelectItem>
                <SelectItem value="name">Name (A → Z)</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile: cards */}
      <div className="lg:hidden space-y-3">
        {filteredSorted.map((customer) => (
          <Card key={customer.id} className="rounded-2xl shadow-sm border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-700">{customer.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{customer.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {customer.phone && (
                        <div className="flex items-center gap-1"><Phone className="size-3" /><span>{customer.phone}</span></div>
                      )}
                      <span>•</span>
                      <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={customer.total_debt > 0 ? "destructive" : "secondary"} className="font-semibold text-xs px-2 py-1">
                    <DollarSign className="size-3 mr-1" />{customer.total_debt.toFixed(2)}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Link href={`/customers/${customer.id}`}>
                  <Button variant="outline" size="sm" className="rounded-xl border-gray-200">Details</Button>
                </Link>
                <Link href={`/customers/${customer.id}`}>
                  <Button size="sm" className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600"> <Plus className="size-4" /> </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: accountant table */}
      <div className="hidden lg:block">
        <Card className="rounded-2xl border border-gray-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
                <TableRow className="border-gray-100">
                  <TableHead className="w-[32%]">Customer</TableHead>
                  <TableHead className="w-[18%]">Phone</TableHead>
                  <TableHead className="w-[18%]">Joined</TableHead>
                  <TableHead className="w-[16%] text-right">Sales</TableHead>
                  <TableHead className="w-[16%] text-right">Payments</TableHead>
                  <TableHead className="w-[16%] text-right">Outstanding</TableHead>
                  <TableHead className="w-[10%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                {filteredSorted.map((c) => (
                  <TableRow key={c.id} className="hover:bg-orange-50/40">
                    <TableCell>
                  <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-orange-700">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                        <div className="font-semibold text-gray-900 truncate">{c.name}</div>
                  </div>
                </TableCell>
                    <TableCell className="text-sm text-gray-700">{c.phone || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-700">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium text-gray-900">${(c as any)._transactions_sum.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-green-700">${(c as any)._payments_sum.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.total_debt > 0 ? "destructive" : "secondary"} className="font-semibold">
                        ${c.total_debt.toFixed(2)}
                  </Badge>
                </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/customers/${c.id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl">Details</Button>
                        </Link>
                        <Link href={`/customers/${c.id}`}>
                          <Button size="sm" className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                            <Plus className="size-4" />
                    </Button>
                  </Link>
                      </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
      </div>
    </div>
  );
}