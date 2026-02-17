import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Requests() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: requests = [], isLoading } = trpc.partsRequests.list.useQuery({
    status: statusFilter && statusFilter !== "all" ? (statusFilter as any) : undefined,
    search: searchQuery || undefined,
  });

  const updateMutation = trpc.partsRequests.updateStatus.useMutation({
    onSuccess: () => {
      utils.partsRequests.list.invalidate();
      utils.partsRequests.getNewCount.invalidate();
      setEditingRequest(null);
      toast.success("Request updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const openEditDialog = (request: any) => {
    setEditingRequest(request);
    setNewStatus(request.status);
    setNewNotes(request.notes || "");
  };

  const handleUpdate = () => {
    if (!editingRequest) return;
    updateMutation.mutate({
      id: editingRequest.id,
      status: newStatus as any,
      notes: newNotes || undefined,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    setLocation("/inventory");
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "ordered": return "bg-yellow-100 text-yellow-800";
      case "ready": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "denied": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === "urgent" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800";
  };

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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/request-parts")}
              className="text-xs md:text-sm"
            >
              Request Parts
            </Button>
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

      <main className="container py-4 md:py-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Parts Requests</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Search by job ID, product code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="ordered">Ordered</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No requests found
          </div>
        ) : (
          <>
            {/* Mobile: Card View */}
            <div className="lg:hidden space-y-4">
              {requests.map((req: any) => (
                <div key={req.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm">Job: {req.jobId}</div>
                      <div className="text-xs text-gray-600">{req.category}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                      {req.priority === "urgent" && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(req.priority)}`}>
                          URGENT
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {req.productCode && (
                    <div className="text-sm">
                      <span className="font-medium">Code:</span> {req.productCode}
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <span className="font-medium">Description:</span> {req.requestedDescription}
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Qty:</span> {req.quantityRequested}
                  </div>
                  
                  {req.notes && (
                    <div className="text-sm bg-gray-50 p-2 rounded">
                      <span className="font-medium">Notes:</span> {req.notes}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Created: {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => openEditDialog(req)}
                  >
                    Update Status
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Job ID</th>
                    <th className="text-left p-3 font-semibold">Category</th>
                    <th className="text-left p-3 font-semibold">Product Code</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-left p-3 font-semibold">Qty</th>
                    <th className="text-left p-3 font-semibold">Priority</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Created</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req: any) => (
                    <tr key={req.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{req.jobId}</td>
                      <td className="p-3 text-sm">{req.category}</td>
                      <td className="p-3 text-sm font-mono">{req.productCode || "-"}</td>
                      <td className="p-3 text-sm max-w-xs truncate">{req.requestedDescription}</td>
                      <td className="p-3 text-sm">{req.quantityRequested}</td>
                      <td className="p-3">
                        {req.priority === "urgent" && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(req.priority)}`}>
                            URGENT
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditDialog(req)}
                        >
                          Update
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      <Dialog open={!!editingRequest} onOpenChange={() => setEditingRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Add notes..."
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleUpdate} 
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
