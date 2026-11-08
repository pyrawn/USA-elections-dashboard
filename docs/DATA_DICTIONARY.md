# Data Dictionary

This project combines two kinds of data: the **certified 2024 presidential election
results** (a static, authoritative federal dataset) and a **2026 midterm "check-in"
layer** (live, partially-uncertified results gathered 5 days after election day,
used only as a narrative comparison point). This document describes where every
field comes from, how it was cleaned, and — critically for the 2026 layer — how
confident you should be in it.

All generated files live in `data/processed/` and are rebuilt from `data/raw/` by
[`scripts/build-data.mjs`](../scripts/build-data.mjs) (`npm run build-data`). Never
edit `data/processed/*.json` by hand — edit the `data/raw/` source and rebuild.

## 1. `data/raw/2024presgeresults.xlsx` → `data/processed/election_2024.json`

**Source:** U.S. Federal Election Commission, *"2024 Official Presidential General
Election Results"*, compiled by the FEC's Public Records Branch, published
2025-01-16. This is the certified federal record — the same workbook FEC.gov
publishes. One row per state + the District of Columbia (51 rows).

| Field | Type | Description |
|---|---|---|
| `state` | string | USPS 2-letter state abbreviation (e.g. `"PA"`). |
| `state_name` | string | Full state name, joined from `states_reference.json`. |
| `fips` | string | 2-digit Census/FIPS code, used to match states on the TopoJSON map. |
| `electoral_votes` | number | Total electoral votes allocated to the state. |
| `electoral_vote_winner` | `"Republican"` \| `"Democratic"` \| `"Split"` | Who won the state's electoral votes. `"Split"` only applies to Maine/Nebraska-style district splits (not triggered in 2024). |
| `electoral_votes_trump` / `electoral_votes_harris` | number | Electoral votes each ticket received in that state. |
| `popular_vote_winner` | `"Republican"` \| `"Democratic"` \| `"Tie"` | Who won the **popular vote** in that state (can differ in principle from the EV winner; did not happen in 2024, but the dashboard computes both honestly rather than assuming they match). |
| `popular_vote_margin_pct` | number | `\|Trump votes − Harris votes\| / total votes × 100`, rounded to 2 decimals. |
| `total_votes` | number | All votes cast for president in the state, per the FEC total column. |
| `none_of_these_candidates` | number | Nevada-only ballot line; 0 elsewhere. |
| `write_ins_scattered` | number | Write-in votes not itemized to a named candidate. |
| `candidates` | object | Keyed by the FEC column header (candidate surname); see §2. |

**Known limitation:** the FEC workbook reports whichever candidates appeared on
each state's ballot — not every candidate ran in every state, so most `votes`
values for minor candidates are legitimately `0` in most states, not missing data.

## 2. `data/raw/candidates_2024.json` → `data/processed/candidates_2024.json`

The FEC workbook's column headers are **surnames only** (`TRUMP`, `STEIN`,
`DE LA CRUZ`, ...) with no party column except for the two electoral-vote
columns. This dictionary was compiled by hand from The Green Papers' 2024
presidential candidate list (<https://www.thegreenpapers.com/P24/candidates.phtml>,
accessed 2026-11-08) to resolve every column to a full name, running mate, and
party.

| Field | Description |
|---|---|
| `column` | The exact FEC column header this entry resolves (join key against `election_2024.json`'s `candidates` object). |
| `full_name` | Candidate's full name. |
| `running_mate` | VP running mate, where applicable/known. |
| `party_full` | The candidate's real party or ballot label (e.g. "Party for Socialism and Liberation"). Shown in the candidate info panel. |
| `party_group` | Collapsed into `"Republican"` / `"Democratic"` / `"Other"` — used for map coloring so the choropleth stays readable (24 distinct party colors would be unreadable on a map). |

## 3. `data/raw/states_reference.json`

A static join table (USPS abbreviation ↔ full name ↔ 2-digit FIPS code). This is
stable federal reference data (not survey data), used to label states and to
match FEC rows to the `us-atlas` TopoJSON map geometry, which keys states by
FIPS id.

## 4. The 2026 midterm layer — ⚠️ read this before trusting any 2026 number

**`data/raw/midterm_2026_senate.json`** and **`data/raw/midterm_2026_governors.json`**
→ merged into **`data/processed/midterm_2026.json`**.

- **Source:** English Wikipedia, *"2026 United States Senate elections"* and
  *"2026 United States gubernatorial elections"*, accessed **2026-11-08** — five
  days after election day (2026-11-03).
- **Why this matters:** at the time this project was built, the 2026 midterms had
  just happened and results were **not yet officially certified** by the states.
  Wikipedia's election pages aggregate media calls (AP-style race calls), which
  are reliable for the vast majority of races but can still be revised during
  certification/recounts. Two races (`AK` and `MS` Senate; `AK` and `KS`
  governor) had **no winner projected yet** at the time of writing and are
  marked `status: "pending"` with `winner_party: null` — the dashboard must
  render these as "too close / not yet called," never guess a winner.
- **Rejected sources:** an early web search surfaced a Fandom wiki page titled
  *"2026 U.S Senate elections (Dark Before the Dawn)"* — this is **fan fiction
  for a fictional alternate-history timeline**, not real election data. It was
  explicitly excluded. This is a useful cautionary example of why every
  external data point in this project is logged with its source and access
  date rather than silently merged in.
- **Coverage:** not every state elects a Senator or Governor in every midterm
  (Senate seats are staggered across 3 classes; most governors serve 4-year
  terms offset from the midterm cycle; a few states elect governors in odd
  years). States with no 2026 race for that office are marked
  `status: "no_election_2026"` with all result fields `null` — this is a
  genuine "not applicable," not missing data.
- **Margins:** only included where the source explicitly reported a
  winner/runner-up percentage. Otherwise `margin_pct` is `null` — **do not**
  interpret a `null` margin as "too close to call"; it usually just means the
  source reported a winner's name without vote shares.

| Field | Description |
|---|---|
| `state`, `state_name` | Join keys, same as above. |
| `office` | `"Senate"` or `"Governor"`. |
| `status` | `"called"` (media-projected winner) \| `"pending"` (too close to call as of 2026-11-08) \| `"no_election_2026"` (not up for election). |
| `winner_name`, `winner_party` | The projected winner and party (`null` if pending/no election). |
| `runner_up_name`, `runner_up_party` | Main challenger, where reported. |
| `previous_party` | Which party held the seat going into the election — used to compute `flipped`. |
| `flipped` | `true` if the seat changed party control, `false` if held, `null` if undecided or not applicable. |
| `margin_pct` | Winner − runner-up percentage-point margin, where reported. |

**Candidate coverage:** every `called` Senate race has both the winner and the
runner-up's name (filled in from the Wikipedia per-race infoboxes; Idaho's
runner-up is an independent, not a Democrat, since the Democratic nominee
withdrew). Governor races are 27/33 complete — six states (RI, SD, TN, VT, WI,
WY) only had a confirmed winner at the time of research, so `runner_up_name`
is `null` for those and the dashboard shows the winner only rather than
guessing a challenger.
| `pres_2024_winner` | That state's 2024 presidential **popular-vote** winner, joined in from `election_2024.json`, for comparison. |
| `regret_signal` | `true` only when **all** of: the race was `called`, the state voted **Republican** for president in 2024, and the 2026 winner is **Democratic** — regardless of whether that specific seat flipped or was already Democratic-held. This is the dashboard's documented, intentionally simple proxy for "this state is now voting differently than it did in 2024." It is *not* an official metric and should always be presented with that caveat. |

## 5. Design choice: why Senate + Governor, not the House

House races are decided district-by-district and don't map cleanly onto a
state-level choropleth next to presidential results. Statewide Senate and
Governor races are the cleanest apples-to-apples comparison to a statewide
presidential vote, so they were chosen as the "today" layer instead of
national generic-ballot polling or district-level House results.
