"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, AlertCircle, LogIn, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, authLoading, router]);

    if (isAuthenticated && !authLoading) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#0A1A13" }}>
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F3D2E] to-[#0A1A13] items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(124, 255, 155, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 255, 155, 0.2) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-[#0F2A1E] border-2 border-[#7CFF9B] mb-8">
                        <span className="font-heading text-5xl text-[#7CFF9B]">T</span>
                    </div>
                    <h1 className="font-heading text-4xl text-white tracking-tight mb-4">
                        TUNG TUNG <span className="text-[#7CFF9B]">SPORT</span>
                    </h1>
                    <p className="text-[#C7D4CE] text-lg mb-12">Manager Analytics Dashboard</p>

                    <div className="bg-[#0F2A1E]/80 border border-[#1A4D35] p-6 text-left max-w-sm mx-auto">
                        <h3 className="font-heading text-sm text-[#7CFF9B] mb-4">EXECUTIVE INSIGHTS</h3>
                        <ul className="space-y-3 text-[#C7D4CE] text-sm">
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#1ED760] rounded-full"></span>
                                Revenue & Sales Trends
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#7CFF9B] rounded-full"></span>
                                Inventory Health Monitoring
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#F2E94E] rounded-full"></span>
                                Customer Behavior Analytics
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#C7D4CE] rounded-full"></span>
                                Report Generation
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0F3D2E] border-2 border-[#7CFF9B] mb-4">
                            <span className="font-heading text-2xl text-[#7CFF9B]">T</span>
                        </div>
                        <h1 className="font-heading text-xl text-white tracking-tight">
                            TUNG TUNG <span className="text-[#7CFF9B]">SPORT</span>
                        </h1>
                        <p className="text-[#C7D4CE] text-sm mt-1">Manager Dashboard</p>
                    </div>

                    <div className="bg-[#0F2A1E] border border-[#1A4D35] p-8">
                        <div className="mb-8">
                            <h2 className="font-heading text-2xl text-white uppercase tracking-wide">Manager Login</h2>
                            <p className="text-[#C7D4CE] text-sm mt-2">Access your executive analytics dashboard</p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 bg-[#D64545]/10 border border-[#D64545]/30 px-4 py-3 mb-6 text-[#D64545] text-sm">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[#C7D4CE] text-xs font-bold uppercase tracking-wider mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#7CFF9B] transition-colors placeholder:text-[#C7D4CE]/40"
                                    placeholder="manager@tungtungsport.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-[#C7D4CE] text-xs font-bold uppercase tracking-wider mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#0A1A13] border border-[#1A4D35] text-white px-4 py-3 pr-12 text-sm focus:outline-none focus:border-[#7CFF9B] transition-colors placeholder:text-[#C7D4CE]/40"
                                        placeholder="Enter your password"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C7D4CE] hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#1E7F43] hover:bg-[#2a9954] text-white font-bold uppercase tracking-wider py-4 flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5" />
                                        <span>Access Dashboard</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-[#1A4D35]">
                            <p className="text-center text-[#C7D4CE] text-sm mb-4">
                                Belum punya akun manager?{" "}
                                <a href="/signup" className="text-[#7CFF9B] hover:underline">
                                    Daftar
                                </a>
                            </p>
                            <p className="text-center text-[#C7D4CE] text-xs">
                                Only users with <span className="text-[#7CFF9B] font-bold">manager</span> role can access this panel.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
