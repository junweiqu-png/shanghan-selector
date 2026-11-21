/* Contextual risk labels and complete, independently selectable character positions. */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const win={},page=fs.readFileSync("wenyan/index.html","utf8");
for(const file of [...page.matchAll(/<script src="([^"?]+)/g)].map(x=>x[1]).filter(x=>!["app.js","study-editor.js","study-explorer.js"].includes(x)))
 vm.runInNewContext(fs.readFileSync("wenyan/"+file,"utf8"),{window:win},{filename:file});
const works=[1,2,3,4].flatMap(n=>win["WENYAN_DATA_"+n]||[]),risk=win.WENYAN_TRANSLATION_RISKS;
function inLesson(title,needle,char){const text=works.find(w=>w.title===title).lines.find(l=>l[0].includes(needle))[0];return risk.classify(title,text,text.indexOf(char));}
assert.equal(inLesson("狼","犬坐","犬")?.type,"usage");
assert.equal(inLesson("狼","一狼洞","洞")?.type,"usage");
assert.equal(inLesson("爱莲说","不蔓","蔓")?.type,"usage");
assert.equal(inLesson("曹刿论战","之狱","狱")?.type,"ancient");
assert.equal(inLesson("桃花源记","无论","论")?.type,"ancient");
assert.equal(inLesson("出师表","存亡之秋","秋")?.type,"ancient");
assert.equal(inLesson("陈太丘与友期行","尊君在不","不")?.type,"loan");
assert.equal(inLesson("伯牙鼓琴","锺子期","期"),null,"a person's name is not an ambiguous verb");
const classify=(text,char,meaning,pos="实词",code="checked")=>risk.classify("课外例句",text,text.indexOf(char),{term:char,meaning,pos,code});
assert.equal(classify("弃甲曳兵而走","走","逃跑")?.type,"ancient");
assert.equal(classify("君子之交","之","的"),null);
assert.equal(classify("吾欲之南海","之","前往")?.type,"poly");
assert.equal(classify("犬坐于前","犬","像狗一样")?.type,"usage");
assert.equal(classify("犬吠","犬","狗"),null,"the noun itself must not be called adverbial");
assert.equal(classify("为是其智弗若与","为","认为")?.type,"poly","a verb meaning 认为 is not automatically putative usage");
assert.equal(classify("汤武革命","汤","商汤", "专名", "proper-name"),null);
assert.equal(classify("假舆马者","假","借助")?.type,"ancient");
assert.equal(classify("虚假","假","虚假"),null,"a glyph alone must not trigger color");

const source=fs.readFileSync("wenyan/app.js","utf8"),start=source.indexOf("const hanCharacter="),end=source.indexOf("function bindTokens(",start);
let captured,inputs,elements,rendered=0;
const savedStorage=new Map(),highlights=Object.create(null);
const sandbox={window:win,highlights,base:works,custom:[],works:()=>works,escape:s=>String(s),MARK_KEY:"wenyan-highlight-v1",localStorage:{setItem:(k,v)=>savedStorage.set(k,v)},
 close:()=>{},render:()=>rendered++,$:id=>elements.get(id),modal:(title,html,after)=>{
  captured={title,html};inputs=[...html.matchAll(/<input type="checkbox" value="([^"]+)" data-highlight-char="([^"]+)"[^>]*>/g)].map(m=>({value:m[1],char:m[2],checked:/ checked/.test(m[0])}));
  elements=new Map(["markCount","markDefaults","markAll","markNone","saveHighlights","cancelHighlights"].map(id=>[id,{textContent:""}]));
  after({querySelectorAll:()=>inputs});
 }};
vm.createContext(sandbox);vm.runInContext(source.slice(start,end),sandbox);
let totalSelectable=0;
for(const work of works){
 sandbox.testWork=work;vm.runInContext("chooseHighlights(testWork.title)",sandbox);
 const expected=[];work.lines.forEach(([text],line)=>{for(let offset=0;offset<text.length;offset++)if(/\p{Script=Han}/u.test(text[offset]))expected.push([line+":"+offset,text[offset]]);});
 assert.deepEqual(inputs.map(i=>[i.value,i.char]),expected,"a body glyph disappeared or moved in "+work.title);
 totalSelectable+=inputs.length;
}
assert.equal(totalSelectable,6446);
const wolf=works.find(w=>w.title==="狼");sandbox.testWork=wolf;
highlights[wolf.title]=["狼"];
vm.runInContext("chooseHighlights(testWork.title)",sandbox);
assert.equal(inputs.length,202,"the chooser must show all 202 occurrences, not 123 distinct glyphs");
assert(inputs.filter(i=>i.char==="狼").length>1);
assert(inputs.filter(i=>i.char==="狼").every(i=>i.checked),"old per-character selections must migrate");
elements.get("markAll").onclick();assert(inputs.every(i=>i.checked));
elements.get("markNone").onclick();assert(inputs.every(i=>!i.checked));
const wolves=inputs.filter(i=>i.char==="狼");wolves[0].checked=true;
elements.get("saveHighlights").onclick();
assert.equal(rendered,1);
assert.equal(highlights[wolf.title].version,2);
assert.equal(highlights[wolf.title].positions.length,1,"selecting one wolf must not select every wolf");
const backup=JSON.parse(savedStorage.get("wenyan-highlight-v1"));
highlights[wolf.title]=backup[wolf.title];
vm.runInContext("chooseHighlights(testWork.title)",sandbox);
assert.equal(inputs.filter(i=>i.checked).length,1,"positional choices must survive export/import or reload");
assert.equal(inputs.find(i=>i.checked).value,wolves[0].value);
const [line,offset]=wolves[0].value.split(":").map(Number);
sandbox.text=wolf.lines[line][0];sandbox.lineIndex=line;
const html=vm.runInContext("marked(text,testWork,lineIndex)",sandbox);
assert(new RegExp('class="token keychar[^\"]*"[^>]*data-term="狼"[^>]*data-study-offset="'+offset+'"').test(html));
assert.equal((html.match(/\bkeychar\b/g)||[]).length,1);
console.log(JSON.stringify({ok:true,works:works.length,allBodyPositionsSelectable:totalSelectable,wolfPositions:202,distinctWolfGlyphs:123,independentRepeatedGlyphs:true,legacyMigration:true,contextualRiskColors:true}));
