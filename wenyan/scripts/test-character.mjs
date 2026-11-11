import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const root=process.env.WENYAN_ROOT||"wenyan/";
const w={};
for(const file of ["data-basic.js","data-classic.js","data-extra.js","data-junior.js","study-annotations.js","study-crosslesson.js","study-verified-characters.js","study-verified-extra.js","study-verified-more2.js","study-verified-common3.js","study-verified-corpus.js","study-verified-batch4.js","study-verified-batch5.js","study-verified-batch6.js","study-verified-batch7.js","study-verified-batch8.js","study-junior-glosses.js"]){
  vm.runInNewContext(fs.readFileSync(root+file,"utf8"),{window:w},{filename:file});
}
const books=[...(w.WENYAN_DATA_1||[]),...(w.WENYAN_DATA_2||[]),...(w.WENYAN_DATA_3||[])];
const chars=[...new Set(books.flatMap(b=>b.terms).flatMap(t=>[...t[0]]).filter(c=>/\p{Script=Han}/u.test(c)))];
assert.equal(books.length,26);
assert(chars.length>=200);
assert(chars.includes("辩")&&chars.includes("斗"));
const examples=w.WENYAN_VERIFIED_CHARACTERS.words;
for(const ch of ["辩","斗"]){
 assert(examples[ch].sources.some(r=>r[0]==="两小儿辩日"&&r[1].includes("辩斗")));
 assert(examples[ch].examples.length>=3);
 assert(examples[ch].examples.every(x=>x[2].includes(ch)&&x[3]&&x[4]&&x[6]&&x[8]));
}
const lexicalStores=[
 ["annotations",w.WENYAN_ANNOTATIONS],["crosslesson",w.WENYAN_CROSSLESSON],
 ["verified-characters",w.WENYAN_VERIFIED_CHARACTERS],["verified-extra",w.WENYAN_VERIFIED_EXTRA],
 ["verified-more2",w.WENYAN_VERIFIED_MORE2],["verified-common3",w.WENYAN_VERIFIED_COMMON3],
 ["verified-corpus",w.WENYAN_VERIFIED_CORPUS],["verified-batch4",w.WENYAN_VERIFIED_BATCH4],
 ["verified-batch5",w.WENYAN_VERIFIED_BATCH5],["verified-batch6",w.WENYAN_VERIFIED_BATCH6],
 ["verified-batch7",w.WENYAN_VERIFIED_BATCH7],["verified-batch8",w.WENYAN_VERIFIED_BATCH8],["junior-glosses",w.WENYAN_JUNIOR_GLOSSES]
];
const isSingleHan=k=>{const a=[...k];if(a.length!==1)return false;const cp=a[0].codePointAt(0);return (cp>=0x3400&&cp<=0x9fff)||(cp>=0xf900&&cp<=0xfaff)||(cp>=0x20000&&cp<=0x323af);};
for(const [name,store] of lexicalStores){
 const bad=Object.keys(store?.words||{}).filter(k=>!isSingleHan(k));
 assert.deepEqual(bad,[],name+" must index one Han character per key");
}
assert(!("内集" in w.WENYAN_VERIFIED_CORPUS.words));
assert(!("俄而" in w.WENYAN_VERIFIED_EXTRA.words));
assert(!("未若" in w.WENYAN_VERIFIED_EXTRA.words));
const characterEvidence=[
 ["内",w.WENYAN_VERIFIED_CORPUS.words["内"]],["集",w.WENYAN_VERIFIED_CORPUS.words["集"]],
 ["俄",w.WENYAN_VERIFIED_EXTRA.words["俄"]],["未",w.WENYAN_VERIFIED_EXTRA.words["未"]],
 ["儿",w.WENYAN_VERIFIED_BATCH4.words["儿"]],["女",w.WENYAN_VERIFIED_BATCH4.words["女"]]
];
for(const [ch,spec] of characterEvidence){
 assert(spec?.sources.some(x=>x[0]==="咏雪"&&x[1].includes(ch)),ch+" must have a current-lesson single-character source");
 assert(spec.examples.length>=5,ch+" must have at least five cross-text examples");
 assert(new Set(spec.examples.map(x=>x[0])).size>=5,ch+" must have five distinct source passages");
 assert.equal(spec.examples[0][6],spec.examples[1][6],ch+" first two examples must share the same sense code");
 assert(spec.examples.every(x=>x[2].includes(ch)&&x[3]&&x[4]&&x[5]&&x[6]&&x[7]&&x[8]),ch+" examples must be character-matched and fully translated");
}
assert(w.WENYAN_ANNOTATIONS.words["而"]&&w.WENYAN_ANNOTATIONS.words["若"]);
const zhu=w.WENYAN_VERIFIED_BATCH8.words["筑"];
const zhuOrigin=w.WENYAN_DATA_4.find(x=>x.title==="智子疑邻");
assert(zhuOrigin?.terms.some(x=>x[0]==="筑"&&x[2].includes("修补")),"筑 must be annotated in 智子疑邻");
assert(zhu.sources.some(x=>x[0]==="智子疑邻"&&x[1].includes("不筑")&&x[4]==="build-structure"),"筑 origin sense must be anchored to the current article");
assert.equal(zhu.examples.length,12);
assert.equal(new Set(zhu.examples.map(x=>x[0])).size,12,"筑 needs twelve distinct source passages");
assert.equal(zhu.examples.filter(x=>x[6]==="build-structure").length,10,"筑 needs ten construction examples");
assert.equal(zhu.examples.filter(x=>x[6]==="instrument").length,2,"筑 musical-instrument sense must be distinguished");
assert(zhu.examples.slice(0,10).every(x=>x[2].includes("筑")&&x[3]&&x[4]&&x[5]&&x[6]==="build-structure"&&x[7]&&x[8]),"筑 construction examples must be fully translated and classified");
const reader=fs.readFileSync(root+"app.js","utf8");
const explorer=fs.readFileSync(root+"study-explorer.js","utf8");
const index=fs.readFileSync(root+"index.html","utf8");
assert(index.includes("study-verified-characters.js"));
assert(reader.includes("for(const ch of text)")&&reader.includes("data-study-offset"));
assert(reader.includes("const dict=(w.terms||[]).find(t=>t[0]===term);"));
assert(!reader.includes("t[0].includes(term)")&&!reader.includes("t[0].includes(b.dataset.term)"));
assert(reader.includes("单字标注（每行：字 | 类型 | 字义）"));
assert(!reader.includes("词语标注"));

assert(explorer.includes("function readingCandidates("));
assert(explorer.includes("含本字的古文（义项待核）"));
for(const file of ["app.js","study-explorer.js","study-editor.js","study-verified-characters.js"])
 new vm.Script(fs.readFileSync(root+file,"utf8"),{filename:file});
const start=reader.indexOf("const hanCharacter="),end=reader.indexOf("function bindTokens(",start);
assert(start>=0&&end>start);
const sandbox={window:w,base:books,custom:[],escape:s=>String(s),testWord:books.find(x=>x.title==="两小儿辩日")};
const html=vm.runInNewContext(reader.slice(start,end)+"\nmarked('孔子东游，见两小儿辩斗，问其故。',testWord)",sandbox);
assert(html.includes('data-term="辩"')&&html.includes('data-term="斗"'));
assert(!html.includes('data-term="辩斗"'));
vm.runInNewContext(explorer,{window:w,document:{getElementById:()=>null,addEventListener:()=>{}},location:{search:""},URLSearchParams,localStorage:{getItem:()=>null}});
const terms=w.WENYAN_STUDY_DEBUG.terms();
assert(terms.every(x=>[...x].length===1));
assert(terms.includes("筑")&&terms.includes("辩")&&terms.includes("斗")&&terms.includes("内")&&terms.includes("集")&&terms.includes("俄")&&terms.includes("未")&&terms.includes("而")&&terms.includes("若")&&terms.includes("儿")&&terms.includes("女"));
assert(terms.length>=chars.length);
const zhuLine=zhuOrigin.lines.find(x=>x[0].includes("不筑"));
const zhuOffset=zhuLine[0].indexOf("筑");
const zhuContext={title:"智子疑邻",text:zhuLine[0],offset:zhuOffset};
const zhuPageOrigin=w.WENYAN_STUDY_DEBUG.origin("筑",zhuContext);
const zhuPageRows=w.WENYAN_STUDY_DEBUG.rows("筑").filter(x=>x.title!=="智子疑邻");
assert(zhuPageOrigin.verified&&zhuPageOrigin.code==="build-structure","筑 card must verify its current-lesson origin");
assert(zhuPageRows.length===12,"筑 card must render all twelve verified passages");
assert(zhuPageRows.filter(x=>x.record.code==="build-structure").length===10,"筑 card must show ten same-sense construction passages");
assert(zhuPageRows.filter(x=>x.record.code==="instrument").length===2,"筑 card must distinguish the instrument sense");
assert(zhuPageRows.every(x=>x.record.title!=="智子疑邻"&&x.record.text.includes("筑")&&x.record.translation),"筑 card must exclude origin and render translated source text");

console.log(JSON.stringify({ok:true,lessons:books.length,characters:chars.length,linked:terms.length,characterEvidence:characterEvidence.map(([ch,spec])=>({char:ch,examples:spec.examples.length,distinctSources:new Set(spec.examples.map(x=>x[0])).size})),focus:"筑 / 内 / 集 / 俄 / 未"}));
