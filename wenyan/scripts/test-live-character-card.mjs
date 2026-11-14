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
 "data-basic.js","data-classic.js","data-extra.js","data-junior.js","data-junior-batch2a.js","data-junior-batch2b.js","data-junior-batch2c.js",
 "study-annotations.js","study-editor.js","study-crosslesson.js","study-verified-extra.js","study-verified-more2.js",
 "study-verified-common3.js","study-verified-corpus.js","study-verified-batch4.js","study-verified-batch5.js",
 "study-verified-batch6.js","study-verified-batch7.js","study-verified-batch8.js","study-verified-batch9.js",
 "study-verified-batch10.js","study-verified-batch11.js","study-verified-characters.js","study-junior-glosses.js","study-grammar-more.js","study-candidate-quality.js","study-explorer.js"
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
