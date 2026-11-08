import { useMemo } from 'react';
import { geoPath } from 'd3';
import * as topojson from 'topojson-client';
import statesTopo from 'us-atlas/states-albers-10m.json';
import { election2024ByFips, senate2026ByAbbr, governors2026ByAbbr, partyColor } from '../lib/data.js';

const path = geoPath();

function raceColor(race) {
  if (!race || race.status === 'no_election_2026') return '#E4DFD3';
  if (race.status === 'pending') return '#D8CBA0';
  return partyColor(race.winner_party);
}

export default function USMap({ mode, office, selected, onSelect, onHover }) {
  const features = useMemo(() => topojson.feature(statesTopo, statesTopo.objects.states).features, []);

  return (
    <svg viewBox="-10 0 975 610" className="w-full h-auto" role="img" aria-label="Choropleth map of US states">
      {features.map((feature) => {
        const abbr2024 = election2024ByFips.get(feature.id);
        const abbr = abbr2024?.state;

        let fill = '#E4DFD3';
        let isRegret = false;

        if (mode === 'party2024') {
          fill = partyColor(abbr2024?.popular_vote_winner);
        } else if (mode === 'checkin2026') {
          const race = office === 'Governor' ? governors2026ByAbbr.get(abbr) : senate2026ByAbbr.get(abbr);
          fill = raceColor(race);
          isRegret = race?.regret_signal === true;
        }

        const isSelected = selected === abbr;

        return (
          <path
            key={feature.id}
            d={path(feature)}
            fill={fill}
            className={`state-shape ${isSelected ? 'is-selected' : ''} ${isRegret ? 'is-regret' : ''}`}
            onClick={() => onSelect(abbr)}
            onMouseEnter={() => onHover(abbr)}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
    </svg>
  );
}
