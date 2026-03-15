import { describe, it, expect } from 'vitest';
import {
  tokenise,
  buildIndex,
  scoreEntry,
  searchIcd10,
  searchDisciplines,
  getEmptySearchState,
} from '../lib/search.js';
import icd10Data from '../data/icd10/icd10-codes.json';
import disciplinesData from '../data/disciplines.json';

const ICD10_CODES = icd10Data.codes;
const DISCIPLINES = disciplinesData;

// ─── tokenise ────────────────────────────────────────────────────────────────

describe('tokenise', () => {
  it('splits on spaces', () => {
    expect(tokenise('Type 2 diabetes')).toContain('type');
    expect(tokenise('Type 2 diabetes')).toContain('diabetes');
  });

  it('splits on hyphens', () => {
    const tokens = tokenise('E11-diabetes');
    expect(tokens).toContain('e11');
    expect(tokens).toContain('diabetes');
  });

  it('lowercases all tokens', () => {
    expect(tokenise('DIABETES MELLITUS')).toEqual(['diabetes', 'mellitus']);
  });

  it('filters tokens shorter than 2 characters', () => {
    const tokens = tokenise('Type 2 diabetes');
    expect(tokens).not.toContain('2');
  });

  it('returns empty array for null', () => {
    expect(tokenise(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(tokenise('')).toEqual([]);
  });
});

// ─── buildIndex ───────────────────────────────────────────────────────────────

describe('buildIndex', () => {
  const sampleCodes = [
    { code: 'E11', description: 'Type 2 diabetes mellitus', chapter: 'E00-E90' },
    { code: 'I21', description: 'Acute myocardial infarction', chapter: 'I00-I99' },
  ];

  it('returns a Map', () => {
    expect(buildIndex(sampleCodes)).toBeInstanceOf(Map);
  });

  it('indexes code tokens', () => {
    const index = buildIndex(sampleCodes);
    expect(index.has('e11')).toBe(true);
    expect(index.has('i21')).toBe(true);
  });

  it('indexes description tokens', () => {
    const index = buildIndex(sampleCodes);
    expect(index.has('diabetes')).toBe(true);
    expect(index.has('mellitus')).toBe(true);
    expect(index.has('infarction')).toBe(true);
  });

  it('maps tokens to correct entry indices', () => {
    const index = buildIndex(sampleCodes);
    expect(index.get('diabetes').has(0)).toBe(true);
    expect(index.get('infarction').has(1)).toBe(true);
    expect(index.get('infarction').has(0)).toBe(false);
  });
});

// ─── scoreEntry ───────────────────────────────────────────────────────────────

describe('scoreEntry', () => {
  const entry = {
    code: 'E11',
    description: 'Type 2 diabetes mellitus',
    chapter: 'E00-E90',
  };

  it('scores exact code match highest', () => {
    expect(scoreEntry(entry, 'E11')).toBeGreaterThanOrEqual(10);
  });

  it('scores code prefix match', () => {
    expect(scoreEntry(entry, 'E1')).toBeGreaterThanOrEqual(5);
  });

  it('scores description keyword match', () => {
    expect(scoreEntry(entry, 'diabetes')).toBeGreaterThanOrEqual(3);
  });

  it('scores description prefix match', () => {
    expect(scoreEntry(entry, 'diab')).toBeGreaterThanOrEqual(1);
  });

  it('returns 0 for non-matching query', () => {
    expect(scoreEntry(entry, 'schizophrenia')).toBe(0);
  });

  it('returns 0 for empty query', () => {
    expect(scoreEntry(entry, '')).toBe(0);
  });
});

// ─── searchIcd10 ─────────────────────────────────────────────────────────────

describe('searchIcd10', () => {
  it('returns matching results for code prefix', () => {
    const results = searchIcd10(ICD10_CODES, 'E11');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].code).toMatch(/^E11/);
  });

  it('exact code match appears first', () => {
    const results = searchIcd10(ICD10_CODES, 'E11');
    expect(results[0].code).toBe('E11');
  });

  it('returns matching results for keyword', () => {
    const results = searchIcd10(ICD10_CODES, 'diabetes');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) =>
      expect(r.description.toLowerCase()).toContain('diabet')
    );
  });

  it('returns matching results for "hypertension"', () => {
    const results = searchIcd10(ICD10_CODES, 'hypertension');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.code === 'I10')).toBe(true);
  });

  it('returns matching results for "asthma"', () => {
    const results = searchIcd10(ICD10_CODES, 'asthma');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.code === 'J45')).toBe(true);
  });

  it('returns matching results for "schizophrenia"', () => {
    const results = searchIcd10(ICD10_CODES, 'schizophrenia');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.code === 'F20')).toBe(true);
  });

  it('handles empty state — query shorter than 2 chars', () => {
    expect(searchIcd10(ICD10_CODES, 'E')).toHaveLength(0);
    expect(searchIcd10(ICD10_CODES, '')).toHaveLength(0);
  });

  it('handles empty state — no match', () => {
    const results = searchIcd10(ICD10_CODES, 'xyzzy');
    expect(results).toHaveLength(0);
  });

  it('handles null codes array', () => {
    expect(searchIcd10(null, 'diabetes')).toHaveLength(0);
  });

  it('respects maxResults option', () => {
    const results = searchIcd10(ICD10_CODES, 'diabetes', { maxResults: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('all results have required fields', () => {
    const results = searchIcd10(ICD10_CODES, 'diabetes');
    for (const r of results) {
      expect(r).toHaveProperty('code');
      expect(r).toHaveProperty('description');
      expect(r).toHaveProperty('chapter');
      expect(r).toHaveProperty('score');
    }
  });

  it('results are sorted by score descending', () => {
    const results = searchIcd10(ICD10_CODES, 'diabetes');
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });
});

// ─── searchDisciplines ────────────────────────────────────────────────────────

describe('searchDisciplines', () => {
  it('returns results for a keyword match', () => {
    const results = searchDisciplines(DISCIPLINES, 'chiro');
    expect(results.length).toBeGreaterThan(0);
  });

  it('handles empty state — short query', () => {
    expect(searchDisciplines(DISCIPLINES, 'c')).toHaveLength(0);
    expect(searchDisciplines(DISCIPLINES, '')).toHaveLength(0);
  });

  it('handles empty state — no match', () => {
    expect(searchDisciplines(DISCIPLINES, 'xyzzyqq')).toHaveLength(0);
  });

  it('handles null disciplines array', () => {
    expect(searchDisciplines(null, 'chiro')).toHaveLength(0);
  });

  it('respects maxResults option', () => {
    const results = searchDisciplines(DISCIPLINES, 'chiro', { maxResults: 1 });
    expect(results.length).toBeLessThanOrEqual(1);
  });

  it('all results have required fields', () => {
    const results = searchDisciplines(DISCIPLINES, 'chiro');
    for (const r of results) {
      expect(r).toHaveProperty('code');
      expect(r).toHaveProperty('sub');
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('category');
      expect(r).toHaveProperty('score');
    }
  });
});

// ─── getEmptySearchState ─────────────────────────────────────────────────────

describe('getEmptySearchState', () => {
  it('returns correct initial shape', () => {
    const state = getEmptySearchState();
    expect(state.results).toEqual([]);
    expect(state.query).toBe('');
    expect(state.hasSearched).toBe(false);
  });
});

// ─── ICD-10 data integrity ────────────────────────────────────────────────────

describe('ICD-10 data file integrity', () => {
  it('loads codes array', () => {
    expect(Array.isArray(ICD10_CODES)).toBe(true);
    expect(ICD10_CODES.length).toBeGreaterThan(0);
  });

  it('all codes have required fields', () => {
    for (const entry of ICD10_CODES) {
      expect(entry).toHaveProperty('code');
      expect(entry).toHaveProperty('description');
      expect(entry).toHaveProperty('chapter');
      expect(entry.code.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });

  it('CDL-relevant codes are present', () => {
    const codes = ICD10_CODES.map((c) => c.code);
    expect(codes).toContain('E11');   // Type 2 diabetes
    expect(codes).toContain('I10');   // Hypertension
    expect(codes).toContain('J45');   // Asthma
    expect(codes).toContain('N18');   // CKD
    expect(codes).toContain('F32');   // Depression
    expect(codes).toContain('G35');   // MS
  });

  it('source metadata is present', () => {
    expect(icd10Data.source).toMatch(/WHO|World Health/i);
    expect(icd10Data.retrieved).toBe('2026-03-15');
  });
});
