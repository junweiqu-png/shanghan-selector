/* 扩展古籍“学生可读候选”统一质量闸门：只选择原底本已有句读的原句。
 * 无标点残卷、夹注、专名假命中等不能自动改写成“原文”；不冒充现代译文。
 */
(()=>{"use strict";
const endMarks=/[。！？；]/g;
const hasEnd=s=>/[。！？；]/.test(s);
const badGlyph=/[\uE000-\uF8FF\uFFFD\u{F0000}-\u{FFFFD}]/u;
const antiName={
 "汲":/汲(?:桑|黯|仁|郡|縣|县|冢|塚|公)/,
 "溉":/溉(?:縣|县|公)/
};
const punctuation="。！？；";
function stripNotes(text){
 return String(text||"")
  .replace(/【[^【】]{0,600}】/g,"")
  .replace(/〈[^〈〉]{0,350}〉/g,"")
  .replace(/\[[^\[\]]{0,180}\]/g,"")
  .replace(/\s+/g," ")
  .replace(/^[…⋯\s]+|[…⋯\s]+$/g,"")
  .trim();
}
function excerpt(raw,char){
 if(!char||[...char].length!==1)return null;
 const text=stripNotes(raw);
 if(!text.includes(char)||badGlyph.test(text))return null;
 const options=[];
 let at=-1,iterations=0;
 while((at=text.indexOf(char,at+1))>=0&&iterations++<40){
  const wordAround=text.slice(at,Math.min(at+10,text.length));
  if(antiName[char]?.test(wordAround))continue;
  // 不插入任何原文中不存在的标点：只在真实句号、问号、感叹号或分号处截取。
  let left=-1,right=-1;
  for(const p of punctuation){
   const v=text.lastIndexOf(p,at-1);if(v>left)left=v;
   const t=text.indexOf(p,at+char.length);if(t!==-1&&(right===-1||t<right))right=t;
  }
  if(right<0)continue;
  let start=left+1,end=right+1;
  const candidate=text.slice(start,end).replace(/^[，、：\s]+/,"").trim();
  if(candidate.length<7||candidate.length>130||!candidate.includes(char)||!hasEnd(candidate))continue;
  if(/(?:师古曰|師古曰|案近刻|顏師古曰|颜师古曰)/.test(candidate))continue;
  if((candidate.match(/[【】〈〉]/g)||[]).length)continue;
  const ratio=(candidate.match(/[，。；：！？]/g)||[]).length;
  if(ratio<1)continue;
  const balanced=(candidate.match(/“/g)||[]).length===(candidate.match(/”/g)||[]).length;
  if(!balanced)continue;
  options.push({text:candidate,score:candidate.length+(candidate.startsWith("…")?30:0)});
 }
 options.sort((a,b)=>a.score-b.score);
 return options[0]?.text||null;
}
function normalizeTitle(input){
 let name=String(input||"").trim();
 for(const book of ["史记","晋书","汉书","后汉书","资治通鉴","魏书","宋书","宋史","明史"]){
  if(name.startsWith(book+"·"+book))name=book+"·"+name.slice(book.length*2+1).replace(/^[·‧.]+/,"");
 }
 return name.replace(/[·‧]{2,}/g,"·").replace(/第(\d+)篇$/,"第$1篇");
}
function explain(text,char,origin={}){
 // 提示只解释“读者可以直接从原文辨认的内容”；不生成未经校核的整句译文。
 const hints=[
  [/引.{0,14}(?:水|河).{0,12}溉|溉.{0,5}田|溉.{0,3}地|且溉且粪/, "这句提到引水或使用水灌溉土地，留意水源与田地的关系。"],
  [/汲水|汲之以器|有泉可汲|绠.{0,14}汲|井.{0,15}汲/, "这句围绕取水、井绳或水源展开；注意“汲”与人名“汲某”不同。"],
  [/固.{0,3}推|固请|固辞|固谏/, "这里有人坚持请求、推举或劝说；“固”可能表示坚持，但仍须核对本句语境。"],
  [/溉汲/, "“溉”是灌溉，“汲”是取水；句中两个动作要分开理解。"],
  [/曰[：“"]|谓.{0,8}曰/, "这句包含人物说话；可以先找出谁在说、说了什么，再理解该字。"],
  [/何以|何故|安能|孰能|何如/, "这里含疑问表达；先认清问的是原因、方法还是比较。"],
  [/若|如.{0,3}则/, "这里可能包含比较或假设关系，须结合前后文辨别。"],
  [/故|遂|乃/, "句中出现承接或因果提示字，可以先梳理事情的先后关系。"]
 ];
 const match=hints.find(([rule])=>rule.test(text));
 if(match)return match[1];
 const meaning=String(origin?.meaning||"").trim();
 if(meaning&&meaning.length<38&&!/尚待|未校/.test(meaning))
  return "本课“"+char+"”的释义是“"+meaning+"”；这句中的用法尚须结合原典核对，不能直接套用。";
 return "先结合上下文判断“"+char+"”在这里指人、事物还是动作；此处仅作阅读线索，不能代替译文。";
}
function format(hit,char,origin){
 const original=String(hit?.text||"");
 const text=excerpt(original,char);
 if(!text)return null;
 const title=normalizeTitle(hit.title||hit.work||"");
 if(!title)return null;
 return {...hit,title,text,readingHint:explain(text,char,origin),punctuation:"source",unreviewed:true};
}
window.WENYAN_CANDIDATE_QUALITY={format,excerpt,stripNotes,explain,normalizeTitle};
})();
