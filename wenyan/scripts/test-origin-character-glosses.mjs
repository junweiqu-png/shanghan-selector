import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const win={};const dirs="wenyan/";
for(const f of ["data-basic.js","data-classic.js","data-extra.js","data-junior.js","data-junior-batch2a.js","data-junior-batch2b.js","data-junior-batch2c.js","study-lesson-character-glosses.js","study-verified-batch12.js","study-reference-dictionary.js"])
 vm.runInNewContext(fs.readFileSync(dirs+f,"utf8"),{window:win},{filename:f});
const works=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[]),...(win.WENYAN_DATA_4||[])];
const curated=win.WENYAN_LESSON_CHARACTER_GLOSSES;
const allChars=new Set(works.flatMap(w=>w.lines.flatMap(line=>[...line[0]].filter(c=>/\p{Script=Han}/u.test(c)))));
const dictionary=win.WENYAN_REFERENCE_DICTIONARY;
assert.equal(allChars.size,1302,"published body unique glyphs changed");
assert(dictionary?.source?.includes("chinese-dictionary")&&dictionary.license==="MIT");
for(const c of allChars)assert(dictionary.words[c]?.s?.length,"every original-body glyph must have a clearly labeled dictionary reference: "+c);
let checked=0,missing=[];
for(const title of curated.lessonTitles){
 const w=works.find(x=>x.title===title);
 for(const [lineIndex,row] of w.lines.entries()){
  const text=row[0];
  for(const [offset,char] of [...text].entries()){
   if(!/\p{Script=Han}/u.test(char))continue;
   const sources=curated.words[char]?.sources||[];
   const hit=sources.filter(s=>s[0]===title&&s[1]?.includes(char)&&s[2]&&s[4]).some(s=>{
    let i=text.indexOf(s[1]);
    while(i>=0){
     if(offset>=i&&offset<s[1].length+i&&text[offset]===char)return true;
     i=text.indexOf(s[1],i+1);
    }return false;
   });
   checked++;if(!hit)missing.push({title,lineIndex,offset,char});
  }
 }
}
assert.equal(missing.length,0,"every target lesson character occurrence must receive a literal annotation: "+JSON.stringify(missing.slice(0,8)));
const origin=curated.words["径"].sources.find(s=>s[0]==="核舟记");
assert(origin&&origin[2]==="直径"&&origin[1].includes("径"),"径寸 must mean diameter");
assert(win.WENYAN_VERIFIED_BATCH12.words["径"].sources.some(x=>x[4]==="diameter"));
assert(win.WENYAN_VERIFIED_BATCH12.words["径"].examples.length>=2&&new Set(win.WENYAN_VERIFIED_BATCH12.words["径"].examples.map(x=>x[0])).size>=2);
const first=works.find(x=>x.title==="核舟记").lines[0];
assert(first[1].includes("直径一寸")&&!first[1].includes("一寸见方"),"correct sentence translation itself, not only glossary");
const page=fs.readFileSync("wenyan/index.html","utf8"),explore=fs.readFileSync("wenyan/study-explorer.js","utf8");
for(const asset of ["study-lesson-character-glosses.js","study-verified-batch12.js","study-reference-dictionary.js"])assert(page.includes(asset));
assert(explore.includes("WENYAN_LESSON_CHARACTER_GLOSSES")&&explore.includes("WENYAN_VERIFIED_BATCH12"));
assert(explore.includes("WENYAN_REFERENCE_DICTIONARY")&&explore.includes("不等于本句义项"),"dictionary meanings cannot substitute verified contextual senses");
assert(page.includes("study-reference-dictionary.js"),"offline reference must load");
console.log(JSON.stringify({ok:true,publishedWorks:works.length,checkedCharacters:checked,lessons:curated.lessonTitles,contextMissing:missing.length,diameterExamples:win.WENYAN_VERIFIED_BATCH12.words["径"].examples.length}));
