/* 《文言拾句》关联学习：经过释义标注的原文、翻译、词义/句式差异。 */
(()=>{
"use strict";
const $=id=>document.getElementById(id), DB=window.WENYAN_ANNOTATIONS||{words:{},grammar:{},meta:{groups:{},families:{}}};
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const core=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[])];
const allTerms=Object.keys(DB.words||{}).filter(Boolean).sort((a,b)=>b.length-a.length);
let chain=[],state=null;
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
 if(!origin.verified)return {type:"unknown",badge:"待核对",diff:"本句的义项还未校定。"};
 const same=origin.code===example.code;
 const near=!same&&(grammar?true:family(origin.code)===family(example.code));
 const type=same?"same":near?"near":"diff",badge=
 (grammar?(same?"句式相同":near?"句式相近":"句式不同"):
 same?"含义相同":near?"含义相近":"含义不同");
 const subject=grammar?"句式":"用法";
 const diff=same?"都采用这一"+subject+"；本文："+origin.usage+"；此句："+example.usage+"。":
 near?"本文侧重"+origin.usage+"；此句侧重"+example.usage+"。":
 "本文"+origin.usage+"；此处"+example.usage+"。"+(origin.pos!==example.pos?"（词性："+origin.pos+" → "+example.pos+"）":"");
 return {type,badge,diff};
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
function displayTitle(name){
 const title=String(name||"").replace(/^《|》$/g,"");
 return "《"+esc(title)+"》";
}
function sourceLink(url){
 return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">核对原典 ↗</a>':"";
}
function open(title,html){
 $("modalTitle").textContent=title;$("modalContent").innerHTML=html;$("overlay").hidden=false;
 $("modalContent").scrollTop=0;
}
function wrapHeader(){
 return chain.length?'<div class="study-toolbar"><button type="button" data-study-back>← 返回</button></div>':"";
}
function baseHeader(origin,isGrammar){
 return '<section class="study-origin">'+
 '<h3><em>'+esc(origin.term)+'</em><span>'+displayTitle(origin.title||"当前古文")+'</span></h3>'+
 (origin.text?'<p class="study-original">'+tokens(origin.text,origin.term,"source")+'</p>':'')+
 '<p class="study-origin-meaning"><b>'+(isGrammar?"本句句式：":"本文“"+esc(origin.term)+"”：")+'</b>'+esc(origin.meaning)+
 (isGrammar?"":'<small>'+esc(origin.pos)+'</small>')+'</p></section>';
}
function rowCard(row,index,origin,isGrammar){
 const meta=row.record,rel=relation(origin,meta,isGrammar),contextId="r"+index;
 const title=displayTitle(meta.title),source=esc(meta.source||"");
 const desc=isGrammar?'<b>句式：</b>'+esc(meta.code):'<b>'+esc(origin.term)+'：</b>'+esc(meta.meaning);
 const comparison=origin.verified?'<div class="study-compare '+rel.type+'"><b>'+
 (rel.type==="same"?"🟢":rel.type==="near"?"🟡":rel.type==="diff"?"🔴":"⚪")+' '+rel.badge+'</b>'+
 '<p><span class="study-compare-meanings">'+esc(origin.meaning)+' → '+esc(meta.meaning)+'</span> · '+esc(rel.diff)+'</p></div>':
 '<div class="study-compare unknown"><b>⚪ 待核对</b><p>本句具体义项暂未核定，不推测异同。</p></div>';
 return '<article class="study-example">'+
 '<h4 class="study-example-top">'+title+(source?'<small> · '+source+'</small>':'')+'</h4>'+
 '<p class="study-original">'+tokens(meta.text,isGrammar?"":origin.term,contextId,isGrammar)+'</p>'+
 '<p class="study-translation">'+esc(meta.translation)+'</p>'+
 '<p class="study-sense">'+desc+(isGrammar?'':'<small> · '+esc(meta.pos)+'</small>')+'</p>'+
 comparison+
 '<div class="study-actions">'+sourceLink(meta.url||"")+
 '<button type="button" data-study-add="'+contextId+'">加入背诵 ↗</button>'+
 (row.grammars||[]).map(g=>'<button type="button" data-study-grammar="'+esc(g)+'" data-study-context="'+contextId+'">'+esc(g)+' ↗</button>').join("")+
 '</div></article>';
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
 state={term,isGrammar,origin};
 const originalRows=isGrammar?createGrammarRows(term):createWordRows(term);
 // No source passage in results, no two hits for the same sense from the same work.
 const seen=new Set(),filtered=[];
 for(const row of originalRows){
  const r=row.record;
  if(r.title===origin.title)continue;
  const key=r.title+"|"+r.code;
  if(seen.has(key))continue;seen.add(key);filtered.push(row);
 }
 const html=wrapHeader()+baseHeader(origin,isGrammar)+
 '<div class="study-sectionhead"><b>关联古文</b></div>'+
 (filtered.length?filtered.map((r,i)=>rowCard(r,i,origin,isGrammar)).join(""):
 '<p class="study-empty">暂无有译文和词义对比的其他古文。</p>');
 open((isGrammar?"句式：":"词义：")+term,html);
 state.rows=filtered;
 state.contexts=new Map(filtered.map((r,i)=>["r"+i,{title:r.record.title,text:r.record.text,annotated:true,annotatedTerm:isGrammar?null:term,
 meaning:r.record.meaning,pos:r.record.pos,code:r.record.code,usage:r.record.usage}]));
 state.contexts.set("source",{title:origin.title,text:origin.text,annotated:true,annotatedTerm:isGrammar?null:term,
 meaning:origin.meaning,pos:origin.pos,code:origin.code,usage:origin.usage});
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
document.getElementById("close")?.addEventListener("click",()=>{chain=[];state=null;});
document.getElementById("overlay")?.addEventListener("click",e=>{if(e.target.id==="overlay"){chain=[];state=null;}});
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
