"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, User } from "lucide-react";

interface TopbarProps {
    sidebarCollapsed?: boolean;
}

export function Topbar({ sidebarCollapsed = false }: TopbarProps) {
    const { user, signOut } = useAuth();

    const sidebarWidth = sidebarCollapsed ? 72 : 256;

    return (
        <header
            className="fixed top-0 right-0 h-16 bg-[#0F2A1E] border-b border-[#1A4D35] flex items-center justify-between px-6 z-40"
            style={{
                left: `${sidebarWidth}px`,
                transition: 'left 0.3s ease'
            }}
        >
            {/* Left side */}
            <div>
                <p className="text-[#C7D4CE] text-xs uppercase tracking-wider">Analytics Dashboard</p>
                <h1 className="font-heading text-white text-lg uppercase tracking-wide">Business Overview</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                    <p className="text-white text-sm font-bold">{user?.name || "Manager"}</p>
                    <p className="text-[#C7D4CE] text-xs uppercase">{user?.role || "Manager"}</p>
                </div>
                <div className="w-10 h-10 bg-[#1E7F43] flex items-center justify-center rounded-sm">
                    <User className="h-5 w-5 text-white" />
                </div>
                <button
                    onClick={signOut}
                    className="text-[#C7D4CE] hover:text-[#D64545] p-2 transition-colors"
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}
