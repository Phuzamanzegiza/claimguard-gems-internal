import guidelinesData from '../../data/guidelines/clinical-guidelines.json';

const GUIDELINES = guidelinesData.guidelines;

// ─── Unique categories in display order ───────────────────────────────────────

const CATEGORY_ORDER = [
  'Regulatory',
  'GEMS Reference',
  'ICD-10 Reference',
  'CDL Management',
  'Mental Health',
  'Oncology',
  'Maternity',
  'Emergency Care',
];

const C = {
  navy: '#0B4E80',
  blue: '#1376B7',
  green: '#19A349',
  gold: '#F0A920',
  teal: '#00AC9F',
  red: '#D51F29',
};

const CATEGORY_COLOURS = {
  Regulatory: C.navy,
  'GEMS Reference': C.teal,
  'ICD-10 Reference': C.blue,
  'CDL Management': C.green,
  'Mental Health': C.gold,
  Oncology: C.red,
  Maternity: C.teal,
  'Emergency Care': C.red,
};

function CategoryBadge({ category }) {
  const colour = CATEGORY_COLOURS[category] || C.blue;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: colour,
        background: `${colour}1A`,
        border: `1px solid ${colour}33`,
        borderRadius: 4,
        padding: '1px 7px',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        whiteSpace: 'nowrap',
      }}
    >
      {category}
    </span>
  );
}

function GuidelineLink({ guideline }) {
  return (
    <a
      data-testid={`guideline-link-${guideline.id}`}
      href={guideline.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(96, 165, 250, 0.05)',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(96, 165, 250, 0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 4,
          flexWrap: 'wrap',
        }}
      >
        <span
          data-testid={`guideline-title-${guideline.id}`}
          style={{ fontSize: 13, fontWeight: 600, color: '#C4D1DE', flex: 1 }}
        >
          {guideline.title}
        </span>
        <CategoryBadge category={guideline.category} />
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: '#5A7088',
          lineHeight: 1.5,
        }}
      >
        {guideline.description}
      </p>
      <p
        data-testid={`guideline-source-${guideline.id}`}
        style={{
          margin: '4px 0 0',
          fontSize: 10,
          color: C.blue,
        }}
      >
        {guideline.source}
      </p>
    </a>
  );
}

function CategorySection({ category, items }) {
  return (
    <div
      data-testid={`guideline-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
      style={{ marginBottom: 16 }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: CATEGORY_COLOURS[category] || C.blue,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          padding: '6px 16px',
          background: 'rgba(30,50,68,.4)',
          borderBottom: '1px solid rgba(96, 165, 250, 0.08)',
        }}
      >
        {category}
      </div>
      {items.map((g) => (
        <GuidelineLink key={g.id} guideline={g} />
      ))}
    </div>
  );
}

/**
 * ClinicalGuidelinesPanel
 *
 * Quick-reference links to public clinical guidelines and regulatory documents.
 * All hrefs point to publicly available sources — no personal data.
 *
 * Data sourced from:
 *   src/data/guidelines/clinical-guidelines.json
 *
 * Props:
 *   filterCategory? — string — show only guidelines matching this category
 */
export function ClinicalGuidelinesPanel({ filterCategory } = {}) {
  const filtered = filterCategory
    ? GUIDELINES.filter((g) => g.category === filterCategory)
    : GUIDELINES;

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = filtered.filter((g) => g.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div data-testid="clinical-guidelines-panel">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          padding: '8px 16px',
          background: 'rgba(30,50,68,.6)',
          borderRadius: 8,
          border: '1px solid rgba(96,165,250,.08)',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12, color: '#7B8FA6' }}>
          <strong style={{ color: '#E8EDF3' }}>{filtered.length}</strong> clinical guidelines
        </span>
        <span style={{ fontSize: 10, color: '#3A5068' }}>
          {guidelinesData.source} · Retrieved {guidelinesData.retrieved}
        </span>
      </div>

      {/* Grouped links */}
      <div
        data-testid="guidelines-list"
        style={{
          background: '#1E2A3A',
          borderRadius: 10,
          border: '1px solid rgba(96, 165, 250, 0.08)',
          overflow: 'hidden',
        }}
      >
        {Object.entries(grouped).map(([cat, items]) => (
          <CategorySection key={cat} category={cat} items={items} />
        ))}
      </div>

      {/* Disclaimer */}
      <p
        style={{
          margin: '10px 0 0',
          fontSize: 10,
          color: '#3A5068',
          textAlign: 'right',
        }}
      >
        External links open in a new tab · For internal GEMS MAS reference only
      </p>
    </div>
  );
}

// Export raw data for tests
export { GUIDELINES, CATEGORY_ORDER };
