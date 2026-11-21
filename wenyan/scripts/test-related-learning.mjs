/* Execute the real card renderer and lazy excerpt loader, including the user's 缀 case. */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import {loadLinkedAudit,workCoverage} from "./load-linked-audit.mjs";
const win={},requests=[],elements=new Map();
for(const id of ["modalTitle","modalContent","overlay"])
 elements.set(id,{textContent:"",innerHTML:"",hidden:false,scrollTop:0,querySelectorAll:()=>[],addEventListener:()=>{}});
const document={getElementById:id=>elements.get(id)||null,addEventListener:()=>{}};
const context={window:win,document,location:{search:""},URLSearchParams,localStorage:{getItem:()=>null},
 fetch:async url=>{requests.push(String(url));const file="wenyan/"+String(url).split("?")[0];return {ok:fs.existsSync(file),status:fs.existsSync(file)?200:404,json:async()=>JSON.parse(fs.readFileSync(file,"utf8"))};}};
const page=fs.readFileSync("wenyan/index.html","utf8");
for(const f of [...page.matchAll(/<script src="([^"?]+)/g)].map(x=>x[1]).filter(x=>!["app.js","study-editor.js","pinyin.js"].includes(x)))
 vm.runInNewContext(fs.readFileSync("wenyan/"+f,"utf8"),context,{filename:f});
assert.equal(requests.length,0,"opening the reader must not download the association corpus");
const d=win.WENYAN_STUDY_DEBUG,works=[1,2,3,4].flatMap(n=>win["WENYAN_DATA_"+n]||[]);
const wolf=works.find(w=>w.title==="狼"),text=wolf.lines[0][0],origin={title:"狼",text,offset:text.indexOf("缀")};
const local=d.coverage("缀",origin);
assert(local.verifiedBooks>=7&&local.sameSenseBooks>=2,"the classroom 缀 card requires seven other works, with two following senses");
function closedAnswers(html){
 const stack=[];let answers=0,fields=0;
 for(const match of html.matchAll(/<\/?([a-z0-9]+)\b[^>]*>/gi)){
  const tag=match[1].toLowerCase(),raw=match[0];
  if(raw.startsWith("</")){const i=stack.findLastIndex(n=>n.tag===tag);if(i>=0)stack.splice(i);continue;}
  const answer=tag==="details"&&/class="[^"]*\bstudy-answer\b/.test(raw);
  if(answer){answers++;assert(!/\sopen(?:\s|=|>)/.test(raw),"answers must be collapsed on a newly opened card");}
  if(/class="(?:study-origin-meaning|study-context-translation|study-translation|study-sense|study-compare|translation-mistakes)[ "-]/.test(raw)){
   fields++;assert(stack.some(n=>n.answer),"a definition, translation or semantic comparison escaped its disclosure");
  }
  if(!["br","hr","input","img","meta","link"].includes(tag))stack.push({tag,answer});
 }
 assert(answers>1&&fields>=answers,"both the original and related answers must exist and be concealed");
}
await d.openWord("缀",origin);
assert.equal(requests.length,1,"one small character shard is sufficient");
assert(!requests[0].includes("manifest"),"a word card must not fetch the full book catalogue");
let html=elements.get("modalContent").innerHTML;closedAnswers(html);
assert(html.includes("跟随在公卿之后")&&html.includes("紧追着对方"));
assert(html.indexOf("送东阳马生序")<html.indexOf("小石潭记"),"two same-meaning examples should come first");
assert(!html.includes("本文本文语境")&&!html.includes("跨篇异同仍须比较"),"remove repetitive unhelpful comparison prose");
await d.openWord("缀",origin);closedAnswers(elements.get("modalContent").innerHTML);
assert.equal(requests.length,1,"reopening a cached word must not re-fetch the same shard");
for(const char of ["蔓","径","之"]){
 const w=works.find(w=>w.lines.some(l=>l[0].includes(char))),text=w.lines.find(l=>l[0].includes(char))[0];
 await d.openWord(char,{title:w.title,text,offset:text.indexOf(char)});closedAnswers(elements.get("modalContent").innerHTML);
}
const char=String.fromCodePoint("风".codePointAt(0));
const before=requests.length;
await Promise.all([win.WENYAN_LINKED_TRANSLATIONS.load(char),win.WENYAN_LINKED_TRANSLATIONS.load(char)]);
assert(requests.length-before<=1,"simultaneous clicks share one shard request");
let cards=0;
for(let n=0;n<64;n++){
 const shard=JSON.parse(fs.readFileSync("wenyan/evidence/linked-examples/"+String(n).padStart(2,"0")+".json","utf8"));
 for(const [char,rows]of Object.entries(shard))for(const r of rows){
  cards++;assert(r.text.includes(r.match||char)&&r.translation&&r.meaning&&r.pos&&r.code&&r.url,"incomplete related card "+char);
  if(r.match&&r.match!==char)assert(win.WENYAN_LINKED_TRANSLATIONS.variants[char]?.includes(r.match),"only documented orthographic variants can supplement a glyph");
  assert(!/待校|尚待|未校|阅读提示/.test(r.translation+r.meaning),"a hint cannot stand in for an answer");
  for(const c of r.text)if(/\p{Script=Han}/u.test(c))assert(win.WENYAN_REFERENCE_DICTIONARY.words[c]?.s?.length,"unexplained glyph in related text "+c);
 }
}
const audit=loadLinkedAudit(win),missing=[];
for(const work of works)for(const char of new Set(work.lines.flatMap(l=>[...l[0]]).filter(c=>/\p{Script=Han}/u.test(c)))){
 const coverage=workCoverage(audit,char,work);
 if(!coverage.exempt&&coverage.verifiedBooks<5)missing.push({work:work.title,char,count:coverage.verifiedBooks});
}
assert.equal(missing.length,0,"every ordinary main-text glyph needs five translated related works: "+JSON.stringify(missing));
console.log(JSON.stringify({ok:true,wolfZhui:local,answersCollapsed:true,lazyShardCache:true,completeRelatedCards:cards,ordinaryUsesMissingFive:missing.length}));
