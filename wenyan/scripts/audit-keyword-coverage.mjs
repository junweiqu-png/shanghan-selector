/* Full audit of every textbook word/phrase against reviewed examples and the 17M-character teacher corpus index. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
const root='wenyan/',out='dist/wenyan/evidence';
const win={};
for(const f of ['data-basic.js','data-classic.js','data-extra.js','data-junior.js','data-junior-batch2a.js','data-junior-batch2b.js','data-junior-batch2c.js','study-annotations.js','study-crosslesson.js','study-verified-extra.js','study-verified-more2.js','study-verified-common3.js','study-verified-corpus.js','study-verified-batch4.js','study-verified-batch5.js','study-verified-batch6.js','study-verified-batch7.js','study-verified-batch8.js','study-junior-glosses.js']){
 vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),{window:win},{filename:f});
}
const works=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[]),...(win.WENYAN_DATA_4||[])];
const stores=[win.WENYAN_ANNOTATIONS,win.WENYAN_CROSSLESSON,win.WENYAN_VERIFIED_EXTRA,win.WENYAN_VERIFIED_MORE2,win.WENYAN_VERIFIED_COMMON3,win.WENYAN_VERIFIED_CORPUS,win.WENYAN_VERIFIED_BATCH4,win.WENYAN_VERIFIED_BATCH5,win.WENYAN_VERIFIED_BATCH6,win.WENYAN_VERIFIED_BATCH7,win.WENYAN_VERIFIED_BATCH8,win.WENYAN_JUNIOR_GLOSSES];
const merged={};
for(const store of stores)for(const [term,s]of Object.entries(store?.words||{})){
 const item=merged[term]||={sources:[],examples:[]};
 item.sources.push(...(s.sources||[]));item.examples.push(...(s.examples||[]));
}
const normalize=code=>({look:'turn-look',lookback:'turn-look'}[code]||code);
const uses=[],han=c=>/\p{Script=Han}/u.test(c);
for(const work of works){
 // “词”只作为原文定位的上下文；统计与学习入口一律拆为正文里的单个汉字。
 const chars=[...new Set((work.terms||[]).flatMap(x=>[...String(x[0]||"")].filter(han)))];
 for(const term of chars){
  const exact=(work.terms||[]).find(x=>x[0]===term);
  const part=exact?.[1]||"单字待校定",meaning=exact?.[2]||"该字在本文中的独立义项待校定";
  const spec=merged[term]||{sources:[],examples:[]};
  const sourceCandidates=spec.sources.filter(s=>s[0]===work.title&&work.lines.some(l=>l[0].includes(s[1])));
  const rows=[],seen=new Set();
  for(const x of spec.examples){
   if(x[0]===work.title||!x[2]?.includes(x[9]||term)||!x[3]?.trim()||!x[4]?.trim()||!x[5]?.trim()||!x[6]?.trim()||!x[7]?.trim())continue;
   const key=x[0]+'|'+normalize(x[6]);if(seen.has(key))continue;seen.add(key);rows.push(x);
  }
  const source=sourceCandidates.map(candidate=>({candidate,same:rows.filter(x=>normalize(x[6])===normalize(candidate[4])).length}))
   .sort((a,b)=>b.same-a.same)[0]?.candidate;
  const same=source?rows.filter(x=>normalize(x[6])===normalize(source[4])).length:0;
  const exactWord=rows.filter(x=>(x[9]||term)===term).length,relatedCharacter=rows.length-exactWord;
  uses.push({work:work.title,term,part,meaning,originAnnotated:!!source,originMeaning:source?.[2]||meaning,reviewedExamples:rows.length,exactWordExamples:exactWord,relatedCharacterExamples:relatedCharacter,sameSense:same,differentSense:source?rows.length-same:0,firstTwoSame:same>=2,meetsFive:rows.length>=5,meetsRule:!!source&&rows.length>=5&&same>=2,shortfall:Math.max(0,5-rows.length)});
 }
}
const terms=[...new Set(uses.map(x=>x.term))];
const manifestPath=path.join(out,'expanded-manifest.json');
let manifest={};try{manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));}catch{}
const candidates={};let candidateIndexAvailable=false;
if(manifest.large?.available&&manifest.large?.termIndexShards){
 candidateIndexAvailable=true;
 for(let i=0;i<manifest.large.termIndexShards;i++){
  const p=path.join(out,'large-term-index',i.toString().padStart(2,'0')+'.json.gz');
  try{Object.assign(candidates,JSON.parse(gunzipSync(fs.readFileSync(p)).toString('utf8')))}catch(e){throw new Error('cannot read term candidate shard '+i+': '+e.message)}
 }
}
const unique=terms.map(term=>{
 const items=uses.filter(x=>x.term===term),candidateRows=candidates[term]||[];
 return {term,uses:items.length,originAnnotated:items.every(x=>x.originAnnotated),minReviewedExamples:Math.min(...items.map(x=>x.reviewedExamples)),minSameSense:Math.min(...items.map(x=>x.sameSense)),rawCandidates:candidateRows.length,candidateBooks:[...new Set(candidateRows.map(x=>x.source))].length,ready:items.every(x=>x.meetsRule),items};
});
const summary={
 generatedAt:new Date().toISOString(),works:works.length,wordOccurrences:uses.length,distinctTerms:terms.length,
 candidateIndexAvailable,largeCorpusRecords:manifest.large?.sourceRecords||0,largeCorpusBooks:manifest.large?.sourceBooks||0,
 termsWithAtLeastFiveRawCandidates:unique.filter(x=>x.rawCandidates>=5).length,
 termsWithNoRawCandidates:unique.filter(x=>x.rawCandidates===0).length,
 termsWithAtLeastFiveReviewedExamples:unique.filter(x=>x.minReviewedExamples>=5).length,
 termsWithTwoSameSenseExamples:unique.filter(x=>x.minSameSense>=2).length,
 termsWithAtLeastFiveExactWordExamples:unique.filter(x=>x.items.every(u=>u.exactWordExamples>=5)).length,
 relatedCharacterExamples:uses.reduce((n,x)=>n+x.relatedCharacterExamples,0),
 termsMeetingFullRule:unique.filter(x=>x.ready).length,
 termsMissingOriginAnnotation:unique.filter(x=>!x.originAnnotated).length,
 termsStillWithoutFiveReviewedExamples:unique.filter(x=>x.minReviewedExamples<5).length
};
const report={summary,terms:unique,uses};
const dest=process.env.WENYAN_KEYWORD_AUDIT_DEST||path.join(out,'keyword-coverage-report.json');
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify(summary));
// 单字模型回归：不再要求已经废弃的双字索引“内集”，而是逐篇验证真实正文中的单字。
const required=[['筑','智子疑邻'],['内','咏雪'],['集','咏雪'],['俄','咏雪'],['未','咏雪'],['儿','咏雪'],['女','咏雪']];
for(const [term,work] of required){
 const item=unique.find(x=>x.term===term),use=item?.items.find(x=>x.work===work);
 if(!use||!use.originAnnotated||use.reviewedExamples<5||use.sameSense<2){
  console.error('Single-character keyword regression',term,work,JSON.stringify(use||null));
  process.exitCode=2;
 }
}
// 固定分母按全部36篇已发布正文计算；覆盖率只作进度指标，不用旧的26篇/双字词基线误判。
const expected={works:51,distinctTerms:317,wordOccurrences:394};
for(const [key,limit]of Object.entries(expected))if((summary[key]||0)<limit){
 console.error('Keyword corpus scope regression: '+key+' below '+limit+' (actual '+summary[key]+')');process.exitCode=3;
}
if(candidateIndexAvailable&&summary.termsWithAtLeastFiveRawCandidates<200){
 console.error('Classical multi-character term index regressed');process.exitCode=4;
}
