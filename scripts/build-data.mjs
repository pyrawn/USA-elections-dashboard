// Builds the clean, documented datasets the dashboard reads from the raw sources in data/raw/.
// Run with `npm run build-data` (also runs automatically before `npm run dev` / `npm run build`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(ROOT, 'data', 'raw');
const OUT = path.join(ROOT, 'data', 'processed');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(RAW, file), 'utf-8'));
}

function writeJson(file, data) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(data, null, 2) + '\n');
  console.log(`  wrote data/processed/${file}`);
}

const statesRef = readJson('states_reference.json').states;
const abbrToState = new Map(statesRef.map((s) => [s.abbr, s]));

const candidatesDict = readJson('candidates_2024.json').candidates;
const candidateByColumn = new Map(candidatesDict.map((c) => [c.column, c]));

// --- 1. Parse the FEC 2024 presidential general election workbook ---------
const wb = XLSX.readFile(path.join(RAW, '2024presgeresults.xlsx'));
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

const headerRow = rows[0].map((h) => (typeof h === 'string' ? h.trim() : h));
const stateAbbrs = new Set(statesRef.map((s) => s.abbr));

// Columns: STATE | ELECTORAL VOTES | ELECTORAL VOTE: TRUMP (R) | ELECTORAL VOTE: HARRIS (D) | <24 candidate columns> | NONE OF THESE CANDIDATES | WRITE-INS (SCATTERED) | TOTAL VOTES
const idxState = headerRow.indexOf('STATE');
const idxEV = headerRow.indexOf('ELECTORAL VOTES');
const idxEvTrump = headerRow.indexOf('ELECTORAL VOTE: TRUMP (R)');
const idxEvHarris = headerRow.indexOf('ELECTORAL VOTE: HARRIS (D)');
const idxTotal = headerRow.indexOf('TOTAL VOTES');
const candidateCols = headerRow
  .map((h, i) => ({ h, i }))
  .filter(({ h, i }) => i > idxEvHarris && i < idxTotal && h && h !== 'NONE OF THESE CANDIDATES' && h !== 'WRITE-INS (SCATTERED)');
const idxNone = headerRow.indexOf('NONE OF THESE CANDIDATES');
const idxWriteIns = headerRow.indexOf('WRITE-INS (SCATTERED)');

const states2024 = [];
for (const row of rows.slice(1)) {
  const abbr = row[idxState];
  if (!abbr || !stateAbbrs.has(abbr)) continue; // skips the "Total:" / "Percentage:" / footnote rows

  const popularVotes = {};
  for (const { h, i } of candidateCols) {
    const dict = candidateByColumn.get(h);
    popularVotes[h] = {
      votes: Number(row[i]) || 0,
      candidate: dict ? dict.full_name : h,
      party_full: dict ? dict.party_full : 'Unknown',
      party_group: dict ? dict.party_group : 'Other',
    };
  }

  const trumpVotes = popularVotes['TRUMP']?.votes ?? 0;
  const harrisVotes = popularVotes['HARRIS']?.votes ?? 0;
  const totalVotes = Number(row[idxTotal]) || 0;
  const evTrump = Number(row[idxEvTrump]) || 0;
  const evHarris = Number(row[idxEvHarris]) || 0;

  const ref = abbrToState.get(abbr);
  states2024.push({
    state: abbr,
    state_name: ref.name,
    fips: ref.fips,
    electoral_votes: Number(row[idxEV]) || 0,
    electoral_vote_winner: evTrump > evHarris ? 'Republican' : evHarris > evTrump ? 'Democratic' : 'Split',
    electoral_votes_trump: evTrump,
    electoral_votes_harris: evHarris,
    popular_vote_winner: trumpVotes > harrisVotes ? 'Republican' : harrisVotes > trumpVotes ? 'Democratic' : 'Tie',
    popular_vote_margin_pct: totalVotes ? Number((Math.abs(trumpVotes - harrisVotes) / totalVotes * 100).toFixed(2)) : null,
    total_votes: totalVotes,
    none_of_these_candidates: Number(row[idxNone]) || 0,
    write_ins_scattered: Number(row[idxWriteIns]) || 0,
    candidates: popularVotes,
  });
}

if (states2024.length !== 51) {
  throw new Error(`Expected 51 state rows (50 states + DC), parsed ${states2024.length}`);
}

writeJson('election_2024.json', {
  _comment: 'Cleaned 2024 US presidential general election results, one row per state + DC, parsed from the official FEC workbook (data/raw/2024presgeresults.xlsx). See docs/DATA_DICTIONARY.md for field definitions.',
  source: 'Federal Election Commission, "2024 Official Presidential General Election Results", compiled by the FEC Public Records Branch, published 2025-01-16',
  election_date: '2024-11-05',
  generated_at: new Date().toISOString().slice(0, 10),
  states: states2024,
});

writeJson('candidates_2024.json', readJson('candidates_2024.json'));
writeJson('states_reference.json', readJson('states_reference.json'));

// --- 2. Merge the 2026 midterm layer against the 2024 results -------------
function mergeMidterm(raceFile, officeLabel) {
  const { races, source, accessed, election_date } = readJson(raceFile);
  const byState = new Map(races.map((r) => [r.state, r]));
  const merged = statesRef
    .filter((s) => s.abbr !== 'DC' || officeLabel !== 'Governor') // DC has a mayor, not a governor
    .map((s) => {
      const race = byState.get(s.abbr);
      const pres2024 = states2024.find((st) => st.state === s.abbr);
      if (!race) {
        return {
          state: s.abbr,
          state_name: s.name,
          office: officeLabel,
          status: 'no_election_2026',
          winner_party: null,
          previous_party: null,
          flipped: null,
          margin_pct: null,
          pres_2024_winner: pres2024?.popular_vote_winner ?? null,
          regret_signal: null,
        };
      }
      const regretSignal =
        race.status === 'called' && pres2024
          ? pres2024.popular_vote_winner === 'Republican' && race.winner_party === 'Democratic'
          : null;
      return {
        state: s.abbr,
        state_name: s.name,
        office: officeLabel,
        status: race.status,
        winner_name: race.winner_name,
        winner_party: race.winner_party,
        runner_up_name: race.runner_up_name ?? null,
        runner_up_party: race.runner_up_party ?? null,
        previous_party: race.previous_party,
        flipped: race.flipped,
        margin_pct: race.margin_pct,
        note: race.note ?? null,
        pres_2024_winner: pres2024?.popular_vote_winner ?? null,
        regret_signal: regretSignal,
      };
    });
  return { source, accessed, election_date, office: officeLabel, races: merged };
}

const senate2026 = mergeMidterm('midterm_2026_senate.json', 'Senate');
const governors2026 = mergeMidterm('midterm_2026_governors.json', 'Governor');

writeJson('midterm_2026.json', {
  _comment: 'US Senate and gubernatorial results for the 2026 midterms, joined state-by-state against the 2024 presidential popular-vote winner. "regret_signal" is true only for a called race where a state that voted Republican for president in 2024 elected a Democrat in 2026 -- a simple, documented proxy for swing-away-from-2024 used by this dashboard, not an official metric.',
  generated_at: new Date().toISOString().slice(0, 10),
  senate: senate2026.races,
  governors: governors2026.races,
  meta: {
    senate_source: senate2026.source,
    senate_accessed: senate2026.accessed,
    governors_source: governors2026.source,
    governors_accessed: governors2026.accessed,
  },
});

console.log('Data build complete.');
