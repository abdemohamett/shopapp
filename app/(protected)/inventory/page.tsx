import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import InventoryList from "./inventory-list";

export default function InventoryPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-md mx-auto lg:max-w-none lg:px-8 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <ArrowLeft className="size-4 text-gray-600" />
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-lg font-bold text-white">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
                  <p className="text-sm text-gray-600">Manage stock and items</p>
                </div>
              </Link>
            </div>
            <Link href="/inventory/add">
              <Button className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200">
                Add Item
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto lg:max-w-7xl lg:px-8 p-6">
        <InventoryList />
      </div>
    </div>
  )
}


