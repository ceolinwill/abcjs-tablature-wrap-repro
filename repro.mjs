import { chromium } from "playwright";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const abcjsScript = require.resolve("abcjs/dist/abcjs-basic-min.js");

const tune = "X:1\nM:4/4\nL:1/4\nK:G\nG A B c | d e f g | g f e d | c B A G |]";
const tablature = [{ instrument: "guitar" }];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<!doctype html><html><body></body></html>");
await page.addScriptTag({ path: abcjsScript });

const results = await page.evaluate(
  ({ tune, tablature }) => {
    function render(options) {
      const div = document.createElement("div");
      document.body.append(div);
      const [rendered] = ABCJS.renderAbc(div, tune, { add_classes: true, ...options });

      return {
        tablatures: rendered.tablatures ? rendered.tablatures.length : 0,
        fretNumbers: div.querySelectorAll(".abcjs-tab-number").length,
      };
    }

    return {
      version: ABCJS.signature,
      withoutWrap: render({ staffwidth: 300, tablature }),
      withWrap: render({ staffwidth: 300, tablature, wrap: { preferredMeasuresPerLine: 2 } }),
    };
  },
  { tune, tablature },
);

await browser.close();

console.log(results.version);
console.log("without wrap:", results.withoutWrap);
console.log("with wrap:   ", results.withWrap);

if (results.withWrap.fretNumbers === 0 && results.withoutWrap.fretNumbers > 0) {
  console.log("\nBug: with `wrap`, the guitar tab isn't drawn.");
  process.exitCode = 1;
}
