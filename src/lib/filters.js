/**
 * PMB Filter Logic — Pure functions for filter operations
 * All filter data derived from publicly available CMS and GEMS sources only.
 */

/**
 * Check if a PMB result matches benefit category filter
 * @param {Object} pmb - PMB result object
 * @param {string|null} category - 'cdl' | 'emergency' | 'prescribed' | null
 * @returns {boolean}
 */
export function matchesBenefitCategory(pmb, category) {
  if (!category) return true;
  
  switch (category) {
    case 'cdl':
      return pmb.l === true || pmb.isCDL === true;
    case 'emergency':
      return pmb.emergency === true || pmb.cat === 'emergency';
    case 'prescribed':
      return pmb.prescribed === true || pmb.cat === 'prescribed';
    default:
      return true;
  }
}

/**
 * Check if a PMB result matches benefit type filter
 * @param {Object} pmb - PMB result object
 * @param {string|null} type - benefit type id or null
 * @returns {boolean}
 */
export function matchesBenefitType(pmb, type) {
  if (!type) return true;
  
  const pmbType = pmb.type || pmb.benefitType || '';
  return pmbType.toLowerCase().replace(/\s+/g, '-') === type;
}

/**
 * Check if a PMB result matches GEMS option filter
 * @param {Object} pmb - PMB result object
 * @param {string[]} options - Array of GEMS option ids
 * @returns {boolean}
 */
export function matchesGemsOption(pmb, options) {
  if (!options || options.length === 0) return true;
  
  const pmbOptions = pmb.gemsOptions || pmb.options || [];
  return options.some((opt) => pmbOptions.includes(opt));
}

/**
 * Check if a PMB result matches ICD-10 chapter filter
 * @param {Object} pmb - PMB result object  
 * @param {string|null} chapter - ICD-10 chapter range (e.g., 'A00-B99')
 * @returns {boolean}
 */
export function matchesIcd10Chapter(pmb, chapter) {
  if (!chapter) return true;
  
  const codes = pmb.codes || [];
  const [rangeStart, rangeEnd] = chapter.split('-');
  
  return codes.some((code) => {
    const codeStr = Array.isArray(code) ? code[0] : code.icd10 || code;
    if (!codeStr) return false;
    
    const codePrefix = codeStr.substring(0, 3).toUpperCase();
    return codePrefix >= rangeStart && codePrefix <= rangeEnd;
  });
}

/**
 * Check if a PMB result matches DTP algorithm filter
 * @param {Object} pmb - PMB result object
 * @param {string|null} algorithm - 'algorithm-a' | 'algorithm-b' | 'algorithm-c' | null
 * @returns {boolean}
 */
export function matchesDtpAlgorithm(pmb, algorithm) {
  if (!algorithm) return true;
  
  const pmbAlgorithm = (pmb.algorithm || pmb.dtp || '').toLowerCase().replace(/\s+/g, '-');
  return pmbAlgorithm === algorithm || pmbAlgorithm.includes(algorithm.replace('algorithm-', ''));
}

/**
 * Check if a PMB result matches funding model filter
 * @param {Object} pmb - PMB result object
 * @param {string|null} model - 'dsp-provider' | 'non-dsp' | 'pmb-only' | null
 * @returns {boolean}
 */
export function matchesFundingModel(pmb, model) {
  if (!model) return true;
  
  const pmbModel = (pmb.fundingModel || pmb.funding || '').toLowerCase().replace(/\s+/g, '-');
  return pmbModel === model;
}

/**
 * Apply all filters to a PMB result
 * @param {Object} pmb - PMB result object
 * @param {Object} filters - Filter state object
 * @returns {boolean}
 */
export function matchesAllFilters(pmb, filters) {
  return (
    matchesBenefitCategory(pmb, filters.benefitCategory) &&
    matchesBenefitType(pmb, filters.benefitType) &&
    matchesGemsOption(pmb, filters.gemsOption) &&
    matchesIcd10Chapter(pmb, filters.icd10Chapter) &&
    matchesDtpAlgorithm(pmb, filters.dtpAlgorithm) &&
    matchesFundingModel(pmb, filters.fundingModel)
  );
}

/**
 * Filter an array of PMB results
 * @param {Object[]} pmbResults - Array of PMB result objects
 * @param {Object} filters - Filter state object
 * @returns {Object[]}
 */
export function filterPmbResults(pmbResults, filters) {
  if (!pmbResults || !Array.isArray(pmbResults)) return [];
  return pmbResults.filter((pmb) => matchesAllFilters(pmb, filters));
}

/**
 * Get initial empty filter state
 * @returns {Object}
 */
export function getEmptyFilterState() {
  return {
    benefitCategory: null,
    benefitType: null,
    gemsOption: [],
    icd10Chapter: null,
    dtpAlgorithm: null,
    fundingModel: null,
  };
}
