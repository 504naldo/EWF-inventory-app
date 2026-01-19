import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, LogOut, Shield, User } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Users() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const { data: allUsers = [], isLoading } = trpc.users.list.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

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

  if (!user || user.role !== "admin") {
    setLocation("/inventory");
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/users")}
              className="text-xs md:text-sm font-semibold"
            >
              Users
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

      <main className="container py-4 md:py-6 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        ) : allUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        ) : (
          <>
            {/* Mobile: Card View */}
            <div className="lg:hidden space-y-3">
              {allUsers.map((u) => (
                <div 
                  key={u.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold">{u.name || "Unknown"}</div>
                      <div className="text-sm text-gray-600">{u.email || "No email"}</div>
                      <div className="text-xs text-gray-500">
                        Last signed in: {new Date(u.lastSignedIn).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role === 'admin' ? (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Tech
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {u.id !== user.id && (
                    <div className="pt-2 border-t">
                      {u.role === 'tech' ? (
                        <Button
                          size="sm"
                          onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'admin' })}
                          disabled={updateRoleMutation.isPending}
                          className="w-full"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Promote to Admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'tech' })}
                          disabled={updateRoleMutation.isPending}
                          className="w-full"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Demote to Tech
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden lg:block border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Name</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Role</th>
                    <th className="text-left p-4 font-semibold">Last Sign In</th>
                    <th className="text-center p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td className="p-4">{u.name || "Unknown"}</td>
                      <td className="p-4 text-gray-600">{u.email || "No email"}</td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3" />
                              Tech
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {new Date(u.lastSignedIn).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {u.id === user.id ? (
                            <span className="text-sm text-gray-400">You</span>
                          ) : u.role === 'tech' ? (
                            <Button
                              size="sm"
                              onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'admin' })}
                              disabled={updateRoleMutation.isPending}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Promote to Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRoleMutation.mutate({ userId: u.id, role: 'tech' })}
                              disabled={updateRoleMutation.isPending}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Demote to Tech
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
