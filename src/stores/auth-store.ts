import { create } from "zustand";

import { restoreSession } from "@/services/auth";
import { persistStorage } from "@/stores/persist-storage";
import type { AuthStatus, UserProfile } from "@/types/auth";

const HYDRATED_KEY = "arena-auth-hydrated";

// Read synchronously so the very first render already has hydrated: true
// if the user has opened the app before. Prevents the "Carregando sessão"
// flash on every page load / tab navigation when the session is known.
function readPersistedHydrated(): boolean {
  try {
    return persistStorage.getItem(HYDRATED_KEY) === "true";
  } catch {
    return false;
  }
}

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
  hydrated: readPersistedHydrated(),
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
      set({ user, status: user ? "authenticated" : "guest", hydrated: true });
      persistStorage.setItem(HYDRATED_KEY, "true");
      return user;
    } catch {
      set({ user: null, status: "guest", hydrated: true });
      persistStorage.setItem(HYDRATED_KEY, "true");
      return null;
    }
  },
  clearSession: () =>
    set({ user: null, status: "guest", hydrated: true }),
}));
