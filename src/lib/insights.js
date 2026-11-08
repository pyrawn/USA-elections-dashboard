import { election2024, midterm2026 } from './data.js';

/** Derived, narrative-ready statistics used in the insights strip and story copy. */
export function computeInsights() {
  const states = election2024.states;
  const trumpStates = states.filter((s) => s.popular_vote_winner === 'Republican');
  const harrisStates = states.filter((s) => s.popular_vote_winner === 'Democratic');

  const allRaces2026 = [...midterm2026.senate, ...midterm2026.governors];
  const calledRaces = allRaces2026.filter((r) => r.status === 'called');
  const pendingRaces = allRaces2026.filter((r) => r.status === 'pending');

  const regretRaces = calledRaces.filter((r) => r.regret_signal === true);
  const regretStates = [...new Set(regretRaces.map((r) => r.state))];

  const flippedToDemocratic = calledRaces.filter((r) => r.flipped === true && r.winner_party === 'Democratic');
  const flippedToRepublican = calledRaces.filter((r) => r.flipped === true && r.winner_party === 'Republican');

  // States where BOTH the Senate and Governor race (if both happened) show a regret signal.
  const doubleRegretStates = regretStates.filter((abbr) => {
    const races = regretRaces.filter((r) => r.state === abbr);
    const offices = new Set(races.map((r) => r.office));
    return offices.size > 1;
  });

  const closest2024 = [...states]
    .filter((s) => s.popular_vote_margin_pct !== null)
    .sort((a, b) => a.popular_vote_margin_pct - b.popular_vote_margin_pct)
    .slice(0, 5);

  return {
    totalStates: states.length,
    trumpStateCount: trumpStates.length,
    harrisStateCount: harrisStates.length,
    nationalPopularVote: {
      trump: states.reduce((sum, s) => sum + (s.candidates.TRUMP?.votes ?? 0), 0),
      harris: states.reduce((sum, s) => sum + (s.candidates.HARRIS?.votes ?? 0), 0),
    },
    calledRaceCount: calledRaces.length,
    pendingRaceCount: pendingRaces.length,
    regretStateCount: regretStates.length,
    regretStates,
    doubleRegretStates,
    flippedToDemocraticCount: flippedToDemocratic.length,
    flippedToRepublicanCount: flippedToRepublican.length,
    closest2024,
  };
}
