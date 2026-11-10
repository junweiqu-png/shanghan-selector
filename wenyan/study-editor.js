/* 用户自建文言字词、句式和逐句译注：不把原始字形搜索冒充解释。 */
(()=>{
"use strict";
const KEY="wenyan-recall-study-v1", $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const blank=()=>({version:1,words:{},grammar:{}});
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&x.version===1&&x.words&&x.grammar?x:blank()}catch{return blank()}}
function save(d){localStorage.setItem(KEY,JSON.stringify(d));}
const data=read();let catalog=null,catalogPromise=null,kind="word",candidateRecords=[];
function words(){return Object.keys(data.words)}
function patterns(){return Object.keys(data.grammar)}
function getSpec(type,name){return (type==="word"?data.words:data.grammar)[name]}
function readCatalog(){
 if(catalogPromise)return catalogPromise;
 catalogPromise=(async()=>{
  const resp=await fetch("evidence/expanded-manifest.json?v=20261110expand1",{cache:"default"});
  if(!resp.ok)throw Error("后台原典索引未部署("+resp.status+")");
  const m=await resp.json();
  const files=["catalog.json",...(m.files||[]).map(x=>x.file)];
  const values=await Promise.all(files.map(async name=>{
   try{const r=await fetch("evidence/"+name,{cache:"default"});if(!r.ok)return [];
    const x=await r.json();return Array.isArray(x.entries)?x.entries:[];}catch{return [];}
  }));
  catalog={manifest:m,entries:values.flat()};
  return catalog;
 })().catch(err=>{catalogPromise=null;throw err});
 return catalogPromise;
}
const largeCache={};
async function readLarge(term,manifest){
 if(!manifest?.large?.available||!term)return [];
 const ch=[...term][0],index=ch.codePointAt(0)%64,key=index.toString().padStart(2,'0');
 if(!largeCache[key]){
  largeCache[key]=fetch('evidence/large-index/'+key+'.json',{cache:'default'})
   .then(r=>{if(!r.ok)throw Error('经史索引 HTTP '+r.status);return r.json()}).catch(e=>{delete largeCache[key];throw e});
 }
 const data=await largeCache[key];
 return (data[ch]||[]).filter(r=>r.text?.includes(term)).map(r=>({
  id:r.id,group:r.group,title:r.source+'·'+r.chapter,work:r.source+'·'+r.chapter,
  text:r.text,url:'https://github.com/gujilab/chinese-classical-corpus',
  originId:r.id
 }));
}
function contextSnippet(r,term){
 const text=String(r.text||"").replace(/\s+/g,' '),pos=text.indexOf(term);
 if(pos<0)return "";
 const before=text.slice(Math.max(0,pos-105),pos),after=text.slice(pos+term.length,Math.min(text.length,pos+term.length+145));
 // Extend one sentence before/after, truncated only in editor candidates.
 return (pos>105?"…":"")+before+term+after+(pos+term.length+145<text.length?"…":"");
}
function formValues(){
 const title=$("editTitle")?.value.trim(),term=$("editName")?.value.trim();
 const original=$("editOriginal")?.value.trim(),translation=$("editTranslation")?.value.trim(),
       meaning=$("editMeaning")?.value.trim(),category=$("editPos")?.value.trim(),usage=$("editUsage")?.value.trim();
 return {title,term,original,translation,meaning,category,usage,variant:$("editCode")?.value.trim(),
 source:$("editSource")?.value.trim(),sourceURL:$("editURL")?.value.trim(),anchor:$("editAnchor")?.value.trim()};
}
function urlOK(url){return !url||/^https:\/\//.test(url)}
function field(s,id,label,place,required=false){
 return '<label>'+label+(required?' *':'')+'</label><input id="'+id+'" placeholder="'+place+'"'+(required?' required':'')+' value="'+esc(s||"")+'">';
}
function start(existing=null){
 const ctx=existing||{},study=ctx.kind||"word";kind=study;
 const liveTitle=$("title")?.textContent||"";
 const currentLine=$("sentence")?.textContent||"";
 const html='<p class="help">词语和句式可以自己新增；例句必须填原文、准确翻译与本句义项。未经译注的后台命中只会显示在这里，<b>不会进入孩子的关联学习页</b>。</p>'+
 '<div class="row"><button id="editWord" class="'+(kind==="word"?'current':'')+'">新增实词/虚词</button><button id="editGrammar" class="'+(kind==="grammar"?'current':'')+'">新增句式</button></div>'+
 '<div class="form">'+field(ctx.name,"editName",kind==="word"?"字 / 词":"句式名称",kind==="word"?"例：期":"例：宾语前置",true)+
 field(ctx.title||liveTitle,"editTitle","例句篇名","例：陈太丘与友期行",true)+
 field(ctx.source,"editSource","出处","例：《世说新语·方正》")+
 field(ctx.sourceURL,"editURL","原典链接（可选，仅 https）","https://zh.wikisource.org/wiki/...")+
 '<label>原文句段 *</label><textarea id="editOriginal" rows="3" placeholder="至少包含上方词语；句式可以是整句">'+esc(ctx.original||currentLine)+'</textarea>'+
 field(ctx.anchor,"editAnchor","本文定位片段（可选）","例：与友期行；加入后可准确区分同字异义")+
 '<label>句意翻译 *</label><textarea id="editTranslation" rows="3" placeholder="准确翻译这段原文；后台检索不会自动造译文">'+esc(ctx.translation)+'</textarea>'+
 field(ctx.meaning,"editMeaning",kind==="word"?"此处具体词义":"该句句式说明","例：约定 / 本句宾语放在动词前",true)+
 (kind==="word"?field(ctx.category||"实词","editPos","词性 / 作用","动词 / 介词 / 代词"):'<label>句式细分类型</label><input id="editPos" value="句式">')+
 field(ctx.variant,"editCode","义项编号 / 句式子类（同义填相同编号）","例：appoint 或 nominal；可自定义",true)+
 field(ctx.usage,"editUsage","与本文比较的侧重点","例：和朋友提前约定一件事",true)+
 '<div class="row"><button id="saveStudy">保存为可关联例句</button><button id="searchCandidates">从后台原典找更多例句</button></div>'+
 '<p id="editError" class="study-caution" hidden></p>'+
 '<div id="studyCandidates"></div>'+
 '<div class="sectionLabel">我的词句积累</div><div id="studySaved"></div>'+
 '<div class="row"><button id="exportStudy">导出词句注释</button><label class="study-import-button">导入注释 JSON <input id="importStudy" type="file" accept=".json,application/json"></label></div></div>';
 $("modalTitle").textContent="补充文言知识";
 $("modalContent").innerHTML=html;
 $("overlay").hidden=false;
 wire();
}
function error(message){const node=$("editError");node.hidden=false;node.textContent=message;}
function wire(){
 $("editWord").onclick=()=>start({...formValues(),name:$("editName").value,kind:"word"});
 $("editGrammar").onclick=()=>start({...formValues(),name:$("editName").value,kind:"grammar"});
 $("saveStudy").onclick=()=>{
 const v=formValues();
 if(!v.term||v.term.length>15||!v.title||!v.original||!v.translation||!v.meaning||!v.variant||!v.usage)
  return error("请填完整词语/句式、篇名、原文、翻译、义项编号、解释和侧重点。");
 if(kind==="word"&&!v.original.includes(v.term))return error("例句原文中没有这个字或词；不能建立错误关联。");
 if(v.original.length>650||v.translation.length>1100)return error("原文请取 650 字以内的句段，翻译不超过 1100 字。");
 if(!urlOK(v.sourceURL))return error("原典链接必须是 HTTPS 地址。");
 const spec=kind==="word"?(data.words[v.term]||={sources:[],examples:[]}):(data.grammar[v.term]||={definition:v.meaning,examples:[]});
 if(kind==="word"){
  const anchor=v.anchor&&v.anchor.includes(v.term)?v.anchor:v.original.includes(v.term)?v.original.slice(Math.max(0,v.original.indexOf(v.term)-6),v.original.indexOf(v.term)+v.term.length+6):v.term;
  const s=[v.title,anchor,v.meaning,v.category||"实词",v.variant,v.usage];
  if(!spec.sources.some(x=>x[0]===s[0]&&x[1]===s[1]&&x[4]===s[4]))spec.sources.push(s);
  const e=[v.title,v.source||"个人校录",v.original,v.translation,v.meaning,v.category||"实词",v.variant,v.usage,v.sourceURL];
  if(!spec.examples.some(x=>x[0]===e[0]&&x[2]===e[2]))spec.examples.push(e);
 }else{
  spec.definition=spec.definition||v.meaning;
  const e=[v.title,v.source||"个人校录",v.original,v.translation,v.variant,v.usage,v.sourceURL];
  if(!spec.examples.some(x=>x[0]===e[0]&&x[2]===e[2]))spec.examples.push(e);
 }
 save(data);
 // Other reader modules rebuild annotations dynamically when user clicks, no reload required.
 const msg=$("editError");msg.hidden=false;msg.className="study-success";msg.textContent="✓ 已保存，现在可以在正文点这个字或句式查看关联。";
 showSaved();
 };
 $("searchCandidates").onclick=search;
 $("exportStudy").onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="文言拾句-自建词句-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 };
 $("importStudy").onchange=async ev=>{
  try{
   const file=ev.target.files?.[0];if(!file||file.size>1500000)throw Error("文件不得大于1.5MB");
   const json=JSON.parse(await file.text());if(json.version!==1||!json.words||!json.grammar)throw Error("不是有效的词句注释文件");
   if(!confirm("导入将覆盖当前自建词义、句式记录，是否继续？"))return;
   localStorage.setItem(KEY,JSON.stringify(json));location.reload();
  }catch(e){error("导入失败："+e.message)}
 };
 showSaved();
}
function showSaved(){
 const root=$("studySaved");
 if(!root)return;
 const items=[...Object.keys(data.words).map(k=>["词",k,data.words[k].examples.length]),...Object.keys(data.grammar).map(k=>["句式",k,data.grammar[k].examples.length])];
 root.innerHTML=items.length?items.map(x=>'<div class="study-saved"><b>'+esc(x[0]+'：'+x[1])+'</b><small>'+x[2]+' 条已翻译关联</small><button data-edit-delete="'+esc(x[0]+'|'+x[1])+'">删除</button></div>').join(""):'<p class="help">尚未录入。新增后可点击关联例句继续深挖。</p>';
 root.querySelectorAll("[data-edit-delete]").forEach(b=>b.onclick=()=>{
  const [type,name]=b.dataset.editDelete.split("|");
  if(!confirm("确定删除"+name+"的所有自建注释？"))return;
  delete (type==="词"?data.words:data.grammar)[name];save(data);showSaved();
 });
}
async function search(){
 const term=$("editName").value.trim();if(!term)return error("请先输入要检索的词或句式名。");
 const target=$("studyCandidates");target.innerHTML='<p class="help">正在检索后台古籍……</p>';
 try{
  const all=await readCatalog(),hits=[],sort={"小学":0,"小学诗文":0,"蒙学经典":1,"初中":1,"高中":2,"古文名篇":2,"古人名言":3,"名言原典":3,"经史名言":3,"史记":4,"汉书":4,"资治通鉴":4,"史籍":4,"二十四史及古籍":5,"世说新语":6,"初中文言拓展":1};
  let count=0,large=[];
  try{large=await readLarge(term,all.manifest);}catch(e){console.warn("large index unavailable:",e.message);}
  for(const r of [...all.entries,...large])if(String(r.text||"").includes(term)){
    count++;
    hits.push({r,score:sort[r.group]??7,text:contextSnippet(r,term)});
  }
  hits.sort((a,b)=>a.score-b.score||a.text.length-b.text.length);
  candidateRecords=hits.slice(0,60).map(x=>x.r);
  target.innerHTML='<div class="sectionLabel">后台原典候选：'+count+' 篇段（显示前 '+candidateRecords.length+' 条）</div>'+
  '<p class="help">以下只有真实原文，未经译注。选中一条后，请自己核对并填写翻译、当前字义和用法，保存后才会加入正式关联结果。</p>'+
  (hits.slice(0,60).map((item,i)=>'<button class="study-candidate" data-candidate="'+i+'"><b>'+esc(item.r.title)+'</b><small>'+esc(item.r.group)+'</small><span>'+esc(item.text)+'</span></button>').join("")||'<p class="help">目前后台库没有命中。你也可以手动输入可靠古文。</p>');
  target.querySelectorAll("[data-candidate]").forEach(b=>b.onclick=()=>{
   const r=candidateRecords[Number(b.dataset.candidate)];
   const selected=hits[Number(b.dataset.candidate)];
   $("editTitle").value=r.work||r.title;
   $("editSource").value=r.title;
   $("editURL").value=r.url;
   $("editOriginal").value=selected.text.replace(/^…|…$/g,'');
   $("editAnchor").value=term;
   $("editTranslation").value="";
   const focus=$("editTranslation");focus.focus();
   $("editError").hidden=false;$("editError").textContent="已填入原典原文：必须自己核对并补译、标注义项后才能保存。";
   $("modalContent").scrollTo({top:0,behavior:"smooth"});
  });
 }catch(e){target.innerHTML='<p class="study-caution">后台索引暂时无法读取：'+esc(e.message)+'。仍可手工录入经校核的古文例句。</p>';}
}
window.WENYAN_STUDY_EDITOR={
 open:start,
 words,patterns,
 data:()=>data,
 indexTerms:()=>[...new Set([...words(),...Object.keys(window.WENYAN_ANNOTATIONS?.words||{})])],
 indexPatterns:()=>[...new Set([...patterns(),...Object.keys(window.WENYAN_ANNOTATIONS?.grammar||{})])],
 lookupWord:name=>data.words[name]||null,
 lookupGrammar:name=>data.grammar[name]||null,
 grammarForText:txt=>patterns().filter(g=>data.grammar[g].examples.some(x=>txt.includes(x[2])||x[2].includes(txt)))
};
})();
