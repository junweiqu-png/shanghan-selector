/* 检查真实学生字卡：三处卮、姓名豁免、意动智、按字查询（非下载全目录）。
 * 在隔离的浏览器式 VM 中执行真正的 study-explorer.js，而不只是查源码字符串。 */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const base="wenyan/";
const win={};
const document={getElementById:()=>null,addEventListener:()=>{}};
const localStorage={getItem:()=>null,setItem:()=>{}};
const requests=[];
const fetch=async uri=>{
 requests.push(String(uri));
 if(String(uri).includes("expanded-manifest"))return {ok:true,json:async()=>({large:{available:true,termIndexShards:1,termIndexEncoding:"json"}})};
 if(String(uri).includes("large-term-index"))return {ok:true,arrayBuffer:async()=>new TextEncoder().encode(JSON.stringify({"卮":[{id:"demo",group:"史记",title:"史记·项羽本纪",text:"赐之卮酒。"}]})).buffer};
 throw Error("单字检索不得预先下载完整书目："+uri);
};
const context={window:win,document,localStorage,location:{search:""},URLSearchParams,console,fetch,setTimeout,clearTimeout,TextEncoder,TextDecoder,Uint8Array};
for(const file of [
 "data-basic.js","data-classic.js","data-extra.js","data-junior.js","data-junior-batch2a.js","data-junior-batch2b.js","data-junior-batch2c.js","data-chushi-full.js",
 "study-annotations.js","study-editor.js","study-crosslesson.js","study-verified-extra.js","study-verified-more2.js",
 "study-verified-common3.js","study-verified-corpus.js","study-verified-batch4.js","study-verified-batch5.js",
 "study-verified-batch6.js","study-verified-batch7.js","study-verified-batch8.js","study-verified-batch9.js",
 "study-verified-batch10.js","study-verified-batch11.js","study-verified-batch12.js","study-lesson-character-glosses.js","study-reference-dictionary.js","study-chushi-character-glosses.js","study-guanchao-reverse-glosses.js","study-verified-characters.js","study-junior-glosses.js","study-grammar-more.js","study-candidate-quality.js","study-complete-glosses.js","study-translated-classics.js","study-explorer.js"
])vm.runInNewContext(fs.readFileSync(base+file,"utf8"),context,{filename:file});
const debug=win.WENYAN_STUDY_DEBUG;
assert(debug,"student character study debug API unavailable");
const book=(win.WENYAN_DATA_1||[]).find(w=>w.title==="画蛇添足");
assert(book?.lines?.length>=3,"original 画蛇添足 body missing");
let validated=0;
for(const [sentence] of book.lines.filter(([s])=>s.includes("卮"))){
 const ctx={title:book.title,text:sentence,offset:sentence.indexOf("卮")};
 const source=debug.origin("卮",ctx),coverage=debug.coverage("卮",ctx);
 assert(source.verified&&source.code==="wine-vessel",JSON.stringify({sentence,source}));
 assert(coverage.complete&&coverage.verifiedBooks>=5&&coverage.sameSenseBooks>=2,JSON.stringify({sentence,coverage}));
 validated++;
}
assert.equal(validated,3,"each of three 卮 occurrences must have a reviewed source sense");
const story=(win.WENYAN_DATA_1||[]).find(w=>w.title==="穿井得一人");
const storyLine=story?.lines?.[0]?.[0];
assert(storyLine?.includes("溉汲"),"original sentence must be preserved unchanged");
for(const char of ["汲","溉"]){
 const ctx={title:story.title,text:storyLine,offset:storyLine.indexOf(char)};
 const origin=debug.origin(char,ctx),stats=debug.coverage(char,ctx);
 assert(origin.verified&&origin.code===(char==="汲"?"draw-water":"irrigate"),"literal sense incorrect for "+char);
 assert(stats.complete&&stats.verifiedBooks>=5&&stats.sameSenseBooks>=2,JSON.stringify({char,stats}));
 assert.equal(win.WENYAN_VERIFIED_BATCH11.words[char].examples.length,5,"five independently sourced examples required for "+char);
}
const nuclear=(win.WENYAN_DATA_4||[]).find(w=>w.title==="核舟记");
assert(nuclear,"核舟记 must remain in 51 work baseline");
const completeChuShi=(win.WENYAN_DATA_4||[]).find(x=>x.title==="出师表");
assert.equal(completeChuShi.lines.length,25,"full original text with per-line translations");
const everyLesson=[...(win.WENYAN_DATA_1||[]),...(win.WENYAN_DATA_2||[]),...(win.WENYAN_DATA_3||[]),...(win.WENYAN_DATA_4||[])];
assert.equal(everyLesson.length,51,"keep all previous lessons");
const notTranslated=everyLesson.flatMap(w=>(w.lines||[]).flatMap(([ancient,modern],i)=>!String(ancient||"").trim()||!String(modern||"").trim()?[w.title+"#"+i]:[]));
assert.equal(notTranslated.length,0,"all 51 lessons must have complete text and translation: "+notTranslated.slice(0,6));
let chushiChecked=0;
for(let lineIndex=completeChuShi.lines.length-1;lineIndex>=0;lineIndex--){
 const row=completeChuShi.lines[lineIndex];
 for(let offset=row[0].length-1;offset>=0;offset--){
  const char=row[0][offset];
  if(!/\p{Script=Han}/u.test(char))continue;
  const origin=debug.origin(char,{title:"出师表",text:row[0],offset});
  assert(origin.verified&&origin.meaning&&origin.code&&origin.usage,
   "missing or unanchored full Chu Shi Biao glyph meaning: line "+(lineIndex+1)+" "+char+" @"+offset);
  // 每一个字必须对应它当前的完整原句和确切位置，不能只与另一处“先帝”“之”“以”短锚重合。
  const sources=win.WENYAN_LESSON_CHARACTER_GLOSSES.words[char]?.sources?.filter(
   s=>s[0]==="出师表"&&s[6]===row[0]&&s[7]===offset)||[];
  assert.equal(sources.length,1,"every glyph must have exactly one position-specific annotation: "+lineIndex+"/"+offset+"/"+char);
  assert.equal(origin.meaning,sources[0][2],"wrong contextual sense for "+lineIndex+"/"+offset+"/"+char);
  assert.equal(origin.code,sources[0][4],"wrong source position for "+lineIndex+"/"+offset+"/"+char);
  assert(origin.usage.includes("该句译为："+row[1]),"wrong sentence translation associated with "+lineIndex+"/"+offset+"/"+char);
  assert(debug.lookupWord(char)?.examples?.some(e=>e[0]==="出师表"&&e[2]===row[0]&&e[3]===row[1]),
   "cross-text index lacks literal translated original for "+lineIndex+"/"+char);
  chushiChecked++;
 }
}
assert.equal(chushiChecked,627);
const tide=(win.WENYAN_DATA_4||[]).find(x=>x.title==="观潮");
assert.equal(tide?.lines.length,7,"观潮原文七段应全部保留");
let tideChecked=0;
for(let line=tide.lines.length-1;line>=0;line--){
 const [original,modern]=tide.lines[line];
 assert(original.trim()&&modern.trim(),"观潮每句原文及译文不得空白");
 for(let offset=original.length-1;offset>=0;offset--){
  const term=original[offset];if(!/\p{Script=Han}/u.test(term))continue;
  const spec=win.WENYAN_LESSON_CHARACTER_GLOSSES.words[term]?.sources?.filter(x=>x[0]==="观潮"&&x[6]===original&&x[7]===offset)||[];
  assert.equal(spec.length,1,"观潮唯一语境位置缺义："+line+"/"+offset+"/"+term);
  const origin=debug.origin(term,{title:"观潮",text:original,offset});
  assert(origin.verified&&origin.meaning===spec[0][2]&&origin.code===spec[0][4],
   "观潮本句字义错配："+line+"/"+offset+"/"+term);
  assert(origin.usage.includes("该句译为："+modern),"观潮字卡串译："+line+"/"+offset+"/"+term);
  assert(debug.lookupWord(term)?.examples?.some(e=>e[0]==="观潮"&&e[2]===original&&e[3]===modern),
   "观潮原文译文未进入跨篇学习："+line+"/"+term);
  tideChecked++;
 }
}
assert.equal(tideChecked,203,"观潮正文203字位必须全部校释");
assert(tide.lines[1][1].includes("吞没天空")&&tide.lines[3][1].includes("五种阵势")&&tide.lines[6][1].includes("十幅大彩旗"),
 "观潮旧译漏掉吞天沃日、五阵、十幅彩旗");
const tideGlyph=(li,text,i=0)=>{const row=tide.lines[li][0],at=row.indexOf(text);assert(at>=0);return debug.origin(text[i],{title:"观潮",text:row,offset:at+i}).meaning;};
assert(tideGlyph(1,"沃日").includes("冲荡"),"观潮沃日之沃是浸没冲荡");
assert(tideGlyph(6,"文身").includes("刺花纹"),"观潮文身之文是刺花纹而非文章");
assert(tideGlyph(5,"为火所焚").includes("被"),"观潮为……所……是被动结构");
// 自末段向首段、从每句末字向首字再次严审，检查缺义、错句、同字异义和跨篇译文。
const reverseChecks=[
 [24,"所言",1,"说、表达"],[22,"雅言",1,"言论、意见"],[22,"善道",0,"好的、妥善的"],
 [21,"兴德之言",3,"劝谏之言"],[20,"之效",1,"任务、重任"],[20,"不效",1,"取得成效"],
 [20,"之灵",1,"亡灵、英灵"],[19,"忠言",1,"忠言"],[16,"不毛",0,"不、没有"],
 [16,"托付不效",2,"未能、没有"],[14,"一年",0,"数字一"],[14,"奉命",1,"命令、使命"],
 [12,"性命",0,"生命"],[12,"性命",1,"人的生命"],[9,"小人",0,"品行卑下"],
 [9,"亲贤臣",0,"形容词作动词"],[8,"得所",1,"合适的位置"],[6,"广益",1,"益处、好处"],
 [4,"有司",0,"各有所司"],[0,"中道",0,"中途、半途"]
];
for(const [lineIndex,fragment,offsetInFragment,meaning] of reverseChecks){
 const sentence=completeChuShi.lines[lineIndex][0],start=sentence.indexOf(fragment);
 assert(start>=0,"test fragment not in original: "+lineIndex+"/"+fragment);
 const term=fragment[offsetInFragment],at=start+offsetInFragment;
 const resolved=debug.origin(term,{title:"出师表",text:sentence,offset:at});
 assert(resolved.meaning.includes(meaning),
  "reverse semantic audit failed at "+(lineIndex+1)+" "+fragment+"（"+term+"）expected "+meaning+" but got "+resolved.meaning);
}
const reverseSite=[];
for(const work of [...everyLesson].reverse()){
 let total=0,unresolved=0,firstUnresolved=[];
 for(const [lineIndex,row] of [...work.lines.entries()].reverse()){
  assert(String(row[1]||"").trim(),"missing modern translation "+work.title+" #"+(lineIndex+1));
  const glyphs=[...row[0]];
  for(let offset=glyphs.length-1;offset>=0;offset--){
   const char=glyphs[offset];
   if(!/\p{Script=Han}/u.test(char))continue;
   total++;
   const sense=debug.origin(char,{title:work.title,text:row[0],offset});
   if(!sense.verified||!sense.code||!sense.meaning||/尚待校核|未标注|待核对|待分字/.test(sense.meaning)){
    unresolved++;
    if(firstUnresolved.length<3)firstUnresolved.push({line:lineIndex+1,char});
   }
  }
 }
 reverseSite.push({title:work.title,total,unresolved,firstUnresolved});
}
assert.equal(reverseSite.reduce((n,w)=>n+w.unresolved,0),0,"all 6446 original glyphs must resolve");
assert.equal(reverseSite.find(w=>w.title==="出师表")?.unresolved,0,"出师表全文倒查不能有空白字义");
assert.equal(reverseSite.find(w=>w.title==="观潮")?.unresolved,0,"观潮全文倒查不能有空白字义");
const unresolvedOthers=reverseSite.filter(x=>x.title!=="出师表"&&x.unresolved>0);
console.log("REVERSE_SITE_AUDIT "+JSON.stringify({works:reverseSite.length,fullChuShiGlyphs:chushiChecked,
 untranslatedSegments:notTranslated.length,unresolvedElsewhere:unresolvedOthers.reduce((n,x)=>n+x.unresolved,0),
 remainingWorkCount:unresolvedOthers.length,reverseFirst10:reverseSite.slice(0,10)}));
const chushiMeaning=(i,needle,charIndex=0)=>{const sentence=completeChuShi.lines[i][0],offset=sentence.indexOf(needle);assert(offset>=0);return debug.origin(needle[charIndex],{title:"出师表",text:sentence,offset:offset+charIndex}).meaning;};
assert(chushiMeaning(9,"先汉").includes("西汉"),"先汉 means Western Han, not a deceased emperor");
assert(chushiMeaning(9,"后汉").includes("东汉"),"后汉 means Eastern Han");
assert(chushiMeaning(8,"行阵").includes("军队行列"),"行阵 行 means ranks, not activity");
assert(chushiMeaning(9,"贤臣",1).includes("臣子"),"贤臣 is a minister, not Zhuge Liang himself");
assert(chushiMeaning(8,"营中",1).includes("军营内部"),"营中 is inside the camp");
assert(chushiMeaning(0,"臣").includes("诸葛亮"),"opening speaker 臣 refers to Zhuge Liang");
const uiFile=fs.readFileSync(base+"study-explorer.js","utf8");
assert(uiFile.includes("本文原句的现代汉语译文：")&&uiFile.includes("const translation=contextTranslation(origin)"),
 "verified character cards should show the full correct modern translation, not only isolated glosses");
assert(debug.lookupWord("陟").examples.some(e=>e[0]==="出师表"&&e[3]),"original translation linked into existing cross-lesson network");
const repeat=(lineNum,term,pos)=>debug.origin(term,{title:"出师表",text:completeChuShi.lines[lineNum][0],offset:completeChuShi.lines[lineNum][0].indexOf(term,pos||0)});
assert(repeat(5,"之").code==="proper-name","郭攸之 '之' is a name, not a function word");
assert(repeat(21,"之",completeChuShi.lines[21][0].indexOf("攸")).code==="proper-name","郭攸之 name must be preserved later");
assert(repeat(2,"以").meaning.includes("目的"),"以光 should express purpose");
const diameter=debug.origin("径",{title:"核舟记",text:nuclear.lines[0][0],offset:nuclear.lines[0][0].indexOf("径")});
assert(diameter.verified&&diameter.code==="diameter"&&diameter.meaning.includes("直径"),"核舟记 径 must mean diameter");
const diameterCoverage=debug.coverage("径",{title:"核舟记",text:nuclear.lines[0][0],offset:nuclear.lines[0][0].indexOf("径")});
assert.equal(diameterCoverage.sameSenseBooks,2,"two verified independently sourced geometric examples, not 狼 straight");
const candidateQuality=win.WENYAN_CANDIDATE_QUALITY;
assert(!candidateQuality.format({title:"晋书·五行志",text:"汲桑被苟晞击败。"},"汲",{meaning:"打水"}),"汲桑 false-person-name hit");
assert(!candidateQuality.format({title:"资治通鉴·第21篇",text:"水出南羌中东北入泽溉民田余无所见"},"溉",{meaning:"灌溉"}),"unpunctuated long fragment");

const nameLine="王戎七岁，尝与诸小儿游。";
const proper=debug.origin("戎",{title:"王戎不取道旁李",text:nameLine,offset:nameLine.indexOf("戎")});
assert(proper.code==="proper-name","戎 in 王戎 must mean a personal name");
const smartLine="暮而果大亡其财，其家甚智其子，而疑邻人之父。";
const smart=debug.origin("智",{title:"智子疑邻",text:smartLine,offset:smartLine.indexOf("智")});
const smartStats=debug.coverage("智",{title:"智子疑邻",text:smartLine,offset:smartLine.indexOf("智")});
assert(smart.code==="judge-clever"&&smartStats.verifiedBooks>=5&&smartStats.sameSenseBooks===0,
 "智 must NOT count simple noun wisdom as same putative usage");
const matched=await win.WENYAN_STUDY_EDITOR.searchClassics("卮");
assert.equal(requests.length,2,"student lookup must fetch only manifest and one sharded index");
assert(!requests.some(x=>x.includes("catalog.json")),"student lookup must not download full catalog");
assert.equal(matched.length,1);
console.log(JSON.stringify({ok:true,works:51,confirmedOriginalContexts:validated,examples:win.WENYAN_VERIFIED_BATCH10.words["卮"].examples.length,lookupRequests:requests,verified:debug.coverage("卮",{title:book.title,text:book.lines[0][0],offset:book.lines[0][0].indexOf("卮")})},null,2));
