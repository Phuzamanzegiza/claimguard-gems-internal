import { describe, it, expect } from 'vitest';
import {
  matchesBenefitCategory,
  matchesBenefitType,
  matchesGemsOption,
  matchesIcd10Chapter,
  matchesDtpAlgorithm,
  matchesFundingModel,
  matchesAllFilters,
  filterPmbResults,
  getEmptyFilterState,
} from '../lib/filters.js';

describe('PMB Filter Logic', () => {
  // Test data
  const cdlCondition = {
    n: 'Diabetes Mellitus Type 2',
    l: true,
    codes: [['E11', 'Type 2 diabetes mellitus']],
    algorithm: 'Algorithm A',
    gemsOptions: ['emerald', 'onyx', 'ruby'],
    fundingModel: 'dsp-provider',
    type: 'Chronic',
  };

  const emergencyCondition = {
    n: 'Acute Myocardial Infarction',
    emergency: true,
    cat: 'emergency',
    codes: [['I21', 'Acute myocardial infarction']],
    algorithm: 'Algorithm C',
    gemsOptions: ['tanzanite-one', 'beryl', 'emerald-value'],
    fundingModel: 'pmb-only',
    type: 'Hospitalisation',
  };

  const mentalHealthCondition = {
    n: 'Major Depressive Disorder',
    prescribed: true,
    codes: [['F32', 'Major depressive disorder']],
    algorithm: 'Algorithm B',
    gemsOptions: ['emerald', 'emerald-value', 'onyx'],
    fundingModel: 'non-dsp',
    type: 'Mental Health',
  };

  describe('matchesBenefitCategory', () => {
    it('returns true when no filter is set', () => {
      expect(matchesBenefitCategory(cdlCondition, null)).toBe(true);
    });

    it('matches CDL conditions correctly', () => {
      expect(matchesBenefitCategory(cdlCondition, 'cdl')).toBe(true);
      expect(matchesBenefitCategory(emergencyCondition, 'cdl')).toBe(false);
    });

    it('matches emergency conditions correctly', () => {
      expect(matchesBenefitCategory(emergencyCondition, 'emergency')).toBe(true);
      expect(matchesBenefitCategory(cdlCondition, 'emergency')).toBe(false);
    });

    it('matches prescribed conditions correctly', () => {
      expect(matchesBenefitCategory(mentalHealthCondition, 'prescribed')).toBe(true);
      expect(matchesBenefitCategory(cdlCondition, 'prescribed')).toBe(false);
    });
  });

  describe('matchesBenefitType', () => {
    it('returns true when no filter is set', () => {
      expect(matchesBenefitType(cdlCondition, null)).toBe(true);
    });

    it('matches hospitalisation type', () => {
      expect(matchesBenefitType(emergencyCondition, 'hospitalisation')).toBe(true);
    });

    it('matches mental-health type', () => {
      expect(matchesBenefitType(mentalHealthCondition, 'mental-health')).toBe(true);
    });
  });

  describe('matchesGemsOption', () => {
    it('returns true when no options selected', () => {
      expect(matchesGemsOption(cdlCondition, [])).toBe(true);
      expect(matchesGemsOption(cdlCondition, null)).toBe(true);
    });

    it('matches single GEMS option', () => {
      expect(matchesGemsOption(cdlCondition, ['emerald'])).toBe(true);
      expect(matchesGemsOption(cdlCondition, ['tanzanite-one'])).toBe(false);
    });

    it('matches multiple GEMS options (any match)', () => {
      expect(matchesGemsOption(cdlCondition, ['emerald', 'onyx'])).toBe(true);
      expect(matchesGemsOption(emergencyCondition, ['tanzanite-one', 'beryl'])).toBe(true);
    });

    it('network-dependent options filter correctly', () => {
      // Tanzanite One, Beryl, Emerald Value are network-dependent
      expect(matchesGemsOption(emergencyCondition, ['tanzanite-one'])).toBe(true);
      expect(matchesGemsOption(emergencyCondition, ['emerald-value'])).toBe(true);
      expect(matchesGemsOption(cdlCondition, ['tanzanite-one'])).toBe(false);
    });
  });

  describe('matchesIcd10Chapter', () => {
    it('returns true when no chapter selected', () => {
      expect(matchesIcd10Chapter(cdlCondition, null)).toBe(true);
    });

    it('matches E00-E90 (Endocrine/Metabolic) for diabetes', () => {
      expect(matchesIcd10Chapter(cdlCondition, 'E00-E90')).toBe(true);
    });

    it('matches I00-I99 (Circulatory) for MI', () => {
      expect(matchesIcd10Chapter(emergencyCondition, 'I00-I99')).toBe(true);
    });

    it('matches F00-F99 (Mental disorders) for depression', () => {
      expect(matchesIcd10Chapter(mentalHealthCondition, 'F00-F99')).toBe(true);
    });

    it('rejects non-matching chapters', () => {
      expect(matchesIcd10Chapter(cdlCondition, 'A00-B99')).toBe(false);
    });
  });

  describe('matchesDtpAlgorithm', () => {
    it('returns true when no algorithm selected', () => {
      expect(matchesDtpAlgorithm(cdlCondition, null)).toBe(true);
    });

    it('matches Algorithm A', () => {
      expect(matchesDtpAlgorithm(cdlCondition, 'algorithm-a')).toBe(true);
    });

    it('matches Algorithm B', () => {
      expect(matchesDtpAlgorithm(mentalHealthCondition, 'algorithm-b')).toBe(true);
    });

    it('matches Algorithm C', () => {
      expect(matchesDtpAlgorithm(emergencyCondition, 'algorithm-c')).toBe(true);
    });

    it('rejects non-matching algorithms', () => {
      expect(matchesDtpAlgorithm(cdlCondition, 'algorithm-c')).toBe(false);
    });
  });

  describe('matchesFundingModel', () => {
    it('returns true when no model selected', () => {
      expect(matchesFundingModel(cdlCondition, null)).toBe(true);
    });

    it('matches dsp-provider', () => {
      expect(matchesFundingModel(cdlCondition, 'dsp-provider')).toBe(true);
    });

    it('matches pmb-only', () => {
      expect(matchesFundingModel(emergencyCondition, 'pmb-only')).toBe(true);
    });

    it('matches non-dsp', () => {
      expect(matchesFundingModel(mentalHealthCondition, 'non-dsp')).toBe(true);
    });
  });

  describe('matchesAllFilters', () => {
    it('returns true with empty filters', () => {
      const emptyFilters = getEmptyFilterState();
      expect(matchesAllFilters(cdlCondition, emptyFilters)).toBe(true);
    });

    it('matches with single filter', () => {
      const filters = { ...getEmptyFilterState(), benefitCategory: 'cdl' };
      expect(matchesAllFilters(cdlCondition, filters)).toBe(true);
      expect(matchesAllFilters(emergencyCondition, filters)).toBe(false);
    });

    it('matches with multiple filters (AND logic)', () => {
      const filters = {
        ...getEmptyFilterState(),
        benefitCategory: 'cdl',
        dtpAlgorithm: 'algorithm-a',
      };
      expect(matchesAllFilters(cdlCondition, filters)).toBe(true);
      
      // CDL but wrong algorithm
      const wrongAlgoFilters = {
        ...getEmptyFilterState(),
        benefitCategory: 'cdl',
        dtpAlgorithm: 'algorithm-c',
      };
      expect(matchesAllFilters(cdlCondition, wrongAlgoFilters)).toBe(false);
    });
  });

  describe('filterPmbResults', () => {
    const allConditions = [cdlCondition, emergencyCondition, mentalHealthCondition];

    it('returns all results with empty filters', () => {
      const result = filterPmbResults(allConditions, getEmptyFilterState());
      expect(result).toHaveLength(3);
    });

    it('filters by benefit category', () => {
      const filters = { ...getEmptyFilterState(), benefitCategory: 'cdl' };
      const result = filterPmbResults(allConditions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].n).toBe('Diabetes Mellitus Type 2');
    });

    it('filters by GEMS option', () => {
      const filters = { ...getEmptyFilterState(), gemsOption: ['tanzanite-one'] };
      const result = filterPmbResults(allConditions, filters);
      expect(result).toHaveLength(1);
      expect(result[0].n).toBe('Acute Myocardial Infarction');
    });

    it('handles empty array input', () => {
      const result = filterPmbResults([], getEmptyFilterState());
      expect(result).toHaveLength(0);
    });

    it('handles null input', () => {
      const result = filterPmbResults(null, getEmptyFilterState());
      expect(result).toHaveLength(0);
    });
  });

  describe('getEmptyFilterState', () => {
    it('returns correct initial state', () => {
      const state = getEmptyFilterState();
      expect(state.benefitCategory).toBeNull();
      expect(state.benefitType).toBeNull();
      expect(state.gemsOption).toEqual([]);
      expect(state.icd10Chapter).toBeNull();
      expect(state.dtpAlgorithm).toBeNull();
      expect(state.fundingModel).toBeNull();
    });
  });
});
