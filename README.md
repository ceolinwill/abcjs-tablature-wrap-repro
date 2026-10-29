# abcjs: no tablature when `renderAbc` wraps lines

Minimal reproduction for `renderAbc` dropping the guitar tab when it gets both `tablature` and `wrap`. Without `wrap`, the same tune draws its tab staff under the notes; with `wrap` (and `staffwidth`), only the notes are drawn.

## Reproduction

```sh
npm install
npx playwright install chromium
npm run repro
```

`repro.mjs` renders one tune twice in headless Chromium with `{ staffwidth: 300, tablature: [{ instrument: "guitar" }] }`, the second time adding `wrap: { preferredMeasuresPerLine: 2 }`, and counts the tab's fret numbers (`.abcjs-tab-number`):

```txt
abcjs-basic v6.7.2
without wrap: { tablatures: 1, fretNumbers: 16 }
with wrap:    { tablatures: 0, fretNumbers: 0 }

Bug: with `wrap`, the guitar tab isn't drawn.
```

`index.html` shows the same two renders from jsDelivr, without installing anything.

## Expected

With `wrap`, the tune wraps onto two lines and each line keeps its tab staff, with all 16 fret numbers.

## Actual

No tab staff and no fret numbers, and the returned tune has no `tablatures`.

`renderEngine` (`src/api/abc_tunebook.js`) parses the tune and sets `tune.tablatures = tablatures.preparePlugins(tune, currentTune, params)`. With `wrap` and `staffwidth`, the `renderAbc` callback calls `doLineWrapping` (`src/api/abc_tunebook_svg.js`), which re-parses the tune with the new line breaks whenever `calcLineWraps` returns `reParse: true` (it does unless the staff is narrower than the margins). The re-parsed tune never gets its `tablatures`, so `EngraverController.engraveABC` skips `tablatures.layoutTablatures`.

Setting them again after the re-parse fixes it. With this change to `doLineWrapping`, a locally bundled copy of 6.7.2 draws two lines and all 16 fret numbers:

```js
var tablatures = require('../tablatures/abc_tablatures');
// …
tune = abcParser.getTune();
if (params.tablature)
    tune.tablatures = tablatures.preparePlugins(tune, tuneNumber, params);
```

## Environment

- abcjs: `6.7.2` (also `6.7.1`)
- Playwright: `1.64.1` (Chromium)
- Node.js: `24.22.0`
- macOS: `27.2`
