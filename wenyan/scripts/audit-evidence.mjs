/** Verify authored examples, count real coverage, and publish inspectable shortfalls.
 * Untranslated full-text hits MUST NOT be treated as teaching examples.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=process.env.WENYAN_ROOT||'wenyan/';
const win={},ctx={window:win};
for(const f of ['data-basic.js','data-classic.js','data-extra.js','study-annotations.js','study-crosslesson.js','study-verified-extra.js','study-verified-more2.js','study-verified-common3.js','study-verified-corpus.js','study-verified-batch4.js','study-verified-batch5.js','study-verified-batch6.js','study-verified-batch7.js','study-grammar-more.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
}
const works=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[])];
const db=win.WENYAN_ANNOTATIONS,lists=[db,win.WENYAN_CROSSLESSON,win.WENYAN_VERIFIED_EXTRA,win.WENYAN_VERIFIED_MORE2,win.WENYAN_VERIFIED_COMMON3,win.WENYAN_VERIFIED_CORPUS,win.WENYAN_VERIFIED_BATCH4,win.WENYAN_VERIFIED_BATCH5,win.WENYAN_VERIFIED_BATCH6,win.WENYAN_VERIFIED_BATCH7];
const merged={};
const grammarMore=win.WENYAN_GRAMMAR_MORE?.grammar||{};
const normalizeSense=code=>({look:'turn-look',lookback:'turn-look'}[code]||code);
for(const src of lists){for(const [term,s] of Object.entries(src.words||{})){
 const entry=merged[term]||={sources:[],examples:[]};
 entry.sources.push(...(s.sources||[]));entry.examples.push(...(s.examples||[]));
}}
const han=c=>/\p{Script=Han}/u.test(c);
const discovered=new Set(works.flatMap(w=>(w.terms||[]).flatMap(x=>[...String(x[0]||"")].filter(han))));
const errors=[],wordResults=[],grammarResults=[];
for(const [term,s]of Object.entries(merged)){
 for(const [i,x]of s.examples.entries()){
  if(!x[2]?.includes(x[9]||term))errors.push(term+': example #'+i+' does not contain matched word');
  if(!x[3]?.trim()||!x[4]?.trim()||!x[5]?.trim()||!x[6]?.trim()||!x[7]?.trim())errors.push(term+': example #'+i+' missing teaching metadata');
 }
 for(const [i,x]of s.sources.entries()){
  if(x[1]&&!x[1].includes(term))errors.push(term+': source #'+i+' phrase does not contain word');
 }
}
for(const w of works){
 const bodyChars=[...new Set((w.terms||[]).flatMap(x=>[...String(x[0]||"")].filter(han)))];
 for(const term of bodyChars){
  const exact=(w.terms||[]).find(x=>x[0]===term);
  const part=exact?.[1]||"单字待校定";
  const sense=exact?.[2]||"该字在本文中的独立义项待校定";
  const spec=merged[term]||{sources:[],examples:[]};
  const fromSource=spec.sources.find(x=>x[0]===w.title&&w.lines.some(l=>l[0].includes(x[1])));
  const fromExample=spec.examples.find(x=>x[0]===w.title&&w.lines.some(l=>l[0].includes(x[2])||x[2].includes(l[0])));
  const context=fromSource||fromExample,originCode=fromSource?.[4]||fromExample?.[6]||null;
  const seen=new Set(),rows=[];
  for(const x of spec.examples||[]){
   if(x[0]===w.title||!x[2]?.includes(x[9]||term)||!x[3]?.trim())continue;
   const key=x[0]+'|'+x[6];
   if(seen.has(key))continue;seen.add(key);rows.push(x);
  }
  const same=originCode?rows.filter(x=>normalizeSense(x[6])===normalizeSense(originCode)):[];
  const different=originCode?rows.filter(x=>x[6]!==originCode):[];
  wordResults.push({work:w.title,term,part,sense,
   originAnnotated:!!context,originCode,
   reviewedExamples:rows.length,sameSense:same.length,differentSense:different.length,
   fiveExamples:rows.length>=5,twoSame:firstTwoSame(rows,originCode),
   shortfall:Math.max(0,5-rows.length),sameShortfall:Math.max(0,2-same.length)});
 }
 for(const [text,translation,g] of w.lines||[]){
  if(!g)continue;
  const joined=[...(db.grammar[g]?.examples||[]),...(grammarMore[g]?.examples||[])];
  const origin=joined.find(x=>x[0]===w.title&&(text.includes(x[2])||x[2].includes(text)));
  const seen=new Set(),rows=[];
  for(const x of joined){
   if(x[0]===w.title||!x[2]||!x[3])continue;
   const key=x[0]+'|'+x[4];if(seen.has(key))continue;seen.add(key);rows.push(x);
  }
  grammarResults.push({work:w.title,term:g,origin:text,originAnnotated:!!origin,originCode:origin?.[4]||null,
   reviewedExamples:rows.length,sameSense:origin?rows.filter(x=>x[4]===origin[4]).length:0,
   fiveExamples:rows.length>=5,shortfall:Math.max(0,5-rows.length)});
 }
}
function firstTwoSame(rows,code){return !!code&&rows.filter(x=>normalizeSense(x[6])===normalizeSense(code)).length>=2}
const sum={
 generatedAt:new Date().toISOString(),
 works:works.length,
 distinctCharacters:discovered.size,characterLessonEntries:wordResults.length,
 charactersWithZero:wordResults.filter(x=>x.reviewedExamples===0).length,
 charactersWithAtLeastFive:wordResults.filter(x=>x.fiveExamples).length,
 charactersWithTwoSame:wordResults.filter(x=>x.twoSame).length,
 charactersWithBoth:wordResults.filter(x=>x.fiveExamples&&x.twoSame).length,
 charactersWithVerifiedOrigin:wordResults.filter(x=>x.originAnnotated).length,
 // Legacy field aliases retained for existing report consumers; values are now single-character units.
 distinctWordTerms:discovered.size,wordLessonEntries:wordResults.length,
 wordsWithZero:wordResults.filter(x=>x.reviewedExamples===0).length,
 wordsWithAtLeastFive:wordResults.filter(x=>x.fiveExamples).length,
 wordsWithTwoSame:wordResults.filter(x=>x.twoSame).length,
 wordsWithBoth:wordResults.filter(x=>x.fiveExamples&&x.twoSame).length,
 wordSourceAnnotated:wordResults.filter(x=>x.originAnnotated).length,
 grammarOccurrences:grammarResults.length,
 grammarWithAtLeastFive:grammarResults.filter(x=>x.fiveExamples).length,
 grammarWithVerifiedOrigin:grammarResults.filter(x=>x.originAnnotated).length,
 grammarTopicsExpanded:Object.keys(grammarMore).length,
 verifiedSupplementalExamples:[win.WENYAN_VERIFIED_EXTRA,win.WENYAN_VERIFIED_MORE2,win.WENYAN_VERIFIED_COMMON3,win.WENYAN_VERIFIED_CORPUS,win.WENYAN_VERIFIED_BATCH4,win.WENYAN_VERIFIED_BATCH5,win.WENYAN_VERIFIED_BATCH6,win.WENYAN_VERIFIED_BATCH7].reduce((n,list)=>n+Object.values(list?.words||{}).reduce((m,x)=>m+x.examples.length,0),0),
 strictRule:'Per single character: >= 5 distinct reviewed source-text/sense pairs, at least 2 with the same sense as its annotated origin. Raw corpus hits do not count.',
 warnings:errors
};
const report={summary:sum,characters:wordResults,words:wordResults,grammar:grammarResults};
if(process.env.WENYAN_COVERAGE_DEST){
 const out=process.env.WENYAN_COVERAGE_DEST;
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2),'utf8');
}
console.log(JSON.stringify(sum));
const regressionChars=['内','集','俄','未','儿','女','诣','疾','顾','引','骤','舍','值','诸','竞','莫','弗','汝','岂','委','闻','或','甚','唯'];
for(const term of regressionChars){
 const spec=merged[term];
 const seen=new Set(),rows=[];
 for(const x of spec?.examples||[]){
  if(!x[2]?.includes(x[9]||term)||!x[3]?.trim())continue;
  const key=x[0]+'|'+x[6];if(seen.has(key))continue;seen.add(key);rows.push(x);
 }
 const candidates=(spec?.sources||[]).map(source=>{
  const originWork=works.find(w=>w.title===source[0]&&(w.lines||[]).some(l=>String(l[0]||"").includes(source[1])));
  const same=rows.filter(x=>normalizeSense(x[6])===normalizeSense(source[4]));
  return {source,originWork,sameSources:new Set(same.map(x=>x[0]))};
 }).filter(x=>x.originWork&&x.sameSources.size>=2)
  .sort((a,b)=>b.sameSources.size-a.sameSources.size);
 const best=candidates[0];
 if(!best||rows.length<5){
  console.error('Verified single-character regression',term,JSON.stringify({
   origin:best?.source?.[0]||null,originInBody:!!best?.originWork,reviewedExamples:rows.length,
   sameSenseSources:best?.sameSources?.size||0,distinctSources:new Set(rows.map(x=>x[0])).size
  }));
  process.exitCode=3;
 }
}
