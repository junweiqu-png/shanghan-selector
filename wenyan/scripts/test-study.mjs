import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const dir=process.env.WENYAN_ROOT||'wenyan/',dbWindow={};
const js=fs.readFileSync(dir+'study-annotations.js','utf8');
new vm.Script(js,{filename:'study-annotations.js'}).runInNewContext({window:dbWindow});
const D=dbWindow.WENYAN_ANNOTATIONS;
assert(D && D.words && D.grammar,'annotation data missing');
let lex=0,gram=0;const seen=new Set();
for(const [term,v] of Object.entries(D.words)){
 assert(Array.isArray(v.examples),'missing examples for '+term);
 for(const s of v.sources||[]){
   assert(s.length===6&&s.every(Boolean),'invalid source sense '+term+' '+JSON.stringify(s));
   assert(s[1].includes(term),'source anchor does not include the headword '+term+' '+s[1]);
 }
 for(const x of v.examples){
  assert(x.length>=8,'incomplete lexical entry '+term);
  assert(x.slice(0,8).every(Boolean),'blank lexical fields '+term+' '+JSON.stringify(x));
  assert(x[2].includes(term),'quote does not contain headword '+term+' '+x[0]);
  assert(!/\(本句没有/.test(x[4]),'negative-control example should not be shown');
  if(x[8])assert(/^https:\/\//.test(x[8]),'source link must be an absolute https URL');
  assert(!seen.has(term+'|'+x[0]+'|'+x[2]),'duplicate lexical example');
  seen.add(term+'|'+x[0]+'|'+x[2]);lex++;
 }
}
for(const [pattern,v] of Object.entries(D.grammar)){
 assert(v.definition&&Array.isArray(v.examples)&&v.examples.length,'missing grammar details '+pattern);
 for(const x of v.examples){
   assert(x.length>=6&&x.slice(0,6).every(Boolean),'incomplete grammar passage '+pattern);
   assert(x[2].length>3&&x[3].length>5,'grammar excerpt needs original and translation');
   gram++;
 }
}
const yin=D.words['因'];assert(yin&&yin.examples.length>=7,'multi-sense 因 missing');
const yinSource=yin.sources.find(x=>x[0]==='咏雪');
assert(yinSource?.[4]==='advantage','咏雪 因 must mean taking advantage of wind');
for(const [title,code] of [['过秦论','advantage'],['烛之武退秦师','depend'],['唐雎不辱使命','then']]){
 assert(yin.examples.some(e=>e[0]===title&&e[6]===code),'missing important 因 contrast '+title);
}
const ni=D.words["拟"];
assert(ni && ni.examples.length>=5,"拟 needs several translated cross-text examples");
assert(ni.sources.some(x=>x[0]==="咏雪"&&x[4]==="compare"),"拟 missing source-lesson meaning");
assert(ni.examples.some(x=>x[6]==="compare"),"拟 needs equivalent sense");
assert(ni.examples.some(x=>x[6]==="imitate"),"拟 needs related sense");
assert(ni.examples.some(x=>x[6]==="nominate"),"拟 needs different official-nomination sense");
assert(ni.examples.every(x=>x[0]!=="咏雪"),"original work cannot repeat as associated example");
const app=fs.readFileSync(dir+'index.html','utf8');
for(const name of ['study-annotations.js','study-explorer.js','study-explorer.css'])assert(app.includes(name),'asset missing in HTML '+name);
const expl=fs.readFileSync(dir+'study-explorer.js','utf8');
new vm.Script(expl,{filename:'study-explorer.js'});
assert(!/上句|下句|命中句/.test(expl),'old up/down/target labels present in visible UI code');
assert(!/rawCount|原典命中|字形匹配/.test(expl),'uncurated raw hits or background counts leaked to learning page');
assert(expl.includes('if(r.title===origin.title)continue'),'source work must be excluded from associated list');
assert(expl.includes('const key=r.title+"|"+r.code'),'identical source senses must be deduplicated');
assert(lex>=90&&gram>=70,'unexpected evidence coverage drop');
console.log(JSON.stringify({ok:true,words:Object.keys(D.words).length,translatedWordExamples:lex,grammarTopics:Object.keys(D.grammar).length,translatedGrammarExamples:gram},null,2));