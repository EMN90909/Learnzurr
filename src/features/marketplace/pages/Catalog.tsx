"use client";

import React, { useEffect, useState } from "react";
import PortalLayout from "@/components/layout/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { showError } from "@/utils/toast";

const VendorCatalog = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;
      setLoading(true);
      try {
        // 1. Fetch from Supabase
        let rawItems: any[] = [];
        try {
          const { data, error } = await supabase
            .from("vendor_items")
            .select("*")
            .eq("vendor_id", profile.id)
            .eq("active", true)
            .order("created_at", { ascending: false });
          if (!error && data) {
            rawItems = data;
          }
        } catch (err) {
          console.warn("Supabase fetch failed, relying on shared localStorage.");
        }

        // 2. Fetch from shared localStorage
        const sharedItemsKey = "struta_shared_vendor_items";
        const sharedItems = JSON.parse(localStorage.getItem(sharedItemsKey) || "[]");
        const localVendorItems = sharedItems.filter((i: any) => i.vendor_id === profile.id && i.active !== false);

        // 3. Merge both lists, avoiding duplicates by ID
        const mergedMap = new Map();
        rawItems.forEach(i => mergedMap.set(i.id, i));
        localVendorItems.forEach((i: any) => {
          if (!mergedMap.has(i.id)) {
            mergedMap.set(i.id, i);
          }
        });

        const mergedItems = Array.from(mergedMap.values()).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setItems(mergedItems);
      } catch (error: any) {
        showError(error.message || "Could not load vendor catalog.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile?.id]);

  return (
    <PortalLayout portalType="marketplace">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Vendor Catalog</h2>
            <p className="text-slate-500">Public-facing list of active rental inventory and services.</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild><Link to="/marketplace/inventory">Manage Inventory</Link></Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>
        ) : items.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{item.category}</p>
                      <h3 className="font-bold text-slate-900">{item.item_name}</h3>
                    </div>
                    <Badge variant="outline">{item.quantity_available}/{item.quantity_total}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{item.description || "No description added yet."}</p>
                  <p className="font-bold">KSh {Number(item.unit_price || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">{item.pricing_unit}</span></p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-3">No catalog items available yet. Add vendor inventory to publish services.</p>
            <Button variant="outline" asChild><Link to="/marketplace/inventory">Add inventory</Link></Button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default VendorCatalog;