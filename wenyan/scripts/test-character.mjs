import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const root=process.env.WENYAN_ROOT||"wenyan/";
const w={};
for(const file of ["data-basic.js","data-classic.js","data-extra.js","study-annotations.js","study-crosslesson.js","study-verified-characters.js"]){
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
const reader=fs.readFileSync(root+"app.js","utf8");
const explorer=fs.readFileSync(root+"study-explorer.js","utf8");
const index=fs.readFileSync(root+"index.html","utf8");
assert(index.includes("study-verified-characters.js"));
assert(reader.includes("for(const ch of text)")&&reader.includes("data-study-offset"));
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
assert(terms.includes("辩")&&terms.includes("斗")&&terms.includes("集"));
assert(terms.length>=chars.length);
console.log(JSON.stringify({ok:true,lessons:books.length,characters:chars.length,linked:terms.length,focus:"辩 / 斗"}));
