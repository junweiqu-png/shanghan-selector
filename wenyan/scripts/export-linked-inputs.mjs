import fs from "node:fs";
import vm from "node:vm";
const window={},ctx={window,document:{getElementById:()=>null,addEventListener:()=>{}},localStorage:{getItem:()=>null},location:{search:""},URLSearchParams};
for(const f of [...fs.readFileSync("wenyan/index.html","utf8").matchAll(/<script src="([^"?]+)/g)].map(x=>x[1]).filter(x=>!["app.js","study-editor.js","pinyin.js","study-linked-library.js"].includes(x)))
 vm.runInNewContext(fs.readFileSync("wenyan/"+f,"utf8"),ctx,{filename:f});
const works=[1,2,3,4].flatMap(n=>window["WENYAN_DATA_"+n]||[]),d=window.WENYAN_STUDY_DEBUG;
const words={},pool=new Map();
for(const char of d.terms()){
 const contexts=new Map();
 for(const w of works)for(const [text] of w.lines)for(let offset=text.indexOf(char);offset>=0;offset=text.indexOf(char,offset+1)){
  const r=d.origin(char,{title:w.title,text,offset});if(r.code==="proper-name")continue;
  contexts.set(r.code+"|"+r.meaning,{meaning:r.meaning,code:r.code,pos:r.pos});
 }
 const examples=d.rows(char).map(r=>r.record);
 words[char]={senses:[...contexts.values()],dictionary:window.WENYAN_REFERENCE_DICTIONARY.words[char]?.s||[],examples};
 for(const r of examples)pool.set(r.title+"|"+r.text,{title:r.title,text:r.text,translation:r.translation,url:r.url,rank:r.rank});
}
const data={works:works.map(w=>({title:w.title,lines:w.lines,terms:w.terms})),words,pool:[...pool.values()]};
fs.writeFileSync(process.argv[2],JSON.stringify(data));
