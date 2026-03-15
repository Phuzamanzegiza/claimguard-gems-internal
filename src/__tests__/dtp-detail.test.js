import { describe, it, expect } from 'vitest';
import { resolveAlgorithmId, ALGORITHM_MAP } from '../components/detail/DtpDetailPanel.jsx';

// Sample PMB records matching the App.jsx data shape
const diabetesPmb = {
  d: 'DTP177',
  n: 'Diabetes Mellitus Type 2',
  t: 'Oral hypoglycaemic agents and/or insulin as clinically indicated.',
  c: 'Chronic Disease List, Endocrine',
  l: true,
  algorithm: 'Algorithm A',
  codes: [['E11', 'Type 2 diabetes mellitus without complications']],
};

const miPmb = {
  d: 'DTP001',
  n: 'Acute Myocardial Infarction',
  t: 'Emergency reperfusion therapy, anticoagulation, dual antiplatelet therapy.',
  c: 'Emergency',
  l: false,
  algorithm: 'Algorithm B',
  codes: [
    ['I21', 'Acute myocardial infarction'],
    ['I22', 'Subsequent myocardial infarction'],
  ],
};

const mddPmb = {
  d: 'DTP202',
  n: 'Major Depressive Disorder',
  t: 'Antidepressant pharmacotherapy and structured psychotherapy.',
  c: 'Mental Health, Prescribed',
  l: false,
  algorithm: 'Algorithm C',
  codes: [['F32', 'Depressive episode']],
};

const noDtpPmb = {
  d: 'DTP999',
  n: 'Unspecified Condition',
  t: null,
  c: 'Miscellaneous',
  l: false,
  algorithm: null,
  codes: [],
};

describe('resolveAlgorithmId', () => {
  it('resolves "Algorithm A" string to algorithm-a', () => {
    expect(resolveAlgorithmId('Algorithm A')).toBe('algorithm-a');
  });

  it('resolves "Algorithm B" string to algorithm-b', () => {
    expect(resolveAlgorithmId('Algorithm B')).toBe('algorithm-b');
  });

  it('resolves "Algorithm C" string to algorithm-c', () => {
    expect(resolveAlgorithmId('Algorithm C')).toBe('algorithm-c');
  });

  it('resolves already-normalised id "algorithm-a"', () => {
    expect(resolveAlgorithmId('algorithm-a')).toBe('algorithm-a');
  });

  it('returns null for null input', () => {
    expect(resolveAlgorithmId(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(resolveAlgorithmId('')).toBeNull();
  });

  it('returns null for unknown algorithm string', () => {
    expect(resolveAlgorithmId('Algorithm Z')).toBeNull();
  });
});

describe('ALGORITHM_MAP', () => {
  it('contains all three algorithm keys', () => {
    expect(ALGORITHM_MAP).toHaveProperty('algorithm-a');
    expect(ALGORITHM_MAP).toHaveProperty('algorithm-b');
    expect(ALGORITHM_MAP).toHaveProperty('algorithm-c');
  });

  it('each algorithm has required fields', () => {
    for (const alg of Object.values(ALGORITHM_MAP)) {
      expect(alg).toHaveProperty('id');
      expect(alg).toHaveProperty('label');
      expect(alg).toHaveProperty('summary');
      expect(alg).toHaveProperty('description');
      expect(alg).toHaveProperty('key_rules');
      expect(alg).toHaveProperty('applicability');
      expect(Array.isArray(alg.key_rules)).toBe(true);
      expect(alg.key_rules.length).toBeGreaterThan(0);
    }
  });

  it('algorithm descriptions are non-empty verbatim text', () => {
    for (const alg of Object.values(ALGORITHM_MAP)) {
      expect(alg.description.length).toBeGreaterThan(50);
    }
  });

  it('Algorithm A references DSP', () => {
    expect(ALGORITHM_MAP['algorithm-a'].description).toMatch(/DSP|Designated Service Provider/i);
  });

  it('Algorithm B references emergency', () => {
    expect(ALGORITHM_MAP['algorithm-b'].description).toMatch(/emergency/i);
  });

  it('Algorithm C references at cost or any provider', () => {
    expect(ALGORITHM_MAP['algorithm-c'].description).toMatch(/at cost|any provider/i);
  });
});

describe('DTP algorithm detail — PMB record resolution', () => {
  it('resolves Algorithm A for a CDL condition', () => {
    const id = resolveAlgorithmId(diabetesPmb.algorithm);
    expect(id).toBe('algorithm-a');
    expect(ALGORITHM_MAP[id].label).toBe('Algorithm A');
  });

  it('resolves Algorithm B for an emergency condition', () => {
    const id = resolveAlgorithmId(miPmb.algorithm);
    expect(id).toBe('algorithm-b');
    expect(ALGORITHM_MAP[id].label).toBe('Algorithm B');
  });

  it('resolves Algorithm C for a mental health condition', () => {
    const id = resolveAlgorithmId(mddPmb.algorithm);
    expect(id).toBe('algorithm-c');
    expect(ALGORITHM_MAP[id].label).toBe('Algorithm C');
  });

  it('returns null for a PMB with no algorithm set', () => {
    const id = resolveAlgorithmId(noDtpPmb.algorithm);
    expect(id).toBeNull();
  });
});

describe('DTP algorithm verbatim text integrity', () => {
  it('Algorithm A key rules include DSP co-payment rule', () => {
    const rules = ALGORITHM_MAP['algorithm-a'].key_rules;
    const hasDspRule = rules.some((r) => /DSP|co-payment/i.test(r));
    expect(hasDspRule).toBe(true);
  });

  it('Algorithm B key rules include emergency funding at any provider', () => {
    const rules = ALGORITHM_MAP['algorithm-b'].key_rules;
    const hasEmergencyRule = rules.some((r) => /emergency|any provider/i.test(r));
    expect(hasEmergencyRule).toBe(true);
  });

  it('Algorithm C key rules include no co-payment', () => {
    const rules = ALGORITHM_MAP['algorithm-c'].key_rules;
    const hasNoCopay = rules.some((r) => /co-payment/i.test(r));
    expect(hasNoCopay).toBe(true);
  });

  it('all algorithm summaries are distinct', () => {
    const summaries = Object.values(ALGORITHM_MAP).map((a) => a.summary);
    const unique = new Set(summaries);
    expect(unique.size).toBe(summaries.length);
  });
});
