/* All expanded classical-text candidates share one quality gate. Tests original punctuation,
 * unpunctuated OCR, intruded notes, person-name false hits and clearly labeled reading cues. */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const win={},ctx=vm.createContext({window:win});
vm.runInContext(fs.readFileSync("wenyan/study-candidate-quality.js","utf8"),ctx,{filename:"study-candidate-quality.js"});
const q=win.WENYAN_CANDIDATE_QUALITY;
assert(q?.format&&q.excerpt&&q.explain,"quality gate missing");
assert.equal(q.excerpt("…士是时年六十徴以贤良为博士使匈奴还报不合上意国人固推", "固"),null,
 "corrupted unpunctuated 史记 should never be shown as if it were edited punctuation");
assert.equal(q.excerpt("…及苟晞将破汲桑，又谣曰：「元超兄弟大落度，上桑打椹为苟作。」","汲"),null,
 "汲桑 is a man's name, not drawing water");
assert.equal(q.excerpt("至东浚稽山南龙勒水上【师古曰水出西南溉田，故河名也】徘徊观虏而还。","溉"),null,
 "a search term only inside historical interlinear comment must not appear");
assert.equal(q.excerpt("士卒皆从命国人固推弘天子以之为第一","固"),null,
 "never fabricate a full stop for an unpunctuated historical page");
const row=q.format({title:"史记·史记卷一百十二",text:"士人初辞。国人固推弘。天子遂召之。",group:"史记",url:"https://example.org"},"固",{meaning:"本来"});
assert.equal(row.title,"史记·卷一百十二");
assert(row.text.includes("固推弘")&&/[。！？；]$/.test(row.text),"must preserve source punctuation");
assert(row.readingHint.includes("坚持"),"reading clue should explain what 固推 implies");
assert(!("translation" in row),"do not invent a translation for unverified sources");
const ga=q.format({title:"史记·河渠书",text:"西门豹引漳水溉邺，以富魏之河内。"},"溉",{meaning:"灌溉"});
assert(ga?.text.includes("引漳水溉邺")&&ga.readingHint.includes("灌溉"),"annotated irrigation phrase should have a grounded reading cue");
assert.equal(q.format({title:"晋书·五行志",text:"苟晞将破汲桑。"},"汲",{meaning:"从井里打水"}),null);
assert(q.format({title:"徐光启·农政全书",text:"用水以溉田。"},"溉",{meaning:"灌溉"}));
const indexBuilder=fs.readFileSync("wenyan/scripts/build-large-corpus.mjs","utf8");
assert(indexBuilder.includes('if(!/[。！？；]/.test(full))continue')&&indexBuilder.includes('usableContext(full,variant)'),
 "index generation must guard every full-text chapter, not only web presentation");
const html=fs.readFileSync("wenyan/index.html","utf8"),explorer=fs.readFileSync("wenyan/study-explorer.js","utf8");
assert(html.includes("study-candidate-quality.js")&&html.includes("study-verified-batch11.js"));
assert(explorer.includes('WENYAN_CANDIDATE_QUALITY?.format')&&explorer.includes('readingHint'));
console.log(JSON.stringify({ok:true,unpunctuatedExcluded:true,interlinearNotesExcluded:true,personNamesExcluded:true,preservedOriginalPunctuation:true,studentHintWithoutFakeTranslation:true}));
