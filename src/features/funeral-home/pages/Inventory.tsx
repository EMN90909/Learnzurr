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
import { Package, Plus, AlertTriangle, Search, Loader2, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { showError, showSuccess } from '@/utils/toast';
import { FUNERAL_HOME_INVENTORY_CATEGORIES, getHomeId } from '@/lib/operations';

const OperationsInventory = () => {
  const { profile } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const emptyItem = {
    id: '',
    item_name: '',
    category: 'Consumables',
    sku: '',
    unit_of_measure: 'unit',
    quantity_in_stock: 0,
    minimum_stock_level: 5,
    reorder_level: 5,
    supplier: '',
    cost_price: 0,
    selling_price: 0,
    item_type: 'consumable',
    reusable: false,
    active: true,
  };
  const [newItem, setNewItem] = useState(emptyItem);

  const fetchInventory = async () => {
    const homeId = getHomeId(profile);
    if (!homeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('funeral_home_inventory')
        .select('*')
        .eq('home_id', homeId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [profile]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('funeral_home_inventory')
        .insert({
          ...newItem,
          id: undefined,
          home_id: getHomeId(profile)
        });

      if (error) throw error;
      showSuccess("Item added to inventory");
      setIsAddOpen(false);
      setNewItem(emptyItem);
      fetchInventory();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('funeral_home_inventory')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      showSuccess("Item removed");
      fetchInventory();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleUpdateItem = async (item: any) => {
    try {
      const { error } = await supabase
        .from('funeral_home_inventory')
        .update({ ...item, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .eq('home_id', getHomeId(profile));
      if (error) throw error;
      showSuccess("Inventory item updated");
      fetchInventory();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const filteredItems = inventory.filter(item => 
    (categoryFilter === 'all' || item.category === categoryFilter) &&
    (item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockItems = inventory.filter(item => item.quantity_in_stock <= item.minimum_stock_level);

  return (
    <PortalLayout portalType="operations">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Inventory & Assets</h2>
            <p className="text-slate-500">Track caskets, body prep supplies, and operational equipment.</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="btn-struta-primary">
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input required value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newItem.category} onValueChange={v => setNewItem({...newItem, category: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FUNERAL_HOME_INVENTORY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Item Code</Label>
                    <Input value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Initial Stock</Label>
                    <Input type="number" value={newItem.quantity_in_stock} onChange={e => setNewItem({...newItem, quantity_in_stock: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Level</Label>
                    <Input type="number" value={newItem.minimum_stock_level} onChange={e => setNewItem({...newItem, minimum_stock_level: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input value={newItem.unit_of_measure} onChange={e => setNewItem({...newItem, unit_of_measure: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reorder Level</Label>
                    <Input type="number" value={newItem.reorder_level} onChange={e => setNewItem({...newItem, reorder_level: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input type="number" value={newItem.cost_price} onChange={e => setNewItem({...newItem, cost_price: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input type="number" value={newItem.selling_price} onChange={e => setNewItem({...newItem, selling_price: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input value={newItem.supplier} onChange={e => setNewItem({...newItem, supplier: e.target.value})} />
                </div>
                <Button type="submit" className="w-full btn-struta-primary">Save Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {lowStockItems.length > 0 && (
          <Card className="bg-amber-50 border-amber-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Low Stock Alert</p>
                  <h3 className="text-xl font-bold text-amber-900">{lowStockItems.length} items need restocking</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by name or Item Code..." 
                className="pl-9" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {FUNERAL_HOME_INVENTORY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--gold)]" /></div>
            ) : filteredItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-bold">{item.item_name}</div>
                        <div className="text-xs text-slate-400">{item.sku ? `Code: ${item.sku}` : 'No Code'}</div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity_in_stock} {item.unit_of_measure || 'unit'}</TableCell>
                      <TableCell>{item.supplier || 'Not set'}</TableCell>
                      <TableCell>{Number(item.selling_price || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          item.quantity_in_stock <= item.minimum_stock_level 
                            ? 'text-rose-600 border-rose-200 bg-rose-50' 
                            : 'text-emerald-600 border-emerald-200 bg-emerald-50'
                        }>
                          {item.quantity_in_stock <= item.minimum_stock_level ? 'Low Stock' : 'Good'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleUpdateItem({ ...item, quantity_in_stock: Number(item.quantity_in_stock || 0) + 1 })}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-rose-600" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No inventory items added yet.</p>
                <Button variant="link" onClick={() => setIsAddOpen(true)}>Add your first item</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default OperationsInventory;