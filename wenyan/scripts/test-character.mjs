import fs from "node:fs";
import assert from "node:assert/strict";
import vm from "node:vm";
const root=process.env.WENYAN_ROOT||"wenyan/";
const w={};
for(const f of ["data-basic.js","data-classic.js","data-extra.js","study-annotations.js",
 "study-crosslesson.js","study-verified-characters.js"]){
 vm.runInNewContext(fs.readFileSync(root+f,"utf8"),{window:w},{filename:f});
}
const books=[...(w.WENYAN_DATA_1||[]),...(w.WENYAN_DATA_2||[]),...(w.WENYAN_DATA_3||[])];
const studentTerms=[...new Set(books.flatMap(b=>b.terms.flatMap(t=>[...t[0]].filter(c=>/\p{Script=Han}/u.test(c))))];
assert.equal(books.length,26);
assert(studentTerms.length>=200,"all compound terms should be split into single Han characters");
assert(studentTerms.includes("辩")&&studentTerms.includes("斗"));
assert.deepEqual([...("辩斗")],["辩","斗"]);
const characters=w.WENYAN_VERIFIED_CHARACTERS.words;
for(const char of ["辩","斗"]){
 assert.equal([...char].length,1);
 assert(characters[char].sources.some(s=>s[0]==="两小儿辩日"&&s[1].includes("辩斗")));
 assert(characters[char].examples.length>=3);
 for(const row of characters[char].examples){
  assert(row[2].includes(char)&&row[3]&&row[4]&&row[5]&&row[6]&&row[7]&&row[8]);
 }
}
const reader=fs.readFileSync(root+"app.js","utf8");
const explorer=fs.readFileSync(root+"study-explorer.js","utf8");
const index=fs.readFileSync(root+"index.html","utf8");
for(const script of ["study-verified-characters.js","study-explorer.js"])assert(index.includes(script));
for(const file of ["app.js","study-explorer.js","study-editor.js","study-verified-characters.js"])
 new vm.Script(fs.readFileSync(root+file,"utf8"),{filename:file});
assert(reader.includes('for(const ch of text)'));
assert(reader.includes('data-term="'+String.fromCharCode(39)+'+escape(ch)'),'reader must only render single-character study tokens');
assert(explorer.includes('function readingCandidates('),"unverified translated sentences must remain separate");
assert(explorer.includes('含本字的古文（义项待核）'));
assert(!explorer.includes('同词 '+String.fromCharCode(39)+'+sameWord'));
const from=reader.indexOf("const hanCharacter="),to=reader.indexOf("function bindTokens(",from);
assert(from>=0&&to>from,"reader character tokenizer must exist");
const sandbox={window:w,base:books,custom:[],escape:s=>String(s),testWord:books.find(x=>x.title==="两小儿辩日")};
const tokenization=reader.slice(from,to);
const html=vm.runInNewContext(tokenization+"\nmarked('孔子东游，见两小儿辩斗，问其故。',testWord)",sandbox);
assert(html.includes('data-term="辩"')&&html.includes('data-term="斗"'));
assert(!html.includes('data-term="辩斗"'));
const document={getElementById:()=>null,addEventListener:()=>{}};
vm.runInNewContext(explorer,{window:w,document,location:{search:""},URLSearchParams,localStorage:{getItem:()=>null}});
const renderedTerms=w.WENYAN_STUDY_DEBUG.terms();
assert(renderedTerms.every(x=>[...x].length===1),"all explorer keys must be single characters");
assert(renderedTerms.includes("辩")&&renderedTerms.includes("斗")&&renderedTerms.includes("集"));
assert(renderedTerms.length>=studentTerms.length);
console.log(JSON.stringify({ok:true,lessons:books.length,studentsCharacters:studentTerms.length,
 explorerCharacters:renderedTerms.length,verifiedBian:characters["辩"].examples.length,verifiedDou:characters["斗"].examples.length}));
