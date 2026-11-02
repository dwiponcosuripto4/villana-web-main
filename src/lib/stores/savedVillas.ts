import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import { showToast, toastMessages } from "$lib/utils/toast";
import { isOnline, networkAwareFetch, offlineQueue } from "$lib/utils/offline";
import type { VillaWithRelations } from "$lib/server/services/villa.service";

const STORAGE_KEY = "villana_saved_villas";
const VILLA_CACHE_KEY = "villana_villa_cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface CachedVillaData {
  villa: VillaWithRelations;
  lastUpdated: Date;
  source: "api" | "static";
}

export interface OfflineVillaData {
  villaIds: number[];
  villaDetails: {
    [villaId: number]: CachedVillaData;
  };
  lastSynced?: Date;
}

export interface SavedVillasState {
  villaIds: number[];
  isLoading: boolean;
  lastSynced?: Date;
}

function createSavedVillasStore() {
  // Initialize from localStorage if in browser
  const initialState: SavedVillasState = {
    villaIds: browser ? loadFromLocalStorage() : [],
    isLoading: false,
  };

  const store = writable<SavedVillasState>(initialState);
  const { subscribe, set, update } = store;

  // Helper functions
  function loadFromLocalStorage(): number[] {
    if (!browser) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading saved villas from localStorage:", error);
      return [];
    }
  }

  function saveToLocalStorage(villaIds: number[]): void {
    if (!browser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(villaIds));
    } catch (error) {
      console.error("Error saving villas to localStorage:", error);
    }
  }

  // Villa cache management functions
  function loadVillaCacheFromStorage(): { [villaId: number]: CachedVillaData } {
    if (!browser) return {};
    try {
      const stored = localStorage.getItem(VILLA_CACHE_KEY);
      if (!stored) return {};

      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      Object.keys(parsed).forEach((key) => {
        if (parsed[key].lastUpdated) {
          parsed[key].lastUpdated = new Date(parsed[key].lastUpdated);
        }
      });
      return parsed;
    } catch (error) {
      console.error("Error loading villa cache from localStorage:", error);
      return {};
    }
  }

  function saveVillaCacheToStorage(cache: {
    [villaId: number]: CachedVillaData;
  }): void {
    if (!browser) return;
    try {
      localStorage.setItem(VILLA_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error("Error saving villa cache to localStorage:", error);
    }
  }

  function isDataStale(
    cachedData: CachedVillaData,
    maxAge: number = CACHE_TTL,
  ): boolean {
    const now = new Date().getTime();
    const dataAge = now - cachedData.lastUpdated.getTime();
    return dataAge > maxAge;
  }

  // Main store methods
  return {
    subscribe,

    // Cache villa details in localStorage
    cacheVillaDetails(
      villaId: number,
      villaData: VillaWithRelations,
      source: "api" | "static" = "api",
    ) {
      if (!browser) return;

      const cache = loadVillaCacheFromStorage();
      cache[villaId] = {
        villa: villaData,
        lastUpdated: new Date(),
        source,
      };
      saveVillaCacheToStorage(cache);
    },

    // Get cached villa details
    getCachedVillaDetails(villaId: number): VillaWithRelations | null {
      if (!browser) return null;

      const cache = loadVillaCacheFromStorage();
      const cachedData = cache[villaId];

      if (!cachedData) return null;

      // Return cached data even if stale (better than nothing)
      return cachedData.villa;
    },

    // Check if cached data is stale
    isCachedDataStale(villaId: number, maxAge?: number): boolean {
      if (!browser) return true;

      const cache = loadVillaCacheFromStorage();
      const cachedData = cache[villaId];

      if (!cachedData) return true;
      return isDataStale(cachedData, maxAge);
    },

    // Get all offline-capable villas (with cached details)
    getOfflineCapableVillas(): VillaWithRelations[] {
      if (!browser) return [];

      const state = get({ subscribe });
      const cache = loadVillaCacheFromStorage();

      return state.villaIds
        .map((id) => cache[id]?.villa)
        .filter((villa) => villa !== undefined) as VillaWithRelations[];
    },

    // Prefetch villa details for saved IDs
    async prefetchVillaDetails(villaIds: number[]) {
      if (!browser) return;

      const cache = loadVillaCacheFromStorage();
      const staleIds = villaIds.filter((id) => {
        const cachedData = cache[id];
        return !cachedData || isDataStale(cachedData);
      });

      if (staleIds.length === 0) return;

      // Check if we're online before attempting network requests
      const onlineStatus = get(isOnline);
      if (!onlineStatus) {
        console.log("Offline - skipping villa prefetch");
        return;
      }

      // Fetch fresh data for stale entries
      try {
        const fetchPromises = staleIds.map(async (id) => {
          try {
            const response = await networkAwareFetch(`/api/villas/${id}`);
            if (response && response.ok) {
              const villaData = await response.json();
              this.cacheVillaDetails(id, villaData, "api");
              return villaData;
            }
          } catch (error) {
            console.warn(`Failed to prefetch villa ${id}:`, error);
          }

          // Try static fallback (this works offline too)
          try {
            const staticResponse = await fetch(`/data/villas/${id}.json`);
            if (staticResponse.ok) {
              const data = await staticResponse.json();
              const villaData = {
                id,
                ...data.villa,
                images: data.images || [],
                amenities: [],
                videos: [],
                bedSizes: [],
                bathroomsIndoor: data.villa.bathroomsIndoor || 2,
                bathroomsOutdoor: data.villa.bathroomsOutdoor || 1,
              };
              this.cacheVillaDetails(id, villaData, "static");
              return villaData;
            }
          } catch (staticError) {
            console.warn(
              `Static fallback failed for villa ${id}:`,
              staticError,
            );
          }

          return null;
        });

        await Promise.all(fetchPromises);
      } catch (error) {
        console.error("Error during villa prefetch:", error);
      }
    },

    // Clear villa cache
    clearCache() {
      if (!browser) return;
      localStorage.removeItem(VILLA_CACHE_KEY);
    },

    // Add a villa to saved list
    add(villaId: number, user?: any, villaData?: VillaWithRelations) {
      update((state) => {
        if (!state.villaIds.includes(villaId)) {
          const newIds = [...state.villaIds, villaId];

          // Save to localStorage for anonymous users (and as backup for logged-in users)
          saveToLocalStorage(newIds);

          return {
            ...state,
            villaIds: newIds,
          };
        }
        return state;
      });

      // Cache villa details if provided
      if (villaData) {
        this.cacheVillaDetails(villaId, villaData, "api");
      }

      // Show success toast immediately for better UX
      const onlineStatus = get(isOnline);
      if (!onlineStatus && user) {
        showToast.success("Villa saved (will sync when online)");
      } else {
        showToast.success(toastMessages.villa.saved);
      }

      // If user is authenticated, also save to server
      if (user && browser) {
        if (onlineStatus) {
          // Online - try to save immediately
          networkAwareFetch(`/api/villas/${villaId}/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
            .then((response) => {
              if (!response || !response.ok) {
                throw new Error(`Server save failed: ${response?.status}`);
              }
            })
            .catch((error) => {
              console.error("Error saving villa to server:", error);
              showToast.error(toastMessages.villa.saveError);
              // Add to offline queue for retry
              offlineQueue.addAction("save", villaId);
              // Don't revert local change - keep it and sync later
            });
        } else {
          // Offline - add to queue for later sync
          offlineQueue.addAction("save", villaId);
        }
      }
    },

    // Remove a villa from saved list
    remove(villaId: number, user?: any, skipToast?: boolean) {
      update((state) => {
        const newIds = state.villaIds.filter((id) => id !== villaId);

        // Save to localStorage for both user types (as backup for logged-in users)
        saveToLocalStorage(newIds);

        return {
          ...state,
          villaIds: newIds,
        };
      });

      // Note: We keep the villa cached even after removing from saved list
      // This allows for quick re-saving without refetching

      // Show success toast unless this is an internal call (like reverting an error)
      if (!skipToast) {
        const onlineStatus = get(isOnline);
        if (!onlineStatus && user) {
          showToast.success("Villa removed (will sync when online)");
        } else {
          showToast.success(toastMessages.villa.removed);
        }
      }

      // If user is authenticated, also remove from server
      if (user && browser) {
        const onlineStatus = get(isOnline);
        if (onlineStatus) {
          // Online - try to remove immediately
          networkAwareFetch(`/api/villas/${villaId}/save`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          })
            .then((response) => {
              if (!response || !response.ok) {
                throw new Error(`Server remove failed: ${response?.status}`);
              }
            })
            .catch((error) => {
              console.error("Error removing villa from server:", error);
              if (!skipToast) {
                showToast.error(toastMessages.villa.removeError);
                // Add to offline queue for retry
                offlineQueue.addAction("remove", villaId);
                // Don't revert local change - keep it and sync later
              }
            });
        } else {
          // Offline - add to queue for later sync
          offlineQueue.addAction("remove", villaId);
        }
      }
    },

    // Toggle save state
    toggle(villaId: number, user?: any) {
      const state = get({ subscribe });
      if (state.villaIds.includes(villaId)) {
        this.remove(villaId, user);
      } else {
        this.add(villaId, user);
      }
    },

    // Load saved villas from server for authenticated user
    async loadFromServer(user: any) {
      if (!user || !browser) return;

      update((state) => ({ ...state, isLoading: true }));

      try {
        const response = await fetch("/api/villas/saved");
        const data = await response.json();

        if (data.villas) {
          const serverVillaIds = data.villas.map((v: any) => v.villaId);

          // For anonymous users or users with no server data, don't merge - it would restore removed villas
          // Only merge if we have legitimate server data to sync
          update((state) => {
            const localIds = state.villaIds;

            // If server has data and local has data, be careful about merging
            // Don't restore villas that were explicitly removed locally
            let finalIds;
            if (serverVillaIds.length === 0) {
              // Server has no saved villas, keep local state
              finalIds = localIds;
            } else if (localIds.length === 0) {
              // Local has no saved villas, use server state
              finalIds = serverVillaIds;
            } else {
              // Both have data - be very careful about merging
              // If local has fewer villas than server, it likely means the user removed some
              // In this case, we should trust the local state (recent removals) over server state
              // Only merge if local has MORE villas (indicating local additions that need syncing)
              if (localIds.length < serverVillaIds.length) {
                finalIds = localIds;
              } else {
                finalIds = [...new Set([...localIds, ...serverVillaIds])];
              }
            }

            return {
              ...state,
              villaIds: finalIds,
              isLoading: false,
              lastSynced: new Date(),
            };
          });

          // Also update localStorage as backup
          const currentState = get(store);
          saveToLocalStorage(currentState.villaIds);

          // Cache villa details from server response if available
          if (data.villas.length > 0 && data.villas[0].villa) {
            data.villas.forEach((savedVilla: any) => {
              if (savedVilla.villa) {
                this.cacheVillaDetails(
                  savedVilla.villaId,
                  savedVilla.villa,
                  "api",
                );
              }
            });
          } else {
            // Prefetch villa details for IDs that aren't cached or are stale
            await this.prefetchVillaDetails(serverVillaIds);
          }
        }
      } catch (error) {
        console.error("Error loading saved villas from server:", error);
        showToast.error(toastMessages.general.networkError);
        update((state) => ({ ...state, isLoading: false }));
      }
    },

    // Sync local storage to server when user logs in
    async syncToServer(user: any) {
      if (!user || !browser) return;

      const localIds = loadFromLocalStorage();
      if (localIds.length === 0) return;

      try {
        // Bulk save local villas to server
        const response = await fetch("/api/villas/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ villaIds: localIds }),
        });

        if (!response.ok) {
          throw new Error(`Sync failed with status ${response.status}`);
        }

        // Clear local storage after successful sync
        localStorage.removeItem(STORAGE_KEY);

        // Load the updated list from server
        await this.loadFromServer(user);

        // Show success message if any villas were synced
        if (localIds.length > 0) {
          showToast.success(
            `Synced ${localIds.length} saved villa${localIds.length > 1 ? "s" : ""} to your account`,
          );
        }
      } catch (error) {
        console.error("Error syncing saved villas to server:", error);
        showToast.error("Failed to sync saved villas to your account");
      }
    },

    // Clear all saved villas
    clear() {
      set({ villaIds: [], isLoading: false });
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
        // Optionally clear cache too - keeping it for now in case of re-saves
        // localStorage.removeItem(VILLA_CACHE_KEY);
      }
    },

    // Check if a villa is saved
    isSaved(villaId: number): boolean {
      const state = get({ subscribe });
      return state.villaIds.includes(villaId);
    },
  };
}

export const savedVillas = createSavedVillasStore();

// Derived store for saved count
export const savedVillasCount = derived(
  savedVillas,
  ($savedVillas) => $savedVillas.villaIds.length,
);
