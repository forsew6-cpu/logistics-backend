"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { User, AuthResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("nearhub_token");
      if (!token) {
        setLoading(false);
        return;
      }
      const data = (await api.getMe()) as { user: User };
      setUser(data.user);
    } catch {
      localStorage.removeItem("nearhub_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const data = (await api.login({ email, password })) as AuthResponse;
    localStorage.setItem("nearhub_token", data.token);
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const data = (await api.signup({
      name,
      email,
      password,
    })) as AuthResponse;
    localStorage.setItem("nearhub_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("nearhub_token");
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
