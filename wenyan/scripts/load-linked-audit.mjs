import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

// Audit the same cards and semantic comparison that students actually open.
export function loadLinkedAudit(win,root="wenyan/"){
 const ctx={window:win,document:{getElementById:()=>null,addEventListener:()=>{}},location:{search:""},URLSearchParams,localStorage:{getItem:()=>null}};
 if(!win.WENYAN_SCHOOL_EXAMPLES)vm.runInNewContext(fs.readFileSync(path.join(root,"study-school-examples.js"),"utf8"),ctx);
 vm.runInNewContext(fs.readFileSync(path.join(root,"study-linked-translations.js"),"utf8"),ctx);
 for(let n=0;n<64;n++)win.WENYAN_LINKED_TRANSLATIONS.install(JSON.parse(fs.readFileSync(path.join(root,"evidence/linked-examples",String(n).padStart(2,"0")+".json"),"utf8")));
 vm.runInNewContext(fs.readFileSync(path.join(root,"study-explorer.js"),"utf8"),ctx);
 return win.WENYAN_STUDY_DEBUG;
}
export function workCoverage(debug,char,work){
 const origins=[],ordinary=[];
 for(const [text]of work.lines)for(let offset=text.indexOf(char);offset>=0;offset=text.indexOf(char,offset+1)){
  const context={title:work.title,text,offset},origin=debug.origin(char,context);origins.push(origin);
  if(origin.code!=="proper-name")ordinary.push(debug.coverage(char,context));
 }
 const exempt=origins.length>0&&!ordinary.length,originAnnotated=origins.length>0&&origins.every(r=>r.verified&&r.meaning);
 const verifiedBooks=ordinary.length?Math.min(...ordinary.map(r=>r.verifiedBooks)):0;
 const sameSenseBooks=ordinary.length?Math.min(...ordinary.map(r=>r.sameSenseBooks)):0;
 return {originAnnotated,originMeanings:[...new Set(origins.map(r=>r.meaning))],pos:origins[0]?.pos||"",originCode:origins[0]?.code||null,
  verifiedBooks,sameSenseBooks,exempt,complete:originAnnotated&&(exempt||verifiedBooks>=5&&sameSenseBooks>=2)};
}
