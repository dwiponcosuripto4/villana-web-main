import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

// Network status store
function createNetworkStore() {
  // Initialize with navigator.onLine if available, otherwise assume online
  const initialOnline = browser ? navigator.onLine : true;
  const { subscribe, set } = writable<boolean>(initialOnline);

  // Set up event listeners in browser
  if (browser) {
    const updateOnline = () => set(navigator.onLine);

    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    // Clean up function (though not easily accessible in this pattern)
    // In a real app, you might want to return cleanup function
  }

  return {
    subscribe,
    // Manual override for testing
    setOnline: (online: boolean) => set(online),
  };
}

export const isOnline = createNetworkStore();

// Derived stores for convenience
export const isOffline = derived(isOnline, ($isOnline) => !$isOnline);

// Network-aware fetch wrapper
export async function networkAwareFetch(
  url: string,
  options?: RequestInit,
  fallbackData?: any,
): Promise<Response | null> {
  if (!browser) {
    // SSR - just attempt the fetch
    try {
      return await fetch(url, options);
    } catch (error) {
      console.warn("SSR fetch failed:", error);
      return null;
    }
  }

  // Browser - check network status
  if (!navigator.onLine) {
    console.warn("Network is offline, skipping fetch for:", url);
    return null;
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.warn("Network fetch failed:", error);
    // Update online status if fetch fails (might indicate network issues)
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      isOnline.setOnline(false);
      // Set a timeout to check connectivity again
      setTimeout(() => {
        if (navigator.onLine) {
          isOnline.setOnline(true);
        }
      }, 5000);
    }
    return null;
  }
}

// Retry mechanism for failed network requests
export function createRetryFetch(maxRetries: number = 3, delay: number = 1000) {
  return async function retryFetch(
    url: string,
    options?: RequestInit,
  ): Promise<Response | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await networkAwareFetch(url, options);
        if (response && response.ok) {
          return response;
        }
        // If response is not ok, throw to trigger retry
        if (response) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if we're offline
        if (!navigator.onLine) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, attempt)),
          );
        }
      }
    }

    console.error(
      `All ${maxRetries} fetch attempts failed for ${url}:`,
      lastError,
    );
    return null;
  };
}

// Background sync queue for when coming back online
interface QueuedAction {
  id: string;
  type: "save" | "remove";
  villaId: number;
  timestamp: Date;
  retries: number;
}

class OfflineActionQueue {
  private queue: QueuedAction[] = [];
  private readonly STORAGE_KEY = "villana_offline_queue";
  private readonly MAX_RETRIES = 3;

  constructor() {
    if (browser) {
      this.loadQueue();
      // Process queue when coming back online
      isOnline.subscribe((online) => {
        if (online && this.queue.length > 0) {
          this.processQueue();
        }
      });
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (error) {
      console.error("Error loading offline queue:", error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Error saving offline queue:", error);
    }
  }

  addAction(type: "save" | "remove", villaId: number) {
    const action: QueuedAction = {
      id: `${type}-${villaId}-${Date.now()}`,
      type,
      villaId,
      timestamp: new Date(),
      retries: 0,
    };

    // Remove any existing actions for this villa of the opposite type
    this.queue = this.queue.filter(
      (item) => !(item.villaId === villaId && item.type !== type),
    );

    // Add or update action
    const existingIndex = this.queue.findIndex(
      (item) => item.villaId === villaId && item.type === type,
    );

    if (existingIndex >= 0) {
      this.queue[existingIndex] = action;
    } else {
      this.queue.push(action);
    }

    this.saveQueue();
  }

  async processQueue() {
    if (!browser || this.queue.length === 0) return;

    const actionsToProcess = [...this.queue];

    for (const action of actionsToProcess) {
      try {
        const url = `/api/villas/${action.villaId}/save`;
        const method = action.type === "save" ? "POST" : "DELETE";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          // Remove successful action from queue
          this.queue = this.queue.filter((item) => item.id !== action.id);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn(`Failed to process offline action ${action.id}:`, error);

        // Increment retry count
        action.retries++;

        // Remove if max retries exceeded
        if (action.retries >= this.MAX_RETRIES) {
          console.error(
            `Removing action ${action.id} after ${this.MAX_RETRIES} failed attempts`,
          );
          this.queue = this.queue.filter((item) => item.id !== action.id);
        }
      }
    }

    this.saveQueue();
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineQueue = new OfflineActionQueue();
