import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import PracticeSetup from "@/pages/PracticeSetup";
import AgentConfig from "@/pages/AgentConfig";
import Simulator from "@/pages/Simulator";
import SimulationTrace from "@/pages/SimulationTrace";
import EvalRunner from "@/pages/EvalRunner";
import ReadinessDashboard from "@/pages/ReadinessDashboard";

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/practice" element={<PracticeSetup />} />
            <Route path="/agent" element={<AgentConfig />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/simulator/:id/trace" element={<SimulationTrace />} />
            <Route path="/evals" element={<EvalRunner />} />
            <Route path="/dashboard" element={<ReadinessDashboard />} />
            <Route path="/" element={<Navigate to="/practice" replace />} />
            <Route path="*" element={<Navigate to="/practice" replace />} />
          </Route>
        </Routes>
      </TooltipProvider>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;
