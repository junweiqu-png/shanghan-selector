(() => {
"use strict";
const $=id=>document.getElementById(id);
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const base=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[])];
const KEY="wenyan-recall-v1", tryJSON=(v,f)=>{if(typeof v!=="string"||!v.trim())return f;try{const parsed=JSON.parse(v);return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:f}catch{return f}};
let stored=tryJSON(localStorage.getItem(KEY),{}), custom=Array.isArray(stored.custom)?stored.custom:[];
let works=()=>[...base,...custom], wi=Math.max(0,Math.min(Number(stored.wi)||0,works().length-1)),si=Number(stored.si)||0, whole=!!stored.whole,show=!!stored.show;
let visited=new Set(stored.visited||[]), learned=new Set(stored.learned||[]), completions=new Set(stored.completions||[]);
function save(){localStorage.setItem(KEY,JSON.stringify({custom,wi,si,whole,show,visited:[...visited],learned:[...learned],completions:[...completions]}));}
function work(){return works()[wi]||works()[0];}
function line(){const w=work();si=Math.max(0,Math.min(si,w.lines.length-1));return w.lines[si];}
// 单字是学生索引的唯一单位，课本中的双字/多字词仅保留作为上下文。
const hanCharacter=c=>/\p{Script=Han}/u.test(c);
function tokensFor(w){
 const out=new Set(),sources=[w,...base,...custom];
 for(const book of sources)for(const item of book.terms||[])for(const ch of String(item[0]||""))if(hanCharacter(ch))out.add(ch);
 for(const term of window.WENYAN_STUDY_EDITOR?.indexTerms()||[])for(const ch of term)if(hanCharacter(ch))out.add(ch);
 for(const term of Object.keys(window.WENYAN_VERIFIED_CHARACTERS?.words||{}))out.add(term);
 return out;
}
function marked(text,w){
 const known=tokensFor(w);let out="",i=0;
 for(const ch of text){
  const shown=window.WENYAN_PINYIN?.span(text,i,w)||escape(ch);
  if(known.has(ch)){
   out+='<span class="token" role="button" tabindex="0" data-term="'+escape(ch)+'" data-study-offset="'+i+'" aria-label="查看“'+escape(ch)+'”的字义和关联古文">'+shown+'</span>';
  }else out+=shown;
  i+=ch.length;
 }
 return out;
}
function bindTokens(root,w){root.querySelectorAll(".token").forEach(n=>{n.addEventListener("click",e=>{e.stopPropagation();openTerm(n.dataset.term,w)});n.addEventListener("keydown",e=>{if(e.key==="Enter"){e.stopPropagation();openTerm(n.dataset.term,w)}})});}
function setNav(active){document.querySelectorAll(".bottom button").forEach(b=>b.classList.remove("active"));$(active).classList.add("active");}
function render(){
 const w=work(),row=line();visited.add(w.title);save();
 $("count").textContent=String(wi+1).padStart(2,"0")+" / "+works().length;
 $("mode").textContent=whole?"逐句":"整篇";
 $("single").hidden=whole;$("whole").hidden=!whole;
 if(!whole){
 $("title").textContent=w.title;$("source").textContent=w.source;$("level").textContent=w.level;
 $("progress").textContent="第 "+(si+1)+" / "+w.lines.length+" 句";
 $("sentence").dataset.plain=row[0];$("sentence").innerHTML=marked(row[0],w);
 $("translation").textContent=row[1];$("translation").hidden=!show;
 $("tapHelp").textContent=show?"轻点空白处隐藏译文 · 上滑下一句":"轻点空白处看译文 · 上滑下一句";
 $("grammarRow").innerHTML=[...new Set([...(row[2]?[row[2]]:[]),...(window.WENYAN_STUDY_EDITOR?.grammarForText(row[0])||[])])].map(g=>'<button data-pattern="'+escape(g)+'">'+escape(g)+" · 学句式 ↗</button>").join("");
 $("grammarRow").querySelectorAll("button").forEach(b=>b.onclick=()=>openPattern(b.dataset.pattern));
 $("dots").textContent=(si+1)+" / "+w.lines.length;
 bindTokens($("sentence"),w);
 } else {
 $("wholeTitle").textContent=w.title;$("wholeLevel").textContent=w.level;$("wholeSource").textContent=w.source;
 $("wholeBody").innerHTML=w.lines.map((x,i)=>'<article class="wholepara" data-i="'+i+'"><div class="wholetext" data-plain="'+escape(x[0])+'">'+marked(x[0],w)+'</div><div class="wholetranslation" hidden>'+escape(x[1])+'</div></article>').join("");
 $("wholeBody").querySelectorAll(".wholepara").forEach(n=>n.onclick=()=>{const target=n.querySelector(".wholetranslation");target.hidden=!target.hidden;});
 bindTokens($("wholeBody"),w);
 }
 setNav("homeTab");
}
function move(d){let w=work();if(si+d>=w.lines.length){completions.add(w.title);if(wi<works().length-1){wi++;si=0;}else si=w.lines.length-1;}else if(si+d<0){if(wi>0){wi--;si=works()[wi].lines.length-1;}else si=0;}else si+=d;show=false;render();}
function select(i){wi=i;si=0;show=false;whole=false;close();render();}
function modal(title,html,after){$("modalTitle").textContent=title;$("modalContent").innerHTML=html;$("overlay").hidden=false;if(after)after($("modalContent"));}
function close(){$("overlay").hidden=true;}
function list(){
 let html='<input id="searchWork" class="search" placeholder="搜索篇目、正文或出处"><div id="workItems"></div><button id="addWork" class="item">＋ 手动新增文章</button>';
 modal("选择篇目",html,root=>{
 const renderList=(q="")=>{$("workItems").innerHTML=works().map((w,i)=>({w,i})).filter(x=>[x.w.title,x.w.source,...x.w.lines.map(l=>l[0])].join(" ").includes(q)).map(({w,i})=>'<button class="item '+(i===wi?"current":"")+'" data-i="'+i+'"><b>'+String(i+1).padStart(2,"0")+'　'+escape(w.title)+'</b><small>'+escape(w.level)+' · '+w.lines.length+' 句 · '+escape(w.source)+'</small></button>').join("")||'<p class="notice">没有匹配的篇目。</p>';
 $("workItems").querySelectorAll("button").forEach(b=>b.onclick=()=>select(Number(b.dataset.i)));};
 $("searchWork").oninput=e=>renderList(e.target.value.trim());$("addWork").onclick=showAdd;renderList();
 });
}
function allEvidence(predicate){const out=[];for(let i=0;i<works().length;i++){const w=works()[i];w.lines.forEach((l,j)=>{if(predicate(l,w))out.push({w,i,j,l});});}return out;}
function evidenceMarkup(matches,limit=60){return matches.slice(0,limit).map(x=>'<div class="evidence"><b>'+escape(x.w.title)+'</b><small>'+escape(x.w.source)+' · 第'+(x.j+1)+'句</small><p>'+escape(x.l[0])+'</p><div class="meaning">'+escape(x.l[1])+'</div><button data-go="'+x.i+','+x.j+'">跳到此句 ↗</button></div>').join("")+(matches.length>limit?'<p class="notice">为保持流畅，先显示前 '+limit+' 条；请使用搜索缩小范围。</p>':"");}
function bindEvidence(root){root.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.go.split(",").map(Number);wi=i;si=j;whole=false;show=false;close();render()});}
function openTerm(term,w){
 const dict=(w.terms||[]).find(t=>t[0]===term)||(w.terms||[]).find(t=>t[0].includes(term));
 const examples=allEvidence(l=>l[0].includes(term));
 const definitions=works().flatMap(x=>(x.terms||[]).filter(t=>t[0].includes(term)).map(t=>({w:x,t})));
 const html='<p><span class="pill">'+escape(dict?.[1]||"词语")+'</span> <strong style="font-size:27px">'+escape(term)+'</strong></p><p class="notice">当前篇解释：'+escape(dict?.[2]||"未添加释义")+'。同字在不同篇目的含义和语法作用可能不同，请结合上下文判断。</p>'+
 '<div class="row"><button id="markWord">'+(learned.has(term)?"✓ 已掌握":"标记为已掌握")+'</button></div>'+
 '<div class="sectionLabel">全站释义 · '+definitions.length+' 条</div>'+
 (definitions.map(x=>'<div class="evidence"><b>'+escape(x.w.title)+'</b>　'+escape(x.t[1])+'：'+escape(x.t[2])+'</div>').join("")||'<p class="help">暂无其他篇的校核释义。</p>')+
 '<div class="sectionLabel">跨篇原文应用 · '+examples.length+' 句</div>'+
 '<p class="help">以下是目前收录古文的原文命中，不代表每个例句里的词义都相同。例句不够时可以添加更多古文，不能自动虚构。</p>'+
 (examples.length?evidenceMarkup(examples):'<p>暂无命中。</p>');
 modal("字义 · 实词虚词 · 跨篇例句",html,root=>{$("markWord").onclick=()=>{if(learned.has(term))learned.delete(term);else learned.add(term);save();$("markWord").textContent=learned.has(term)?"✓ 已掌握":"标记为已掌握";};bindEvidence(root);});
}
function openPattern(name){
 const matches=allEvidence(l=>l[2]===name);
 const html='<p class="notice">这是按照人工标注的句式类型汇集的原句；并非所有包含同一字词的句子都属于同一句式。对于争议句式，请以权威教材讲解为准。</p><h2>'+escape(name)+'</h2><div class="sectionLabel">已标注的古文应用 · '+matches.length+' 句</div>'+evidenceMarkup(matches);
 modal("句式专题 · "+name,html,bindEvidence);
}
function review(){
 const stats='<div class="stats"><div><strong>'+works().length+'</strong><small>收录篇目</small></div><div><strong>'+visited.size+'</strong><small>已学习篇</small></div><div><strong>'+learned.size+'</strong><small>掌握词语</small></div></div>';
 const words=[...new Set([...works().flatMap(w=>(w.terms||[]).flatMap(t=>[...t[0]].filter(hanCharacter))),...(window.WENYAN_STUDY_EDITOR?.indexTerms()||[]).flatMap(t=>[...t].filter(hanCharacter))])].sort((a,b)=>a.localeCompare(b,"zh-CN"));
 let html=stats+'<div class="sectionLabel">单字索引 · '+words.length+' 字</div><input id="wordSearch" class="search" placeholder="按字查实词 / 虚词"><div id="wordList"></div><div class="row"><a class="pill" href="coverage.html" target="_blank" rel="noopener noreferrer">查看全部单字的校译进度 ↗</a></div><div class="sectionLabel">句式专题</div><div id="patterns"></div><div class="row"><button id="studyEditReview">＋ 录入新实词、虚词、句式</button></div>';
 modal("积累 · 实词虚词与句式",html,root=>{
 let draw=(q="")=>{$("wordList").innerHTML=words.filter(s=>s.includes(q)).map(s=>'<button class="pill" data-term="'+escape(s)+'">'+escape(s)+(learned.has(s)?" ✓":"")+'</button>').join("")||"暂无";$("wordList").querySelectorAll("[data-term]").forEach(b=>b.onclick=()=>{let ref=works().find(w=>(w.terms||[]).some(t=>t[0].includes(b.dataset.term)))||work();openTerm(b.dataset.term,ref);});};
 $("wordSearch").oninput=e=>draw(e.target.value.trim());draw();
 const pats=[...new Set([...works().flatMap(w=>w.lines.map(l=>l[2]).filter(Boolean)),...(window.WENYAN_STUDY_EDITOR?.indexPatterns()||[])])];
 $("patterns").innerHTML=pats.map(p=>'<button class="pill" data-p="'+escape(p)+'">'+escape(p)+'</button>').join("");
 $("patterns").querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>openPattern(b.dataset.p));$("studyEditReview").onclick=()=>window.WENYAN_STUDY_EDITOR?.open();
 });
}
function showAdd(){
 modal("新增古文 · 手工录入",'<p class="notice">逐句一行，原文和翻译用“ || ”分隔；也可以只填原文，之后再补译。填写保存后仅存于当前浏览器。建议保留出处和版本信息，不把未核查内容标作权威资料。</p>'+
 '<div class="form"><label>标题 *</label><input id="newTitle" placeholder="例如：新篇目"><label>出处 / 版本</label><input id="newSource" placeholder="例如：《世说新语·言语》"><label>分类</label><select id="newLevel"><option>基础语感</option><option>经典积累</option><option>我的文章</option></select>'+
 '<label>每句原文 || 译文（每行一组） *</label><textarea id="newLines" placeholder="原文第一句。 || 第一句译文。\n原文第二句。 || 第二句译文。"></textarea>'+
 '<label>词语标注（每行：词语 | 类型 | 释义）</label><textarea id="newTerms" placeholder="之 | 虚词 | 代词，指代前文事物"></textarea><button id="saveNew">保存文章并开始背诵</button><div id="formError" class="danger"></div></div>',root=>{
 $("saveNew").onclick=()=>{
 const title=$("newTitle").value.trim(),raw=$("newLines").value.trim();if(!title||!raw){$("formError").textContent="标题和原文不能为空";return;}
 const lines=raw.split(/\n+/).map(s=>{let v=s.split(/\s*\|\|\s*/);return [(v[0]||"").trim(),(v.slice(1).join(" || ")||"").trim(),""]}).filter(x=>x[0]);
 if(!lines.length){$("formError").textContent="请至少输入一句原文";return;}
 const terms=$("newTerms").value.split(/\n+/).map(s=>s.split("|").map(v=>v.trim())).filter(t=>t.length===3&&t[0]);
 custom.push({title,source:$("newSource").value.trim()||"个人导入（待核查）",level:$("newLevel").value,lines,terms,ruby:{},hint:""});wi=works().length-1;si=0;whole=false;show=false;save();close();render();
 };});
}
function settings(){
 const html='<p class="notice">学习数据、手动添加的文章仅保存在当前浏览器的 localStorage。清理网站数据、换手机、换浏览器可能导致丢失。建议定期导出备份。</p>'+
 '<div class="row"><a class="pill" href="coverage.html" target="_blank" rel="noopener noreferrer">查看所有课内单字校译进度 ↗</a></div><div class="sectionLabel">数据管理</div><div class="row"><button id="add">＋ 新增文章</button><button id="studyEditSettings">＋ 实词／虚词／句式</button><button id="export">导出全部数据</button></div>'+
 '<label class="item" style="cursor:pointer">导入备份 JSON（将替换当前数据）<input id="import" type="file" accept="application/json,.json" style="display:block;margin-top:9px"></label>'+
 '<div class="sectionLabel">我的文章</div>'+(custom.length?custom.map((w,i)=>'<div class="item"><b>'+escape(w.title)+'</b><small>'+w.lines.length+'句　<button data-remove="'+i+'">删除此自定义篇目</button></small></div>').join(""):'<p class="help">暂无自定义文章。</p>')+
 '<div class="sectionLabel">使用说明</div><p class="help">逐句模式：上滑下一句，下滑上一句；轻点正文空白区域展开译文；点带点线的实词、虚词可看本句释义及跨篇古文；点句式标签查其他古文中的应用。整篇模式可逐句点开译文。学习状态自动保存。</p>'+
 '<p class="help">内置篇目、注释与例句为首版学习底稿，尚非经过出版社审定的权威教材。遇到古籍版本差异，以教材指定版本为准。</p>';
 modal("我的 · 添加与备份",html,root=>{
 $("add").onclick=showAdd;$("studyEditSettings").onclick=()=>window.WENYAN_STUDY_EDITOR?.open();
 $("export").onclick=()=>{const blob=new Blob([JSON.stringify({version:1,data:stored={custom,wi,si,whole,show,visited:[...visited],learned:[...learned],completions:[...completions]},study:window.WENYAN_STUDY_EDITOR?.data()||null},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="文言拾句-学习备份-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);};
 $("import").onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(data.version!==1||!data.data||!Array.isArray(data.data.custom))throw Error("文件格式不正确");if(!confirm("导入将替换当前学习进度与自定义篇目，确认继续？"))return;localStorage.setItem(KEY,JSON.stringify(data.data));if(data.study?.version===1&&data.study.words&&data.study.grammar)localStorage.setItem("wenyan-recall-study-v1",JSON.stringify(data.study));location.reload();}catch(err){alert("导入失败："+err.message)}};
 root.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{if(!confirm("确定删除这篇自定义文章？"))return;custom.splice(Number(b.dataset.remove),1);wi=Math.min(wi,works().length-1);si=0;save();settings();});
 });
}
$("card").addEventListener("click",e=>{if(e.target.closest(".token"))return;show=!show;render();});
$("card").addEventListener("keydown",e=>{if(e.target!==$("card"))return;if(e.key==="Enter"||e.key===" "){e.preventDefault();show=!show;render();}});
let start=null;
$("card").addEventListener("touchstart",e=>{start={x:e.touches[0].clientX,y:e.touches[0].clientY,t:Date.now()};},{passive:true});
$("card").addEventListener("touchend",e=>{if(!start||e.target.closest(".token")){start=null;return;}const delta=e.changedTouches[0].clientY-start.y,h=Math.abs(e.changedTouches[0].clientX-start.x);if(Math.abs(delta)>65&&Math.abs(delta)>h*1.2){e.preventDefault();move(delta<0?1:-1);}start=null;},{passive:false});
document.addEventListener("keydown",e=>{if($("overlay").hidden&& !whole && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){if(e.key==="ArrowDown"){e.preventDefault();move(1)}if(e.key==="ArrowUp"){e.preventDefault();move(-1)}}if(e.key==="Escape")close();});
$("prev").onclick=()=>move(-1);$("next").onclick=()=>move(1);
$("choose").onclick=list;$("mode").onclick=()=>{whole=!whole;save();render();};$("more").onclick=settings;
$("homeTab").onclick=()=>{close();render()};$("libraryTab").onclick=list;$("reviewTab").onclick=review;$("settingsTab").onclick=settings;
$("close").onclick=close;$("overlay").onclick=e=>{if(e.target===$("overlay"))close();};
$("hideAll").onclick=()=>{const nodes=$("wholeBody").querySelectorAll(".wholetranslation");let any=[...nodes].some(n=>!n.hidden);nodes.forEach(n=>n.hidden=any);$("hideAll").textContent=any?"显示译文":"隐藏译文";};
window.addEventListener("error",e=>console.error("文言拾句运行错误",e.message));
render();
})();