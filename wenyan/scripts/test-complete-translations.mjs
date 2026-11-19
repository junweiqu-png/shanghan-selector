import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const window={},context={window,document:{getElementById:()=>null,addEventListener:()=>{}},localStorage:{getItem:()=>null},location:{search:""},URLSearchParams};
const page=fs.readFileSync("wenyan/index.html","utf8");
for(const f of [...page.matchAll(/<script src="([^"?]+)/g)].map(x=>x[1]).filter(x=>!["app.js","study-editor.js","pinyin.js"].includes(x)))
 vm.runInNewContext(fs.readFileSync("wenyan/"+f,"utf8"),context,{filename:f});
const works=[1,2,3,4].flatMap(n=>window["WENYAN_DATA_"+n]||[]),d=window.WENYAN_STUDY_DEBUG;
let glyphs=0,segments=0,examples=0;
const chars=new Set();
for(const w of works)for(const [text,translation] of w.lines){
 assert(translation.trim()&&translation!==text,w.title+" must have an actual modern translation");segments++;
 for(let offset=text.length-1;offset>=0;offset--){
  const char=text[offset];if(!/\p{Script=Han}/u.test(char))continue;chars.add(char);glyphs++;
  const found=d.origin(char,{title:w.title,text,offset});
  assert(found.verified&&found.meaning&&found.translation===translation,w.title+" missing context: "+offset+"/"+char);
  assert(!/待校|尚待|未标注|未校|字义尚/.test(found.meaning),w.title+" placeholder: "+char);
  const exact=window.WENYAN_LESSON_CHARACTER_GLOSSES.words[char].sources.filter(s=>s[0]===w.title&&s[6]===text&&s[7]===offset);
  assert.equal(exact.length,1,"each glyph needs exactly one positional sense");
 }
}
for(const char of chars)for(const {record:r} of d.rows(char)){
 assert(r.translation.trim()&&r.meaning.trim()&&r.text.includes(r.match||char),"empty related card: "+char+"/"+r.title);examples++;
 for(const c of r.text)if(/\p{Script=Han}/u.test(c))assert(window.WENYAN_REFERENCE_DICTIONARY.words[c]?.s?.length,"dictionary lookup empty inside related text: "+c+"/"+r.title);
}
const meaning=(title,fragment,char,n=0)=>{
 const w=works.find(x=>x.title===title),text=w.lines.find(x=>x[0].includes(fragment))[0];let offset=text.indexOf(fragment)+fragment.indexOf(char);
 while(n--)offset=text.indexOf(char,offset+1);
 return d.origin(char,{title,text,offset});
};
for(const [title,phrase,char,expected] of [
 ["爱莲说","不蔓不枝","蔓","横生藤蔓"],["爱莲说","不蔓不枝","枝","旁生枝茎"],
 ["王戎不取道旁李","多子","子","果实"],["陈太丘与友期行","尊君在不","不","否"],
 ["杨氏之子","孔君平","君","名字"],["杨氏之子","君家果","君","您"],
 ["两小儿辩日","日始出","日","太阳"],["记承天寺夜游","十二日夜","日","日子"],
 ["曹刿论战","公将鼓之","鼓","击鼓"],["伯牙鼓琴","伯牙鼓琴","鼓","弹"],
 ["狼","得骨止","止","停止"],["狼","止有剩骨","止","只"],
 ["湖心亭看雪","大雪三日","雪","下雪"],["湖心亭看雪","上下一白","一","全"],
 ["河中石兽","转转不已","已","停止"],["智子疑邻","甚智其子","智","聪明"],
 ["塞翁失马","其父曰","父","老人"],["塞翁失马","父子相保","父","父亲"],
 ["扁鹊见蔡桓公","还走","还","转身"],["口技","不能指其一端","指","指出"]
])assert(meaning(title,phrase,char).meaning.includes(expected),title+" “"+phrase+"”/"+char+" should mean "+expected);
assert.equal(meaning("智子疑邻","甚智其子","智").code,"judge-clever");
const man=window.WENYAN_TRANSLATED_CLASSICS.records;
assert.equal(man.length,12);assert.equal(man.filter(x=>x.sourceId).length,8,"translate all eight previously displayed raw records");
assert(man.every(r=>r.translation&&r.meaning&&r.url));
assert(man.find(x=>x.sourceId==="zuozhuan#10").translation.includes("原先"));
assert(man.filter(x=>x.code==="proper-name").length===2,"蔓成然 and 范蔓 must stay names");
const explorer=fs.readFileSync("wenyan/study-explorer.js","utf8");
assert(!explorer.includes("readingHint")&&!explorer.includes("searchClassics"),"no raw hints or network dependency in student word cards");
assert(page.includes('id="chooseHighlights"')&&page.includes('id="chooseHighlightsWhole"'));
assert.equal(works.length,51);assert.equal(segments,320);assert.equal(glyphs,6446);
console.log(JSON.stringify({ok:true,works:works.length,translatedSegments:segments,explainedPositions:glyphs,relatedCards:examples,translatedClassicalExcerpts:man.length}));
