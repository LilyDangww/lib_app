"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role_id: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  gender: string | null;
  dob: string | null;
  phone: string | null;
  joined_at: string;
  roles: string;
}

const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "token";
const AUTH_EVENT_NAME = "auth-state-changed";

/**
 * Reusable hook for managing user information in localStorage
 * Provides methods to get, set, update, and clear user data
 */
export const useUser = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem(USER_STORAGE_KEY);
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Listen for storage changes (e.g., logout from another tab)
    window.addEventListener("storage", loadUser);

    // Listen for custom auth events (e.g., login/logout/user update)
    window.addEventListener(AUTH_EVENT_NAME, loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener(AUTH_EVENT_NAME, loadUser);
    };
  }, []);

  /**
   * Set user data in localStorage and update state
   */
  const setUserData = useCallback((userData: UserInfo | null) => {
    try {
      if (userData) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
        // Dispatch event to notify other components
        window.dispatchEvent(new Event(AUTH_EVENT_NAME));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
        window.dispatchEvent(new Event(AUTH_EVENT_NAME));
      }
    } catch (error) {
      console.error("Error setting user data:", error);
    }
  }, []);

  /**
   * Update user data in localStorage (merges with existing data)
   */
  const updateUserData = useCallback((updates: Partial<UserInfo>) => {
    try {
      const currentUserStr = localStorage.getItem(USER_STORAGE_KEY);
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        // Dispatch event to notify other components
        window.dispatchEvent(new Event(AUTH_EVENT_NAME));
      }
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  }, []);

  /**
   * Update user data from UserProfile (from API)
   * Maps UserProfile fields to UserInfo format
   */
  const updateUserFromProfile = useCallback((profile: UserProfile) => {
    try {
      const currentUserStr = localStorage.getItem(USER_STORAGE_KEY);
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        // Update user data with profile data (keep role_id if not in profile)
        const updatedUser: UserInfo = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          role_id: currentUser.role_id || 3, // Default to reader role if not available
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        // Dispatch event to notify other components
        window.dispatchEvent(new Event(AUTH_EVENT_NAME));
      }
    } catch (error) {
      console.error("Error updating user from profile:", error);
    }
  }, []);

  /**
   * Clear user data from localStorage
   */
  const clearUser = useCallback(() => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      // Dispatch event to notify other components
      window.dispatchEvent(new Event(AUTH_EVENT_NAME));
    } catch (error) {
      console.error("Error clearing user data:", error);
    }
  }, []);

  /**
   * Get token from localStorage
   */
  const getToken = useCallback(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }, []);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = useCallback(() => {
    return !!user && !!getToken();
  }, [user, getToken]);

  return {
    user,
    isLoading,
    setUserData,
    updateUserData,
    updateUserFromProfile,
    clearUser,
    getToken,
    isAuthenticated: isAuthenticated(),
  };
};

