export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function getSearchTerms(query) {
  return [...new Set(normalizeSearchText(query).trim().split(/\s+/).filter(Boolean))];
}

export function matchesSearch(query, ...fields) {
  const terms = getSearchTerms(query);
  if (!terms.length) return true;
  const haystack = normalizeSearchText(fields.flat(Infinity).filter(Boolean).join(' '));
  return terms.every((term) => haystack.includes(term));
}
