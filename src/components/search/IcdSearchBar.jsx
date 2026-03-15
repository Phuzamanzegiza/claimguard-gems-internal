import { useState, useCallback } from 'react';
import icd10Data from '../../data/icd10/icd10-codes.json';
import disciplinesData from '../../data/disciplines.json';
import { searchIcd10, searchDisciplines } from '../../lib/search.js';

const C = {
  navy: '#0B4E80',
  blue: '#1376B7',
  green: '#19A349',
  gold: '#F0A920',
  teal: '#00AC9F',
  red: '#D51F29',
};

const ICD10_CODES = icd10Data.codes;
const DISCIPLINES = disciplinesData;

function ChapterBadge({ chapter }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: C.teal,
        background: 'rgba(0, 172, 159, 0.1)',
        border: '1px solid rgba(0, 172, 159, 0.2)',
        borderRadius: 4,
        padding: '1px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {chapter}
    </span>
  );
}

function Icd10ResultRow({ entry }) {
  return (
    <div
      data-testid="icd-result-row"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 14px',
        borderBottom: '1px solid rgba(96, 165, 250, 0.05)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(96, 165, 250, 0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        style={{
          fontFamily: "'Source Code Pro', monospace",
          fontWeight: 700,
          color: '#2DD4BF',
          fontSize: 12,
          minWidth: 52,
          paddingTop: 1,
        }}
        data-testid="icd-result-code"
      >
        {entry.code}
      </span>
      <span
        style={{ flex: 1, fontSize: 13, color: '#C4D1DE', lineHeight: 1.45 }}
        data-testid="icd-result-description"
      >
        {entry.description}
      </span>
      <ChapterBadge chapter={entry.chapter} />
    </div>
  );
}

function DisciplineResultRow({ entry }) {
  return (
    <div
      data-testid="discipline-result-row"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 14px',
        borderBottom: '1px solid rgba(96, 165, 250, 0.05)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(96, 165, 250, 0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        style={{
          fontFamily: "'Source Code Pro', monospace",
          fontWeight: 700,
          color: C.gold,
          fontSize: 12,
          minWidth: 60,
          paddingTop: 1,
        }}
        data-testid="discipline-result-code"
      >
        {entry.code}/{entry.sub}
      </span>
      <span style={{ flex: 1, fontSize: 13, color: '#C4D1DE', lineHeight: 1.45 }}>
        {entry.name}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: C.blue,
          background: 'rgba(19, 118, 183, 0.1)',
          border: '1px solid rgba(19, 118, 183, 0.2)',
          borderRadius: 4,
          padding: '1px 6px',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.category}
      </span>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div
      data-testid="search-empty-state"
      style={{
        padding: '32px 24px',
        textAlign: 'center',
        color: '#5A7088',
        fontSize: 13,
      }}
    >
      <p style={{ fontSize: 24, margin: '0 0 10px' }}>🔍</p>
      <p style={{ margin: 0, fontWeight: 600, color: '#7B8FA6' }}>
        No results for &ldquo;{query}&rdquo;
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 12 }}>
        Try a code prefix (e.g. E11) or a keyword (e.g. diabetes)
      </p>
    </div>
  );
}

function SearchPrompt() {
  return (
    <div
      data-testid="search-prompt"
      style={{
        padding: '20px 24px',
        textAlign: 'center',
        color: '#5A7088',
        fontSize: 12,
      }}
    >
      Type 2+ characters — search ICD-10 codes and tariff disciplines
    </div>
  );
}

/**
 * IcdSearchBar
 *
 * Standalone search bar for ICD-10 codes and tariff discipline codes.
 * Data sourced from:
 *   src/data/icd10/icd10-codes.json (WHO public codebook)
 *   src/data/disciplines.json (tariff discipline codes)
 *
 * Props:
 *   onSelectIcd10?      — callback(entry) when an ICD-10 result is selected
 *   onSelectDiscipline? — callback(entry) when a discipline result is selected
 */
export function IcdSearchBar({ onSelectIcd10, onSelectDiscipline }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('icd10');
  const [hasSearched, setHasSearched] = useState(false);

  const icdResults = searchIcd10(ICD10_CODES, query);
  const disciplineResults = searchDisciplines(DISCIPLINES, query);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    setHasSearched(val.trim().length >= 2);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setHasSearched(false);
  }, []);

  const results = activeTab === 'icd10' ? icdResults : disciplineResults;
  const showEmpty = hasSearched && results.length === 0;
  const showResults = hasSearched && results.length > 0;

  return (
    <div data-testid="icd-search-bar">
      {/* Search input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#263545',
          borderRadius: 12,
          border: '1px solid rgba(96, 165, 250, 0.18)',
          padding: '4px 16px',
          gap: 8,
          boxShadow: '0 2px 16px rgba(0,0,0,.15)',
          marginBottom: 10,
        }}
      >
        <span style={{ color: '#5A7088', fontSize: 16 }}>🔍</span>
        <input
          data-testid="search-input"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search ICD-10 code or description (e.g. E11, diabetes)"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#E8EDF3',
            fontSize: 14,
            padding: '12px 0',
            fontFamily: 'inherit',
            fontWeight: 500,
          }}
        />
        {query && (
          <button
            data-testid="search-clear"
            onClick={handleClear}
            style={{
              background: 'rgba(96, 165, 250, 0.12)',
              border: 'none',
              color: '#8BA3BC',
              width: 28,
              height: 28,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[
          { id: 'icd10', label: `ICD-10 Codes${icdResults.length > 0 ? ` (${icdResults.length})` : ''}` },
          { id: 'disciplines', label: `Tariff Disciplines${disciplineResults.length > 0 ? ` (${disciplineResults.length})` : ''}` },
        ].map((tab) => (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background:
                activeTab === tab.id
                  ? 'rgba(96, 165, 250, 0.12)'
                  : 'transparent',
              borderColor:
                activeTab === tab.id
                  ? 'rgba(96, 165, 250, 0.35)'
                  : 'rgba(96, 165, 250, 0.08)',
              color: activeTab === tab.id ? '#60A5FA' : '#7B8FA6',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results panel */}
      <div
        style={{
          background: '#1E2A3A',
          borderRadius: 10,
          border: '1px solid rgba(96, 165, 250, 0.08)',
          overflow: 'hidden',
        }}
      >
        {!hasSearched && <SearchPrompt />}
        {showEmpty && <EmptyState query={query} />}
        {showResults && (
          <div data-testid="search-results">
            {activeTab === 'icd10'
              ? icdResults.map((entry) => (
                  <div
                    key={entry.code}
                    onClick={() => onSelectIcd10?.(entry)}
                    style={{ cursor: onSelectIcd10 ? 'pointer' : 'default' }}
                  >
                    <Icd10ResultRow entry={entry} />
                  </div>
                ))
              : disciplineResults.map((entry) => (
                  <div
                    key={`${entry.code}/${entry.sub}`}
                    onClick={() => onSelectDiscipline?.(entry)}
                    style={{ cursor: onSelectDiscipline ? 'pointer' : 'default' }}
                  >
                    <DisciplineResultRow entry={entry} />
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
