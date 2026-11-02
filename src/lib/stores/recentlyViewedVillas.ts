import { writable, get } from "svelte/store";
import { browser } from "$app/environment";

const STORAGE_KEY = "villana_recently_viewed";
const MAX_ITEMS = 10;

export interface RecentlyViewedState {
  villaIds: number[];
  isLoading: boolean;
}

function createRecentlyViewedStore() {
  // Initialize from localStorage if in browser
  const initialState: RecentlyViewedState = {
    villaIds: browser ? loadFromLocalStorage() : [],
    isLoading: false,
  };

  const store = writable<RecentlyViewedState>(initialState);
  const { subscribe, set, update } = store;

  // Helper functions
  function loadFromLocalStorage(): number[] {
    if (!browser) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading recently viewed from localStorage:", error);
      return [];
    }
  }

  function saveToLocalStorage(villaIds: number[]): void {
    if (!browser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(villaIds));
    } catch (error) {
      console.error("Error saving recently viewed to localStorage:", error);
    }
  }

  return {
    subscribe,

    // Add a villa to recently viewed (called when visiting villa detail page)
    add(villaId: number): void {
      update((state) => {
        // Remove if already exists (to move to front)
        const filtered = state.villaIds.filter((id) => id !== villaId);
        // Add to front, limit to MAX_ITEMS
        const newIds = [villaId, ...filtered].slice(0, MAX_ITEMS);
        saveToLocalStorage(newIds);
        return { ...state, villaIds: newIds };
      });
    },

    // Remove a villa from recently viewed
    remove(villaId: number): void {
      update((state) => {
        const newIds = state.villaIds.filter((id) => id !== villaId);
        saveToLocalStorage(newIds);
        return { ...state, villaIds: newIds };
      });
    },

    // Clear all recently viewed
    clear(): void {
      set({ villaIds: [], isLoading: false });
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
      }
    },

    // Get current IDs (synchronous)
    getIds(): number[] {
      return get(store).villaIds;
    },

    // Set loading state
    setLoading(isLoading: boolean): void {
      update((state) => ({ ...state, isLoading }));
    },

    // Initialize from localStorage (useful for hydration)
    initialize(): void {
      if (browser) {
        const ids = loadFromLocalStorage();
        update((state) => ({ ...state, villaIds: ids }));
      }
    },
  };
}

export const recentlyViewedVillas = createRecentlyViewedStore();
