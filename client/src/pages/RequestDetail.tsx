import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, LogOut, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function RequestDetail() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/requests/:id");
  const [status, setStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();
  const { data: request, isLoading } = trpc.partsRequests.getById.useQuery(
    { id: params?.id || "" },
    { enabled: !!params?.id && !!user && user.role === "admin" }
  );

  const updateMutation = trpc.partsRequests.updateStatus.useMutation({
    onSuccess: () => {
      utils.partsRequests.getById.invalidate({ id: params?.id || "" });
      utils.partsRequests.list.invalidate();
      utils.partsRequests.getNewCount.invalidate();
      toast.success("Request updated successfully");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setAdminNotes(request.adminNotes || "");
    }
  }, [request]);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const handleSave = () => {
    if (!params?.id) return;
    setIsSaving(true);
    updateMutation.mutate({
      id: params.id,
      status: status as any,
      adminNotes: adminNotes || undefined,
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

  if (!match) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!request) {
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
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs md:text-sm">
                <LogOut className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="container py-6">
          <div className="text-center text-gray-500">
            Request not found
          </div>
        </main>
      </div>
    );
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

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/requests")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Request Details</h1>
        </div>

        <div className="space-y-6">
          {/* Request Info Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Building ID</label>
                <p className="text-lg font-mono mt-1">{request.buildingId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Category</label>
                <p className="text-lg mt-1">{request.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Product Code</label>
                <p className="text-lg font-mono mt-1">{request.productCode || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Quantity Requested</label>
                <p className="text-lg mt-1">{request.quantityRequested}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="text-base mt-1 bg-gray-50 p-3 rounded">{request.requestedDescription}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Priority</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Requested By</label>
                <p className="text-base mt-1">{request.createdByName || request.createdByEmail || "Unknown"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Created Date</label>
                <p className="text-base mt-1">{new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {request.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Tech Notes</label>
                <p className="text-base mt-1 bg-gray-50 p-3 rounded">{request.notes}</p>
              </div>
            )}
          </div>

          {/* Admin Actions Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">Admin Actions</h2>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-2">
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
              <div className="mt-2">
                <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes for this request..."
                className="mt-2"
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">These notes are for admin reference only</p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/requests")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
