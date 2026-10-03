# CrossMorph

A complete English crossword game with a new procedurally generated layout for every new puzzle. Built with plain HTML, CSS, and JavaScript. No packages, accounts, APIs, remote assets, or build step required.

## Play

Open `index.html` in a modern desktop browser, or serve this directory with any static web server. The game also works offline. Click a clue or a square, type letters, and use the crossings to finish the puzzle. A built-in How to play dialog explains all controls.

- Letters: enter a letter and move along the active answer.
- Arrows: navigate cells; horizontal arrows favor Across, vertical arrows favor Down.
- Space / Enter: switch direction at a crossing.
- Tab / Shift+Tab: next / previous clue.
- Backspace: erase the current letter, or move back and erase when the current square is blank.
- Home / End: beginning / end of the active answer.
- Check: mark entered letters without revealing answers.
- Hint: reveal one incorrect or missing letter in the selected answer.
- Reset: clear entries and solve statistics, retaining the current grid.
- New puzzle: choose new words and generate an entirely new structure.

## Generation

The local database contains 215 original answer/clue pairs across everyday English, science, technology, nature, travel, culture, and food. The generator uses seeded word selection, insertion order, candidate placement, and shape preferences. Layout dimensions are derived from occupied cells; there is no fixed template or symmetry requirement.

Every crossword has 14–18 connected answers. Placement checks reject mismatched crossings, parallel overlaps, side adjacency, and letters abutting word ends. A separate validator checks database membership, clues, intersections, adjacency, entry identity, numbering, connectivity, and orphan cells. Invalid attempts are discarded with a bounded retry budget. The last 20 shape, structure, and word-set signatures are excluded from new puzzles.

Difficulty affects vocabulary, answer length, clue directness, intersection preference, hint allowance, and score. Medium is the default. Easy gives 9 hints, Medium 5, and Hard 3. The timer starts on interaction, pauses when the tab is hidden, and can be hidden. Browser storage saves the current puzzle and progress when available.

## Static deployment

Upload this directory as-is. `index.html` is the entry point. All paths are relative, so deployment under a subdirectory is supported. For Vercel, use the Other framework preset and leave build/install commands empty. A minimal `vercel.json` is included.

## Development

`database.js` contains the clue data; `generator.js` exposes the generation and validation functions and can also be required in Node. `app.js` contains interaction, scoring, persistence, and timer behavior. `style.css` supplies the responsive editorial interface. `?qa=1` exposes a read-only state snapshot for browser verification. Normal play does not expose that test interface.

See `TESTING.md` for the verification results accompanying this build.
