# Changes

## 2026-11-11 — learning tools and interface polish

This entry records the current local implementation, including changes not yet committed or deployed.

### Collection and presentation

- Made the welcome area more compact so the collection and Physics Journey remain easier to reach.
- Redesigned the collection toolbar with larger **Basic systems** and **Intermediate systems** tabs, corresponding Hebrew labels, more padding, clearer spacing, a separate experiment count, and visible keyboard focus. Mobile tabs share the available width and allow labels to wrap.
- Gave the toolbar distinct theme treatments: smooth segmented controls in regular mode; ruled paper, a margin line, pencil-style borders, and an underlined selection in notebook mode. Both follow light/dark colors and right-to-left layout.
- Made the brand mark follow the illustration style: a crisp pendulum badge in regular mode and a pencil-style pendulum with a hatched bob and graph-paper background in notebook mode. Both inherit the active light/dark palette.
- Standardized interface typography across headings, controls, counts, metrics, graph tick labels, and the footer. Both styles use the same shared UI font stack; equations and physical symbols retain the bundled Latin Modern Math font. Numeric readouts use tabular digits.
- Extended theme-aware colors throughout simulation scenes and catalog artwork, including dark variants for both illustration styles. Theme switching preserves simulation state.

### Quizzes, progress, and language

- Expanded each demonstration to ten bilingual conceptual questions, with five-question practice sets, a full-bank option, hints, retries, answer-specific feedback, and reviews of missed concepts.
- Added **Predict → Observe → Explain** challenges across all demonstrations. A persistent coach guides A/B setups, playback, observation progress, replay, and a separate reasoning question. Parameter changes require replaying the affected setup.
- Added permanent Explorer, Investigator, and Mastery milestones, with bronze/silver/gold stars and matching card frames. The responsive Physics Journey shows collection progress, demonstration tiles, subject badges, and a final collection badge.
- Preserved active sessions and progress locally, including answers and hints, with an in-memory fallback when browser storage is unavailable.
- Refined Hebrew terminology, instructions, and question wording. [HEBREW_STYLE.md](HEBREW_STYLE.md) records the terminology and authoring conventions.
- Rendered authored quiz mathematics locally as semantic MathML, keeping formulas left-to-right inside Hebrew text.

### Verification

- Added native Firefox quiz/achievement checks and canvas theme/contrast checks, plus coverage for progress, mathematical rendering, and theme-specific artwork.
- After the final typography changes, static checks, presentation tests, mobile layout tests, and the Firefox quiz suite passed. The browser suite covered persistence, language switching, guided spring experiments, and English/Hebrew journey layouts at 320, 375, and 430 pixels. The final Firefox run passed after an earlier refresh timeout.

## 2026-11-10 — graph interaction and direct manipulation

Recorded in commit `bc94440` (`bug fixes, more handy features.`).

- Added a graph visibility button beside playback controls.
- Added graph scrubbing with pointer and keyboard controls. Seeking pauses playback and synchronizes the simulation and graph cursor at the selected time.
- Made plots redraw to fit their available dimensions and improved graph-window placement, including use of gaps between diagram regions.
- Reserved the full motion envelopes and relevant force/geometry regions in carousel, circular-motion, bowl, and friction scenes so automatic graph placement better avoids the diagrams.
- Added drag-to-release interaction for the spring, double-spring, and pendulum bodies. Dragging updates the release displacement or angle within the control limits; releasing starts playback. Canceling a drag restores the previous setting and playback state.
- Corrected restoring-force arrow scaling for negative release displacements and expanded clock, graph, layout, and oscillator regression coverage.
