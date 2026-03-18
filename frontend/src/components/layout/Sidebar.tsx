import { NavLink } from "react-router-dom";
import {
  Building2,
  Bot,
  MessageSquare,
  FileSearch,
  FlaskConical,
  LayoutDashboard,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/practice", label: "Practice Setup", icon: Building2 },
  { to: "/agent", label: "Agent Config", icon: Bot },
  { to: "/simulator", label: "Simulator", icon: MessageSquare },
  { to: "/simulator/latest/trace", label: "Sim Trace", icon: FileSearch },
  { to: "/evals", label: "Eval Runner", icon: FlaskConical },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Launch<span className="text-teal-600">Lab</span>
        </span>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Healthcare Agent Simulator
        </p>
      </div>
    </div>
  );
}
