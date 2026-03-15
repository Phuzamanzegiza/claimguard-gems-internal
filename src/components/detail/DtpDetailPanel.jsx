import dtpAlgorithmsData from '../../data/dtp/dtp-algorithms.json';

// Build a lookup map from the JSON data
const ALGORITHM_MAP = Object.fromEntries(
  dtpAlgorithmsData.algorithms.map((alg) => [alg.id, alg])
);

// Normalise an algorithm string from a PMB record to one of the algorithm IDs
function resolveAlgorithmId(algorithmStr) {
  if (!algorithmStr) return null;
  const normalised = algorithmStr.toLowerCase().replace(/\s+/g, '-');
  // Direct match (e.g. 'algorithm-a')
  if (ALGORITHM_MAP[normalised]) return normalised;
  // Suffix match — 'a' → 'algorithm-a'
  const suffixMatch = Object.keys(ALGORITHM_MAP).find((id) =>
    id.endsWith(`-${normalised}`)
  );
  return suffixMatch || null;
}

// GEMS colours
const C = {
  navy: '#0B4E80',
  blue: '#1376B7',
  green: '#19A349',
  gold: '#F0A920',
  red: '#D51F29',
  teal: '#00AC9F',
};

function AlgorithmBadge({ label }) {
  const colour =
    label === 'Algorithm A' ? C.blue
    : label === 'Algorithm B' ? C.gold
    : C.teal;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.5px',
        color: '#FFFFFF',
        background: colour,
      }}
    >
      {label}
    </span>
  );
}

function KeyRulesList({ rules }) {
  return (
    <ul
      style={{
        margin: '10px 0 0',
        paddingLeft: 20,
        fontSize: 13,
        lineHeight: 1.7,
        color: '#C4D1DE',
      }}
    >
      {rules.map((rule, i) => (
        <li key={i} style={{ marginBottom: 4 }}>
          {rule}
        </li>
      ))}
    </ul>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.blue,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: 8,
      }}
    >
      {children}
    </p>
  );
}

// Empty / placeholder state
function EmptyState() {
  return (
    <div
      style={{
        padding: '40px 24px',
        textAlign: 'center',
        color: '#5A7088',
        fontSize: 13,
      }}
      data-testid="dtp-detail-empty"
    >
      <p style={{ fontSize: 28, margin: '0 0 12px' }}>📋</p>
      <p style={{ margin: 0, fontWeight: 600 }}>Select a PMB condition</p>
      <p style={{ margin: '6px 0 0', fontSize: 12 }}>
        Click a result to view the DTP algorithm detail.
      </p>
    </div>
  );
}

/**
 * DtpDetailPanel
 *
 * Props:
 *   pmb  — PMB result object (from App search results), or null
 *          Expected shape: { d, n, t, c, l, codes, algorithm }
 *
 * Shows verbatim DTP algorithm text sourced from
 * src/data/dtp/dtp-algorithms.json (CMS public data).
 */
export function DtpDetailPanel({ pmb }) {
  if (!pmb) return <EmptyState />;

  const algorithmId = resolveAlgorithmId(pmb.algorithm || pmb.dtp);
  const algorithm = algorithmId ? ALGORITHM_MAP[algorithmId] : null;

  return (
    <div
      data-testid="dtp-detail-panel"
      style={{
        background: '#263545',
        borderRadius: 14,
        border: '1px solid rgba(96, 165, 250, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 22px',
          background:
            'linear-gradient(135deg, rgba(96,165,250,.08), rgba(56,189,248,.04))',
          borderBottom: '1px solid rgba(96, 165, 250, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              background: 'rgba(96, 165, 250, 0.15)',
              color: '#60A5FA',
              padding: '2px 8px',
              borderRadius: 5,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Source Code Pro', monospace",
              letterSpacing: '0.5px',
            }}
            data-testid="dtp-code"
          >
            {pmb.d}
          </span>
          {pmb.l && (
            <span
              style={{
                background: 'rgba(251,191,36,.12)',
                color: '#FBBF24',
                padding: '2px 8px',
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              CDL
            </span>
          )}
          {algorithm && <AlgorithmBadge label={algorithm.label} />}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: '#E8EDF3',
            lineHeight: 1.4,
          }}
          data-testid="dtp-name"
        >
          {pmb.n}
        </h2>
        {pmb.c && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              color: '#7B8FA6',
            }}
          >
            {pmb.c}
          </p>
        )}
      </div>

      {/* Algorithm detail section */}
      {algorithm ? (
        <div
          style={{ padding: '16px 22px', borderBottom: '1px solid rgba(96,165,250,.06)' }}
          data-testid="dtp-algorithm-section"
        >
          <SectionLabel>DTP Algorithm — {algorithm.label}</SectionLabel>
          <div
            style={{
              background: 'rgba(19, 118, 183, 0.06)',
              border: '1px solid rgba(19, 118, 183, 0.15)',
              borderLeft: `3px solid ${C.blue}`,
              borderRadius: 10,
              padding: '14px 18px',
              fontSize: 13,
              lineHeight: 1.7,
              color: '#C4D1DE',
            }}
            data-testid="dtp-algorithm-description"
          >
            {algorithm.description}
          </div>
          <SectionLabel style={{ marginTop: 14 }}>Key Rules</SectionLabel>
          <KeyRulesList rules={algorithm.key_rules} />
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 11,
              color: '#5A7088',
              fontStyle: 'italic',
            }}
            data-testid="dtp-algorithm-applicability"
          >
            {algorithm.applicability}
          </p>
        </div>
      ) : (
        <div
          style={{
            padding: '14px 22px',
            borderBottom: '1px solid rgba(96,165,250,.06)',
            fontSize: 12,
            color: '#5A7088',
          }}
          data-testid="dtp-algorithm-unknown"
        >
          Algorithm not specified for this DTP entry.
        </div>
      )}

      {/* Treatment section */}
      {pmb.t && (
        <div
          style={{ padding: '16px 22px', borderBottom: '1px solid rgba(96,165,250,.06)' }}
        >
          <SectionLabel>Treatment Protocol</SectionLabel>
          <div
            style={{
              background: 'rgba(45,212,191,.06)',
              border: '1px solid rgba(45,212,191,.12)',
              borderLeft: '3px solid #2DD4BF',
              borderRadius: 10,
              padding: '14px 18px',
              fontSize: 13,
              lineHeight: 1.7,
              color: '#C4D1DE',
            }}
            data-testid="dtp-treatment"
          >
            {pmb.t}
          </div>
        </div>
      )}

      {/* ICD-10 codes section */}
      {pmb.codes && pmb.codes.length > 0 && (
        <div style={{ padding: '16px 22px' }}>
          <SectionLabel>ICD-10 Codes ({pmb.codes.length})</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pmb.codes.map((code, i) => {
              const [icd, desc] = Array.isArray(code) ? code : [code, ''];
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'rgba(45,212,191,.04)',
                  }}
                  data-testid={`icd-code-${i}`}
                >
                  <span
                    style={{
                      fontFamily: "'Source Code Pro', monospace",
                      fontWeight: 700,
                      color: '#2DD4BF',
                      fontSize: 12,
                      minWidth: 52,
                    }}
                  >
                    {icd}
                  </span>
                  <span style={{ fontSize: 12, color: '#8BA3BC', lineHeight: 1.4 }}>
                    {desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data source footer */}
      <div
        style={{
          padding: '10px 22px',
          borderTop: '1px solid rgba(96,165,250,.06)',
          fontSize: 10,
          color: '#3A5068',
        }}
      >
        Source: {dtpAlgorithmsData.source} · Retrieved {dtpAlgorithmsData.retrieved}
      </div>
    </div>
  );
}

// Export resolver for use in tests
export { resolveAlgorithmId, ALGORITHM_MAP };
