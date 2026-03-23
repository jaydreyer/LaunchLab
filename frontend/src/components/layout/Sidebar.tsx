import { NavLink } from "react-router-dom";
import {
  Building2,
  Bot,
  MessageSquare,
  FlaskConical,
  LayoutDashboard,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    heading: "Configure",
    items: [
      { to: "/practice", label: "Practice Setup", icon: Building2 },
      { to: "/agent", label: "Agent Config", icon: Bot },
    ],
  },
  {
    heading: "Test",
    items: [
      { to: "/simulator", label: "Simulator", icon: MessageSquare },
      { to: "/evals", label: "Eval Runner", icon: FlaskConical },
    ],
  },
  {
    heading: "Evaluate",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
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
      <nav className="flex-1 px-2 py-3">
        {navSections.map((section, idx) => (
          <div key={section.heading} className={idx > 0 ? "mt-4" : ""}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.heading}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
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
            </div>
          </div>
        ))}
      </nav>
      <Separator />
      <div className="px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
          Healthcare Agent Simulator
        </p>
      </div>
    </div>
  );
}
