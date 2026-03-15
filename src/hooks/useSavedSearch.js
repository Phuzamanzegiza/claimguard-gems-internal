/**
 * Saved search — localStorage only.
 * Persists filter state (no user identifiers) across page reloads.
 * Clears on explicit user reset.
 *
 * Data rule: only filter key/value pairs are stored.
 * Forbidden fields (memberId, staffId, userId, name, email)
 * are rejected at write time to prevent accidental PII storage.
 */

const STORAGE_KEY = 'claimguard-saved-filter';

const FORBIDDEN_KEYS = ['memberId', 'staffId', 'userId', 'name', 'email', 'id'];

/**
 * Load a previously saved filter state from localStorage.
 * Returns null if nothing is saved or the data is malformed.
 * @returns {{ filters: object, savedAt: string } | null}
 */
export function loadSavedSearch() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.filters) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist a filter state object to localStorage.
 * Rejects objects that contain user-identifier keys.
 *
 * @param {object} filters — filter state to persist
 * @returns {boolean} true on success, false on rejection or write error
 */
export function saveSearch(filters) {
  if (!filters || typeof filters !== 'object') return false;
  if (FORBIDDEN_KEYS.some((k) => k in filters)) return false;

  const payload = { filters, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove the saved filter state from localStorage.
 * @returns {boolean} true on success
 */
export function clearSavedSearch() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Return true if a saved filter state exists in localStorage.
 * @returns {boolean}
 */
export function hasSavedSearch() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

// ─── React hook ───────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

/**
 * useSavedSearch
 *
 * Manages saved filter state in localStorage.
 * No user identifiers are stored at any point.
 *
 * @returns {{
 *   saved: { filters: object, savedAt: string } | null,
 *   save: (filters: object) => boolean,
 *   clear: () => boolean,
 *   hasSaved: boolean,
 * }}
 */
export function useSavedSearch() {
  const [saved, setSaved] = useState(() => loadSavedSearch());

  const save = useCallback((filters) => {
    const ok = saveSearch(filters);
    if (ok) setSaved(loadSavedSearch());
    return ok;
  }, []);

  const clear = useCallback(() => {
    const ok = clearSavedSearch();
    if (ok) setSaved(null);
    return ok;
  }, []);

  return { saved, save, clear, hasSaved: saved !== null };
}
