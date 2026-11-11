/** 初中学习正文与趣味句式回归：正文是分母，扩展只作证据。 */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const root=process.env.WENYAN_ROOT||"wenyan/";
const win={},files=["data-basic.js","data-classic.js","data-extra.js","data-junior.js",
 "study-junior-glosses.js","junior-curriculum.js"];
for(const f of files)new vm.Script(fs.readFileSync(root+f,"utf8"),{filename:f}).runInNewContext({window:win});
const old=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[])],
 newWorks=win.WENYAN_DATA_4||[],works=[...old,...newWorks],guide=win.WENYAN_JUNIOR_GUIDE?.items||{};
const han=s=>(String(s).match(/\p{Script=Han}/gu)||[]);
assert.equal(old.length,26,"original set should be preserved");
assert.equal(newWorks.length,10,"expected 10 curated junior texts");
assert.equal(works.length,36,"expected 36 main published texts");
assert.equal(new Set(works.map(x=>x.title)).size,works.length,"no duplicate main titles");
const grades=new Set(),termTypes=new Set(),bodyChars=new Set(),special=new Set();
let missions=0,newBodyOccurrences=0;
for(const w of newWorks){
 const lines=w.lines||[];
 assert(lines.length>=3&&lines.every(x=>x.length===3&&x[0]&&x[1]&&x[2]),"each published sentence requires original, translation, grammar label: "+w.title);
 assert(/^https:\/\//.test(w.sourceUrl||""),"source must be HTTPS "+w.title);
 assert(w.hook&&w.theme,"child-friendly context must be present "+w.title);
 const text=lines.map(x=>x[0]).join(""),length=han(text).length;
 assert(length>=35&&length<=370,"age-appropriate length of 35–370 Han chars: "+w.title+" "+length);
 grades.add(w.level.split("·")[0]);newBodyOccurrences+=length;
 for(const c of han(text))bodyChars.add(c);
 const annotations=new Set();
 for(const [c,pos,meaning] of w.terms||[]){
  assert(han(c).length===1&&[...c].length===1&&text.includes(c),"annotation must be one actual body character "+c+" "+w.title);
  assert(pos&&meaning&&!annotations.has(c),"single-character meaning missing/duplicated "+c+" "+w.title);
  annotations.add(c);termTypes.add(pos);
 }
 assert(Array.isArray(w.missions)&&w.missions.length===2,"exactly two optional puzzles per junior story "+w.title);
 for(const m of w.missions){
  assert(Number.isInteger(m.line)&&m.line>=0&&m.line<lines.length);
  assert(m.question&&m.explain&&m.type);
  assert(m.options?.length===3&&new Set(m.options).size===3);
  assert(Number.isInteger(m.answer)&&m.answer>=0&&m.answer<3);
  missions++;
 }
}
assert.deepEqual([...grades].sort(),["初一","初三","初二"].sort());
assert.equal(missions,20);
const oldBody=old.flatMap(w=>w.lines.flatMap(line=>han(line[0])));
const actualBody=new Set([...oldBody,...bodyChars]);
const terms=new Set(works.flatMap(w=>(w.terms||[]).flatMap(t=>han(t[0]))));
assert(actualBody.size>231&&actualBody.size>terms.size,"all body Han chars must exceed only selected annotated chars");
const glosses=win.WENYAN_JUNIOR_GLOSSES?.words||{};
assert(Object.keys(glosses).length>=100,"priority main-text annotations should be usable");
for(const [c,sp] of Object.entries(glosses)){
 assert(han(c).length===1);
 for(const src of sp.sources||[]){
  assert(newWorks.some(w=>w.title===src[0]&&w.lines.some(l=>l[0].includes(src[1]))),
   "annotation source fragment should exist in published main text "+c);
  assert(src[2]&&src[3]&&src[4]);
 }
 for(const row of sp.examples||[]){
  assert(newWorks.some(w=>w.title===row[0]&&w.lines.some(l=>l[0]===row[2]&&l[1]===row[3])),
   "do not use extension/candidate translations as verified primary material "+c);
 }
}
assert(Object.keys(guide).length>=12);
for(const [name,g] of Object.entries(guide)){
 assert(g.clue&&g.trap&&g.steps?.length===3&&g.question&&g.options?.length===3&&g.explain,name);
 assert(Number.isInteger(g.answer)&&[0,1,2].includes(g.answer),name);
 const w=works.find(w=>w.title===g.work);
 assert(w?.lines.some(line=>line[0].includes(g.example)),"grammar discover example should quote an actual main sentence: "+name+" -> "+g.work+" "+g.example);
}
const index=fs.readFileSync(root+"index.html","utf8"),app=fs.readFileSync(root+"app.js","utf8"),
 explorer=fs.readFileSync(root+"study-explorer.js","utf8"),coverage=fs.readFileSync(root+"coverage.html","utf8");
for(const item of ["data-junior.js","study-junior-glosses.js","junior-curriculum.js","missionLaunch","missionLaunchWhole"])assert(index.includes(item));
for(const item of ["new Set()","missionDone","function openMission(","gradeFilter","data-mission-choice","w.lines||[]"])assert(app.includes(item));
assert(explorer.includes("WENYAN_DATA_4")&&explorer.includes("WENYAN_JUNIOR_GLOSSES")&&explorer.includes("function discoveryGuide("));
assert(app.includes('addEventListener("touchend"')&&!app.includes('if(!start||e.target.closest(".token"))'),
 "swiping a Chinese character must still turn pages, not cancel the touch gesture");
assert(index.includes('id="showTranslation"')&&app.includes('class="reveal-line"'),
 "full-character clickable text needs explicit translation controls");
assert(coverage.includes("正文单字")&&coverage.includes("bodyUniqueCharacters")&&coverage.includes("priorityCharacters"));
for(const f of ["app.js","study-explorer.js","junior-curriculum.js","data-junior.js","study-junior-glosses.js"])
 new vm.Script(fs.readFileSync(root+f,"utf8"),{filename:f});
console.log(JSON.stringify({ok:true,publishedWorks:works.length,addedStories:newWorks.length,
 juniorGrades:[...grades],newStoryBodyCharacters:newBodyOccurrences,
 bodyUniqueCharacters:actualBody.size,selectedAnnotatedCharacters:terms.size,
 newCuratedCharacters:Object.keys(glosses).length,grammarGuides:Object.keys(guide).length,missions}));
