import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPin, Trash, Coins, Medal, Settings, Home } from "lucide-react";

const sidebarItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/report", icon: MapPin, label: "Report Waste" },
  { href: "/collect", icon: Trash, label: "Collect Waste" },
  { href: "/rewards", icon: Coins, label: "Rewards" },
  { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
];

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        bg-gradient-to-b from-white via-green-50 to-green-100 shadow-lg
        border-r pt-20 text-gray-800 w-64 fixed inset-y-0 left-0 z-30
        transform transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:shadow-none
      `}
      aria-label="Main sidebar"
    >
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4 py-6 space-y-2">
          {sidebarItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={`
                  w-full justify-start py-3 font-medium rounded-lg
                  transition-colors group
                  ${pathname === item.href
                    ? "bg-green-200 text-green-900 shadow "
                    : "text-gray-600 hover:bg-green-50  hover:text-green-800"}
                `}
                tabIndex={0}
              >
                <item.icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-base">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <Link href="/settings" passHref>
            <Button
              variant={pathname === "/settings" ? "secondary" : "outline"}
              className={`
                w-full py-3 rounded-lg font-medium
                transition-colors
                ${pathname === "/settings"
                  ? "bg-green-200 text-green-900 shadow"
                  : "text-gray-600 border-gray-300 hover:bg-green-50 hover:text-green-800"}
              `}
            >
              <Settings className="mr-3 h-5 w-5" />
              <span className="text-base">Settings</span>
            </Button>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
