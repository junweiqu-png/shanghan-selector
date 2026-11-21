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
 if(!builtin&&!junior&&!cross&&!verified&&!more&&!common&&!corpus&&!batch&&!batch5&&!batch6&&!batch7&&!batch8&&!batch9&&!batch10&&!batch11&&!batch12&&!lesson&&!characters&&!personal&&!window.WENYAN_LINKED_TRANSLATIONS?.words?.[word])return null;
 return {sources:[...(personal?.sources||[]),...(batch12?.sources||[]),...(batch11?.sources||[]),...(lesson?.sources||[]),...(batch10?.sources||[]),...(batch9?.sources||[]),...(batch8?.sources||[]),...(builtin?.sources||[]),...(junior?.sources||[]),...(verified?.sources||[]),...(more?.sources||[]),...(common?.sources||[]),...(corpus?.sources||[]),...(batch?.sources||[]),...(batch5?.sources||[]),...(batch6?.sources||[]),...(batch7?.sources||[]),...(characters?.sources||[]),...(cross?.sources||[])],
 examples:[...(personal?.examples||[]),...(batch12?.examples||[]),...(lesson?.examples||[]),...(batch11?.examples||[]),...(batch10?.examples||[]),...(batch9?.examples||[]),...(batch8?.examples||[]),...(builtin?.examples||[]),...(junior?.examples||[]),...(verified?.examples||[]),...(more?.examples||[]),...(common?.examples||[]),...(corpus?.examples||[]),...(batch?.examples||[]),...(batch5?.examples||[]),...(batch6?.examples||[]),...(batch7?.examples||[]),...(characters?.examples||[]),...(cross?.examples||[]),...(window.WENYAN_LINKED_TRANSLATIONS?.words?.[word]?.examples||[])]};
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
 '<details><summary>展开：怎样从原句发现这种句式？</summary>'+
 '<p>'+esc(g.clue)+'</p>'+
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
 const title=context?.title||activeOrigin().title,text=context?.text||activeOrigin().text;
 const offset=Number.isInteger(context?.offset)?context.offset:text.indexOf(term);
 const complete=window.WENYAN_COMPLETE_TRANSLATIONS?.lookup(title,text,offset);
 if(complete&&complete.term===term)return complete;
 if(context?.annotated&&context.annotatedTerm===term)return {
 title:context.title,text:context.text,term,meaning:context.meaning,pos:context.pos,code:context.code,usage:context.usage,translation:context.translation,verified:true};
 // 任何入口都不能把不含该字的当前句当成“原字原文”。
 if(!text.includes(term))return {title:"单字索引",text:"",term,meaning:"尚未定位到含此字的原句",pos:"",code:null,usage:"请选择或录入包含此字的古文及准确译文。",verified:false};
 if(spec){
  const candidates=(spec.sources||[]).filter(s=>s[0]===title&&(!s[1]||text.includes(s[1])));
  // 完整逐字课文以【标题+原句+字位】精确定位；单用短句片段会让“先帝”“之”“以”等跨句串义。
  // 第7、8列是新式来源的正文原句和字符偏移；旧来源继续沿用原有短句锚点。
  const haveOffset=Number.isInteger(context?.offset)&&context.offset>=0;
  const precise=haveOffset?candidates.find(s=>typeof s[6]==="string"&&Number.isInteger(s[7])&&s[6]===text&&s[7]===context.offset):null;
  const legacy=candidates.filter(s=>!(typeof s[6]==="string"&&Number.isInteger(s[7])));
  const loose=legacy.find(s=>{
    if(!haveOffset||!s[1])return false;
    let start=text.indexOf(s[1]);while(start!==-1){if(context.offset>=start&&context.offset+term.length<=start+s[1].length)return true;start=text.indexOf(s[1],start+1);}
    return false;
  });
  const sameSentence=haveOffset?null:candidates.find(s=>s[6]===text&&s[7]===text.indexOf(term));
  const hit=precise||loose||sameSentence||(!haveOffset?legacy[0]:null);
  if(hit)return {title,text,term,meaning:hit[2],pos:hit[3],code:hit[4],usage:hit[5],translation:context?.translation,verified:true};
  const occurrenceCount=text.split(term).length-1;
  // 同一原句中多次出现同字，不能借其他位置的例句标注猜当前字义。
  if(occurrenceCount===1){
   const example=(spec.examples||[]).find(x=>x[0]===title&&x[2]?.includes(term)&&(text.includes(x[2])||x[2].includes(text)));
   if(example)return {title,text,term,meaning:example[4],pos:example[5],code:example[6],usage:example[7],translation:context?.translation||example[3],verified:true};
  }
 }
 const defs=localDefs(term),entry=defs.find(x=>x.w.title===title),reference=window.WENYAN_REFERENCE_DICTIONARY?.words?.[term];
 return {title,text,term,
  meaning:entry&&!entry.compound?entry.d[2]:(reference?.s||[]).join("；"),
  pos:entry&&!entry.compound?entry.d[1]:"字典释义",code:null,
  usage:"",translation:context?.translation,
  verified:!!entry&&!entry.compound,sourceLevel:entry&&!entry.compound?"lesson-gloss":"dictionary"};
}
function grammarOrigin(pattern,context){
 const title=context?.title||activeOrigin().title,text=context?.text||activeOrigin().text;
 const a=grammarSpec(pattern)?.examples?.find(x=>x[0]===title&&(text.includes(x[2])||x[2].includes(text)));
 return {title,text,term:pattern,meaning:grammarSpec(pattern)?.definition||"需结合上下文分析",code:a?.[4]||null,pos:"句式",usage:a?.[5]||"本句的具体结构暂未逐句核注",verified:!!a};
}
function relation(origin,example,grammar=false){
 if(!origin.verified||!origin.code)return {type:"unknown",badge:"待核对",diff:origin.verified?"本句有课文释义，但尚未完成跨篇义项同异核对。":"本句的具体义项尚未校定。"};
 const gloss=s=>String(s||"").split(/，指|；指|，这里|；这里/)[0].replace(/^[\p{Script=Han}]{2}，(?=.{2,}(?:样子|状态))/u,"").replace(/[，、；。\s]/g,"");
 const kind=s=>(/意动/.test(s)?"putative":/使动/.test(s)?"causative":/名词作状语/.test(s)?"adverbial":"ordinary");
 const compatible=kind(origin.meaning+origin.pos)===kind(example.meaning+example.pos);
 const same=(example.codes?.length?example.codes:[example.code]).some(code=>normalizeSense(origin.code)===normalizeSense(code))||
 (!grammar&&compatible&&gloss(origin.meaning)===gloss(example.meaning));
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
 const sharedMeaning=!grammar&&compatible&&String(origin.meaning).split(/[，、；。]/).some(part=>part.length>=2&&String(example.meaning).includes(part));
 const near=!same&&(grammar?!(g1&&g2&&g1!==g2):family(origin.code)===family(example.code)||sharedMeaning);
 const type=same?"same":near?"near":"diff",badge=
 (grammar?(same?"句式相同":near?"句式相近":"句式不同"):
 same?"含义相同":near?"含义相近":"含义不同");
 const diff=same?(grammar?"与本文的句式相同。":"与本文“"+origin.meaning+"”义相同。"):
 "本文："+origin.meaning+"；此句："+example.meaning+"。";
 return {type,badge,diff};
}
function tokens(sentence,selected,contextId,grammar=false){
 const text=String(sentence||"");let html="";
 for(let offset=0;offset<text.length;offset++){
  const char=text[offset],shown=window.WENYAN_PINYIN?.span(text,offset)||esc(char);
  html+=/\p{Script=Han}/u.test(char)?'<button class="study-token'+(char===selected?' hit-word':'')+'" type="button" data-study-word="'+esc(char)+'" data-study-offset="'+offset+'" data-study-context="'+esc(contextId||"")+'" aria-label="查询“'+esc(char)+'”的字义">'+shown+'</button>':shown;
 }return html;
}

function displayTitle(name){
 const title=String(name||"").replace(/^《|》$/g,"");
 return "《"+esc(title)+"》";
}
function sourceLink(url,reference=false){
 return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+(reference?'原文与译注 ↗':'核对原典 ↗')+'</a>':"";
}
function open(title,html){
 $("modalTitle").textContent=title;$("modalContent").innerHTML=html;$("overlay").hidden=false;
 $("modalContent").scrollTop=0;
}
function wrapHeader(){
 return chain.length?'<div class="study-toolbar"><button type="button" data-study-back>← 返回</button></div>':"";
}
function contextTranslation(origin){
 if(origin.translation)return origin.translation;
 const translated=window.WENYAN_TRANSLATED_CLASSICS?.find(origin.title,origin.text);
 if(translated)return translated.translation;
 const w=core.find(w=>w.title===origin.title);
 if(!w){const example=knowTerm(origin.term)?.examples?.find(x=>x[0]===origin.title&&x[2]===origin.text);return example?.[3]||"";}
 const row=(w.lines||[]).find(x=>x[0]===origin.text)
  ||(w.lines||[]).find(x=>x[0]?.includes(origin.text)&&origin.text?.length>=6);
 return row?.[1]||"";
}
function baseHeader(origin,isGrammar){
 const translation=contextTranslation(origin);
 return '<section class="study-origin">'+
 '<h3><em>'+esc(origin.term)+'</em><span>'+displayTitle(origin.title||"当前古文")+'</span></h3>'+
 (origin.text?'<p class="study-original">'+tokens(origin.text,origin.term,"source")+'</p>':'')+
 '<details class="study-reveal study-answer" data-answer-key="source"><summary>查看本句译文与字义</summary>'+
 '<p class="study-origin-meaning"><b>'+(isGrammar?"本句句式：":origin.sourceLevel==="dictionary"?"字典释义：":"本文“"+esc(origin.term)+"”字：")+'</b>'+esc(origin.meaning)+
 (isGrammar?"":'<small>'+esc(origin.pos)+'</small>')+'</p>'+
 (translation?'<div class="study-context-translation"><b>本文原句的现代汉语译文：</b><p>'+esc(translation)+'</p></div>':'')+'</details></section>';
}

function rowCard(row,index,origin,isGrammar){
 const meta=row.record,rel=relation(origin,meta,isGrammar),contextId="r"+index;
 const title=displayTitle(meta.title),rawSource=String(meta.source||"").trim(),source=rawSource.replace(/[《》]/g,"")===String(meta.title).replace(/[《》]/g,"")?"":esc(rawSource);
 const related=!isGrammar&&meta.match&&meta.match!==origin.term;
 const desc=isGrammar?'<b>句式：</b>'+esc(meta.code):(related?'<b>关联字“'+esc(meta.match)+'”：</b>':'<b>'+esc(origin.term)+'：</b>')+esc(meta.meaning);
 const comparison=origin.verified?'<div class="study-compare '+rel.type+'"><b>'+
 (rel.type==="same"?"🟢":rel.type==="near"?"🟡":rel.type==="diff"?"🔴":"⚪")+' '+(related?'原文作“'+esc(meta.match)+'” · ':'')+esc(rel.badge)+'</b>'+
 '<p>'+esc(rel.diff)+'</p></div>':
 '';
 return '<article class="study-example">'+
 '<h4 class="study-example-top">'+title+(source?'<small> · '+source+'</small>':'')+'</h4>'+
 '<p class="study-original">'+tokens(meta.text,isGrammar?"":(meta.match||origin.term),contextId,isGrammar)+'</p>'+
 '<details class="study-reveal study-answer" data-answer-key="'+esc(meta.title+'|'+meta.text)+'"><summary>查看译文与字义</summary>'+
 '<p class="study-translation">'+esc(meta.translation)+'</p>'+
 '<p class="study-sense">'+desc+(isGrammar?'':'<small> · '+esc(meta.pos)+'</small>')+'</p>'+
 comparison+'</details>'+
 '<div class="study-actions">'+sourceLink(meta.url||"",meta.provenance?.kind==="paired-reference")+
 '<button type="button" data-study-add="'+contextId+'">加入背诵 ↗</button>'+
 (row.grammars||enrichGrammars(meta)).map(g=>'<button type="button" data-study-grammar="'+esc(g)+'" data-study-context="'+contextId+'">'+esc(g)+' ↗</button>').join("")+
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
 return (spec.examples||[]).filter(x=>x[2]&&x[3]&&x[4]&&x[5]&&x[6]&&x[6]!=="name"&&x[2].includes(x[9]||term)).map(x=>({
 title:x[0],record:{title:x[0],source:x[1],text:x[2],translation:x[3],meaning:x[4],pos:x[5],code:x[6],usage:x[7],url:x[8]||"",match:x[9]||term,rank:Number.isFinite(x[10])?x[10]:99,codes:x[11],provenance:x[12]}
 })).sort((a,b)=>{
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
const plain=s=>String(s||"").replace(/[^\p{Script=Han}]/gu,"");
function usableRows(rows,origin){
 const seen=new Set(),texts=[],filtered=[],body=plain(origin.text);
 for(const row of rows){
  const r=row.record,text=plain(r.text);
  if(r.title===origin.title||text&&(body.includes(text)||text.includes(body)&&body.length>3))continue;
  const key=r.title+"|"+normalizeSense(r.code);
  if(seen.has(key)||texts.some(t=>t===text||Math.min(t.length,text.length)>8&&(t.includes(text)||text.includes(t))))continue;
  seen.add(key);texts.push(text);filtered.push(row);
 }
 return filtered;
}
function renderPage(term,isGrammar,origin,push=true){
 if(push&&state)chain.push(state);
 state={term,isGrammar,origin};
 const originalRows=isGrammar?createGrammarRows(term):createWordRows(term);
 // No source passage in results, no two hits for the same sense from the same work.
 const filtered=usableRows(originalRows,origin);
 // 按学习要求：前两条例句必须与原句同义；后面先看不同义项，再看近义、其他同义。
 const nameRows=filtered.filter(r=>r.record.code==="proper-name");
 filtered.splice(0,filtered.length,...filtered.filter(r=>r.record.code!=="proper-name"));
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
 const auditLine='<p class="study-coverage">关联 '+independentBooks+' 篇 · '+(isGrammar?'同类 ':'同义 ')+sameBooks+' 篇</p>';
 const visible=12;
 const html=wrapHeader()+baseHeader(origin,isGrammar)+
 (isGrammar?discoveryGuide(term):'')+
 (filtered.length?auditLine+'<div class="study-sectionhead"><b>'+(isGrammar?'同类句式':'同字关联古文')+'</b><button id="editStudyTerm" type="button">＋ 补充例句</button></div>'+ '<div id="studyExamples">'+filtered.slice(0,visible).map((r,i)=>rowCard(r,i,origin,isGrammar)).join("")+'</div>'+ (filtered.length>visible?'<button id="studyMoreExamples" type="button">再看 12 条</button>':''):'')+
 (nameRows.length?'<details class="study-names"><summary>更多关联例句（'+nameRows.length+' 条）</summary>'+nameRows.map((r,i)=>rowCard(r,filtered.length+i,origin,isGrammar)).join("")+'</details>':'');
 open((isGrammar?"句式：":"字义：")+term,html);
 if($("editStudyTerm"))$("editStudyTerm").onclick=()=>window.WENYAN_STUDY_EDITOR?.open({kind:isGrammar?"grammar":"word",name:term,title:origin.title,original:origin.text});
 let shown=visible;
 if($("studyMoreExamples"))$("studyMoreExamples").onclick=()=>{
  const next=filtered.slice(shown,shown+12);$("studyExamples").insertAdjacentHTML("beforeend",next.map((r,i)=>rowCard(r,shown+i,origin,isGrammar)).join(""));shown+=next.length;
  if(shown>=filtered.length)$("studyMoreExamples").hidden=true;
 };

 if(isGrammar){
  const guide=grammarSpec(term)?.guide;
  $("modalContent").querySelectorAll("[data-guide-option]").forEach(btn=>btn.onclick=()=>{
   const result=btn.closest("details")?.querySelector(".study-guide-feedback");
   if(!result||!guide)return;
   if(Number(btn.dataset.guideOption)===guide.answer){result.textContent="✓ 找到了！"+guide.explain;result.classList.add("ready")}
   else {result.textContent="再观察一下原句，看看哪些字能证明你的选择。";result.classList.remove("ready")}
  });
 }
 state.rows=[...filtered,...nameRows];
 state.contexts=new Map(state.rows.map((r,i)=>["r"+i,{title:r.record.title,text:r.record.text,annotated:true,annotatedTerm:isGrammar?null:(r.record.match||term),
 meaning:r.record.meaning,pos:r.record.pos,code:r.record.code,usage:r.record.usage,translation:r.record.translation}]));
 state.contexts.set("source",{title:origin.title,text:origin.text,annotated:!!origin.verified,annotatedTerm:isGrammar?null:term,
 meaning:origin.meaning,pos:origin.pos,code:origin.code,usage:origin.usage,translation:contextTranslation(origin)});
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
let opening=0;
async function openWord(word,context){
 const request=++opening,origin=termOrigin(word,context);
 // The lesson and its existing examples are available immediately. A cached,
 // small shard adds other works without downloading the full reference corpus.
 renderPage(word,false,origin);
 if(!window.WENYAN_LINKED_TRANSLATIONS)return;
 try{
  await window.WENYAN_LINKED_TRANSLATIONS.load(word);
  if(request!==opening||state?.term!==word||state?.origin!==origin||$("overlay").hidden)return;
  const expanded=new Set([...$("modalContent").querySelectorAll(".study-answer[open]")].map(n=>n.dataset.answerKey)),scroll=$("modalContent").scrollTop;
  renderPage(word,false,origin,false);
  $("modalContent").querySelectorAll(".study-answer").forEach(n=>{n.open=expanded.has(n.dataset.answerKey);});
  $("modalContent").scrollTop=scroll;
 }catch{ /* Keep the already translated lesson and local examples available. */ }
}
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
window.WENYAN_STUDY_DEBUG={terms:()=>allTerms(),patterns:()=>grammarNames(),openWord,openGrammar,getState:()=>state&&({term:state.term,count:state.rows?.length,origin:state.origin}),lookupWord:term=>knowTerm(term),origin:(term,context)=>termOrigin(term,context),rows:term=>createWordRows(term),coverage:(term,context)=>{
 const origin=termOrigin(term,context);if(!origin)return null;
 const rows=usableRows(createWordRows(term),origin).filter(row=>row.record.code!=="proper-name");
 const same=rows.filter(row=>relation(origin,row.record,false).type==="same");
 const previews=[];
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
