/** 初中学习正文与趣味句式回归：正文是分母，扩展只作证据。 */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const root=process.env.WENYAN_ROOT||"wenyan/";
const win={},files=["data-basic.js","data-classic.js","data-extra.js","data-junior.js","data-junior-batch2a.js","data-junior-batch2b.js","data-junior-batch2c.js",
 "study-junior-glosses.js","junior-curriculum.js"];
for(const f of files)new vm.Script(fs.readFileSync(root+f,"utf8"),{filename:f}).runInNewContext({window:win});
const old=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[])],
 newWorks=win.WENYAN_DATA_4||[],works=[...old,...newWorks],guide=win.WENYAN_JUNIOR_GUIDE?.items||{};
const han=s=>(String(s).match(/\p{Script=Han}/gu)||[]);
assert.equal(old.length,26,"original set should be preserved");
assert.equal(newWorks.length,25,"expected 10 baseline junior texts plus 15 graded additions");
assert.equal(works.length,51,"expected 51 main published texts");
assert.equal(new Set(works.map(x=>x.title)).size,works.length,"no duplicate main titles");
const baselineTitles=["智子疑邻","狐假虎威","鹬蚌相争","三峡","黔之驴","湖心亭看雪","河中石兽","曹刿论战","邹忌讽齐王纳谏","桃花源记"];
assert.equal(JSON.stringify(newWorks.slice(0,10).map(x=>x.title)),JSON.stringify(baselineTitles),"the original 10 lessons must not change order");
const added=newWorks.slice(10);
assert.equal(added.length,15,"second batch must add exactly 15 works");
const expectedTiers=[...Array(6).fill("初一"),...Array(5).fill("初二"),...Array(4).fill("初三")];
assert.equal(JSON.stringify(added.map(w=>w.level.split("·")[0])),JSON.stringify(expectedTiers),"new 15 lessons must progress from easy to hard");
const avg=added.reduce((n,w)=>n+(w.lines.map(x=>x[0]).join("").match(/\p{Script=Han}/gu)||[]).length,0)/added.length;
assert(avg>=125&&avg<=200,"new graded lessons must have a balanced average body length, actual "+avg);
assert(added.every(x=>x.hook&&x.theme&&x.terms.length>=5),"new lessons require engaging hooks and at least five single-character notes");
assert(added.every(x=>x.missions[0].type!==x.missions[1].type),"each story must offer varied exercise types");

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
assert.equal(missions,50);
const oldBody=old.flatMap(w=>w.lines.flatMap(line=>han(line[0])));
const actualBody=new Set([...oldBody,...bodyChars]);
const terms=new Set(works.flatMap(w=>(w.terms||[]).flatMap(t=>han(t[0]))));
assert(actualBody.size>231&&actualBody.size>terms.size,"all body Han chars must exceed only selected annotated chars");
const glosses=win.WENYAN_JUNIOR_GLOSSES?.words||{};
assert(Object.keys(glosses).length>=100,"priority main-text annotations should be usable");
assert(old.every(w=>(w.terms||[]).filter(x=>han(x[0]).length===1).every(([c])=>(glosses[c]?.sources||[]).some(x=>x[0]===w.title))),"all original 26 texts' explicit single-character glosses must be mapped");
for(const [c,sp] of Object.entries(glosses)){
 assert(han(c).length===1);
 for(const src of sp.sources||[]){
  assert(works.some(w=>w.title===src[0]&&w.lines.some(l=>l[0].includes(src[1]))),
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
for(const item of ["data-junior.js","data-junior-batch2a.js","data-junior-batch2b.js","data-junior-batch2c.js","study-junior-glosses.js","junior-curriculum.js","missionLaunch","missionLaunchWhole"])assert(index.includes(item));
for(const item of ["new Set()","missionDone","function openMission(","gradeFilter","data-mission-choice","w.lines||[]"])assert(app.includes(item));
assert(explorer.includes("WENYAN_DATA_4")&&explorer.includes("WENYAN_JUNIOR_GLOSSES")&&explorer.includes("function discoveryGuide("));
assert(app.includes('addEventListener("touchend"')&&!app.includes('if(!start||e.target.closest(".token"))'),
 "swiping a Chinese character must still turn pages, not cancel the touch gesture");
assert(index.includes('id="showTranslation"')&&app.includes('class="reveal-line"'),
 "full-character clickable text needs explicit translation controls");
assert(coverage.includes("正文单字")&&coverage.includes("bodyUniqueCharacters")&&coverage.includes("priorityCharacters"));
for(const f of ["app.js","study-explorer.js","junior-curriculum.js","data-junior.js","data-junior-batch2a.js","data-junior-batch2b.js","data-junior-batch2c.js","study-junior-glosses.js"])
 new vm.Script(fs.readFileSync(root+f,"utf8"),{filename:f});
console.log(JSON.stringify({ok:true,publishedWorks:works.length,addedStories:newWorks.length,
 juniorGrades:[...grades],newStoryBodyCharacters:newBodyOccurrences,
 bodyUniqueCharacters:actualBody.size,selectedAnnotatedCharacters:terms.size,
 newCuratedCharacters:Object.keys(glosses).length,grammarGuides:Object.keys(guide).length,missions}));
