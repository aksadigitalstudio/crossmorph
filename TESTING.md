# CrossMorph verification

Tested on 3 October 2026 in desktop Chrome, including direct offline file opening.

## Generator

- 215 unique bundled English answer/clue pairs.
- 300 generated and independently checked puzzles: 100 Easy, 100 Medium, 100 Hard.
- 300 distinct silhouettes; 116 distinct width/height combinations.
- Every generated puzzle contains 14–18 connected answers.
- Across/Down numbering, letter runs, clue mapping, intersections, adjacency, membership, tight bounds, and lack of duplicate answers were checked.
- Five deliberately corrupted puzzles were rejected. Seed determinism and rejection of a recently used structure/word set were confirmed.
- Generation timing: median 11.17 ms, 95th percentile 98.66 ms, maximum 185.99 ms in this run. Timing varies by device.

## Browser

All 74 checks passed. Puzzle A, B, and C were recorded, followed by 10 additional UI-generated puzzles; every layout validated and differed in silhouette, structure, and word set.

Keyboard typing, automatic advance, Backspace, all arrow keys, Space/Enter direction switching, Tab/Shift+Tab clue navigation, Escape, grid/clue selection, Check, Hint limits, Reset, New puzzle, persistence, timer visibility, instructions, and touch-keyboard input passed. A full crossword was solved through normal keyboard input; completion, statistics, stopped timer, review, and a fresh puzzle were verified.

Responsive layouts passed at 1920×1080, 1280×800, 1024×768, 768×1024, and 390×844. Cells retain a minimum size of 25 px. When a phone cannot fit a wide puzzle, a labeled scrollable grid preserves readable cells without page overflow.

There were 0 critical console/runtime errors and 0 failed asset requests.

## Final offline test

The game opened directly from index.html with the browser offline and made 0 remote requests. A full keyboard solve completed successfully. Resetting the same puzzle and using one hint plus one incorrect check reduced the score from 3500 to 3340. The completion New puzzle button generated a different valid grid, and a final Hint/Check/Reset interaction passed. Normal play has no QA interface. No runtime or console errors were observed.

The playable assets total 61,811 bytes; test reports and documentation are not loaded by the game. No build, server-side service, package installation, remote font, image, or puzzle source is needed.

## Recorded puzzles

### Puzzle A

Seed: 3331068293. Dimensions: 11 × 16. Answers: 17.

Across: 2. SOAP, 5. BRIDGE, 6. OPERA, 7. ACORN, 9. BALCONY, 12. CABIN, 13. CARPET, 14. HORIZON.

Down: 1. NOVEL, 3. POETRY, 4. VOLTAGE, 5. BASIL, 8. CINEMA, 9. BUTTON, 10. FRICTION, 11. VOLCANO, 12. CIRCUIT.

Silhouette (■ = playable square):

```text
··■···■■■■·
··■······■·
■·■·■■■■■■·
■■■■■····■·
■·■·■·■■■■■
■···■··■·■·
■·■■■■■■■··
■·■····■·■·
■·■·■··■·■·
··■·■·■■■■■
··■·■·■··■·
··■·■■■■■■·
····■·■··■·
····■·■··■·
···■■■■■■■·
······■····
```

### Puzzle B

Seed: 1406617378. Dimensions: 7 × 18. Answers: 14.

Across: 4. LAVA, 5. MIRROR, 6. MATTER, 8. MOSS, 9. CHAIR, 11. FERN, 12. LEMON, 13. ATLAS.

Down: 1. ENVELOPE, 2. ALGORITHM, 3. ATOM, 7. RESORT, 9. COFFEE, 10. AIRPORT.

Silhouette (■ = playable square):

```text
····■··
··■·■··
■·■■■■·
■·■·■··
■·■·■··
■■■■■■·
··■·■··
■■■■■■·
··■··■·
··■■■■·
·····■·
·■■■■■·
·■·■·■·
·■■■■··
·■·■···
■■■■■··
·■·■···
··■■■■■
```

### Puzzle C

Seed: 2785704375. Dimensions: 9 × 18. Answers: 14.

Across: 3. RECIPE, 5. GENETICS, 6. CANOPY, 7. DRONE, 10. SOUVENIR, 11. AIRPORT, 12. OXYGEN.

Down: 1. OCEAN, 2. FRICTION, 4. ENCRYPTION, 6. CHORUS, 8. ENVELOPE, 9. FOREST, 11. ATOM.

Silhouette (■ = playable square):

```text
··■·■····
··■·■····
·■■■■■■··
··■·■·■··
■■■■■■■■·
····■·■··
·■■■■■■··
·■··■·■··
·■····■··
■■■■■·■·■
·■··■·■·■
·■■■■■■■■
····■···■
····■···■
■■■■■■■·■
■···■····
■■■■■■···
■········
```

## Evidence files

generation-tests.json contains seeds, dimensions, answer lists, silhouettes, and timings for all 300 generator cases. browser-tests.json contains the 74 browser checks and the three recorded puzzles. final-tests.json records the offline and score tests. Screenshots of A/B/C, completion, desktop, tablet, mobile, and offline play accompany the project in the outputs directory.
