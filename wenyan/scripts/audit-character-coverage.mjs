/* 2022义务教育语文课程标准下的正文优先逐字审计。
 * 分母永远来自发布正文 lines[][0]，辅助例句、源码注释、课外候选与题目仅作证据。
 * 单字“有一处释义”与“所有义项已校、同义跨篇达标”是不同指标。
 */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const root=process.env.WENYAN_ROOT||"wenyan/",win={};
const files=["data-basic.js","data-classic.js","data-extra.js","data-junior.js","data-junior-batch2a.js","data-junior-batch2b.js","data-junior-batch2c.js",
 "study-annotations.js","study-crosslesson.js","study-verified-extra.js",
 "study-verified-more2.js","study-verified-common3.js","study-verified-corpus.js",
 "study-verified-batch4.js","study-verified-batch5.js","study-verified-batch6.js",
 "study-verified-batch7.js","study-verified-batch8.js","study-verified-batch9.js","study-verified-batch10.js","study-verified-characters.js","study-junior-glosses.js"];
for(const f of files)vm.runInNewContext(fs.readFileSync(path.join(root,f),"utf8"),{window:win},{filename:f});
const works=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[]),...(win.WENYAN_DATA_4||[])];
const stores=[win.WENYAN_ANNOTATIONS,win.WENYAN_CROSSLESSON,win.WENYAN_VERIFIED_EXTRA,
 win.WENYAN_VERIFIED_MORE2,win.WENYAN_VERIFIED_COMMON3,win.WENYAN_VERIFIED_CORPUS,
 win.WENYAN_VERIFIED_BATCH4,win.WENYAN_VERIFIED_BATCH5,win.WENYAN_VERIFIED_BATCH6,
 win.WENYAN_VERIFIED_BATCH7,win.WENYAN_VERIFIED_BATCH8,win.WENYAN_VERIFIED_BATCH9,win.WENYAN_VERIFIED_BATCH10,win.WENYAN_VERIFIED_CHARACTERS,win.WENYAN_JUNIOR_GLOSSES];
const han=c=>/\p{Script=Han}/u.test(c);
const invalidEvidenceKeys=stores.flatMap((store,index)=>Object.keys(store?.words||{})
 .filter(c=>[...c].length!==1||!han(c)).map(key=>({store:index,key})));
if(invalidEvidenceKeys.length)throw Error("evidence stores must use single-Han-character keys: "+JSON.stringify(invalidEvidenceKeys));
const bodyLetters=w=>[...(w.lines||[]).flatMap(line=>[...String(line[0]||"")])].filter(han);
const named=new Set();
for(const w of works)if(!w.title||named.has(w.title))throw Error("duplicate or empty main work "+w.title);else named.add(w.title);
const priority=new Set(works.flatMap(w=>(w.terms||[]).flatMap(t=>[...t[0]].filter(han))));
const merged=new Map();
for(const store of stores)for(const [c,spec] of Object.entries(store?.words||{})){
 if([...c].length!==1||!han(c))continue;
 const row=merged.get(c)||{sources:[],examples:[]};
 row.sources.push(...spec.sources||[]);row.examples.push(...spec.examples||[]);
 merged.set(c,row);
}
const normalize=code=>({look:"turn-look",lookback:"turn-look"}[code]||code);
const uses=[],bodyCount=new Map();
let bodyOccurrences=0,annotatedOccurrences=0;
for(const w of works){
 const body=bodyLetters(w),here=new Set(body);
 bodyOccurrences+=body.length;
 for(const c of body)bodyCount.set(c,(bodyCount.get(c)||0)+1);
 for(const line of w.lines||[]){
  const txt=String(line[0]||"");
  for(const [index,c] of [...txt].entries()){
   if(!han(c))continue;
   const spec=merged.get(c);
   if(!spec)continue;
   const matching=spec.sources.some(src=>{
    if(src[0]!==w.title||!src[1]?.includes(c))return false;
    const anchor=src[1];let start=txt.indexOf(anchor);
    while(start>=0){if(index>=start&&index<start+anchor.length&&txt.slice(start,index+1).endsWith(c))return true;start=txt.indexOf(anchor,start+1);}
    return false;
   });
   if(matching)annotatedOccurrences++;
  }
 }
 for(const char of here){
  const s=merged.get(char)||{sources:[],examples:[]};
  const anchors=s.sources.filter(src=>src[0]===w.title&&src[1]?.includes(char)&&w.lines.some(line=>line[0].includes(src[1])));
  const seen=new Set(),rows=[];
  for(const x of s.examples){
   if(x[0]===w.title||!x[2]?.includes(x[9]||char)||![x[3],x[4],x[5],x[6],x[7]].every(Boolean)||["name","proper-name"].includes(x[6]))continue;
   const key=x[0]+"|"+normalize(x[6]);if(seen.has(key))continue;
   seen.add(key);rows.push(x);
  }
  const books=new Set(rows.map(x=>x[0]));
  const same=new Set(rows.filter(x=>anchors.some(a=>normalize(a[4])===normalize(x[6]))).map(x=>x[0]));
  uses.push({work:w.title,char,priority:priority.has(char),originAnnotated:anchors.length>0,
   originMeanings:[...new Set(anchors.map(x=>x[2]))],verifiedBooks:books.size,sameSenseBooks:same.size,
   ready:anchors.length>0&&books.size>=5&&same.size>=2,missingBooks:Math.max(0,5-books.size),missingSame:Math.max(0,2-same.size)});
 }
}
const letters=[...bodyCount.keys()].sort((a,b)=>a.localeCompare(b,"zh-CN"));
const characters=letters.map(char=>{
 const items=uses.filter(x=>x.char===char);
 return {char,term:char,priority:priority.has(char),frequency:bodyCount.get(char),
  uses:items.length,workTitles:items.map(x=>x.work),
  ready:items.every(x=>x.ready),originAnnotated:items.every(x=>x.originAnnotated),
  anyOriginAnnotated:items.some(x=>x.originAnnotated),
  minReviewedExamples:Math.min(...items.map(x=>x.verifiedBooks)),
  minSameSense:Math.min(...items.map(x=>x.sameSenseBooks)),items};
});
const summary={
 generatedAt:new Date().toISOString(),standard:"义务教育语文课程标准（2022年版）第四学段",
 source:"https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582344386456.pdf",
 works:works.length,coreWorks:works.length-(win.WENYAN_DATA_4?.length||0),newStoryWorks:win.WENYAN_DATA_4?.length||0,
 miniChallenges:(win.WENYAN_DATA_4||[]).reduce((n,w)=>n+(w.missions?.length||0),0),
 distinctCharacters:characters.length,bodyUniqueCharacters:letters.length,bodyOccurrences,
 characterLessonUses:uses.length,
 singleCharacterEvidenceKeys:stores.reduce((n,store)=>n+Object.keys(store?.words||{}).length,0),
 nonCharacterEvidenceKeys:invalidEvidenceKeys.length,
 priorityCharacters:characters.filter(x=>x.priority).length,
 charactersWithSomeSource:characters.filter(x=>x.anyOriginAnnotated).length,
 charactersFullyOriginAnnotated:characters.filter(x=>x.originAnnotated).length,
 charactersMeetingRule:characters.filter(x=>x.ready).length,
 priorityCharactersMeetingRule:characters.filter(x=>x.priority&&x.ready).length,
 charactersStillWithoutFive:characters.filter(x=>x.minReviewedExamples<5).length,
 charactersMissingOrigin:characters.filter(x=>!x.originAnnotated).length,
 annotatedOccurrences,annotationCoverageOfBody:Number((annotatedOccurrences/bodyOccurrences*100).toFixed(2)),
 strictRule:"分母只计已发布文章正文中的汉字；“重点字”是正文内人为注释子集。每个正文篇目至少一个原字义项来源、跨篇已校译五篇且同义两篇，方称达到本阶段规则。阅读水平与中考题型仍须单独评测。",
 scopeNote:"非全国统一中考考纲，不能把新增10篇或本统计等同初中全部考试要求"
};
if(works.length!==51||letters.length<=231||!letters.includes("辩")||!letters.includes("斗"))throw Error("main-text-only coverage regression");
if(summary.priorityCharacters>summary.bodyUniqueCharacters||summary.bodyOccurrences<summary.bodyUniqueCharacters)throw Error("wrong denominator");
const output={summary,characters,uses};
const dest=process.env.WENYAN_CHARACTER_AUDIT_DEST||"dist/wenyan/evidence/character-coverage-report.json";
fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(output,null,2),"utf8");
console.log(JSON.stringify(summary));
