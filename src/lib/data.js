// Thin lookup layer over the generated datasets in data/processed/.
// Run `npm run build-data` (or just `npm run dev`, which does it automatically)
// to regenerate those files from data/raw/ — see docs/DATA_DICTIONARY.md.
import election2024 from '../../data/processed/election_2024.json';
import candidates2024 from '../../data/processed/candidates_2024.json';
import midterm2026 from '../../data/processed/midterm_2026.json';

export const election2024ByFips = new Map(election2024.states.map((s) => [s.fips, s]));
export const election2024ByAbbr = new Map(election2024.states.map((s) => [s.state, s]));
export const candidateDict = new Map(candidates2024.candidates.map((c) => [c.column, c]));

export const senate2026ByAbbr = new Map(midterm2026.senate.map((r) => [r.state, r]));
export const governors2026ByAbbr = new Map(midterm2026.governors.map((r) => [r.state, r]));

export { election2024, candidates2024, midterm2026 };

/** Ranked list of every candidate who received at least one vote in a state. */
export function candidateBreakdown(stateRow) {
  return Object.entries(stateRow.candidates)
    .map(([column, c]) => ({ column, ...c }))
    .filter((c) => c.votes > 0)
    .sort((a, b) => b.votes - a.votes);
}

export const PARTY_COLORS = {
  Republican: '#B23A48',
  Democratic: '#2F5C8A',
  Other: '#8A7B5C',
  Split: '#8A7B5C',
  Tie: '#8A7B5C',
};

export function partyColor(partyGroup) {
  return PARTY_COLORS[partyGroup] ?? '#B7AE9A';
}
