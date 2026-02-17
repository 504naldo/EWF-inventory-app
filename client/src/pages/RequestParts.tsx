import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CATEGORIES } from "@shared/categories";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function RequestParts() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [jobId, setJobId] = useState("");
  const [category, setCategory] = useState("");
  const [productCode, setProductCode] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

  const createMutation = trpc.partsRequests.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Request submitted! ID: ${data.requestId}`);
      // Reset form
      setJobId("");
      setCategory("");
      setProductCode("");
      setDescription("");
      setQuantity("");
      setPriority("normal");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobId.trim()) {
      toast.error("Job ID is required");
      return;
    }
    if (!category) {
      toast.error("Category is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    createMutation.mutate({
      jobId: jobId.trim(),
      category,
      productCode: productCode.trim() || undefined,
      requestedDescription: description.trim(),
      quantityRequested: qty,
      priority,
    });
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/inventory")}
              className="text-xs md:text-sm"
            >
              Inventory
            </Button>
            {user.role === "admin" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation("/requests")}
                className="text-xs md:text-sm"
              >
                Requests
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

      <main className="container py-4 md:py-6 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Request Parts</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="jobId" className="text-base">
              Job ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="jobId"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Enter job ID"
              className="text-base h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-base">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="text-base h-12">
                <SelectValue placeholder="Select category" />
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
            <Label htmlFor="productCode" className="text-base">
              Product Code (Optional)
            </Label>
            <Input
              id="productCode"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="Enter product code if known"
              className="text-base h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-base">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the part you need"
              className="text-base min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-base">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="text-base h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-base">
              Priority
            </Label>
            <Select value={priority} onValueChange={(val) => setPriority(val as "normal" | "urgent")}>
              <SelectTrigger className="text-base h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
