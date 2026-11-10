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
  const resp=await fetch("evidence/expanded-manifest.json?v=20261111termindex1",{cache:"default"});
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
async function fetchClassicsIndex(url){
 const r=await fetch(url,{cache:"default"});
 if(!r.ok)throw Error("经史索引 HTTP "+r.status);
 const bytes=new Uint8Array(await r.arrayBuffer());
 let raw;
 if(bytes[0]===0x1f&&bytes[1]===0x8b){
  if(typeof DecompressionStream==="undefined")throw Error("当前浏览器不支持压缩古籍索引，仍可使用教材与世说新语候选");
  raw=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
 }else raw=new TextDecoder().decode(bytes);
 return JSON.parse(raw);
}
function stableHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
async function readLarge(term,manifest){
 if(!manifest?.large?.available||!term)return [];
 if(manifest.large.termIndexShards){
  const shard=(stableHash(term)%manifest.large.termIndexShards).toString().padStart(2,'0'),cacheKey='term:'+shard;
  if(!largeCache[cacheKey]){
   const ext=manifest.large.termIndexEncoding==="gzip"?".json.gz":".json";
   largeCache[cacheKey]=fetchClassicsIndex('evidence/large-term-index/'+shard+ext).catch(e=>{delete largeCache[cacheKey];throw e});
  }
  const indexed=await largeCache[cacheKey],rows=indexed[term]||[];
  if(rows.length)return rows.map(r=>({id:r.id,group:r.group,title:r.title||r.source+'·'+r.chapter,work:r.source+'·'+r.chapter,
   text:r.text,matched:r.matched||term,url:r.url||'https://github.com/gujilab/chinese-classical-corpus',originId:r.id}));
 }
 // 自建词或尚未收录的词仍可退回单字候选索引。
 const ch=[...term][0],index=ch.codePointAt(0)%64,key=index.toString().padStart(2,'0');
 if(!largeCache[key]){
  const ext=manifest.large.indexEncoding==="gzip"?".json.gz":".json";
  largeCache[key]=fetchClassicsIndex('evidence/large-index/'+key+ext).catch(e=>{delete largeCache[key];throw e});
 }
 const data=await largeCache[key];
 return (data[ch]||[]).filter(r=>r.text?.includes(term)).map(r=>({
  id:r.id,group:r.group,title:r.source+'·'+r.chapter,work:r.source+'·'+r.chapter,
  text:r.text,matched:term,url:'https://github.com/gujilab/chinese-classical-corpus',originId:r.id
 }));
}
function contextSnippet(r,term){
 const text=String(r.text||"").replace(/\s+/g,' '),matched=r.matched||term,pos=text.indexOf(matched);
 if(pos<0)return "";
 const before=text.slice(Math.max(0,pos-105),pos),after=text.slice(pos+matched.length,Math.min(text.length,pos+matched.length+145));
 // Extend one sentence before/after, truncated only in editor candidates.
 return (pos>105?"…":"")+before+matched+after+(pos+matched.length+145<text.length?"…":"");
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
 '<label>后台搜索关键词（句式可填典型原句）</label><input id="editQuery" placeholder="例：期、何陋之有、非……无以……" value="'+esc(kind==="word"?ctx.name||"":"" )+'">'+
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
 if(kind==="word"&&!v.original.includes(v.term)&&!(v.anchor&&v.original.includes(v.anchor)))return error("例句原文中没有这个字或词的原字形；不能建立错误关联。");
 if(v.original.length>650||v.translation.length>1100)return error("原文请取 650 字以内的句段，翻译不超过 1100 字。");
 if(!urlOK(v.sourceURL))return error("原典链接必须是 HTTPS 地址。");
 const spec=kind==="word"?(data.words[v.term]||={sources:[],examples:[]}):(data.grammar[v.term]||={definition:v.meaning,examples:[]});
 if(kind==="word"){
  const anchor=v.anchor&&v.original.includes(v.anchor)?v.anchor:v.original.includes(v.term)?v.original.slice(Math.max(0,v.original.indexOf(v.term)-6),v.original.indexOf(v.term)+v.term.length+6):(v.anchor||v.term);
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
 const term=($("editQuery")?.value.trim()||$("editName").value.trim()).replace(/[⋯…]/g,'');
 if(!term)return error("请输入要在原文中查找的字或句子，句式可输入典型古文原句。");
 const target=$("studyCandidates");target.innerHTML='<p class="help">正在检索后台古籍……</p>';
 try{
  const all=await readCatalog(),hits=[],scores={"小学":0,"小学诗文":0,"蒙学经典":1,"初中":1,"高中":2,"古文名篇":2,"古人名言":3,"名言原典":3,"经史名言":3,"史记":4,"汉书":4,"资治通鉴":4,"史籍":4,"二十四史及古籍":5,"世说新语":6,"初中文言拓展":1};
  let large=[];
  try{large=await readLarge(term,all.manifest);}catch(e){console.warn("background index:",e.message);}
  for(const r of [...all.entries,...large])if(String(r.text||"").includes(r.matched||term)){
    hits.push({r,score:scores[r.group]??7,text:contextSnippet(r,term)});
  }
  hits.sort((a,b)=>a.score-b.score||a.text.length-b.text.length);
  const sections=[
    {label:"小学",groups:["小学","小学诗文","蒙学经典"]},
    {label:"初中",groups:["初中","初中文言拓展"]},
    {label:"高中",groups:["高中","古文名篇"]},
    {label:"名言",groups:["名言原典","古人名言","经史名言"]},
    {label:"史记",groups:["史记"]},
    {label:"资治通鉴",groups:["资治通鉴"]},
    {label:"世说新语",groups:["世说新语"]},
    {label:"其他古籍",groups:["汉书","史籍","二十四史及古籍"]}
  ];
  function groupOf(hit){return sections.find(s=>s.groups.includes(hit.r.group))?.label||"其他古籍";}
  function balance(){
    const grouped=sections.map(s=>hits.filter(h=>groupOf(h)===s.label));
    const out=[],keys=new Set();let cursor=0;
    while(out.length<Math.min(hits.length,60)&&cursor<60){
      for(const group of grouped){
        const row=group[cursor];
        if(row&&!keys.has(row.r.id+"|"+row.r.url)){out.push(row);keys.add(row.r.id+"|"+row.r.url)}
      }
      cursor++;
    }
    return out.slice(0,60);
  }
  let filter="全部",visible=balance(),offset=0;
  function draw(){
    const chosen=filter==="全部"?visible:hits.filter(h=>groupOf(h)===filter);
    const page=chosen.slice(0,offset+40);
    candidateRecords=page.map(h=>h.r);
    target.innerHTML='<div class="sectionLabel">后台真实原典 '+hits.length+' 条 · 已列 '+page.length+' 条</div>'+
    '<p class="help">未经译注的原文只供教师选取。必须核对并补上句意、词义或句式说明，才会进入孩子的关联页面。</p>'+
    '<div class="study-source-filters">'+
    ["全部",...sections.map(s=>s.label)].map(g=>'<button type="button" class="'+(filter===g?'active':'')+'" data-source="'+esc(g)+'">'+esc(g)+'（'+(g==="全部"?hits.length:hits.filter(h=>groupOf(h)===g).length)+'）</button>').join('')+
    '</div>'+
    (page.map((item,i)=>'<button class="study-candidate" data-candidate="'+i+'"><b>'+esc(item.r.title)+'</b><small>'+esc(item.r.group)+'</small><span>'+(window.WENYAN_PINYIN?.annotate(item.text)||esc(item.text))+'</span></button>').join("")||'<p class="help">此分类暂无候选原文，可切换其他类别。</p>')+
    (chosen.length>page.length?'<button id="nextTeacherPage">查看更多（已显示 '+page.length+'/'+chosen.length+'）</button>':'');
    target.querySelectorAll("[data-source]").forEach(b=>b.onclick=()=>{filter=b.dataset.source;offset=0;draw()});
    target.querySelectorAll("[data-candidate]").forEach(b=>b.onclick=()=>{
      const idx=Number(b.dataset.candidate),r=candidateRecords[idx],item=page[idx];if(!r)return;
      $("editTitle").value=r.work||r.title;
      $("editSource").value=r.title;
      $("editURL").value=r.url;
      $("editOriginal").value=item.text.replace(/^…|…$/g,'');
      $("editAnchor").value=kind==="word"?(r.matched||$("editName").value.trim()):term;
      $("editTranslation").value="";
      $("editError").hidden=false;$("editError").textContent="已选择原文。须核对并填写译文及此处义项，才可加入正式关联。";
      $("editTranslation").focus();$("modalContent").scrollTo({top:0,behavior:"smooth"});
    });
    const more=$("nextTeacherPage");if(more)more.onclick=()=>{offset+=40;draw()};
  }
  draw();
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
