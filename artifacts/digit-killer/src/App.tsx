import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MarketProvider } from "@/lib/market-context";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import Scanner from "@/pages/scanner";
import Signals from "@/pages/signals";
import Analysis from "@/pages/analysis";
import TradeDesk from "@/pages/trade-desk";
import Strategies from "@/pages/strategies";
import MockPages, { Settings } from "@/pages/mock-pages";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/scanner" component={Scanner} />
        <Route path="/signals" component={Signals} />
        <Route path="/analysis" component={Analysis} />
        <Route path="/trade-desk" component={TradeDesk} />
        <Route path="/strategies" component={Strategies} />
        <Route path="/learning" component={MockPages} />
        <Route path="/performance" component={MockPages} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </MarketProvider>
    </QueryClientProvider>
  );
}

export default App;
