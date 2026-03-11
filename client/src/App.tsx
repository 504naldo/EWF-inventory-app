import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Inventory from "./pages/Inventory";
import Users from "./pages/Users";
import ApiDocs from "./pages/ApiDocs";
import RequestParts from "./pages/RequestParts";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/inventory"} component={Inventory} />
      <Route path={"/users"} component={Users} />
      <Route path={"/api-docs"} component={ApiDocs} />
      <Route path={"/request-parts"} component={RequestParts} />
      <Route path={"/requests/:id"} component={RequestDetail} />
      <Route path={"/requests"} component={Requests} />
      <Route path={"/"} component={Inventory} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
