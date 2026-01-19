"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface ManagerUser {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: ManagerUser | null;
    signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<ManagerUser | null>(null);
    const router = useRouter();

    // Fetch user profile and verify manager role
    const fetchManagerProfile = async (authUser: User) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (error || !data) {
            console.error('Error fetching profile:', error);
            return null;
        }

        // Verify manager role
        if (data.role !== 'manager') {
            return null;
        }

        return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role
        } as ManagerUser;
    };

    // Initialize auth state
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const managerProfile = await fetchManagerProfile(session.user);
                if (managerProfile) {
                    setUser(managerProfile);
                    setIsAuthenticated(true);
                } else {
                    await supabase.auth.signOut();
                }
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const managerProfile = await fetchManagerProfile(session.user);
                    if (managerProfile) {
                        setUser(managerProfile);
                        setIsAuthenticated(true);
                    } else {
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, name: string) => {
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role: 'manager' }
            }
        });

        if (authError) {
            return { error: new Error(authError.message) };
        }

        if (data.user) {
            await new Promise(resolve => setTimeout(resolve, 500));

            const managerProfile = await fetchManagerProfile(data.user);
            if (managerProfile) {
                setUser(managerProfile);
                setIsAuthenticated(true);
            }
        }

        return { error: null };
    };

    const signIn = async (email: string, password: string) => {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return { error: new Error(authError.message) };
        }

        if (data.user) {
            const managerProfile = await fetchManagerProfile(data.user);
            if (!managerProfile) {
                await supabase.auth.signOut();
                return { error: new Error("Akun ini bukan manager. Silakan gunakan akun manager.") };
            }
            setUser(managerProfile);
            setIsAuthenticated(true);
        }

        return { error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, signUp, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
