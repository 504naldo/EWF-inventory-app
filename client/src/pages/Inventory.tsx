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
    onMutate: async ({ id, quantity }) => {
      await utils.inventory.list.cancel();
      const previousItems = utils.inventory.list.getData();
      
      utils.inventory.list.setData(undefined, (old) => 
        old?.map(item => item.id === id ? { ...item, quantity } : item)
      );
      
      return { previousItems };
    },
    onError: (error, variables, context) => {
      utils.inventory.list.setData(undefined, context?.previousItems);
      toast.error(error.message);
    },
    onSettled: () => {
      utils.inventory.list.invalidate();
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
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container py-3 md:py-4 flex items-center justify-between gap-4">
          <button onClick={() => setLocation("/inventory")} className="focus:outline-none flex-shrink-0">
            <img 
              src="/branding/ewf-logo.png" 
              alt="Earth Wind and Fire" 
              className="h-7 md:h-10"
            />
          </button>
          <div className="flex items-center gap-2 md:gap-4">
            {isAdmin && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/users")}
                className="text-xs md:text-sm"
              >
                Users
              </Button>
            )}
            <span className="text-xs md:text-sm text-gray-600 hidden sm:inline">
              {user.name} ({user.role})
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs md:text-sm">
              <LogOut className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-4 md:py-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Input
            placeholder="Search by product code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-md"
          />
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
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

        {/* Mobile: Dropdown for categories */}
        <div className="lg:hidden">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs for categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="hidden lg:block">
          <TabsList className="w-full flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No items found
          </div>
        ) : (
          <>
            {/* Mobile: Card View */}
            <div className="lg:hidden space-y-3">
              {filteredItems.map((item) => {
                const value = (item.quantity * item.currentCost) / 100;
                const isLowStock = item.quantity <= 2;
                
                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-4 space-y-3 ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-white'}`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm font-mono">{item.productCode}</div>
                      <div className="text-sm text-gray-700 line-clamp-2">{item.productDescription}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{item.quantity}</div>
                        <div className="text-xs text-gray-500">Quantity</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">${(item.currentCost / 100).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Cost</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">${value.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Value</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        disabled={updateQuantityMutation.isPending || item.quantity === 0}
                        className="flex-1 h-12 text-lg"
                      >
                        -1
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        disabled={updateQuantityMutation.isPending}
                        className="flex-1 h-12 text-lg"
                      >
                        +1
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleQuantityChange(item.id, item.quantity, 5)}
                        disabled={updateQuantityMutation.isPending}
                        className="flex-1 h-12 text-lg"
                      >
                        +5
                      </Button>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                              className="flex-1"
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden lg:block border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
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
                        className={`border-t ${isLowStock ? 'bg-red-50' : ''}`}
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
          </>
        )}
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
