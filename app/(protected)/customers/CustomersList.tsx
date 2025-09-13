"use client"

import useSWR from "swr";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MoreHorizontal } from "lucide-react";

type Customer = { 
  id: string; 
  name: string; 
  slug: string; 
  created_at: string;
  total_debt?: number;
};

const fetcher = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from("customers")
    .select(`
      id, 
      name, 
      slug, 
      created_at,
      orders (
        quantity,
        unit_price
      )
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.warn("Error fetching customers:", error);
    return [];
  }
  
  // Calculate total debt for each customer
  const customersWithDebt = (data ?? []).map(customer => {
    const totalDebt = customer.orders?.reduce((sum: number, order: any) => 
      sum + (order.quantity * Number(order.unit_price)), 0
    ) || 0;
    
    return {
      ...customer,
      total_debt: totalDebt
    };
  });
  
  return customersWithDebt;
};

function TableSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Total Debt</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function CustomersList() {
  const { data, error, isLoading } = useSWR("customers:list", fetcher);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-center">
          <div className="text-destructive text-sm">Failed to load customers.</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first customer</p>
          <Link href="/customers/add">
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              Add Customer
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100">
              <TableHead className="font-semibold text-gray-900">Customer</TableHead>
              <TableHead className="font-semibold text-gray-900">Total Debt</TableHead>
              <TableHead className="font-semibold text-gray-900">Joined</TableHead>
              <TableHead className="w-[100px] font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-orange-50/50 transition-colors">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-orange-700">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">@{customer.slug}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge 
                    variant={customer.total_debt! > 0 ? "destructive" : "secondary"}
                    className="font-semibold"
                  >
                    ${customer.total_debt!.toFixed(2)}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-sm text-gray-600">
                  {new Date(customer.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-4">
                  <Link href={`/customers/${customer.slug}`}>
                    <Button variant="outline" size="sm" className="rounded-lg border-gray-200 hover:bg-orange-50 hover:border-orange-200 group">
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}