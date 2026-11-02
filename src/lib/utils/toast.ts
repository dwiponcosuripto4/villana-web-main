import toast from "svelte-5-french-toast";

/**
 * Toast utility functions for consistent notification styling across the app
 */

export const showToast = {
  /**
   * Show a success toast message
   */
  success: (message: string, options?: any) => {
    return toast.success(message, {
      duration: 4000,
      position: "top-center",
      ...options,
    });
  },

  /**
   * Show an error toast message
   */
  error: (message: string, options?: any) => {
    return toast.error(message, {
      duration: 6000,
      position: "top-center",
      ...options,
    });
  },

  /**
   * Show an info toast message
   */
  info: (message: string, options?: any) => {
    return toast(message, {
      icon: "ℹ️",
      duration: 4000,
      position: "top-center",
      ...options,
    });
  },

  /**
   * Show a loading toast message
   */
  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      position: "top-center",
      ...options,
    });
  },

  /**
   * Show a promise-based toast with loading, success, and error states
   */
  promise: async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: any,
  ) => {
    return toast.promise(promise, messages, {
      position: "top-center",
      ...options,
    });
  },

  /**
   * Dismiss a specific toast by id
   */
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  /**
   * Remove a specific toast by id
   */
  remove: (toastId?: string) => {
    return toast.remove(toastId);
  },
};

/**
 * Pre-configured toast messages for common operations
 */
export const toastMessages = {
  villa: {
    saved: "Villa saved to your favorites",
    removed: "Villa removed from favorites",
    saveError: "Failed to save villa. Please try again.",
    removeError: "Failed to remove villa. Please try again.",
  },
  auth: {
    loginSuccess: "Successfully logged in",
    logoutSuccess: "Successfully logged out",
    loginError: "Login failed. Please check your credentials.",
    unauthorized: "You need to be logged in to perform this action",
  },
  admin: {
    villaCreated: "Villa created successfully",
    villaUpdated: "Villa updated successfully",
    villaDeleted: "Villa deleted successfully",
    operationError: "Operation failed. Please try again.",
  },
  general: {
    networkError: "Network error. Please check your connection.",
    unexpectedError: "Something went wrong. Please try again.",
  },
};
