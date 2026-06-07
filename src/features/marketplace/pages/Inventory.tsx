"use client";

import React, { useState, useEffect } from 'react';
import PortalLayout from '@/components/layout/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Search, Loader2, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { showError, showSuccess } from '@/utils/toast';
import { VENDOR_ITEM_CATEGORIES } from '@/lib/operations';

const VendorInventory = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [newItem, setNewItem] = useState({
    item_name: '',
    category: 'Chairs and tables',
    quantity_total: 0,
    unit_price: 0,
    pricing_unit: 'per day',
    sku: '',
    description: '',
    requires_delivery: true,
    requires_setup: true
  });

  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchItems = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // 1. Fetch from Supabase
      let rawItems: any[] = [];
      try {
        const { data, error } = await supabase
          .from('vendor_items')
          .select('*')
          .eq('vendor_id', profile.id)
          .eq('active', true)
          .order('created_at', { ascending: false });
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
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.id || !profile?.is_vendor) {
      setItems([]);
      setLoading(false);
      return;
    }
    fetchItems();
  }, [profile?.id, profile?.is_vendor]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newItemId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      // Try Supabase
      try {
        await supabase
          .from('vendor_items')
          .insert({
            id: newItemId,
            ...newItem,
            vendor_id: profile.id,
            quantity_available: newItem.quantity_total
          });
      } catch (err) {
        console.warn("Supabase insert failed, relying on shared localStorage.");
      }

      // Always save to shared localStorage
      const sharedItemsKey = "struta_shared_vendor_items";
      const sharedItems = JSON.parse(localStorage.getItem(sharedItemsKey) || "[]");
      sharedItems.push({
        id: newItemId,
        ...newItem,
        vendor_id: profile.id,
        quantity_available: newItem.quantity_total,
        active: true,
        created_at: timestamp
      });
      localStorage.setItem(sharedItemsKey, JSON.stringify(sharedItems));

      showSuccess("Vendor inventory item added");
      setIsAddOpen(false);
      fetchItems();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      // Try Supabase
      try {
        await supabase
          .from('vendor_items')
          .update({
            item_name: editingItem.item_name,
            category: editingItem.category,
            quantity_total: editingItem.quantity_total,
            quantity_available: editingItem.quantity_total, // Reset available to total for simplicity
            unit_price: editingItem.unit_price,
            pricing_unit: editingItem.pricing_unit,
            sku: editingItem.sku,
            description: editingItem.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)
          .eq('vendor_id', profile.id);
      } catch (err) {
        console.warn("Supabase update failed, relying on shared localStorage.");
      }

      // Always update shared localStorage
      const sharedItemsKey = "struta_shared_vendor_items";
      const sharedItems = JSON.parse(localStorage.getItem(sharedItemsKey) || "[]");
      const updatedItems = sharedItems.map((i: any) => 
        i.id === editingItem.id ? {
          ...i,
          item_name: editingItem.item_name,
          category: editingItem.category,
          quantity_total: editingItem.quantity_total,
          quantity_available: editingItem.quantity_total,
          unit_price: editingItem.unit_price,
          pricing_unit: editingItem.pricing_unit,
          sku: editingItem.sku,
          description: editingItem.description,
          updated_at: new Date().toISOString()
        } : i
      );
      localStorage.setItem(sharedItemsKey, JSON.stringify(updatedItems));

      showSuccess("Vendor inventory item updated");
      setIsEditOpen(false);
      fetchItems();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deactivateItem = async (id: string) => {
    try {
      // Try Supabase
      try {
        await supabase.from('vendor_items').update({ active: false, updated_at: new Date().toISOString() }).eq('id', id).eq('vendor_id', profile.id);
      } catch (err) {
        console.warn("Supabase update failed, relying on shared localStorage.");
      }

      // Always update shared localStorage
      const sharedItemsKey = "struta_shared_vendor_items";
      const sharedItems = JSON.parse(localStorage.getItem(sharedItemsKey) || "[]");
      const updatedItems = sharedItems.map((i: any) => 
        i.id === id ? { ...i, active: false, updated_at: new Date().toISOString() } : i
      );
      localStorage.setItem(sharedItemsKey, JSON.stringify(updatedItems));

      showSuccess("Vendor inventory item deactivated");
      fetchItems();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <PortalLayout portalType="marketplace">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Rental Inventory</h2>
            <p className="text-slate-500">Manage your equipment, tents, and event supplies.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" fallbackTitle="Add Rental Item">
              <DialogHeader>
                <DialogTitle>Add Rental Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input required value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {VENDOR_ITEM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Code</Label>
                    <Input value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Quantity</Label>
                    <Input type="number" value={newItem.quantity_total} onChange={e => setNewItem({...newItem, quantity_total: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price ({newItem.pricing_unit})</Label>
                    <Input type="number" value={newItem.unit_price} onChange={e => setNewItem({...newItem, unit_price: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pricing Unit</Label>
                    <Input value={newItem.pricing_unit} onChange={e => setNewItem({...newItem, pricing_unit: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Save Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by item name or Item Code..." 
                className="pl-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden group border-slate-200">
                    <div className="h-32 bg-slate-50 flex items-center justify-center border-b">
                      <ImageIcon className="w-8 h-8 text-slate-200" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{item.category}</p>
                          <h3 className="font-bold text-slate-900">{item.item_name}</h3>
                        </div>
                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50">{item.quantity_available}/{item.quantity_total}</Badge>
                      </div>
                      <p className="text-sm font-bold text-slate-900">KSh {item.unit_price.toLocaleString()} <span className="text-xs font-normal text-slate-400">{item.pricing_unit}</span></p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                          setEditingItem(item);
                          setIsEditOpen(true);
                        }}><Edit2 className="w-3 h-3 mr-2" /> Edit</Button>
                        <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => deactivateItem(item.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No rental items added yet.</p>
                <Button variant="link" className="text-emerald-600" onClick={() => setIsAddOpen(true)}>Add your first item</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md" fallbackTitle="Edit Rental Item">
            <DialogHeader>
              <DialogTitle>Edit Rental Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditItem} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input required value={editingItem.item_name} onChange={e => setEditingItem({...editingItem, item_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editingItem.category} onValueChange={v => setEditingItem({...editingItem, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                      {VENDOR_ITEM_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Code</Label>
                  <Input value={editingItem.sku || ''} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Total Quantity</Label>
                  <Input type="number" value={editingItem.quantity_total} onChange={e => setEditingItem({...editingItem, quantity_total: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ({editingItem.pricing_unit})</Label>
                  <Input type="number" value={editingItem.unit_price} onChange={e => setEditingItem({...editingItem, unit_price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Pricing Unit</Label>
                  <Input value={editingItem.pricing_unit} onChange={e => setEditingItem({...editingItem, pricing_unit: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={editingItem.description || ''} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Save Changes</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </PortalLayout>
  );
};

export default VendorInventory;
