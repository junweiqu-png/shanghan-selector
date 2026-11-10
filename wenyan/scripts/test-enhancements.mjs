import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root='wenyan/',win={},context={window:win};
const pinyin=fs.readFileSync(root+'pinyin.js','utf8');
new vm.Script(pinyin).runInNewContext(context);
assert(win.WENYAN_PINYIN,'pinyin renderer missing');
const p=win.WENYAN_PINYIN;
assert.equal(p.pick('尊君在不？',3),'fǒu','在不 must be fǒu');
assert.equal(p.pick('期年之后',0),'jī','期年 must be jī');
assert.equal(p.pick('俄而雪骤',3),'zhòu','骤 must be zhòu');
assert.equal(p.pick('王戎',1),'róng','戎 must be róng');
assert.equal(p.pick('不动',0),'','do not annotate common 不 as fǒu');
assert(p.annotate('俄而雪骤').includes('<ruby>骤<rt>zhòu</rt></ruby>'));
for(const f of ['study-editor.js','app.js','study-explorer.js','scripts/build-large-corpus.mjs','scripts/build-expanded-corpus.mjs','scripts/build-poetry-classics.mjs']){
 new vm.Script(fs.readFileSync(root+f,'utf8'),{filename:f});
}
const site=fs.readFileSync(root+'index.html','utf8');
for(const file of ['pinyin.js','study-editor.js','study-editor.css','study-explorer.js','study-annotations.js'])
 assert(site.includes(file),'missing HTML asset '+file);
const app=fs.readFileSync(root+'app.js','utf8');
assert(app.includes('studyEditSettings'),'user annotation editor not reachable from settings');
assert(app.includes('studyEditReview'),'user annotation editor not reachable from study index');
assert(app.includes('data-plain'),'source text must exclude ruby readings in word sense matching');
assert(app.includes('window.WENYAN_PINYIN?.span'),'difficult-character pinyin absent in card render');
const explorer=fs.readFileSync(root+'study-explorer.js','utf8');
assert(explorer.includes('function grammarSpec('),'custom grammar not merged');
assert(explorer.includes('function knowTerm('),'custom word not merged');
assert(explorer.includes('editStudyTerm'),'association dialog lacks add-example action');
const teacher=fs.readFileSync(root+'study-editor.js','utf8');
assert(teacher.includes('evidence/expanded-manifest.json'),'teacher corpus manifest not read');
assert(teacher.includes('evidence/large-index/'),'teacher does not use lazy classical dictionary index');
assert(teacher.includes('editTranslation'),'translated example is required');
const config=fs.readFileSync('.github/workflows/pages.yml','utf8');
for(const name of ['build-expanded-corpus.mjs','build-large-corpus.mjs','build-poetry-classics.mjs'])
 assert(config.includes('node '+name.replace(/^/, 'wenyan/scripts/')),'Pages workflow missing builder '+name);
console.log(JSON.stringify({ok:true,pinyin:'context-correct',manualEditor:'wired',backgroundIndex:'lazy',workflow:'complete'}));
