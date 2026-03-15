import { describe, it, expect } from 'vitest';
import { GUIDELINES, CATEGORY_ORDER } from '../components/guidelines/ClinicalGuidelinesPanel.jsx';
import guidelinesData from '../data/guidelines/clinical-guidelines.json';

// ─── Data file integrity ───────────────────────────────────────────────────────

describe('Clinical guidelines data file', () => {
  it('loads a non-empty guidelines array', () => {
    expect(Array.isArray(guidelinesData.guidelines)).toBe(true);
    expect(guidelinesData.guidelines.length).toBeGreaterThan(0);
  });

  it('source metadata is present and non-empty', () => {
    expect(typeof guidelinesData.source).toBe('string');
    expect(guidelinesData.source.length).toBeGreaterThan(0);
  });

  it('retrieved date is present', () => {
    expect(guidelinesData.retrieved).toBe('2026-03-15');
  });

  it('GUIDELINES export matches the data file', () => {
    expect(GUIDELINES).toEqual(guidelinesData.guidelines);
  });
});

// ─── Required fields ───────────────────────────────────────────────────────────

describe('Each guideline has required fields', () => {
  it('all guidelines have an id', () => {
    GUIDELINES.forEach((g) => {
      expect(typeof g.id).toBe('string');
      expect(g.id.length).toBeGreaterThan(0);
    });
  });

  it('all guidelines have a title', () => {
    GUIDELINES.forEach((g) => {
      expect(typeof g.title).toBe('string');
      expect(g.title.length).toBeGreaterThan(0);
    });
  });

  it('all guidelines have a category', () => {
    GUIDELINES.forEach((g) => {
      expect(typeof g.category).toBe('string');
      expect(g.category.length).toBeGreaterThan(0);
    });
  });

  it('all guidelines have a description', () => {
    GUIDELINES.forEach((g) => {
      expect(typeof g.description).toBe('string');
      expect(g.description.length).toBeGreaterThan(20);
    });
  });

  it('all guidelines have an href', () => {
    GUIDELINES.forEach((g) => {
      expect(typeof g.href).toBe('string');
      expect(g.href.length).toBeGreaterThan(0);
    });
  });

  it('all guidelines have a source', () => {
    GUIDELINES.forEach((g) => {
      expect(typeof g.source).toBe('string');
      expect(g.source.length).toBeGreaterThan(0);
    });
  });
});

// ─── No broken hrefs ──────────────────────────────────────────────────────────

describe('No broken hrefs', () => {
  it('all hrefs start with https://', () => {
    GUIDELINES.forEach((g) => {
      expect(g.href).toMatch(/^https:\/\//);
    });
  });

  it('no hrefs are bare hash fragments', () => {
    GUIDELINES.forEach((g) => {
      expect(g.href).not.toBe('#');
      expect(g.href).not.toMatch(/^#/);
    });
  });

  it('no hrefs use javascript: protocol', () => {
    GUIDELINES.forEach((g) => {
      expect(g.href.toLowerCase()).not.toMatch(/^javascript:/);
    });
  });

  it('no hrefs point to localhost', () => {
    GUIDELINES.forEach((g) => {
      expect(g.href).not.toMatch(/localhost/i);
      expect(g.href).not.toMatch(/127\.0\.0\.1/);
    });
  });

  it('no hrefs are placeholder strings', () => {
    const placeholders = ['#', 'about:blank', 'void(0)', 'TODO', 'FIXME', ''];
    GUIDELINES.forEach((g) => {
      placeholders.forEach((p) => {
        expect(g.href).not.toBe(p);
      });
    });
  });

  it('all hrefs contain a valid domain (at least one dot after schema)', () => {
    GUIDELINES.forEach((g) => {
      // e.g. https://www.example.org — must have a dot in the host part
      const withoutSchema = g.href.replace(/^https:\/\//, '');
      expect(withoutSchema).toMatch(/\./);
    });
  });

  it('all ids are unique', () => {
    const ids = GUIDELINES.map((g) => g.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all hrefs are unique', () => {
    const hrefs = GUIDELINES.map((g) => g.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });
});

// ─── Category coverage ────────────────────────────────────────────────────────

describe('Category coverage', () => {
  const categories = GUIDELINES.map((g) => g.category);
  const uniqueCategories = [...new Set(categories)];

  it('all categories are recognised in CATEGORY_ORDER', () => {
    uniqueCategories.forEach((cat) => {
      expect(CATEGORY_ORDER).toContain(cat);
    });
  });

  it('has at least one Regulatory guideline', () => {
    expect(GUIDELINES.some((g) => g.category === 'Regulatory')).toBe(true);
  });

  it('has at least one GEMS Reference guideline', () => {
    expect(GUIDELINES.some((g) => g.category === 'GEMS Reference')).toBe(true);
  });

  it('has at least one ICD-10 Reference guideline', () => {
    expect(GUIDELINES.some((g) => g.category === 'ICD-10 Reference')).toBe(true);
  });

  it('has at least one CDL Management guideline', () => {
    expect(GUIDELINES.some((g) => g.category === 'CDL Management')).toBe(true);
  });

  it('has at least one Emergency Care guideline', () => {
    expect(GUIDELINES.some((g) => g.category === 'Emergency Care')).toBe(true);
  });
});

// ─── Key guideline presence ───────────────────────────────────────────────────

describe('Key guidelines are present', () => {
  it('CMS PMB regulations link is present', () => {
    const g = GUIDELINES.find((g) => g.id === 'cms-pmb-regulations');
    expect(g).toBeDefined();
    expect(g.href).toMatch(/medicalschemes/i);
  });

  it('CMS CDL list link is present', () => {
    const g = GUIDELINES.find((g) => g.id === 'cms-cdl-list');
    expect(g).toBeDefined();
    expect(g.href).toMatch(/medicalschemes/i);
  });

  it('CMS Circular 47 of 2022 link is present (DTP algorithms)', () => {
    const g = GUIDELINES.find((g) => g.id === 'cms-circular-47-2022');
    expect(g).toBeDefined();
    expect(g.description.toLowerCase()).toMatch(/algorithm/i);
  });

  it('GEMS fact sheet link is present', () => {
    const g = GUIDELINES.find((g) => g.id === 'gems-fact-sheet');
    expect(g).toBeDefined();
    expect(g.href).toMatch(/gems\.gov\.za/i);
  });

  it('WHO ICD-10 browser link is present', () => {
    const g = GUIDELINES.find((g) => g.id === 'who-icd10-browser');
    expect(g).toBeDefined();
    expect(g.href).toMatch(/who\.int/i);
  });

  it('diabetes guideline is present (CDL condition)', () => {
    const g = GUIDELINES.find((g) => g.description.toLowerCase().includes('diabetes'));
    expect(g).toBeDefined();
    expect(g.href).toMatch(/^https:\/\//);
  });

  it('hypertension guideline is present (CDL condition)', () => {
    const g = GUIDELINES.find((g) => g.description.toLowerCase().includes('hypertension'));
    expect(g).toBeDefined();
    expect(g.href).toMatch(/^https:\/\//);
  });

  it('asthma guideline is present (CDL condition)', () => {
    const g = GUIDELINES.find((g) => g.description.toLowerCase().includes('asthma'));
    expect(g).toBeDefined();
  });

  it('HIV/ARV guideline is present (CDL condition)', () => {
    const g = GUIDELINES.find((g) => g.description.toLowerCase().match(/hiv|arv|antiretroviral/));
    expect(g).toBeDefined();
    expect(g.href).toMatch(/^https:\/\//);
  });

  it('mental health guideline is present', () => {
    const g = GUIDELINES.find((g) => g.category === 'Mental Health');
    expect(g).toBeDefined();
    expect(g.description.toLowerCase()).toMatch(/depression|bipolar|schizophrenia/i);
  });
});

// ─── No personal data ─────────────────────────────────────────────────────────

describe('No personal data in guidelines', () => {
  const allText = JSON.stringify(guidelinesData);

  it('no member IDs', () => {
    expect(allText).not.toMatch(/memberId|member_id/i);
  });

  it('no staff IDs', () => {
    expect(allText).not.toMatch(/staffId|staff_id/i);
  });

  it('no email addresses', () => {
    // Allow emails in href if any, but not as data fields
    const fieldsOnly = GUIDELINES.map(({ id, title, category, description, source }) =>
      [id, title, category, description, source].join(' ')
    ).join(' ');
    expect(fieldsOnly).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });

  it('no case numbers or claim references', () => {
    expect(allText).not.toMatch(/caseNumber|case_number|claimRef/i);
  });
});
