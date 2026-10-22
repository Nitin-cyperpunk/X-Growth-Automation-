"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <DashboardIcon />,
  },
  {
    label: "Compose",
    href: "/compose",
    icon: <ComposeIcon />,
  },
  {
    label: "AI Writer",
    href: "/ai-writer",
    icon: <AiIcon />,
  },
  {
    label: "Ideas",
    href: "/ideas",
    icon: <IdeasIcon />,
  },
  {
    label: "Queue",
    href: "/queue",
    icon: <QueueIcon />,
  },
  {
    label: "Published",
    href: "/published",
    icon: <PublishedIcon />,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <AnalyticsIcon />,
  },
  {
    label: "AI Insights",
    href: "/insights",
    icon: <InsightsIcon />,
  },
  {
    label: "Automation",
    href: "/automation",
    icon: <AutomationIcon />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <SettingsIcon />,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <Link href="/" className="text-base font-semibold text-white">
          X Growth Engine
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-600/10 text-violet-400"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <span className="h-4 w-4 shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 px-2 py-3">
        <Link
          href="/settings/integrations"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
        >
          <span className="h-4 w-4 shrink-0"><IntegrationIcon /></span>
          Integrations
        </Link>
      </div>
    </aside>
  );
}

// Minimal SVG icons — kept inline to avoid extra dependencies
function DashboardIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ComposeIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M11.5 1.5l3 3M2 11l7.5-7.5 3 3L5 14H2v-3z" />
    </svg>
  );
}

function AiIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
      <circle cx="8" cy="8" r="3" />
    </svg>
  );
}

function IdeasIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M6 14h4M5.5 11.5c-1.5-1-2.5-2.5-2.5-4.5a5 5 0 1 1 10 0c0 2-1 3.5-2.5 4.5" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M2 4h12M2 8h12M2 12h8" />
    </svg>
  );
}

function PublishedIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M4 8l3 3 5-6" />
      <circle cx="8" cy="8" r="7" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M2 14V9M6 14V6M10 14V4M14 14V2" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 5v3l2 2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}

function AutomationIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M2 8a6 6 0 0 1 12 0M5 8a3 3 0 0 1 6 0" />
      <circle cx="8" cy="8" r="1" />
      <path d="M8 9v4" />
    </svg>
  );
}

function IntegrationIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
      <path d="M6 2v4l-2 2 2 2v4M10 2v4l2 2-2 2v4" />
    </svg>
  );
}
