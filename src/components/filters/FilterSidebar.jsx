import { useState } from 'react';
import gemsOptionsData from '../../data/gems-options/gems-options.json';

// GEMS brand colours from CLAUDE.md
const COLOURS = {
  navy: '#0B4E80',
  blue: '#1376B7',
  green: '#19A349',
  green2: '#026635',
  gold: '#F0A920',
  gold2: '#CD7B28',
  red: '#D51F29',
  red2: '#AD2225',
  teal: '#00AC9F',
  teal2: '#017E81',
};

// Filter dimension configurations
const FILTER_DIMENSIONS = {
  benefitCategory: {
    label: 'Benefit Category',
    options: [
      { id: 'cdl', label: 'Chronic (CDL)' },
      { id: 'emergency', label: 'Emergency' },
      { id: 'prescribed', label: 'Prescribed' },
    ],
  },
  benefitType: {
    label: 'Benefit Type',
    options: [
      { id: 'hospitalisation', label: 'Hospitalisation' },
      { id: 'specialist', label: 'Specialist' },
      { id: 'radiology', label: 'Radiology' },
      { id: 'pathology', label: 'Pathology' },
      { id: 'mental-health', label: 'Mental Health' },
      { id: 'oncology', label: 'Oncology' },
      { id: 'maternity', label: 'Maternity' },
    ],
  },
  gemsOption: {
    label: 'GEMS Benefit Option',
    options: gemsOptionsData.options.map((opt) => ({
      id: opt.id,
      label: opt.name,
      networkDependent: opt.network_dependent,
      savingsAccount: opt.savings_account,
      colour: opt.colour,
    })),
    multiSelect: true,
  },
  icd10Chapter: {
    label: 'ICD-10 Chapter',
    options: [
      { id: 'A00-B99', label: 'Infectious diseases' },
      { id: 'C00-D48', label: 'Neoplasms' },
      { id: 'D50-D89', label: 'Blood diseases' },
      { id: 'E00-E90', label: 'Endocrine/Metabolic' },
      { id: 'F00-F99', label: 'Mental disorders' },
      { id: 'G00-G99', label: 'Nervous system' },
      { id: 'H00-H59', label: 'Eye diseases' },
      { id: 'H60-H95', label: 'Ear diseases' },
      { id: 'I00-I99', label: 'Circulatory system' },
      { id: 'J00-J99', label: 'Respiratory system' },
      { id: 'K00-K93', label: 'Digestive system' },
      { id: 'L00-L99', label: 'Skin diseases' },
      { id: 'M00-M99', label: 'Musculoskeletal' },
      { id: 'N00-N99', label: 'Genitourinary' },
      { id: 'O00-O99', label: 'Pregnancy' },
      { id: 'P00-P96', label: 'Perinatal' },
      { id: 'Q00-Q99', label: 'Congenital' },
      { id: 'R00-R99', label: 'Symptoms/Signs' },
      { id: 'S00-T98', label: 'Injury/Poisoning' },
      { id: 'Z00-Z99', label: 'Health status' },
    ],
  },
  dtpAlgorithm: {
    label: 'DTP Algorithm',
    options: [
      { id: 'algorithm-a', label: 'Algorithm A' },
      { id: 'algorithm-b', label: 'Algorithm B' },
      { id: 'algorithm-c', label: 'Algorithm C' },
    ],
  },
  fundingModel: {
    label: 'Funding Model',
    options: [
      { id: 'dsp-provider', label: 'DSP Provider' },
      { id: 'non-dsp', label: 'Non-DSP' },
      { id: 'pmb-only', label: 'PMB-only' },
    ],
  },
};

// Network dependency indicator component
function NetworkIndicator() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        color: COLOURS.gold,
        background: 'rgba(240, 169, 32, 0.1)',
        border: '1px solid rgba(240, 169, 32, 0.2)',
        borderRadius: 4,
        padding: '2px 6px',
        marginLeft: 6,
      }}
    >
      🏥 Network
    </span>
  );
}

// Savings account indicator component
function SavingsIndicator() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        color: COLOURS.green,
        background: 'rgba(25, 163, 73, 0.1)',
        border: '1px solid rgba(25, 163, 73, 0.2)',
        borderRadius: 4,
        padding: '2px 6px',
        marginLeft: 6,
      }}
    >
      💰 Savings
    </span>
  );
}

// Single filter pill component
function FilterPill({ option, isSelected, onToggle, showIndicators = false }) {
  return (
    <button
      onClick={() => onToggle(option.id)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 500,
        color: isSelected ? '#FFFFFF' : '#8BA3BC',
        background: isSelected
          ? option.colour || COLOURS.blue
          : 'rgba(139, 163, 188, 0.08)',
        border: '1px solid',
        borderColor: isSelected
          ? option.colour || COLOURS.blue
          : 'rgba(139, 163, 188, 0.12)',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {option.label}
      {showIndicators && option.networkDependent && <NetworkIndicator />}
      {showIndicators && option.savingsAccount && <SavingsIndicator />}
    </button>
  );
}

// Filter group component
function FilterGroup({ dimension, selectedValues, onToggle, multiSelect = false }) {
  const config = FILTER_DIMENSIONS[dimension];
  const isGemsOption = dimension === 'gemsOption';

  return (
    <div style={{ marginBottom: 20 }}>
      <h4
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: COLOURS.blue,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 10,
        }}
      >
        {config.label}
      </h4>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {config.options.map((option) => (
          <FilterPill
            key={option.id}
            option={option}
            isSelected={
              multiSelect || config.multiSelect
                ? selectedValues.includes(option.id)
                : selectedValues === option.id
            }
            onToggle={onToggle}
            showIndicators={isGemsOption}
          />
        ))}
      </div>
    </div>
  );
}

// Main FilterSidebar component
export function FilterSidebar({ filters, onFilterChange, onClearAll }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = (dimension, optionId, multiSelect = false) => {
    if (multiSelect || FILTER_DIMENSIONS[dimension].multiSelect) {
      // Multi-select: toggle option in array
      const current = filters[dimension] || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      onFilterChange(dimension, updated);
    } else {
      // Single-select: set or clear
      const newValue = filters[dimension] === optionId ? null : optionId;
      onFilterChange(dimension, newValue);
    }
  };

  const activeFilterCount = Object.values(filters).reduce((count, value) => {
    if (Array.isArray(value)) return count + value.length;
    return value ? count + 1 : count;
  }, 0);

  return (
    <aside
      style={{
        width: isCollapsed ? 48 : 280,
        minHeight: '100vh',
        background: '#1E2A3A',
        borderRight: '1px solid rgba(96, 165, 250, 0.1)',
        padding: isCollapsed ? 12 : 20,
        transition: 'width 0.2s ease',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        {!isCollapsed && (
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#E8EDF3',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            🔍 Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: COLOURS.blue,
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 10,
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </h3>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'rgba(139, 163, 188, 0.08)',
            border: '1px solid rgba(139, 163, 188, 0.12)',
            borderRadius: 6,
            padding: '6px 8px',
            cursor: 'pointer',
            color: '#8BA3BC',
            fontSize: 14,
          }}
          title={isCollapsed ? 'Expand filters' : 'Collapse filters'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Clear all button */}
          {activeFilterCount > 0 && (
            <button
              onClick={onClearAll}
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: 20,
                fontSize: 12,
                fontWeight: 600,
                color: COLOURS.red,
                background: 'rgba(213, 31, 41, 0.08)',
                border: '1px solid rgba(213, 31, 41, 0.15)',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              ✕ Clear all filters
            </button>
          )}

          {/* Filter groups */}
          <FilterGroup
            dimension="benefitCategory"
            selectedValues={filters.benefitCategory}
            onToggle={(id) => handleToggle('benefitCategory', id)}
          />
          <FilterGroup
            dimension="benefitType"
            selectedValues={filters.benefitType}
            onToggle={(id) => handleToggle('benefitType', id)}
          />
          <FilterGroup
            dimension="gemsOption"
            selectedValues={filters.gemsOption || []}
            onToggle={(id) => handleToggle('gemsOption', id, true)}
            multiSelect
          />
          <FilterGroup
            dimension="icd10Chapter"
            selectedValues={filters.icd10Chapter}
            onToggle={(id) => handleToggle('icd10Chapter', id)}
          />
          <FilterGroup
            dimension="dtpAlgorithm"
            selectedValues={filters.dtpAlgorithm}
            onToggle={(id) => handleToggle('dtpAlgorithm', id)}
          />
          <FilterGroup
            dimension="fundingModel"
            selectedValues={filters.fundingModel}
            onToggle={(id) => handleToggle('fundingModel', id)}
          />
        </>
      )}
    </aside>
  );
}

// Export filter dimensions for use in filter logic
export { FILTER_DIMENSIONS };
