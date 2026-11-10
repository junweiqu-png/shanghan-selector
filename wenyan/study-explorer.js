/* 《文言拾句》关联学习：经过释义标注的原文、翻译、词义/句式差异。 */
(()=>{
"use strict";
const $=id=>document.getElementById(id), DB=window.WENYAN_ANNOTATIONS||{words:{},grammar:{},meta:{groups:{},families:{}}};
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const core=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[])];
const allTerms=[...new Set([...Object.keys(DB.words||{}),...core.flatMap(w=>(w.terms||[]).map(t=>t[0]))])].filter(Boolean).sort((a,b)=>b.length-a.length);
let chain=[],state=null,requestId=0,rawCatalogPromise=null;
const order={"过秦论":1,"烛之武退秦师":2,"唐雎不辱使命":3,"曹刿论战":4,"孙权劝学":5,"爱莲说":6,"陋室铭":7,"卖油翁":8,"狼":9,"记承天寺夜游":10,"咏雪":40,"陈太丘与友期行":41};
const sortEntries=(a,b)=>(order[a.title]||20)-(order[b.title]||20)||a.title.localeCompare(b.title,"zh-CN");
const family=s=>DB.meta?.families?.[s]||s;
function knowTerm(word){return DB.words?.[word]||null;}
function localDefs(term){
 const out=[];for(const w of core){const d=(w.terms||[]).find(t=>t[0]===term);if(d)out.push({w,d})}return out;
}
function activeOrigin(){
 const whole= !$("whole").hidden;
 const title=whole?$("wholeTitle").textContent:$("title").textContent;
 let text=whole?($("wholeBody")?.querySelector(".wholepara:focus-within .wholetext")?.textContent||""):$("sentence").textContent;
 return {title,text};
}
function termOrigin(term,context){
 const spec=knowTerm(term);
 if(context?.annotated&&context.annotatedTerm===term)return {
 title:context.title,text:context.text,term,meaning:context.meaning,pos:context.pos,code:context.code,usage:context.usage,verified:true};
 const title=context?.title||activeOrigin().title,text=context?.text||activeOrigin().text;
 if(spec){
  const candidates=(spec.sources||[]).filter(s=>s[0]===title&&(!s[1]||text.includes(s[1])));
  const hit=candidates.find(s=>{
    if(!Number.isInteger(context?.offset)||!s[1])return false;
    let start=text.indexOf(s[1]);while(start!==-1){if(context.offset>=start&&context.offset+term.length<=start+s[1].length)return true;start=text.indexOf(s[1],start+1);}
    return false;
  })||(Number.isInteger(context?.offset)&&candidates.length>1?null:candidates[0]);
  if(hit)return {title,text,term,meaning:hit[2],pos:hit[3],code:hit[4],usage:hit[5],verified:true};
  const example=(spec.examples||[]).find(x=>x[0]===title&&(text.includes(x[2])||x[2].includes(text)));
  if(example)return {title,text,term,meaning:example[4],pos:example[5],code:example[6],usage:example[7],verified:true};
 }
 const defs=localDefs(term),entry=defs.find(x=>x.w.title===title);
 return {title,text,term,meaning:entry?.d[2]||"当前原文的具体义项尚待校核",pos:entry?.d[1]||"未标注",code:null,usage:"本句目前只有课文释义或尚未完成词义定位，不能用它自动判断其他句子的词义关系。",verified:false};
}
function grammarOrigin(pattern,context){
 const title=context?.title||activeOrigin().title,text=context?.text||activeOrigin().text;
 const a=DB.grammar?.[pattern]?.examples?.find(x=>x[0]===title&&(text.includes(x[2])||x[2].includes(text)));
 return {title,text,term:pattern,meaning:DB.grammar?.[pattern]?.definition||"需结合上下文分析",code:a?.[4]||null,pos:"句式",usage:a?.[5]||"本句的具体结构暂未逐句核注",verified:!!a};
}
function relation(origin,example,grammar=false){
 if(!origin.verified)return {type:"unknown",badge:"待核对",diff:"本句的具体义项或句式功能尚未完成逐句校核，因此不以字形或标签相同推断关系。"};
 const same=origin.code===example.code;
 const near=!same&&(grammar?!/^非/.test(example.code):family(origin.code)===family(example.code));
 const type=same?"same":near?"near":"diff",badge=same?"含义相同":near?"含义相近":"含义不同";
 const name=grammar?"结构":"词义";
 if(same)return {type,badge:grammar?"句式相同":"含义相同",
 diff:grammar?"都属于“"+origin.code+"”这一"+name+"。本文："+origin.usage+"；例句："+example.usage+"。":
 "两处都表示“"+origin.meaning+"”。本文："+origin.usage+"；例句："+example.usage+"。"};
 if(near)return {type,badge:grammar?"句式相近":"含义相近",
 diff:grammar?"都可归入“"+origin.term+"”，但本文采用“"+origin.code+"”，例句采用“"+example.code+"”。本文："+origin.usage+"；例句："+example.usage+"。":
 "两处属于相近的语义范围，但不宜直接互换。本文："+origin.usage+"；例句："+example.usage+"。"};
 return {type,badge:grammar?"句式不同":"含义不同",
 diff:"本文“"+origin.term+"”是"+origin.pos+"，表示“"+origin.meaning+"”，主要用于"+origin.usage+"；例句中是"+example.pos+"，表示“"+example.meaning+"”，主要用于"+example.usage+"。"};
}
function tokens(sentence,selected,contextId,grammar=false){
 const s=String(sentence||"");let out="",i=0;
 while(i<s.length){
  const t=allTerms.find(word=>s.startsWith(word,i));
  if(t){
    const highlighted=t===selected?" hit-word":"";
    out+='<button class="study-token'+highlighted+'" type="button" data-study-word="'+esc(t)+'" data-study-offset="'+i+'" data-study-context="'+esc(contextId||"")+'" aria-label="查询“'+esc(t)+'”的不同古文用法">'+esc(t)+'</button>';i+=t.length;
  }else {out+=esc(s[i]);i++;}
 }
 if(selected&&!s.includes(selected))return esc(s);
 return out;
}
function sourceLink(url){
 return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">核对原典 ↗</a>':"";
}
function open(title,html){
 $("modalTitle").textContent=title;$("modalContent").innerHTML=html;$("overlay").hidden=false;
 $("modalContent").scrollTop=0;
}
function wrapHeader(){
 return chain.length?'<div class="study-toolbar"><button type="button" data-study-back>← 返回上一层</button><span>已深入 '+chain.length+' 层</span></div>':"";
}
function baseHeader(origin,isGrammar){
 return '<section class="study-origin"><small>从这里开始</small><h3>'+esc(origin.title||"当前古文")+' · <em>'+esc(origin.term)+'</em></h3>'+
 (origin.text?'<p class="study-original">'+tokens(origin.text,origin.term,"source")+'</p>':'')+
 '<p><b>'+(isGrammar?"本句结构：":"本文含义：")+'</b>'+esc(origin.meaning)+'</p>'+
 (isGrammar?"":'<p><b>词性／作用：</b>'+esc(origin.pos)+'</p>')+
 '<p class="study-usage">'+esc(origin.usage)+'</p>'+
 (!origin.verified?'<p class="study-caution">本句尚无经过核对的具体义项；请注意下方译文与义项是独立校核的，不能据此给本句做同义判定。</p>':"")+'</section>';
}
function rowCard(row,index,origin,isGrammar){
 const meta=row.record,rel=relation(origin,meta,isGrammar);
 const contextId='r'+index;
 let meaningCompare=isGrammar?
 '<p class="study-sense"><b>此句结构：</b>'+esc(meta.code)+'；'+esc(meta.usage)+'</p>':
 '<p class="study-sense"><b>这里“'+esc(origin.term)+'”的意思：</b>'+esc(meta.meaning)+' <span>（'+esc(meta.pos)+'）</span></p>';
 return '<article class="study-example"><div class="study-example-top"><b>'+esc(meta.title)+'</b><small>'+esc(meta.source)+'</small></div>'+
 '<p class="study-original">'+tokens(meta.text,isGrammar?"":origin.term,contextId,isGrammar)+'</p>'+
 '<p class="study-translation"><strong>翻译：</strong>'+esc(meta.translation)+'</p>'+
 meaningCompare+
 '<div class="study-compare '+rel.type+'"><b>'+(rel.type==="same"?"🟢":rel.type==="near"?"🟡":rel.type==="diff"?"🔴":"⚪")+' '+rel.badge+'</b>'+
 (origin.verified?'<div class="study-double"><span>本句：'+esc(origin.meaning)+'</span><span>此处：'+esc(meta.meaning)+'</span></div>':"")+
 '<p>'+esc(rel.diff)+'</p></div>'+
 '<div class="study-actions">'+sourceLink(meta.url||"")+'<button type="button" data-study-add="'+contextId+'">＋ 加为背诵卡</button>'+(row.grammars||[]).map(g=>'<button type="button" data-study-grammar="'+esc(g)+'" data-study-context="'+contextId+'">学习“'+esc(g)+'”句式 ↗</button>').join("")+'</div></article>';
}
function enrichGrammars(record){
 const rows=[];for(const [name,spec] of Object.entries(DB.grammar||{})){
  if(spec.examples?.some(x=>x[0]===record.title&&(x[2]===record.text||record.text.includes(x[2])||x[2].includes(record.text))))rows.push(name);
 }
 return rows.slice(0,2);
}
function createWordRows(term){
 const spec=knowTerm(term);
 if(!spec)return [];
 return (spec.examples||[]).filter(x=>x[2]&&x[3]&&x[4]&&x[5]&&x[6]).map(x=>({
 title:x[0],record:{title:x[0],source:x[1],text:x[2],translation:x[3],meaning:x[4],pos:x[5],code:x[6],usage:x[7],url:x[8]||""}
 })).map(x=>({...x,grammars:enrichGrammars(x.record)})).sort((a,b)=>{
   if(term==="因"){
     const popular=["因利乘便","因人之力而敝之","安陵君因使唐雎","因遗策","因河为池"];
     const rank=x=>{const i=popular.findIndex(t=>x.record.text.includes(t));return i<0?100:i;};
     if(rank(a)!==rank(b))return rank(a)-rank(b);
   }
   return sortEntries(a,b);
 });
}
function createGrammarRows(name){
 return (DB.grammar?.[name]?.examples||[]).filter(x=>x[2]&&x[3]&&x[4]&&x[5]).map(x=>({
 title:x[0],record:{title:x[0],source:x[1],text:x[2],translation:x[3],meaning:DB.grammar?.[name]?.definition||name,pos:"句式",code:x[4],usage:x[5],url:x[6]||""}
 })).sort(sortEntries);
}
function renderPage(term,isGrammar,origin,push=true){
 if(push&&state)chain.push(state);
 state={term,isGrammar,origin};requestId++;
 const rows=isGrammar?createGrammarRows(term):createWordRows(term);
 // Avoid repeating the same selected passage.
 const filtered=rows.filter(x=>!(x.record.title===origin.title&&origin.text&&origin.text.includes(x.record.text)));
 const specs=isGrammar?null:knowTerm(term);
 const subtitle=isGrammar?'句式对比：':'古文词义对比：';
 const groups=specs?[...new Map(specs.examples.map(x=>[x[6],x[4]])).entries()].map(([key,val])=>esc(val)).filter((x,i,a)=>a.indexOf(x)===i):[];
 let html=wrapHeader()+baseHeader(origin,isGrammar)+
 '<div class="study-sectionhead"><b>'+subtitle+esc(term)+'</b><small>'+filtered.length+' 条已配译文与释义</small></div>'+
 (groups.length>1?'<p class="study-glosses">本字常见义项：'+groups.join(" · ")+'</p>':"")+
 '<p class="study-help">优先显示初高中常见篇目，再显示《世说新语》及其他古文。每条都含现代汉语翻译；相同、相近、不同仅在原句义项经过核对时判定。</p>'+
 (filtered.length?filtered.map((r,i)=>rowCard(r,i,origin,isGrammar)).join(""):'<p class="study-caution">这个词或句式暂未整理足够的逐句译注。为了避免误教，不会把仅含相同字形的原文当作已经解释清楚的例句。</p>')+
 '<div class="study-corpus"><b>更多原典正在校核</b><p id="rawCount">正在统计《世说新语》36门及初中文言原文中的候选片段……</p>'+
 '<p>原典词形命中并不能证明含义或句式相同。尚无可靠译文、释义对比的片段暂不作为学习例句展示。</p>'+
 '<a href="https://zh.wikisource.org/wiki/世說新語" target="_blank" rel="noopener noreferrer">核对《世说新语》原典 ↗</a></div>';
 open(subtitle+term,html);
 state.rows=filtered;
 // Click-to-learn contexts support unlimited drill-down.
 state.contexts=new Map(filtered.map((r,i)=>['r'+i,{title:r.record.title,text:r.record.text,annotated:true,annotatedTerm:isGrammar?null:term,
 meaning:r.record.meaning,pos:r.record.pos,code:r.record.code,usage:r.record.usage}]));
 state.contexts.set("source",{title:origin.title,text:origin.text,annotated:true,annotatedTerm:isGrammar?null:term,
 meaning:origin.meaning,pos:origin.pos,code:origin.code,usage:origin.usage});
 const id=requestId;
 if(!rawCatalogPromise)rawCatalogPromise=fetch('evidence/catalog.json?v=20261110b',{cache:"force-cache"}).then(r=>r.ok?r.json():null).catch(()=>null);
 rawCatalogPromise.then(d=>{
  if(id!==requestId||!$("rawCount"))return;
  if(!d||!Array.isArray(d.entries)){$("rawCount").textContent="大型古籍原典索引暂不可用；已整理的译注例句仍可正常使用。";return;}
  let count=0;
  for(const ent of d.entries){const text=ent.text||"";if(isGrammar){
   // Grammar retrieval cannot be proven by plain text; report corpus size rather than misleading hit count.
   continue;
  }else if(text.includes(term))count++;}
  $("rawCount").textContent=isGrammar?
    "已接入《世说新语》"+(d.info?.ssCount||"千余")+"则和初中原典"+(d.info?.juniorCount||"若干")+"篇（句式仍需人工分析）。":
    "还发现 "+count+" 个古籍篇段含“"+term+"”字形，尚需逐条核对读音、词义、翻译及上下文。";
 });
}

function addTranslatedCard(key){
 const entry=state?.contexts?.get(key),row=state?.rows?.find((_,i)=>'r'+i===key);
 if(!entry||!row)return;
 const e=row.record;
 let value={};try{value=JSON.parse(localStorage.getItem('wenyan-recall-v1')||'{}')||{}}catch{}
 if(!Array.isArray(value.custom))value.custom=[];
 if(value.custom.some(w=>w.lines?.some(l=>l[0]===e.text)&&w.source===e.source)){
  alert("这条有翻译的古文已加入背诵卡。");return;
 }
 value.custom.push({title:e.title+"·关联精读",source:e.source,sourceUrl:e.url||"",level:"关联学习",lines:[[e.text,e.translation,""]],terms:[],ruby:{},hint:"来自已整理的逐句原典比较"});
 localStorage.setItem("wenyan-recall-v1",JSON.stringify(value));
 alert("已加入背诵卡（含原文和翻译）。下次打开篇目列表即可查看；页面会更新新增篇目。");
 location.reload();
}
function openWord(word,context){renderPage(word,false,termOrigin(word,context));}
function openGrammar(gram,context){renderPage(gram,true,grammarOrigin(gram,context));}
function navigateBack(){
 if(!chain.length){$("close").click();return;}
 const previous=chain.pop();renderPage(previous.term,previous.isGrammar,previous.origin,false);
}
document.addEventListener('click',e=>{
 const add=e.target.closest?.('[data-study-add]');
 if(add){e.preventDefault();e.stopImmediatePropagation();addTranslatedCard(add.dataset.studyAdd);return;}
 const back=e.target.closest?.('[data-study-back]');
 if(back){e.preventDefault();e.stopImmediatePropagation();navigateBack();return;}
 const t=e.target.closest?.('[data-study-word],[data-term]'),
       g=e.target.closest?.('[data-study-grammar],[data-pattern],[data-p]');
 if(!t&&!g)return;
 // Keep existing reader navigation and remote source links unaffected.
 const name=t?(t.dataset.studyWord||t.dataset.term):(g.dataset.studyGrammar||g.dataset.pattern||g.dataset.p);
 if(!name)return;
 const which=t||g, contextId=which.dataset.studyContext;
 let context=contextId&&state?.contexts?.get(contextId);
 if(t){
  if(context)context={...context,offset:Number.isFinite(Number(which.dataset.studyOffset))?Number(which.dataset.studyOffset):null};
  else {
   const wholeNode=which.closest('.wholepara');
   const container=wholeNode?.querySelector('.wholetext')||(which.closest('#sentence')?$('sentence'):null);
   if(container){
    const text=container.textContent||"";
    const title=wholeNode?$('wholeTitle').textContent:$('title').textContent;
    const same=[...container.querySelectorAll('[data-term]')].filter(n=>n.dataset.term===name);
    const n=Math.max(0,same.indexOf(which));
    let start=-1;for(let i=0;i<=n;i++)start=text.indexOf(name,start+1);
    context={title,text,offset:start>=0?start:null};
   }
  }
 }
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 if(t)openWord(name,context);else openGrammar(name,context);
},true);
window.WENYAN_STUDY_DEBUG={terms:()=>Object.keys(DB.words||{}),patterns:()=>Object.keys(DB.grammar||{}),getState:()=>state&&({term:state.term,count:state.rows?.length,origin:state.origin})};
})();
