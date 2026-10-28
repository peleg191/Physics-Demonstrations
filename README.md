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

Basketball has speed and angle controls, with heights and distance in the advanced panel. Its previous observed trajectory can remain visible for comparison. The fixed pulley allows changing both masses and releasing them from rest. No experiment autoplays. Playback pauses when the tab is hidden. Keyboard users can use native slider arrows, number inputs, and buttons; reduced motion users can advance with Step.

## Models and developer configuration

Set `gravity` in `public/js/config.js` to change gravity manually for both models. It defaults to 10 m/s²; there is no student-facing gravity control. Use a finite, positive value.

- Basketball uses constant-gravity analytic projectile motion, no drag, a point particle, and no bounce. Time ends at ground contact. A successful shot crosses the hoop's horizontal coordinate on descent within 0.12 m of its height. Ball and rim artwork do not represent collision geometry. There is no physical capture at the hoop; the analytic trajectory continues to the ground.
- The pulley has a massless, frictionless fixed wheel and taut massless rope. Both masses start from rest. Acceleration and tension follow the two-mass Newton equations. Each mass can travel 1.25 m from its starting position before the experiment freezes; no collision or subsequent dynamics are modeled. Equal masses stay at rest during the four-second observation window. The readouts show travel magnitudes; feedback gives direction.
- Models are sampled at elapsed simulated time rather than advanced with frame-dependent numerical integration.

Detailed equations, instructional prompts, vectors, free-body diagrams, and graphs are deferred.

## Project structure and adding a system

`public/js/registry.js` is the catalog's source of truth. The app and router contain no individual-system logic. Shared code in `public/js/core/` handles the clock, controls, layout, and translation of common interface text.

To add a system:

1. Create `public/js/demos/<id>/physics.js`, `strings.js`, and `index.js`. Keep physics pure and supply gravity explicitly rather than reading hidden model constants.
2. Export `mount({ root, lang })` from `index.js`. It must return `{ reset(), setLanguage(lang), dispose() }`. Use `createExperiment` for the common simulation layout, clock, and controls. Its render callback receives simulated time. Register every event listener with the shell's `signal` so disposal removes it; `api.dispose()` cancels animation and removes the layout. Use a new, module-specific SVG ID prefix for patterns and clips.
3. Keep live state in the mounted instance. Language changes update labels without rebuilding or resetting the instance. Put system-specific Hebrew and English text in `strings.js`; common text lives in `core/i18n.js`. Keep the physical diagram's left/right coordinates independent of interface text direction.
4. Add an illustration in `public/assets/` and a registry entry with a unique stable ID, number, bilingual title/description/tags, topic key, image path, and lazy `load()` function. Use an existing shared topic key, or add its translations in `core/i18n.js`. Catalog cards and `#/<id>` routes appear automatically.
5. Add tests for known physical results, conservation/constraints, alternative gravity, and boundary cases. Document model assumptions and travel limits in both languages.

The collection can grow without editing existing demos or navigation. Topic grouping and search can be added when the catalog becomes large enough to need them.

## Verification

```sh
npm test
npm run check
```

Tests check reference trajectories, energy, force balance, rope constraints, alternative gravity, travel limits, frame-rate independence, pause/resume, stepping, and disposal. Module smoke tests use a minimal DOM adapter to check mounting, language switching without reset, parameter edits, hidden-tab pause, and listener cleanup. In-memory HTTP tests check root/subdirectory asset serving and isolation without opening sockets. The static checker checks JavaScript syntax, local imports/assets, bilingual registry entries, and public directory isolation. Browser interaction and visual checks should cover desktop/mobile, Hebrew layout, language switching during animation, keyboard controls, invalid numeric input, and rapid route changes.

Visual browser QA has not been completed in the implementation environment: local server sockets are blocked and the installed browser cannot launch. Run the local preview on your machine for that check.

## GitHub Pages

Publish the repository to GitHub, using `main` as the default branch (or update `.github/workflows/pages.yml`). Under **Settings → Pages → Build and deployment**, select **GitHub Actions**. Pushes and pull requests run validation only. When you are ready to publish, manually run the workflow on `main` from the Actions tab; it runs checks and tests, then uploads **only `public/`** and deploys it. The workflow follows [GitHub's custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Private development inputs and internal planning files are ignored by Git and are outside `public/`. Do not force-add those files or deploy the workspace root. If any private file was already committed elsewhere, ignoring it does not remove its history; keep it out of the public repository before publishing.

No license has been selected yet. Choose a license before inviting reuse or contributions.
