import gemsOptionsData from '../../data/gems-options/gems-options.json';

const OPTIONS = gemsOptionsData.options;

const TIER_ORDER = { entry: 0, mid: 1, high: 2, top: 3 };

// GEMS brand colours
const C = {
  navy: '#0B4E80',
  blue: '#1376B7',
  green: '#19A349',
  gold: '#F0A920',
  teal: '#00AC9F',
  red: '#D51F29',
};

function NetworkBadge() {
  return (
    <span
      data-testid="network-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        color: C.gold,
        background: 'rgba(240, 169, 32, 0.12)',
        border: '1px solid rgba(240, 169, 32, 0.25)',
        borderRadius: 4,
        padding: '2px 7px',
      }}
    >
      🏥 Network required
    </span>
  );
}

function SavingsBadge() {
  return (
    <span
      data-testid="savings-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        color: C.green,
        background: 'rgba(25, 163, 73, 0.12)',
        border: '1px solid rgba(25, 163, 73, 0.25)',
        borderRadius: 4,
        padding: '2px 7px',
      }}
    >
      💰 Savings account
    </span>
  );
}

function TierLabel({ tier, tierLabel }) {
  const colours = {
    entry: C.teal,
    mid: C.gold,
    high: C.green,
    top: C.navy,
  };
  const colour = colours[tier] || C.blue;
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
      }}
    >
      {tierLabel}
    </span>
  );
}

/**
 * Single GEMS benefit option card.
 * Shows name, tier, description, network-dependency flag, savings flag.
 */
function OptionCard({ option, isHighlighted }) {
  return (
    <div
      data-testid={`option-card-${option.id}`}
      style={{
        background: isHighlighted ? 'rgba(96,165,250,.06)' : '#263545',
        border: `1px solid ${isHighlighted ? 'rgba(96,165,250,.25)' : 'rgba(96,165,250,.08)'}`,
        borderLeft: `4px solid ${option.colour}`,
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: option.colour,
          }}
          data-testid={`option-name-${option.id}`}
        >
          {option.name}
        </span>
        <TierLabel tier={option.tier} tierLabel={option.tier_label} />
        {option.network_dependent && <NetworkBadge />}
        {option.savings_account && <SavingsBadge />}
      </div>

      {/* Description — verbatim from source */}
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: '#8BA3BC',
          lineHeight: 1.55,
        }}
        data-testid={`option-description-${option.id}`}
      >
        {option.description}
      </p>
    </div>
  );
}

/**
 * BenefitOptionScope
 *
 * Displays all six GEMS benefit options with tier, network-dependency,
 * and savings-account indicators.
 *
 * Data sourced verbatim from:
 *   src/data/gems-options/gems-options.json (gems.gov.za/Information/Fact-Sheet)
 *
 * Props:
 *   highlightedOptionIds? — string[] — option IDs to visually highlight
 *                           (e.g. from an active filter selection)
 */
export function BenefitOptionScope({ highlightedOptionIds = [] }) {
  const sorted = [...OPTIONS].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
  );

  const networkOptions = OPTIONS.filter((o) => o.network_dependent);
  const savingsOptions = OPTIONS.filter((o) => o.savings_account);

  return (
    <div data-testid="benefit-option-scope">
      {/* Summary bar */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
          padding: '10px 16px',
          background: 'rgba(30,50,68,.6)',
          borderRadius: 8,
          border: '1px solid rgba(96,165,250,.08)',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 12, color: '#7B8FA6' }}>
          <strong style={{ color: '#E8EDF3' }}>{OPTIONS.length}</strong> benefit options
        </span>
        <span
          style={{ fontSize: 12, color: '#7B8FA6' }}
          data-testid="network-count"
        >
          <strong style={{ color: C.gold }}>{networkOptions.length}</strong> network-dependent
        </span>
        <span
          style={{ fontSize: 12, color: '#7B8FA6' }}
          data-testid="savings-count"
        >
          <strong style={{ color: C.green }}>{savingsOptions.length}</strong> with savings account
        </span>
        <span style={{ fontSize: 12, color: '#5A7088', marginLeft: 'auto' }}>
          Employer subsidy: {gemsOptionsData.employer_subsidy_pct}% (max R
          {gemsOptionsData.employer_subsidy_max_zar.toLocaleString()}/month)
        </span>
      </div>

      {/* Option cards */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        data-testid="option-cards-list"
      >
        {sorted.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            isHighlighted={highlightedOptionIds.includes(option.id)}
          />
        ))}
      </div>

      {/* Source attribution */}
      <p
        style={{
          margin: '12px 0 0',
          fontSize: 10,
          color: '#3A5068',
          textAlign: 'right',
        }}
      >
        Source: {gemsOptionsData.source} · Retrieved {gemsOptionsData.retrieved}
      </p>
    </div>
  );
}

// Export raw option data for use in tests
export { OPTIONS };
