import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/inventory");
    }
  }, [isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-6">
          <img 
            src="/branding/ewf-logo.png" 
            alt="Earth Wind and Fire" 
            className="mx-auto" 
            style={{ maxWidth: '240px' }}
          />
          <p className="text-gray-600">Sign in to access the inventory system</p>
        </div>
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => window.location.href = getLoginUrl()}
        >
          Sign In
        </Button>
      </div>
    </div>
  );
}
