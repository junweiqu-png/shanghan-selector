/** Verify authored examples, count real coverage, and publish inspectable shortfalls.
 * Untranslated full-text hits MUST NOT be treated as teaching examples.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=process.env.WENYAN_ROOT||'wenyan/';
const win={},ctx={window:win};
for(const f of ['data-basic.js','data-classic.js','data-extra.js','study-annotations.js','study-crosslesson.js','study-verified-extra.js','study-grammar-more.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
}
const works=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[])];
const db=win.WENYAN_ANNOTATIONS,lists=[db,win.WENYAN_CROSSLESSON,win.WENYAN_VERIFIED_EXTRA];
const merged={};
const grammarMore=win.WENYAN_GRAMMAR_MORE?.grammar||{};
const normalizeSense=code=>({look:'turn-look',lookback:'turn-look'}[code]||code);
for(const src of lists){for(const [term,s] of Object.entries(src.words||{})){
 const entry=merged[term]||={sources:[],examples:[]};
 entry.sources.push(...(s.sources||[]));entry.examples.push(...(s.examples||[]));
}}
const discovered=new Set(works.flatMap(w=>(w.terms||[]).map(x=>x[0])));
const errors=[],wordResults=[],grammarResults=[];
for(const [term,s]of Object.entries(merged)){
 for(const [i,x]of s.examples.entries()){
  if(!x[2]?.includes(term))errors.push(term+': example #'+i+' does not contain word');
  if(!x[3]?.trim()||!x[4]?.trim()||!x[5]?.trim()||!x[6]?.trim()||!x[7]?.trim())errors.push(term+': example #'+i+' missing teaching metadata');
 }
 for(const [i,x]of s.sources.entries()){
  if(x[1]&&!x[1].includes(term))errors.push(term+': source #'+i+' phrase does not contain word');
 }
}
for(const w of works){
 for(const [term,part,sense]of w.terms||[]){
  const spec=merged[term]||{sources:[],examples:[]};
  const context=spec.sources.find(x=>x[0]===w.title&&w.lines.some(l=>l[0].includes(x[1]))),
        originCode=context?.[4]||null;
  const seen=new Set(),rows=[];
  for(const x of spec.examples||[]){
   if(x[0]===w.title||!x[2]?.includes(term)||!x[3]?.trim())continue;
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
 works:works.length,distinctWordTerms:discovered.size,wordLessonEntries:wordResults.length,
 wordsWithZero:wordResults.filter(x=>x.reviewedExamples===0).length,
 wordsWithAtLeastFive:wordResults.filter(x=>x.fiveExamples).length,
 wordsWithTwoSame:wordResults.filter(x=>x.twoSame).length,
 wordsWithBoth:wordResults.filter(x=>x.fiveExamples&&x.twoSame).length,
 wordSourceAnnotated:wordResults.filter(x=>x.originAnnotated).length,
 grammarOccurrences:grammarResults.length,
 grammarWithAtLeastFive:grammarResults.filter(x=>x.fiveExamples).length,
 grammarWithVerifiedOrigin:grammarResults.filter(x=>x.originAnnotated).length,
 grammarTopicsExpanded:Object.keys(grammarMore).length,
 verifiedSupplementalExamples:Object.values(win.WENYAN_VERIFIED_EXTRA?.words||{}).reduce((n,x)=>n+x.examples.length,0),
 strictRule:'Goal: >= 5 distinct reviewed source-text/sense pairs, first 2 SAME sense as origin. Do not count raw corpus hits or fabricate a translation.',
 warnings:errors
};
const report={summary:sum,words:wordResults,grammar:grammarResults};
if(process.env.WENYAN_COVERAGE_DEST){
 const out=process.env.WENYAN_COVERAGE_DEST;
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2),'utf8');
}
console.log(JSON.stringify(sum));
if(errors.length)process.exitCode=2;
for(const term of ['俄而','未若','诣','疾','顾','引','骤','舍','值']){
 const rows=wordResults.filter(r=>r.term===term);
 if(!rows.length||rows.some(r=>r.reviewedExamples<5||r.sameSense<2))
 {console.error('Verified regression',term,JSON.stringify(rows));process.exitCode=3;}
}
