import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@shared/categories";
import { Loader2, LogOut, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Inventory() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: allItems = [], isLoading } = trpc.inventory.list.useQuery();

  const updateQuantityMutation = trpc.inventory.updateQuantity.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      setIsAddDialogOpen(false);
      toast.success("Item added successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      setEditingItem(null);
      toast.success("Item updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredItems = useMemo(() => {
    let items = allItems;
    
    if (selectedCategory !== "all") {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.productCode.toLowerCase().includes(query) ||
        item.productDescription.toLowerCase().includes(query)
      );
    }
    
    return items.sort((a, b) => a.productCode.localeCompare(b.productCode));
  }, [allItems, selectedCategory, searchQuery]);

  const handleQuantityChange = (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    updateQuantityMutation.mutate({ id, quantity: newQty });
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.name} ({user.role})
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search by product code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                </DialogHeader>
                <ItemForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No items found
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-semibold">Product Code</th>
                      <th className="text-left p-4 font-semibold">Description</th>
                      <th className="text-right p-4 font-semibold">Quantity</th>
                      <th className="text-right p-4 font-semibold">Current Cost</th>
                      <th className="text-right p-4 font-semibold">Value</th>
                      <th className="text-center p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => {
                      const value = (item.quantity * item.currentCost) / 100;
                      const isLowStock = item.quantity <= 2;
                      
                      return (
                        <tr 
                          key={item.id} 
                          className={`border-t ${isLowStock ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                        >
                          <td className="p-4 font-mono text-sm">{item.productCode}</td>
                          <td className="p-4">{item.productDescription}</td>
                          <td className="p-4 text-right font-semibold">{item.quantity}</td>
                          <td className="p-4 text-right">${(item.currentCost / 100).toFixed(2)}</td>
                          <td className="p-4 text-right font-semibold">${value.toFixed(2)}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                                disabled={updateQuantityMutation.isPending || item.quantity === 0}
                              >
                                -1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                disabled={updateQuantityMutation.isPending}
                              >
                                +1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity, 5)}
                                disabled={updateQuantityMutation.isPending}
                              >
                                +5
                              </Button>
                              {isAdmin && (
                                <>
                                  <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingItem(item)}
                                      >
                                        Edit
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Item</DialogTitle>
                                      </DialogHeader>
                                      <ItemForm
                                        initialData={item}
                                        onSubmit={(data) => updateMutation.mutate({ id: item.id, ...data })}
                                        isLoading={updateMutation.isPending}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this item?")) {
                                        deleteMutation.mutate({ id: item.id });
                                      }
                                    }}
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ItemForm({ 
  initialData, 
  onSubmit, 
  isLoading 
}: { 
  initialData?: any; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    category: initialData?.category || CATEGORIES[0],
    productCode: initialData?.productCode || "",
    productDescription: initialData?.productDescription || "",
    quantity: initialData?.quantity || 0,
    currentCost: initialData ? initialData.currentCost / 100 : 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      currentCost: Math.round(formData.currentCost * 100),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Product Code</Label>
        <Input
          required
          value={formData.productCode}
          onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          required
          value={formData.productDescription}
          onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input
          type="number"
          min="0"
          required
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="space-y-2">
        <Label>Current Cost ($)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          required
          value={formData.currentCost}
          onChange={(e) => setFormData({ ...formData, currentCost: parseFloat(e.target.value) || 0 })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : initialData ? "Update" : "Add"}
      </Button>
    </form>
  );
}
