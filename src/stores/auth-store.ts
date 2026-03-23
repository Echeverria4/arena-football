import { create } from "zustand";

import { restoreSession } from "@/services/auth";
import type { UserProfile } from "@/types/auth";
import type { AuthStatus } from "@/types/auth";

interface AuthState {
  user: UserProfile | null;
  status: AuthStatus;
  hydrated: boolean;
  stayConnected: boolean;
  setUser: (user: UserProfile | null) => void;
  setStatus: (status: AuthStatus) => void;
  setStayConnected: (value: boolean) => void;
  hydrateSession: () => Promise<UserProfile | null>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  hydrated: false,
  stayConnected: true,
  setUser: (user) =>
    set({
      user,
      status: user ? "authenticated" : "guest",
      hydrated: true,
    }),
  setStatus: (status) => set({ status }),
  setStayConnected: (value) => set({ stayConnected: value }),
  hydrateSession: async () => {
    set({ status: "loading" });

    try {
      const user = await restoreSession();
      set({
        user,
        status: user ? "authenticated" : "guest",
        hydrated: true,
      });

      return user;
    } catch {
      set({
        user: null,
        status: "guest",
        hydrated: true,
      });

      return null;
    }
  },
  clearSession: () =>
    set({
      user: null,
      status: "guest",
      hydrated: true,
    }),
}));
