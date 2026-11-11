/* 逐字审计：双字词只用于定位上下文，不再作为学习、匹配或达标索引键。 */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const root=process.env.WENYAN_ROOT||"wenyan/",win={};
const files=["data-basic.js","data-classic.js","data-extra.js","study-annotations.js",
 "study-crosslesson.js","study-verified-extra.js","study-verified-more2.js",
 "study-verified-common3.js","study-verified-corpus.js","study-verified-batch4.js",
 "study-verified-batch5.js","study-verified-batch6.js","study-verified-batch7.js",
 "study-verified-characters.js"];
for(const file of files)vm.runInNewContext(fs.readFileSync(path.join(root,file),"utf8"),{window:win},{filename:file});
const works=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[])];
const stores=[win.WENYAN_ANNOTATIONS,win.WENYAN_CROSSLESSON,win.WENYAN_VERIFIED_EXTRA,
 win.WENYAN_VERIFIED_MORE2,win.WENYAN_VERIFIED_COMMON3,win.WENYAN_VERIFIED_CORPUS,
 win.WENYAN_VERIFIED_BATCH4,win.WENYAN_VERIFIED_BATCH5,win.WENYAN_VERIFIED_BATCH6,
 win.WENYAN_VERIFIED_BATCH7,win.WENYAN_VERIFIED_CHARACTERS];
const han=c=>/\p{Script=Han}/u.test(c);
const words=new Map();
for(const store of stores)for(const [term,spec] of Object.entries(store?.words||{})){
 if([...term].length!==1||!han(term))continue;
 const entry=words.get(term)||{sources:[],examples:[]};
 entry.sources.push(...spec.sources||[]);entry.examples.push(...spec.examples||[]);
 words.set(term,entry);
}
const normalize=c=>({look:"turn-look",lookback:"turn-look"}[c]||c);
const usages=[];
for(const w of works){
 const chars=[...new Set((w.terms||[]).flatMap(row=>[...row[0]].filter(han)))];
 for(const char of chars){
  const s=words.get(char)||{sources:[],examples:[]};
  const anchors=s.sources.filter(src=>src[0]===w.title&&src[1]?.includes(char)&&w.lines.some(line=>line[0].includes(src[1])));
  // 未核验的词语整体释义不能算作任一单字的独立义项。
  const available=s.examples.filter(x=>x[0]!==w.title&&x[2]?.includes(x[9]||char)&&x[3]&&x[4]&&x[5]&&x[6]&&x[7]&&!["name","proper-name"].includes(x[6]));
  const seen=new Set(),rows=[];
  for(const x of available){const key=x[0]+"|"+normalize(x[6]);if(!seen.has(key)){seen.add(key);rows.push(x);}}
  const titles=new Set(rows.map(x=>x[0]));
  const same=anchors.length?new Set(rows.filter(x=>anchors.some(a=>normalize(a[4])===normalize(x[6]))).map(x=>x[0])):new Set();
  const verifiedBooks=titles.size;
  const item={work:w.title,char,sourceAnnotated:anchors.length>0,
   originMeanings:anchors.map(x=>x[2]),verifiedBooks,sameSenseBooks:same.size,
   ready:anchors.length>0&&verifiedBooks>=5&&same.size>=2,
   missingBooks:Math.max(0,5-verifiedBooks),missingSame:Math.max(0,2-same.size)};
  usages.push(item);
 }
}
const chars=[...new Set(usages.map(x=>x.char))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
const characters=chars.map(char=>{
 const items=usages.filter(x=>x.char===char);
 return {char,term:char,uses:items.length,ready:items.every(x=>x.ready),
  minReviewedExamples:Math.min(...items.map(x=>x.verifiedBooks)),
  minSameSense:Math.min(...items.map(x=>x.sameSenseBooks)),
  originAnnotated:items.every(x=>x.sourceAnnotated),items};
});
const summary={generatedAt:new Date().toISOString(),works:works.length,
 distinctCharacters:characters.length,characterLessonUses:usages.length,
 charactersMeetingRule:characters.filter(x=>x.ready).length,
 charactersStillWithoutFive:characters.filter(x=>x.minReviewedExamples<5).length,
 charactersMissingOrigin:characters.filter(x=>!x.originAnnotated).length,
 strictRule:"每字至少5篇不同古文经逐字核义；同义至少2篇；不同篇的整句译文或共享字形不算校核。",
 compoundTermCount:[...new Set(works.flatMap(w=>w.terms.map(t=>t[0])))].filter(x=>[...x].length>1).length};
if(works.length!==26||chars.length<200||!chars.includes("辩")||!chars.includes("斗"))throw Error("character coverage regression");
const output={summary,characters,uses:usages};
const dest=process.env.WENYAN_CHARACTER_AUDIT_DEST||"dist/wenyan/evidence/character-coverage-report.json";
fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(output,null,2),"utf8");
console.log(JSON.stringify(summary));
