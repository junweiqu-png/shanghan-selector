/* 《文言拾句》关联学习：经过释义标注的原文、翻译、字义/句式差异。 */
(()=>{
"use strict";
const $=id=>document.getElementById(id), DB=window.WENYAN_ANNOTATIONS||{words:{},grammar:{},meta:{groups:{},families:{}}};
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const core=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[]),...(window.WENYAN_DATA_4||[])];
const rawTerms=()=>[...new Set([...Object.keys(DB.words||{}),...Object.keys(window.WENYAN_CROSSLESSON?.words||{}),...Object.keys(window.WENYAN_VERIFIED_EXTRA?.words||{}),...Object.keys(window.WENYAN_VERIFIED_MORE2?.words||{}),...Object.keys(window.WENYAN_VERIFIED_COMMON3?.words||{}),...Object.keys(window.WENYAN_VERIFIED_CORPUS?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH4?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH5?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH6?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH7?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH8?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH9?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH10?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH11?.words||{}),...Object.keys(window.WENYAN_VERIFIED_BATCH12?.words||{}),...Object.keys(window.WENYAN_LESSON_CHARACTER_GLOSSES?.words||{}),...core.flatMap(w=>(w.lines||[]).map(line=>line[0])),...core.flatMap(w=>(w.terms||[]).map(t=>t[0])),...(window.WENYAN_STUDY_EDITOR?.words()||[])])].filter(Boolean);
const allTerms=()=>[...new Set(rawTerms().flatMap(t=>[...String(t)].filter(c=>/\p{Script=Han}/u.test(c))))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
let chain=[],state=null;
const order={"过秦论":1,"烛之武退秦师":2,"唐雎不辱使命":3,"曹刿论战":4,"孙权劝学":5,"爱莲说":6,"陋室铭":7,"卖油翁":8,"狼":9,"记承天寺夜游":10,"咏雪":40,"陈太丘与友期行":41};
const sortEntries=(a,b)=>(order[a.title]||20)-(order[b.title]||20)||a.title.localeCompare(b.title,"zh-CN");
const family=s=>DB.meta?.families?.[s]||s;
const normalizeSense=s=>({look:"turn-look",lookback:"turn-look"}[s]||s);
function knowTerm(word){
 const builtin=DB.words?.[word],junior=window.WENYAN_JUNIOR_GLOSSES?.words?.[word],cross=window.WENYAN_CROSSLESSON?.words?.[word],verified=window.WENYAN_VERIFIED_EXTRA?.words?.[word],more=window.WENYAN_VERIFIED_MORE2?.words?.[word],common=window.WENYAN_VERIFIED_COMMON3?.words?.[word],corpus=window.WENYAN_VERIFIED_CORPUS?.words?.[word],batch=window.WENYAN_VERIFIED_BATCH4?.words?.[word],batch5=window.WENYAN_VERIFIED_BATCH5?.words?.[word],batch6=window.WENYAN_VERIFIED_BATCH6?.words?.[word],batch7=window.WENYAN_VERIFIED_BATCH7?.words?.[word],batch8=window.WENYAN_VERIFIED_BATCH8?.words?.[word],batch9=window.WENYAN_VERIFIED_BATCH9?.words?.[word],batch10=window.WENYAN_VERIFIED_BATCH10?.words?.[word],batch11=window.WENYAN_VERIFIED_BATCH11?.words?.[word],batch12=window.WENYAN_VERIFIED_BATCH12?.words?.[word],lesson=window.WENYAN_LESSON_CHARACTER_GLOSSES?.words?.[word],characters=window.WENYAN_VERIFIED_CHARACTERS?.words?.[word],personal=window.WENYAN_STUDY_EDITOR?.lookupWord(word);
 if(!builtin&&!junior&&!cross&&!verified&&!more&&!common&&!corpus&&!batch&&!batch5&&!batch6&&!batch7&&!batch8&&!batch9&&!batch10&&!batch11&&!batch12&&!lesson&&!characters&&!personal)return null;
 return {sources:[...(personal?.sources||[]),...(batch12?.sources||[]),...(lesson?.sources||[]),...(batch11?.sources||[]),...(batch10?.sources||[]),...(batch9?.sources||[]),...(batch8?.sources||[]),...(builtin?.sources||[]),...(junior?.sources||[]),...(verified?.sources||[]),...(more?.sources||[]),...(common?.sources||[]),...(corpus?.sources||[]),...(batch?.sources||[]),...(batch5?.sources||[]),...(batch6?.sources||[]),...(batch7?.sources||[]),...(characters?.sources||[]),...(cross?.sources||[])],
 examples:[...(personal?.examples||[]),...(batch12?.examples||[]),...(lesson?.examples||[]),...(batch11?.examples||[]),...(batch10?.examples||[]),...(batch9?.examples||[]),...(batch8?.examples||[]),...(builtin?.examples||[]),...(junior?.examples||[]),...(verified?.examples||[]),...(more?.examples||[]),...(common?.examples||[]),...(corpus?.examples||[]),...(batch?.examples||[]),...(batch5?.examples||[]),...(batch6?.examples||[]),...(batch7?.examples||[]),...(characters?.examples||[]),...(cross?.examples||[])]};
}
function grammarSpec(name){
 const built=DB.grammar?.[name]||null,added=window.WENYAN_GRAMMAR_MORE?.grammar?.[name]||null,
  personal=window.WENYAN_STUDY_EDITOR?.lookupGrammar(name),guide=window.WENYAN_JUNIOR_GUIDE?.items?.[name]||null;
 if(!built&&!added&&!personal&&!guide)return null;
 const work=guide&&core.find(w=>w.title===guide.work);
 const original=guide&&work?.lines.find(x=>x[0].includes(guide.example));
 const annotated=original?[[work.title,work.source,original[0],original[1],"课堂观察："+name,guide.clue,work.sourceUrl||""]]:[];
 return {definition:personal?.definition||built?.definition||added?.definition||guide?.clue||"当前语境需辨析",
  examples:[...(personal?.examples||[]),...(built?.examples||[]),...(added?.examples||[]),...annotated],
  guide};
}
function grammarNames(){
 return [...new Set([...Object.keys(DB.grammar||{}),...Object.keys(window.WENYAN_GRAMMAR_MORE?.grammar||{}),
 ...Object.keys(window.WENYAN_JUNIOR_GUIDE?.items||{}),...(window.WENYAN_STUDY_EDITOR?.patterns()||[])])];
}
function discoveryGuide(name){
 const g=grammarSpec(name)?.guide;
 if(!g)return "";
 return '<section class="study-grammar-guide"><b>🔍 三步看懂 · '+esc(name)+'</b>'+
 '<p>'+esc(g.clue)+'</p>'+
 '<details><summary>展开：怎样从原句发现这种句式？</summary>'+
 '<ol>'+g.steps.map(step=>'<li>'+esc(step)+'</li>').join("")+'</ol>'+
 '<p class="study-guide-warning">⚠ '+esc(g.trap)+'</p>'+
 '<blockquote>'+esc(g.example)+'</blockquote>'+
 '<p><b>试一试：</b>'+esc(g.question)+'</p>'+
 g.options.map((opt,i)=>'<button type="button" class="study-guide-choice" data-guide-option="'+i+'">'+esc(opt)+'</button>').join("")+
 '<div class="study-guide-feedback" aria-live="polite"></div></details></section>';
}

function localDefs(term){
 const out=[];for(const w of core){
  const d=(w.terms||[]).find(t=>t[0]===term)||(w.terms||[]).find(t=>t[0]?.includes(term));
  if(d)out.push({w,d,compound:d[0]!==term});
 }return out;
}
function activeOrigin(){
 const whole= !$("whole").hidden;
 const title=whole?$("wholeTitle").textContent:$("title").textContent;
 let text=whole?($("wholeBody")?.querySelector(".wholepara:focus-within .wholetext")?.dataset.plain||""):$("sentence").dataset.plain||$("sentence").textContent;
 return {title,text};
}
function indexOrigin(term){
 // “积累”的字表不指向当前阅读进度：必须从真正含该字的原句取得语境。
 let personal=[];
 try{const s=JSON.parse(localStorage.getItem("wenyan-recall-v1")||"{}");if(Array.isArray(s.custom))personal=s.custom}catch{}
 const spec=knowTerm(term),results=[];
 for(const [wi,w] of [...core,...personal].entries()){
  for(const [li,row] of (w.lines||[]).entries()){
   const text=String(row?.[0]||"");if(!text.includes(term))continue;
   const source=(spec?.sources||[]).find(s=>s[0]===w.title&&s[1]&&s[1].includes(term)&&text.includes(s[1]));
   const index=source?text.indexOf(source[1])+source[1].indexOf(term):text.indexOf(term);
   // 优先人工标注原句，其次课本自带单字释义，再其次普通正文命中。
   const hasDefinition=(w.terms||[]).some(t=>t[0]===term);
   results.push({title:w.title,text,offset:index,score:source?0:hasDefinition?1:2,wi,li});
  }
 }
 results.sort((a,b)=>a.score-b.score||a.wi-b.wi||a.li-b.li);
 if(results.length){const {title,text,offset}=results[0];return {title,text,offset};}
 // 某些扩展字词只在有译文的精选材料里出现，也必须以真实例句定位。
 const source=(spec?.examples||[]).find(x=>x[2]?.includes(term)&&x[3]);
 return source?{title:source[0],text:source[2],offset:source[2].indexOf(term)}:null;
}
function termOrigin(term,context){
 const spec=knowTerm(term);
 if(context?.annotated&&context.annotatedTerm===term)return {
 title:context.title,text:context.text,term,meaning:context.meaning,pos:context.pos,code:context.code,usage:context.usage,verified:true};
 const title=context?.title||activeOrigin().title,text=context?.text||activeOrigin().text;
 // 任何入口都不能把不含该字的当前句当成“原字原文”。
 if(!text.includes(term))return {title:"单字索引",text:"",term,meaning:"尚未定位到含此字的原句",pos:"",code:null,usage:"请选择或录入包含此字的古文及准确译文。",verified:false};
 if(spec){
  const candidates=(spec.sources||[]).filter(s=>s[0]===title&&(!s[1]||text.includes(s[1])));
  const hit=candidates.find(s=>{
    if(!Number.isInteger(context?.offset)||!s[1])return false;
    let start=text.indexOf(s[1]);while(start!==-1){if(context.offset>=start&&context.offset+term.length<=start+s[1].length)return true;start=text.indexOf(s[1],start+1);}
    return false;
  })||(Number.isInteger(context?.offset)&&context.offset>=0?null:candidates[0]);
  if(hit)return {title,text,term,meaning:hit[2],pos:hit[3],code:hit[4],usage:hit[5],verified:true};
  const occurrenceCount=text.split(term).length-1;
  // 同一原句中多次出现同字，不能借其他位置的例句标注猜当前字义。
  if(occurrenceCount===1){
   const example=(spec.examples||[]).find(x=>x[0]===title&&x[2]?.includes(term)&&(text.includes(x[2])||x[2].includes(text)));
   if(example)return {title,text,term,meaning:example[4],pos:example[5],code:example[6],usage:example[7],verified:true};
  }
 }
 const defs=localDefs(term),entry=defs.find(x=>x.w.title===title);
 return {title,text,term,
  meaning:entry?.compound?("所在语境“"+entry.d[0]+"”整体意为："+entry.d[2]+"；“"+term+"”的独立义项待校核。"):entry?.d[2]||"当前原文的具体字义尚待校核",
  pos:entry?.compound?"待分字":entry?.d[1]||"未标注",code:null,
  usage:entry?.compound?"只把原文短语的整体译注作为语境提示，不能把短语意思自动赋给其中一个字。":entry?"课文已提供本字释义，但还未独立核对跨篇同异。":"本字在当前句子的义项尚待逐字核校。",
  verified:!!entry&&!entry.compound,sourceLevel:entry?(entry.compound?"phrase-context":"lesson-gloss"):"unverified"};
}
function grammarOrigin(pattern,context){
 const title=context?.title||activeOrigin().title,text=context?.text||activeOrigin().text;
 const a=grammarSpec(pattern)?.examples?.find(x=>x[0]===title&&(text.includes(x[2])||x[2].includes(text)));
 return {title,text,term:pattern,meaning:grammarSpec(pattern)?.definition||"需结合上下文分析",code:a?.[4]||null,pos:"句式",usage:a?.[5]||"本句的具体结构暂未逐句核注",verified:!!a};
}
function relation(origin,example,grammar=false){
 if(!origin.verified||!origin.code)return {type:"unknown",badge:"待核对",diff:origin.verified?"本句有课文释义，但尚未完成跨篇义项同异核对。":"本句的具体义项尚未校定。"};
 const same=normalizeSense(origin.code)===normalizeSense(example.code);
 const grammarKind=s=>{
  s=String(s||"");
  for(const [expr,code] of [[/省略主语/,"subject"],[/省略介词/,"preposition"],[/省略宾语/,"object"],
    [/名词作状语/,"adverbial-noun"],[/名词作动词/,"verbal-noun"],[/使动/,"causative"],[/意动/,"putative"],
    [/于表地点|于表趋向/,"place"],[/以表工具/,"tool"]]){
    if(expr.test(s))return code;
  }
  return null;
 };
 const g1=grammar?grammarKind(origin.code):null,g2=grammar?grammarKind(example.code):null;
 const near=!same&&(grammar?!(g1&&g2&&g1!==g2):family(origin.code)===family(example.code));
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
 const s=String(sentence||"");let out="",i=0;const words=allTerms();
 while(i<s.length){
  let t=words.find(word=>s.startsWith(word,i));
  if(selected){
   const nextSelected=s.indexOf(selected,i);
   if(nextSelected===i)t=selected;
   else if(t&&nextSelected>i&&nextSelected<i+t.length)t=null;
  }
  if(t){
    const highlighted=t===selected?" hit-word":"";
    let display="";for(let j=0;j<t.length;j++)display+=window.WENYAN_PINYIN?.span(s,i+j)||esc(s[i+j]);out+='<button class="study-token'+highlighted+'" type="button" data-study-word="'+esc(t)+'" data-study-offset="'+i+'" data-study-context="'+esc(contextId||"")+'" aria-label="查询“'+esc(t)+'”的不同古文用法">'+display+'</button>';i+=t.length;
  }else {out+=window.WENYAN_PINYIN?.span(s,i)||esc(s[i]);i++;}
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
function contextTranslation(origin){
 const w=core.find(w=>w.title===origin.title);
 if(!w)return "";
 const row=(w.lines||[]).find(x=>x[0]===origin.text)
  ||(w.lines||[]).find(x=>x[0]?.includes(origin.text)&&origin.text?.length>=6);
 return row?.[1]||"";
}
function baseHeader(origin,isGrammar){
 const translation=!isGrammar&&!origin.verified?contextTranslation(origin):"";
 const provisional=translation?'<div class="study-context-translation"><b>已校课文整句译文（辅助理解，不等于本字已校释义）：</b><p>'+esc(translation)+'</p>'+
 '<p class="study-caution">这句有译文，但“'+esc(origin.term)+'”字的独立字义仍待核对；请勿把这句译文当作字的释义。</p>'+
 '<a href="https://www.zdic.net/hans/'+encodeURIComponent(origin.term)+'" target="_blank" rel="noopener noreferrer">查阅单字字典（具体义项仍需结合原句核对）↗</a></div>':"";
 return '<section class="study-origin">'+
 '<h3><em>'+esc(origin.term)+'</em><span>'+displayTitle(origin.title||"当前古文")+'</span></h3>'+
 (origin.text?'<p class="study-original">'+tokens(origin.text,origin.term,"source")+'</p>':'')+
 '<p class="study-origin-meaning"><b>'+(isGrammar?"本句句式：":"本文“"+esc(origin.term)+"”字：")+'</b>'+esc(origin.meaning)+
 (isGrammar?"":'<small>'+esc(origin.pos)+'</small>')+'</p>'+provisional+'</section>';
}
function rowCard(row,index,origin,isGrammar){
 const meta=row.record,rel=relation(origin,meta,isGrammar),contextId="r"+index;
 const title=displayTitle(meta.title),rawSource=String(meta.source||"").trim(),source=rawSource.replace(/[《》]/g,"")===String(meta.title).replace(/[《》]/g,"")?"":esc(rawSource);
 const related=!isGrammar&&meta.match&&meta.match!==origin.term;
 const desc=isGrammar?'<b>句式：</b>'+esc(meta.code):(related?'<b>关联字“'+esc(meta.match)+'”：</b>':'<b>'+esc(origin.term)+'：</b>')+esc(meta.meaning);
 const comparison=origin.verified?'<div class="study-compare '+rel.type+'"><b>'+
 (rel.type==="same"?"🟢":rel.type==="near"?"🟡":rel.type==="diff"?"🔴":"⚪")+' '+(related?'仅该字相关 · ':'')+esc(rel.badge)+'</b>'+
 '<p><span class="study-compare-meanings">'+esc(origin.meaning)+' → '+esc(meta.meaning)+'</span> · '+esc(rel.diff)+'</p></div>':
 '<div class="study-compare unknown"><b>⚪ 待核对</b><p>本句具体义项暂未核定，不推测异同。</p></div>';
 return '<article class="study-example">'+
 '<h4 class="study-example-top">'+title+(source?'<small> · '+source+'</small>':'')+'</h4>'+
 '<p class="study-original">'+tokens(meta.text,isGrammar?"":(meta.match||origin.term),contextId,isGrammar)+'</p>'+
 '<details class="study-reveal"><summary>查看译文、字义与比较</summary>'+ '<p class="study-translation">'+esc(meta.translation)+'</p>'+
 '<p class="study-sense">'+desc+(isGrammar?'':'<small> · '+esc(meta.pos)+'</small>')+'</p>'+
 comparison+'</details>'+
 '<div class="study-actions">'+sourceLink(meta.url||"")+
 '<button type="button" data-study-add="'+contextId+'">加入背诵 ↗</button>'+
 (row.grammars||[]).map(g=>'<button type="button" data-study-grammar="'+esc(g)+'" data-study-context="'+contextId+'">'+esc(g)+' ↗</button>').join("")+
 '</div></article>';
}
function enrichGrammars(record){
 const rows=[];for(const name of grammarNames()){const spec=grammarSpec(name);
  if(spec.examples?.some(x=>x[0]===record.title&&(x[2]===record.text||record.text.includes(x[2])||x[2].includes(record.text))))rows.push(name);
 }
 return rows.slice(0,2);
}
function createWordRows(term){
 const spec=knowTerm(term);
 if(!spec)return [];
 return (spec.examples||[]).filter(x=>x[2]&&x[3]&&x[4]&&x[5]&&x[6]&&x[6]!=="name"&&x[6]!=="proper-name"&&x[2].includes(x[9]||term)).map(x=>({
 title:x[0],record:{title:x[0],source:x[1],text:x[2],translation:x[3],meaning:x[4],pos:x[5],code:x[6],usage:x[7],url:x[8]||"",match:x[9]||term,rank:Number.isFinite(x[10])?x[10]:999}
 })).map(x=>({...x,grammars:enrichGrammars(x.record)})).sort((a,b)=>{
   if(term==="因"){
     const popular=["因利乘便","因人之力而敝之","安陵君因使唐雎","因遗策","因河为池"];
     const rank=x=>{const i=popular.findIndex(t=>x.record.text.includes(t));return i<0?100:i;};
     if(rank(a)!==rank(b))return rank(a)-rank(b);
   }
   return (a.record.rank-b.record.rank)||sortEntries(a,b);
 });
}
function createGrammarRows(name){
 return (grammarSpec(name)?.examples||[]).filter(x=>x[2]&&x[3]&&x[4]&&x[5]).map(x=>({
 title:x[0],record:{title:x[0],source:x[1],text:x[2],translation:x[3],meaning:grammarSpec(name)?.definition||name,pos:"句式",code:x[4],usage:x[5],url:x[6]||""}
 })).sort(sortEntries);
}
// 有整句译文但尚未核定本字义项的原典，只能作为学生的阅读候选，不能计入达标数。
function readingCandidates(char,origin,reviewed){
 if([...char].length!==1)return [];
 const seen=new Set(reviewed.map(x=>x.record.title)),rows=[];
 const add=(title,source,text,translation,url)=>{
  if(!title||title===origin.title||seen.has(title)||!text?.includes(char)||!translation)return;
  seen.add(title);rows.push({title,source,text,translation,url:url||""});
 };
 for(const w of core)for(const line of w.lines||[])add(w.title,w.source,line[0],line[1],w.sourceUrl);
 const stores=[DB,window.WENYAN_VERIFIED_EXTRA,window.WENYAN_VERIFIED_MORE2,
  window.WENYAN_VERIFIED_COMMON3,window.WENYAN_VERIFIED_CORPUS,
  window.WENYAN_VERIFIED_BATCH4,window.WENYAN_VERIFIED_BATCH5,window.WENYAN_VERIFIED_BATCH6,
  window.WENYAN_VERIFIED_BATCH7,window.WENYAN_VERIFIED_BATCH8,window.WENYAN_VERIFIED_BATCH9,window.WENYAN_VERIFIED_BATCH10,window.WENYAN_VERIFIED_BATCH11,window.WENYAN_VERIFIED_BATCH12,window.WENYAN_LESSON_CHARACTER_GLOSSES,window.WENYAN_VERIFIED_CHARACTERS];
 for(const store of stores)for(const spec of Object.values(store?.words||{}))
  for(const x of spec.examples||[])add(x[0],x[1],x[2],x[3],x[8]);
 return rows.slice(0,10);
}
function previewCard(row,i,char){
 return '<article class="study-example study-unverified">'+
  '<h4 class="study-example-top">'+displayTitle(row.title)+'</h4>'+
  '<p class="study-original">'+tokens(row.text,char,"p"+i)+'</p>'+
  '<details class="study-reveal"><summary>查看译文与核校提示</summary><p class="study-translation">'+esc(row.translation)+'</p>'+
  '<p class="study-compare unknown">⚪ 本字在本句的具体义项尚未逐字校核，不能判断同义或异义。</p></details>'+
  '<div class="study-actions">'+sourceLink(row.url)+'</div></article>';
}
function largeCandidateCard(row,index,char){
 const meta=[row.group,row.id?"语料记录 "+row.id:""].filter(Boolean).join(" · ");
 return '<article class="study-example study-unverified">'+
  '<h4 class="study-example-top">'+displayTitle(row.title||"扩展古籍原文")+'</h4>'+
  '<p class="study-original">'+tokens(row.text,char,"lc"+index)+'</p>'+
  '<details class="study-reveal"><summary>查看简明阅读提示（非人工译文）</summary>'+
  '<p class="study-sense">'+esc(row.readingHint||"这段原文的字义尚待逐字核对。")+'</p>'+
  '<p class="study-compare unknown">这只是依据句面词语生成的阅读线索，没有给出经校对的现代译文，也不能算同义例句。</p></details>'+
  '<p class="study-caution">只保留原典自带的标点；未经逐字校译，不计入5篇／2篇关联要求。</p>'+
  (meta?'<p class="study-sense">来源：'+esc(meta)+'</p>':'')+
  '<div class="study-actions">'+
  (row.url?'<a href="'+esc(row.url)+'" target="_blank" rel="noopener noreferrer">查看语料库来源 ↗</a>':'')+
  '<button type="button" data-study-large-edit="'+index+'">人工校译并加入</button></div></article>';
}
async function loadLargeCandidates(term,origin,reviewed,previews,active){
 const host=$("studyLargeCandidates");
 const search=window.WENYAN_STUDY_EDITOR?.searchClassics;
 if(!host||typeof search!=="function")return;
 host.innerHTML='<p class="study-caution">正在扩展古籍全文库中检索本字……</p>';
 try{
  const hits=await Promise.race([
    search(term),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error("古籍全文索引加载超时；已核译例句仍可使用，可稍后重试")),12000))
   ]);
  if(state!==active)return;
  const seen=new Set([...reviewed.map(x=>x.record.title),...previews.map(x=>x.title),origin.title]);
  const candidates=[];
  for(const hit of hits||[]){
   const row=window.WENYAN_CANDIDATE_QUALITY?.format(hit,term,origin);
   if(!row||seen.has(row.title))continue;
   seen.add(row.title);candidates.push(row);
   if(candidates.length>=8)break;
  }
  active.largeCandidates=candidates;
  candidates.forEach((row,i)=>active.contexts.set("lc"+i,{title:row.title,text:row.text,annotated:false}));
  if(!candidates.length){
   host.innerHTML='<div class="study-sectionhead"><b>扩展古籍全文库候选（待逐字校译）</b></div><p class="study-caution">全文库检索完成。目前没有可显示的清晰带标点原文（无句读、残损字、人名假命中及重复篇目已过滤）。不会用猜测补标点或假译文。</p>';
   return;
  }
  host.innerHTML='<div class="study-sectionhead"><b>扩展古籍全文库候选（待逐字校译） · '+candidates.length+' 篇</b></div>'+
   '<p class="study-caution">只显示保留来源标点、内容可读的候选句，并提供简明阅读提示。提示并非校核后的现代译文，人工核对字义与句译后方可计入上方达标数量。</p>'+
   candidates.map((row,i)=>largeCandidateCard(row,i,term)).join("");
  host.querySelectorAll("[data-study-large-edit]").forEach(button=>button.onclick=()=>{
   const row=active.largeCandidates[Number(button.dataset.studyLargeEdit)];
   if(!row)return;
   window.WENYAN_STUDY_EDITOR?.open({kind:"word",name:term,title:row.title,
    source:"公开古籍全文库（"+(row.group||"待核书目")+"）",original:row.text,anchor:""});
  });
 }catch(error){
  if(state!==active)return;
  host.innerHTML='<div class="study-sectionhead"><b>扩展古籍全文库候选</b></div><p class="study-caution">全文库暂时不可读取：'+esc(error?.message||error)+'。已有人工校核例句不受影响。</p>';
 }
}
function renderPage(term,isGrammar,origin,push=true){
 if(push&&state)chain.push(state);
 state={term,isGrammar,origin};
 const isName=!isGrammar&&origin.code==="proper-name";
 const originalRows=isGrammar?createGrammarRows(term):createWordRows(term);
 // No source passage in results, no two hits for the same sense from the same work.
 const seen=new Set(),filtered=[];
 for(const row of originalRows){
  const r=row.record;
  if(r.title===origin.title)continue;
  const key=r.title+"|"+normalizeSense(r.code);
  if(seen.has(key))continue;seen.add(key);filtered.push(row);
 }
 // 按学习要求：前两条例句必须与原句同义；后面先看不同义项，再看近义、其他同义。
 const same=[],diff=[],near=[],unknown=[];
 for(const r of filtered){
  const category=relation(origin,r.record,isGrammar).type;
  ({same,diff,near,unknown}[category]||unknown).push(r);
 }
 function favorDistinct(items){
  const seen=new Set(),first=[],later=[];
  for(const x of items){const key=x.record.title;if(seen.has(key))later.push(x);else{seen.add(key);first.push(x);}}
  return first.concat(later);
 }
 const arranged=[
  ...favorDistinct(same).slice(0,2),
  ...favorDistinct(diff),
  ...favorDistinct(near),
  ...favorDistinct(same).slice(2),
  ...unknown
 ];
 filtered.splice(0,filtered.length,...arranged);
 // 单字关联只依靠已校核的该字例句。候选整句译文不计入数字。
 const independentBooks=new Set(filtered.map(r=>r.record.title)).size;
 const sameBooks=new Set(same.map(r=>r.record.title)).size;
 const complete=!isName&&!!origin.verified&&!!origin.code&&independentBooks>=5&&sameBooks>=2;
 const missing=[];
 if(!origin.verified||!origin.code)missing.push(origin.sourceLevel==="lesson-gloss"?"本文已有课文释义，跨篇义项仍待核定":"本文字义尚未逐字校定");
 if(independentBooks<5)missing.push("还缺"+(5-independentBooks)+"篇逐字校核的古文");
 if(sameBooks<2)missing.push("还缺"+(2-sameBooks)+"篇同义例句");
 const previews=isGrammar||isName?[]:readingCandidates(term,origin,filtered);
 const auditLine=isName?'<p class="study-coverage ready">本字在这一原句中属于人物姓名：已核定为专名用字。此处不参加普通实词的“5篇跨文义项／2篇同义”评估；其他语境仍须重新辨义。</p>':
  '<p class="study-coverage '+(complete?'ready':'partial')+'">'+
 (isGrammar?'已校核句式 ':'已逐字校译 ')+independentBooks+' 篇 · '+(isGrammar?'同类 ':'同义 ')+sameBooks+' 篇'+(isGrammar?'':' · 待核原句 '+previews.length+' 篇')+
 '<br><b>'+(complete?'✓ 本字跨篇例句数量与义项比较达标':'待完善：'+esc(missing.join('；')))+'</b></p>';
 const html=wrapHeader()+baseHeader(origin,isGrammar)+
 auditLine+
 (isGrammar?discoveryGuide(term):'')+
 '<div class="study-sectionhead"><b>'+(isGrammar?'同类句式在其他古文中的用法':'同字关联古文（已核义）')+'</b><button id="editStudyTerm" type="button">＋ 补充例句</button></div>'+
 (isName?'<p class="study-empty">此处为姓名用字，不以普通词义强行凑出五篇；同形字在别的古文里仍可另行查询。</p>':filtered.length?filtered.map((r,i)=>rowCard(r,i,origin,isGrammar)).join(""):
 '<p class="study-empty">暂无已逐字校核的关联古文。可以从下方整句有译文的候选原文继续核验。</p>')+
 (previews.length?'<div class="study-sectionhead"><b>含本字的古文（义项待核）</b></div>'+
 '<p class="study-caution">这些句子已有现代译文，但尚未校核本字含义，不会计算到上方的关联数量。</p>'+
 previews.map((r,i)=>previewCard(r,i,term)).join(""):'')+
 '<div id="studyLargeCandidates"></div>';

 open((isGrammar?"句式：":"字义：")+term,html);
 const active=state;if(!isGrammar&&!isName&&!complete)loadLargeCandidates(term,origin,filtered,previews,active);
 $("editStudyTerm").onclick=()=>window.WENYAN_STUDY_EDITOR?.open({kind:isGrammar?"grammar":"word",name:term,title:origin.title,original:origin.text});
 if(isGrammar){
  const guide=grammarSpec(term)?.guide;
  $("modalContent").querySelectorAll("[data-guide-option]").forEach(btn=>btn.onclick=()=>{
   const result=btn.closest("details")?.querySelector(".study-guide-feedback");
   if(!result||!guide)return;
   if(Number(btn.dataset.guideOption)===guide.answer){result.textContent="✓ 找到了！"+guide.explain;result.classList.add("ready")}
   else {result.textContent="再观察一下原句，看看哪些字能证明你的选择。";result.classList.remove("ready")}
  });
 }
 state.rows=filtered;
 state.contexts=new Map(filtered.map((r,i)=>["r"+i,{title:r.record.title,text:r.record.text,annotated:true,annotatedTerm:isGrammar?null:(r.record.match||term),
 meaning:r.record.meaning,pos:r.record.pos,code:r.record.code,usage:r.record.usage}]));
 for(const [i,p] of previews.entries())state.contexts.set("p"+i,{title:p.title,text:p.text,annotated:false});
 state.contexts.set("source",{title:origin.title,text:origin.text,annotated:!!origin.verified,annotatedTerm:isGrammar?null:term,
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
 const fromIndex=!!t&&!!which.closest("#wordList");
 let context=fromIndex?indexOrigin(name):(contextId&&state?.contexts?.get(contextId));
 if(t){
  if(context&&!fromIndex)context={...context,offset:Number.isFinite(Number(which.dataset.studyOffset))?Number(which.dataset.studyOffset):null};
  else {
   const wholeNode=which.closest('.wholepara');
   const container=wholeNode?.querySelector('.wholetext')||(which.closest('#sentence')?$('sentence'):null);
   if(container){
    const text=container.dataset.plain||container.textContent||"";
    const title=wholeNode?$('wholeTitle').textContent:$('title').textContent;
    const same=[...container.querySelectorAll('[data-term]')].filter(n=>n.dataset.term===name);
    const n=Math.max(0,same.indexOf(which));
    let start=-1;for(let i=0;i<=n;i++)start=text.indexOf(name,start+1);
    context={title,text,offset:start>=0?start:null};
   }
  }
 }
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 if(t&&fromIndex&&!context){open("单字索引",'<p class="study-empty">尚未找到确实包含“'+esc(name)+'”的古文原句，请先补充经核校的例句。</p>');return;}
 if(t)openWord(name,context);else openGrammar(name,context);
},true);
window.WENYAN_STUDY_DEBUG={terms:()=>allTerms(),patterns:()=>grammarNames(),getState:()=>state&&({term:state.term,count:state.rows?.length,origin:state.origin}),lookupWord:term=>knowTerm(term),origin:(term,context)=>termOrigin(term,context),rows:term=>createWordRows(term),coverage:(term,context)=>{
 const origin=termOrigin(term,context);if(!origin)return null;
 const seen=new Set(),rows=[];
 for(const row of createWordRows(term)){const r=row.record;if(r.title===origin.title)continue;const key=r.title+"|"+normalizeSense(r.code);if(seen.has(key))continue;seen.add(key);rows.push(row);}
 const same=rows.filter(row=>relation(origin,row.record,false).type==="same");
 const previews=readingCandidates(term,origin,rows);
 const verifiedBooks=new Set(rows.map(row=>row.record.title)).size;
 const sameSenseBooks=new Set(same.map(row=>row.record.title)).size;
 return {verifiedBooks,sameSenseBooks,pendingBooks:previews.length,complete:!!origin.verified&&!!origin.code&&verifiedBooks>=5&&sameSenseBooks>=2};
}};
// 从“关键词校译进度”页直接打开对应学习卡片，不依赖当前阅读进度。
const linkedParams=new URLSearchParams(location.search),linkedTerm=linkedParams.get("term"),linkedWork=linkedParams.get("work");
if(linkedTerm && allTerms().includes(linkedTerm)){
 queueMicrotask(()=>{
  // 缺义清单中可精确指向“某一篇的某个字”，不再跳到另一篇同字的已校注位置。
  const selected=linkedWork&&core.find(w=>w.title===linkedWork);
  const context=selected&&(selected.lines||[]).find(line=>String(line[0]||"").includes(linkedTerm));
  const origin=context?{title:selected.title,text:context[0],offset:context[0].indexOf(linkedTerm)}:indexOrigin(linkedTerm);
  if(origin)openWord(linkedTerm,origin);
  else open("单字索引",'<p class="study-empty">“'+esc(linkedTerm)+'”尚无可定位的原句。请先补齐原文和准确释义。</p>');
 });
}
})();
