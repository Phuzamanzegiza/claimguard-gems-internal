import { describe, it, expect } from 'vitest';
import { OPTIONS } from '../components/options/BenefitOptionScope.jsx';
import gemsOptionsData from '../data/gems-options/gems-options.json';

// ─── Data integrity ───────────────────────────────────────────────────────────

describe('GEMS options data file', () => {
  it('contains exactly 6 benefit options', () => {
    expect(OPTIONS).toHaveLength(6);
  });

  it('all six correct option IDs are present', () => {
    const ids = OPTIONS.map((o) => o.id);
    expect(ids).toContain('tanzanite-one');
    expect(ids).toContain('beryl');
    expect(ids).toContain('ruby');
    expect(ids).toContain('emerald-value');
    expect(ids).toContain('emerald');
    expect(ids).toContain('onyx');
  });

  it('does not contain forbidden option names', () => {
    const names = OPTIONS.map((o) => o.name.toLowerCase());
    expect(names).not.toContain('sapphire');
    expect(names.every((n) => n !== 'tanzanite')).toBe(true); // must be "tanzanite one"
  });

  it('each option has required fields', () => {
    for (const opt of OPTIONS) {
      expect(opt).toHaveProperty('id');
      expect(opt).toHaveProperty('name');
      expect(opt).toHaveProperty('tier');
      expect(opt).toHaveProperty('tier_label');
      expect(opt).toHaveProperty('network_dependent');
      expect(opt).toHaveProperty('savings_account');
      expect(opt).toHaveProperty('description');
      expect(opt).toHaveProperty('colour');
    }
  });

  it('source metadata is from gems.gov.za', () => {
    expect(gemsOptionsData.source).toMatch(/gems\.gov\.za/i);
    expect(gemsOptionsData.retrieved).toBe('2026-03-15');
  });

  it('employer subsidy is correct', () => {
    expect(gemsOptionsData.employer_subsidy_pct).toBe(75);
    expect(gemsOptionsData.employer_subsidy_max_zar).toBe(4987);
  });
});

// ─── Network dependency ───────────────────────────────────────────────────────

describe('Network-dependent options', () => {
  const networkOptions = OPTIONS.filter((o) => o.network_dependent);
  const nonNetworkOptions = OPTIONS.filter((o) => !o.network_dependent);

  it('exactly 3 options are network-dependent', () => {
    expect(networkOptions).toHaveLength(3);
  });

  it('Tanzanite One is network-dependent', () => {
    const opt = OPTIONS.find((o) => o.id === 'tanzanite-one');
    expect(opt.network_dependent).toBe(true);
  });

  it('Beryl is network-dependent', () => {
    const opt = OPTIONS.find((o) => o.id === 'beryl');
    expect(opt.network_dependent).toBe(true);
  });

  it('Emerald Value is network-dependent', () => {
    const opt = OPTIONS.find((o) => o.id === 'emerald-value');
    expect(opt.network_dependent).toBe(true);
  });

  it('Ruby is NOT network-dependent', () => {
    const opt = OPTIONS.find((o) => o.id === 'ruby');
    expect(opt.network_dependent).toBe(false);
  });

  it('Emerald is NOT network-dependent', () => {
    const opt = OPTIONS.find((o) => o.id === 'emerald');
    expect(opt.network_dependent).toBe(false);
  });

  it('Onyx is NOT network-dependent', () => {
    const opt = OPTIONS.find((o) => o.id === 'onyx');
    expect(opt.network_dependent).toBe(false);
  });

  it('network-dependent options are the correct three by name', () => {
    const networkNames = networkOptions.map((o) => o.name);
    expect(networkNames).toContain('Tanzanite One');
    expect(networkNames).toContain('Beryl');
    expect(networkNames).toContain('Emerald Value');
  });

  it('non-network options are the correct three by name', () => {
    const nonNetworkNames = nonNetworkOptions.map((o) => o.name);
    expect(nonNetworkNames).toContain('Ruby');
    expect(nonNetworkNames).toContain('Emerald');
    expect(nonNetworkNames).toContain('Onyx');
  });
});

// ─── Savings account ─────────────────────────────────────────────────────────

describe('Savings account options', () => {
  const savingsOptions = OPTIONS.filter((o) => o.savings_account);

  it('exactly 1 option has a savings account', () => {
    expect(savingsOptions).toHaveLength(1);
  });

  it('Ruby is the only option with a savings account', () => {
    expect(savingsOptions[0].id).toBe('ruby');
    expect(savingsOptions[0].name).toBe('Ruby');
  });

  it('all other options have no savings account', () => {
    const nonSavings = OPTIONS.filter((o) => o.id !== 'ruby');
    nonSavings.forEach((opt) => {
      expect(opt.savings_account).toBe(false);
    });
  });
});

// ─── Tier structure ───────────────────────────────────────────────────────────

describe('Tier structure', () => {
  it('Tanzanite One and Beryl are Entry Level', () => {
    ['tanzanite-one', 'beryl'].forEach((id) => {
      const opt = OPTIONS.find((o) => o.id === id);
      expect(opt.tier).toBe('entry');
    });
  });

  it('Ruby is Mid Level', () => {
    const opt = OPTIONS.find((o) => o.id === 'ruby');
    expect(opt.tier).toBe('mid');
  });

  it('Emerald Value and Emerald are High Level', () => {
    ['emerald-value', 'emerald'].forEach((id) => {
      const opt = OPTIONS.find((o) => o.id === id);
      expect(opt.tier).toBe('high');
    });
  });

  it('Onyx is Top Level', () => {
    const opt = OPTIONS.find((o) => o.id === 'onyx');
    expect(opt.tier).toBe('top');
  });
});

// ─── Description verbatim check ───────────────────────────────────────────────

describe('Option descriptions', () => {
  it('all descriptions are non-empty', () => {
    OPTIONS.forEach((opt) => {
      expect(opt.description.length).toBeGreaterThan(20);
    });
  });

  it('network-dependent descriptions reference network or network-dependent concepts', () => {
    const networkOpts = OPTIONS.filter((o) => o.network_dependent);
    networkOpts.forEach((opt) => {
      expect(opt.description.toLowerCase()).toMatch(/network/i);
    });
  });

  it('Ruby description references savings', () => {
    const ruby = OPTIONS.find((o) => o.id === 'ruby');
    expect(ruby.description.toLowerCase()).toMatch(/savings/i);
  });
});
