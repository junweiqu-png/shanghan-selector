/* 51篇正文的“有逐句译文且有课文单字注释”词条：只纳入人工已给出单字释义的正文原句。
 * 拒绝把未写释义的所有汉字自动标为已校核；同字在另一句另一个位置仍须单独辨义。
 */
(()=>{
"use strict";
const works=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[]),...(window.WENYAN_DATA_4||[])];
const words=Object.create(null),han=c=>/^\p{Script=Han}$/u.test(c);
function anchorFor(sentence,char){
 const i=sentence.indexOf(char);
 if(i<0)throw Error("字不在正文");
 // 只圈定一个汉字位置；不让同句多个同字误共享义项。
 let start=Math.max(0,i-4),end=Math.min(sentence.length,i+5);
 while(sentence.slice(start,i).includes(char))start++;
 while(sentence.slice(i+1,end).includes(char))end--;
 const span=sentence.slice(start,end);
 if(!span.includes(char)||span.split(char).length!==2)throw Error("定位失败 "+char);
 return span;
}
const aliases={
 "何":"question", "且":"about-to","焉":"where-when","以":"means","虽":"hypothetical",
 "若":"similarity","乃":"then","者":"person","之":"object","筑":"build-structure"
};
for(const w of works){
 const lines=w.lines||[],refs=w.terms||[];
 for(const [char,pos,meaning] of refs){
  // 基础篇含“舍人”等词组释义，绝不拆分成字义；只把明确单字注释纳入证据。
  if(!han(char))continue;
  if(!meaning)throw Error("需单字释义 "+w.title+" "+char);
  const row=lines.find(r=>r[0].includes(char));
  if(!row?.[1])throw Error("缺正文句译 "+char+" "+w.title);
  const anchor=anchorFor(row[0],char);
  // 课程内容有已校译原句，但“与其他古文同义”只有同一义项编码时才可判断。
  const code=char==="筑"?"build-structure":(aliases[char]||"lesson")+"-"+w.title+"-"+char;
  const usage="本文语境“"+anchor+"”：本字释为“"+meaning+"”；句译已校，跨篇异同仍须比较。";
  const sp=words[char]||(words[char]={sources:[],examples:[]});
  sp.sources.push([w.title,anchor,meaning,pos,code,usage]);
  sp.examples.push([w.title,w.source,row[0],row[1],meaning,pos,code,usage,w.sourceUrl,char]);
 }
}
window.WENYAN_JUNIOR_GLOSSES={words};
})();
