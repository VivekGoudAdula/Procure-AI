import React from "react";
import { FloatingDock } from "./ui/floating-dock";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

export default function FloatingDockMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useApp();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard />,
      isActive: location.pathname.startsWith("/dashboard"),
      onClick: () => navigate("/dashboard"),
    },
    {
      title: "Procurement",
      icon: <ShoppingCart />,
      isActive: location.pathname.startsWith("/procurement"),
      onClick: () => navigate("/procurement"),
    },
    {
      title: "Transactions",
      icon: <History />,
      isActive: location.pathname.startsWith("/transactions"),
      onClick: () => navigate("/transactions"),
    },
    {
      title: "Analytics",
      icon: <BarChart3 />,
      isActive: location.pathname.startsWith("/analytics"),
      onClick: () => navigate("/analytics"),
    },
    {
      title: "Settings",
      icon: <Settings />,
      isActive: location.pathname.startsWith("/settings"),
      onClick: () => navigate("/settings"),
    },
    {
      title: "Logout",
      icon: <LogOut />,
      isActive: false,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <FloatingDock
        mobileClassName="translate-y-0"
        items={links}
      />
    </div>
  );
}
