# Physics Playground

A static, bilingual collection of interactive mechanics experiments for introductory university students. Built with HTML, CSS, JavaScript ES modules, and SVG. No build step, packages, accounts, or external runtime services.

## Run locally

Use Node.js 18+ and Python 3:

```sh
npm run dev
```

Open http://127.0.0.1:8000/. ES modules require an HTTP server; opening the HTML file directly will not work. Only `public/` is served. To check a GitHub Pages project subdirectory:

```sh
python3 scripts/serve.py --port 8000 --base-path /physics-playground/
```

Open http://127.0.0.1:8000/physics-playground/. Direct experiment links use `#/basketball` and `#/pulley`, so a reload requires no server routing rules.

## Use

Choose an experiment, change its sliders or numeric fields, and press Play. Pause, advance by 0.05 simulated seconds, reset, or choose quarter-speed playback. Changing physical parameters resets time. Restore defaults resets the physical parameters too. Language changes preserve the current experiment, parameters, and playback state; the language preference is stored locally when storage is available.

Basketball has an optional equal-time trail in “Make it your own”: dots mark positions every 0.1 simulated seconds, revealing constant horizontal spacing and changing vertical spacing. The trail is off by default. Basketball has speed and angle controls, with heights and distance in the advanced panel. Its previous observed trajectory can remain visible for comparison. The fixed pulley allows changing both masses and releasing them from rest. No experiment autoplays. Playback pauses when the tab is hidden. Keyboard users can use native slider arrows, number inputs, and buttons; reduced motion users can advance with Step.

## Models and developer configuration

Set `gravity` in `public/js/config.js` to change gravity manually for both models. It defaults to 10 m/s²; there is no student-facing gravity control. Use a finite, positive value.

- Basketball uses constant-gravity analytic projectile motion, no drag, a point particle, and no bounce. Time ends at ground contact. A successful shot crosses the hoop's horizontal coordinate on descent within 0.12 m of its height. Ball and rim artwork do not represent collision geometry. There is no physical capture at the hoop; the analytic trajectory continues to the ground.
- The pulley has a massless, frictionless fixed wheel and taut massless rope. Both masses start from rest. Acceleration and tension follow the two-mass Newton equations. Each mass can travel 1.25 m from its starting position before the experiment freezes; no collision or subsequent dynamics are modeled. Equal masses stay at rest during the four-second observation window. The readouts show travel magnitudes; feedback gives direction.
- Models are sampled at elapsed simulated time rather than advanced with frame-dependent numerical integration.

In the pulley experiment, click or tap either mass (or focus it and press Enter/Space) to open its body analysis below the simulation. Selection shows thick, horizontally centered tension and weight arrows directly on the mass in the simulation and pauses playback without changing time; Play continues with the analysis open. Close or Escape dismisses the panel and returns focus to that mass. Selection and the optional substitution/solution expansions survive parameter edits, reset, and language changes. Leaving the experiment clears them.

The force arrows follow the selected mass during playback and use one linear scale shared by both bodies. The equations below state the positive axis: downward on the left and upward on the right. There is no separate force diagram. Equations use native MathML with a bundled Latin Modern Math font for TeX-style typesetting, proper fractions, subscripts, and powers. The font is served locally; its license and attribution are in `public/assets/fonts/`. Symbolic Newton equations precede optional current-value substitutions and a symbolic coupled-system derivation; “Solve the system” contains no numerical substitutions. At the travel cutoff the panel explains that the ideal motion equations do not model a collision or equilibrium. Time graphs and tools for solving basketball launch parameters remain deferred.

In basketball, select the ball by click, tap, or Enter/Space to see its launch components and horizontal/vertical equations of motion. A small +x/+y marker shows the fixed coordinate directions. The optional “Derive the trajectory” section eliminates time to obtain the symbolic parabola equation, without numerical substitutions. Selection pauses playback; Play continues with the equations open. Canvas clicks outside the ball, Close, and Escape dismiss the analysis. Selection and the derivation expansion survive scene rebuilds, parameter changes, resets, and language changes. The selected outline stays fixed while the decorative ball artwork rotates. At ground contact, the panel explains the model cutoff.

The third system, **Inclined plane with friction / מישור משופע עם חיכוך**, is available at `#/incline`. It uses the section 1.3 example from `Material/Tirgul3.pdf`: a 3 kg block, μₛ = 0.2, μₖ = 0.1, and a 30° slope. Controls vary mass, angle, and both friction coefficients; editing a coefficient adjusts its counterpart when needed to preserve μₖ ≤ μₛ. Every parameter edit restarts the block from rest. Static friction balances the downhill weight component up to its limit; above the critical angle the block slides with acceleration g(sin α − μₖ cos α). The readouts show displacement, acceleration, and critical angle. Select the block to pause playback, show weight/normal/friction arrows on the moving body, and open the symbolic threshold and acceleration derivations. Language switching and parameter edits retain selection. Playback ends after 4 m of travel, or 4 s for a resting block; no collision is modeled. The source document stays outside the served public directory.

Two harmonic oscillator systems are available from the catalog:

- **Small-angle pendulum / מטוטלת בזוויות קטנות** (`#/pendulum`): adjust bob mass, string length (0.5–3 m), and initial angle (1–15°). Released from rest, the bob follows θ(t) = θ₀ cos(√(g/L)t). Angular velocity is reported in rad/s; the displayed angle and input use degrees. The dynamics and conserved energy use the small-angle approximation, while the drawing follows a circular arc. The tangential restoring-force arrow is approximate and does not represent the total force, which also includes the radial component.
- **Horizontal mass–spring oscillator / מתנד מסה–קפיץ אופקי** (`#/spring`): adjust mass, spring stiffness (1–100 N/m), and initial displacement (0.05–1 m). Released from rest on a frictionless horizontal surface, the mass follows x(t) = A cos(√(k/m)t). The spring visibly compresses and stretches around its natural length; a dashed line marks equilibrium.

Both oscillators use analytic time sampling without damping or driving. Select the moving body to pause playback and open symbolic derivations of the restoring equation, cosine solution, velocity, and period. Play resumes with the analysis open; Escape or Close dismisses it. Selection and the expanded derivation survive edits, resets, and language changes. Each run ends after four periods as an observation cutoff, rather than a physical stop. Tests check phase, turning points, energy conservation, parameter dependence, selection, localization, and cleanup.

## Project structure and adding a system

`public/js/registry.js` is the catalog's source of truth. The app and router contain no individual-system logic. Shared code in `public/js/core/` handles the clock, controls, layout, and translation of common interface text.

To add a system:

1. Create `public/js/demos/<id>/physics.js`, `strings.js`, and `index.js`. Keep physics pure and supply gravity explicitly rather than reading hidden model constants.
2. Export `mount({ root, lang })` from `index.js`. It must return `{ reset(), setLanguage(lang), dispose() }`. Use `createExperiment` for the common simulation layout, clock, and controls. Its render callback receives simulated time. Register every event listener with the shell's `signal` so disposal removes it; `api.dispose()` cancels animation and removes the layout. Use a new, module-specific SVG ID prefix for patterns and clips.
3. Keep live state in the mounted instance. Language changes update labels without rebuilding or resetting the instance. Put system-specific Hebrew and English text in `strings.js`; common text lives in `core/i18n.js`. Keep the physical diagram's left/right coordinates independent of interface text direction.
4. Add an illustration in `public/assets/` and a registry entry with a unique stable ID, number, bilingual title/description/tags, topic key, image path, and lazy `load()` function. Use an existing shared topic key, or add its translations in `core/i18n.js`. Catalog cards and `#/<id>` routes appear automatically.
5. For a force-based system, use `createBodyAnalysis` from `core/body-analysis.js` with a unique ID and the shell's `stageColumn` and `signal`. Supply stable body IDs, localized titles, two vertical force vectors (tension then weight for the pulley), a common linear scale, the positive-axis direction, accessible force descriptions, and authored symbolic/numeric solution steps. Render force overlays in the simulation itself; the shared panel displays equations. Keep these data in a demo-specific module such as `demos/pulley/analysis.js`, using the existing physics model as the source of truth. The panel preserves expansion state while updating content and avoids redrawing unchanged analysis during animation. Handle selection, pausing, focus return, and reset policy in the demo. The shared panel also accepts optional `groups` of equations and can omit `numeric` entirely, as in `demos/basketball/analysis.js`. Its `solution` expansion holds the optional symbolic derivation. Use the shared MathML helpers for authored fractions, subscripts, powers, and upright trigonometric functions. When rebuilding SVG objects, delegate events to the stable SVG root or abort per-scene listeners to avoid retaining detached objects.
6. Add tests for known physical results, conservation/constraints, alternative gravity, and boundary cases. Document model assumptions and travel limits in both languages.

The collection can grow without editing existing demos or navigation. Topic grouping and search can be added when the catalog becomes large enough to need them.

## Verification

```sh
npm test
npm run check
```

Tests check reference trajectories, energy, force balance, rope constraints, alternative gravity, travel limits, frame-rate independence, pause/resume, stepping, and disposal. Basketball analysis tests check scene-rebuild selection, delegated events, keyboard/background dismissal, preserved expansion state, continued playback, symbolic MathML, and trajectory consistency across launch parameters and gravity. Body-analysis tests also check both axis signs, common force scaling at extreme ratios, alternative gravity, keyboard selection, focus return, pause without reset, retained expansions, translated content, cutoff labeling, and disposal. Module smoke tests use a minimal DOM adapter to check mounting, language switching without reset, parameter edits, hidden-tab pause, and listener cleanup. In-memory HTTP tests check root/subdirectory asset serving and isolation without opening sockets. The static checker checks JavaScript syntax, local imports/assets, bilingual registry entries, and public directory isolation. Browser interaction and visual checks should cover desktop/mobile, Hebrew layout, language switching during animation, keyboard controls, invalid numeric input, and rapid route changes.

Headless Firefox captures also verified the basketball analysis on an English desktop and Hebrew phone layout, including open symbolic derivations; browser-side checks exercise selection, scene rebuilds, dismissal, keyboard controls, and resets. The pulley captures verified the route, the open English desktop analysis, and the Hebrew phone layout with an extreme mass ratio and expanded equations. Automated DOM tests verify selection and lifecycle behavior. A hands-on screen-reader and touch-device review remains useful; screenshot checks do not replace it.

## GitHub Pages

Publish the repository to GitHub, using `main` as the default branch (or update `.github/workflows/pages.yml`). Under **Settings → Pages → Build and deployment**, select **GitHub Actions**. Pushes and pull requests run validation only. When you are ready to publish, manually run the workflow on `main` from the Actions tab; it runs checks and tests, then uploads **only `public/`** and deploys it. The workflow follows [GitHub's custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Private development inputs and internal planning files are ignored by Git and are outside `public/`. Do not force-add those files or deploy the workspace root. If any private file was already committed elsewhere, ignoring it does not remove its history; keep it out of the public repository before publishing.

No license has been selected yet. Choose a license before inviting reuse or contributions.
