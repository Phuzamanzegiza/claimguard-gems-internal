/**
 * ICD-10 and tariff code search — pure functions, no side effects.
 * Builds an inverted index for prefix and keyword matching.
 */

/**
 * Tokenise a string into lowercase search tokens.
 * Splits on whitespace and punctuation; filters short tokens.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenise(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[\s\-/,()\\.]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/**
 * Build an inverted index from an array of ICD-10 code objects.
 *
 * Each entry in the index maps a token → Set of code indices.
 *
 * @param {Array<{code: string, description: string, chapter: string}>} codes
 * @returns {Map<string, Set<number>>}
 */
export function buildIndex(codes) {
  const index = new Map();

  codes.forEach((entry, i) => {
    const tokens = [
      ...tokenise(entry.code),
      ...tokenise(entry.description),
      ...tokenise(entry.chapter),
    ];

    for (const token of tokens) {
      if (!index.has(token)) index.set(token, new Set());
      index.get(token).add(i);
    }
  });

  return index;
}

/**
 * Score a single ICD-10 entry against a query string.
 * Higher score = better match.
 *
 * Scoring rules:
 *   +10  exact code match (case-insensitive)
 *   +5   code starts with query
 *   +3   description token exact match
 *   +1   description token prefix match
 *
 * @param {Object} entry
 * @param {string} query
 * @returns {number}
 */
export function scoreEntry(entry, query) {
  if (!query) return 0;
  const q = query.trim().toLowerCase();
  const codeNorm = entry.code.toLowerCase();
  const descNorm = entry.description.toLowerCase();

  let score = 0;

  if (codeNorm === q) score += 10;
  else if (codeNorm.startsWith(q)) score += 5;

  const descTokens = tokenise(entry.description);
  for (const token of descTokens) {
    if (token === q) score += 3;
    else if (token.startsWith(q)) score += 1;
  }

  return score;
}

/**
 * Search ICD-10 codes for a query string.
 * Supports both code prefix search (e.g. "E11") and keyword search.
 *
 * @param {Array<{code: string, description: string, chapter: string}>} codes
 * @param {string} query
 * @param {Object} [options]
 * @param {number} [options.maxResults=20]
 * @returns {Array<{code: string, description: string, chapter: string, score: number}>}
 */
export function searchIcd10(codes, query, { maxResults = 20 } = {}) {
  if (!codes || !Array.isArray(codes)) return [];
  const q = (query || '').trim();
  if (q.length < 2) return [];

  return codes
    .map((entry) => ({ ...entry, score: scoreEntry(entry, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code))
    .slice(0, maxResults);
}

/**
 * Search tariff discipline codes.
 *
 * @param {Array<{code: string, sub: string, name: string, category: string}>} disciplines
 * @param {string} query
 * @param {Object} [options]
 * @param {number} [options.maxResults=20]
 * @returns {Array<{code: string, sub: string, name: string, category: string, score: number}>}
 */
export function searchDisciplines(disciplines, query, { maxResults = 20 } = {}) {
  if (!disciplines || !Array.isArray(disciplines)) return [];
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  return disciplines
    .map((entry) => {
      const fullCode = `${entry.code}/${entry.sub}`;
      let score = 0;
      if (fullCode.startsWith(q) || entry.code.startsWith(q)) score += 5;
      const nameTokens = tokenise(entry.name);
      for (const token of nameTokens) {
        if (token === q) score += 3;
        else if (token.startsWith(q)) score += 1;
      }
      if (entry.category.toLowerCase().includes(q)) score += 1;
      return { ...entry, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code))
    .slice(0, maxResults);
}

/**
 * Get the empty search result state.
 * @returns {{ results: [], query: string, hasSearched: boolean }}
 */
export function getEmptySearchState() {
  return { results: [], query: '', hasSearched: false };
}
