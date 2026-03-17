import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Inventory from "./pages/Inventory";
import Login from "./pages/Login";
import RequestParts from "./pages/RequestParts";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";
import Users from "./pages/Users";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Inventory} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/login" component={Login} />
      <Route path="/request-parts" component={RequestParts} />
      <Route path="/requests" component={Requests} />
      <Route path="/requests/:id" component={RequestDetail} />
      <Route path="/users" component={Users} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
