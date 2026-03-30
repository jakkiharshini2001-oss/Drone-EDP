import {
  LayoutDashboard,
  Bell,
  Briefcase,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function ProviderSidebar({ collapsed, mobileOpen, toggle, closeMobile }) {
  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/provider/dashboard" },
    { name: "Jobs", icon: Briefcase, path: "/provider/bookings" },
    { name: "Services", icon: LayoutGrid, path: "/provider/services" },
    { name: "Earnings", icon: Wallet, path: "/provider/earnings" },
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 bg-white/20 backdrop-blur-xl border-r border-white/20 transition-all duration-300 h-screen pt-20
        lg:sticky lg:top-0 lg:h-screen flex flex-col lg:shadow-none
        ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
        ${collapsed ? "lg:w-20" : "lg:w-64"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && <h2 className="font-black text-lg text-black border-b-2 border-green-500 pb-1">Provider</h2>}
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-slate-100 text-black"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 space-y-1 mt-4">
        {menu.map(({ name, icon: Icon, path }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition
              ${isActive
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-sm border border-green-100"
                : "text-black hover:bg-slate-100 hover:text-green-600"
              }`
            }
          >
            <Icon size={18} />
            {!collapsed && name}
          </NavLink>
        ))}
      </nav>
    </aside >
  );
}
