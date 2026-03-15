import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSavedSearch,
  saveSearch,
  clearSavedSearch,
  hasSavedSearch,
} from '../hooks/useSavedSearch.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE_FILTER = {
  benefitCategory: ['chronic'],
  benefitType: ['hospitalisation'],
  gemsOption: ['ruby', 'emerald'],
  icd10Chapter: [],
  dtpAlgorithm: ['algorithm-a'],
  fundingModel: [],
};

beforeEach(() => {
  localStorage.clear();
});

// ─── loadSavedSearch ──────────────────────────────────────────────────────────

describe('loadSavedSearch', () => {
  it('returns null when nothing is saved', () => {
    expect(loadSavedSearch()).toBeNull();
  });

  it('returns saved payload after a successful save', () => {
    saveSearch(SAMPLE_FILTER);
    const result = loadSavedSearch();
    expect(result).not.toBeNull();
    expect(result.filters).toEqual(SAMPLE_FILTER);
  });

  it('returns null for malformed JSON in localStorage', () => {
    localStorage.setItem('claimguard-saved-filter', 'not-valid-json{{{');
    expect(loadSavedSearch()).toBeNull();
  });

  it('returns null when stored object has no filters key', () => {
    localStorage.setItem(
      'claimguard-saved-filter',
      JSON.stringify({ something: 'else' })
    );
    expect(loadSavedSearch()).toBeNull();
  });

  it('preserves the savedAt timestamp', () => {
    saveSearch(SAMPLE_FILTER);
    const result = loadSavedSearch();
    expect(result).toHaveProperty('savedAt');
    expect(typeof result.savedAt).toBe('string');
    expect(result.savedAt.length).toBeGreaterThan(0);
  });
});

// ─── saveSearch ───────────────────────────────────────────────────────────────

describe('saveSearch', () => {
  it('returns true on successful save', () => {
    expect(saveSearch(SAMPLE_FILTER)).toBe(true);
  });

  it('writes to localStorage', () => {
    saveSearch(SAMPLE_FILTER);
    expect(localStorage.getItem('claimguard-saved-filter')).not.toBeNull();
  });

  it('stores filters exactly as provided', () => {
    saveSearch(SAMPLE_FILTER);
    const { filters } = JSON.parse(
      localStorage.getItem('claimguard-saved-filter')
    );
    expect(filters).toEqual(SAMPLE_FILTER);
  });

  it('returns false for null input', () => {
    expect(saveSearch(null)).toBe(false);
  });

  it('returns false for non-object input (string)', () => {
    expect(saveSearch('diabetes')).toBe(false);
  });

  it('returns false for non-object input (number)', () => {
    expect(saveSearch(42)).toBe(false);
  });

  it('returns false when filters contain memberId', () => {
    expect(saveSearch({ ...SAMPLE_FILTER, memberId: '12345' })).toBe(false);
  });

  it('returns false when filters contain staffId', () => {
    expect(saveSearch({ ...SAMPLE_FILTER, staffId: 'S99' })).toBe(false);
  });

  it('returns false when filters contain userId', () => {
    expect(saveSearch({ ...SAMPLE_FILTER, userId: 'u-abc' })).toBe(false);
  });

  it('returns false when filters contain name', () => {
    expect(saveSearch({ ...SAMPLE_FILTER, name: 'John' })).toBe(false);
  });

  it('returns false when filters contain email', () => {
    expect(saveSearch({ ...SAMPLE_FILTER, email: 'a@b.com' })).toBe(false);
  });

  it('returns false when filters contain id', () => {
    expect(saveSearch({ ...SAMPLE_FILTER, id: 'abc' })).toBe(false);
  });

  it('does NOT write to localStorage when input is rejected', () => {
    saveSearch({ ...SAMPLE_FILTER, memberId: '99' });
    expect(localStorage.getItem('claimguard-saved-filter')).toBeNull();
  });

  it('accepts an empty filter object', () => {
    expect(saveSearch({})).toBe(true);
  });

  it('overwrites the previous save on a second call', () => {
    saveSearch(SAMPLE_FILTER);
    const updated = { ...SAMPLE_FILTER, benefitCategory: ['emergency'] };
    saveSearch(updated);
    const { filters } = loadSavedSearch();
    expect(filters.benefitCategory).toEqual(['emergency']);
  });

  it('stored payload does not contain forbidden keys', () => {
    saveSearch(SAMPLE_FILTER);
    const raw = JSON.parse(localStorage.getItem('claimguard-saved-filter'));
    const forbidden = ['memberId', 'staffId', 'userId', 'name', 'email'];
    forbidden.forEach((k) => {
      expect(raw).not.toHaveProperty(k);
      expect(raw.filters).not.toHaveProperty(k);
    });
  });
});

// ─── clearSavedSearch ─────────────────────────────────────────────────────────

describe('clearSavedSearch', () => {
  it('returns true', () => {
    saveSearch(SAMPLE_FILTER);
    expect(clearSavedSearch()).toBe(true);
  });

  it('removes the item from localStorage', () => {
    saveSearch(SAMPLE_FILTER);
    clearSavedSearch();
    expect(localStorage.getItem('claimguard-saved-filter')).toBeNull();
  });

  it('is safe to call when nothing is saved', () => {
    expect(() => clearSavedSearch()).not.toThrow();
    expect(clearSavedSearch()).toBe(true);
  });

  it('loadSavedSearch returns null after clear', () => {
    saveSearch(SAMPLE_FILTER);
    clearSavedSearch();
    expect(loadSavedSearch()).toBeNull();
  });
});

// ─── hasSavedSearch ───────────────────────────────────────────────────────────

describe('hasSavedSearch', () => {
  it('returns false when nothing is saved', () => {
    expect(hasSavedSearch()).toBe(false);
  });

  it('returns true after a successful save', () => {
    saveSearch(SAMPLE_FILTER);
    expect(hasSavedSearch()).toBe(true);
  });

  it('returns false after clear', () => {
    saveSearch(SAMPLE_FILTER);
    clearSavedSearch();
    expect(hasSavedSearch()).toBe(false);
  });

  it('returns false when localStorage contains rejected save', () => {
    // rejected saves do not write to localStorage
    saveSearch({ memberId: '99' });
    expect(hasSavedSearch()).toBe(false);
  });
});

// ─── Round-trip integrity ─────────────────────────────────────────────────────

describe('Round-trip save → load → clear', () => {
  it('filter values survive the round trip exactly', () => {
    saveSearch(SAMPLE_FILTER);
    const { filters } = loadSavedSearch();
    expect(filters.benefitCategory).toEqual(['chronic']);
    expect(filters.benefitType).toEqual(['hospitalisation']);
    expect(filters.gemsOption).toEqual(['ruby', 'emerald']);
    expect(filters.icd10Chapter).toEqual([]);
    expect(filters.dtpAlgorithm).toEqual(['algorithm-a']);
    expect(filters.fundingModel).toEqual([]);
  });

  it('hasSavedSearch is consistent with loadSavedSearch', () => {
    expect(hasSavedSearch()).toBe(false);
    expect(loadSavedSearch()).toBeNull();

    saveSearch(SAMPLE_FILTER);
    expect(hasSavedSearch()).toBe(true);
    expect(loadSavedSearch()).not.toBeNull();

    clearSavedSearch();
    expect(hasSavedSearch()).toBe(false);
    expect(loadSavedSearch()).toBeNull();
  });
});
