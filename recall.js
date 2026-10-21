(()=>{
'use strict';
const DATA=window.SHANGHAN_RECALL||SHANGHAN_RECALL;
const KEY='shanghan-recall-v2', OLD_KEY='shanghan-recall-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const base=DATA.cards;
const units=base.flatMap((c,bi)=>c.segments.map((text,si)=>({
  key:c.id+':'+si, baseId:c.id, baseIndex:bi, originIndex:si,
  text, defaultLabel:c.defaults[si]||'p', ruby:c.segmentRuby?.[si]||null, gloss:c.segmentGloss?.[si]||''
})));
const state={i:0,cardKey:null,flipped:false,direction:'forward',edits:{},glossEdits:{},sideGlossEdits:{},orderMode:'sequential',randomOrder:[],randomPos:0,boundaries:{},showPinyin:true};
let cards=[],wheelLock=false,startPoint=null,selectingText=false;

function isBoundary(i){
 if(i>=units.length-1)return true;
 const key=units[i].key;
 return Object.prototype.hasOwnProperty.call(state.boundaries,key)?state.boundaries[key]:units[i].baseId!==units[i+1].baseId;
}
function constructCards(){
 cards=[];let start=0;
 for(let i=0;i<units.length;i++){
  if(!isBoundary(i))continue;
  const group=units.slice(start,i+1), first=group[0], last=group[group.length-1];
  const original=base[first.baseIndex],whole=group.length===original.segments.length&&group.every(u=>u.baseId===original.id);
  const ids=[...new Set(group.map(u=>u.baseId))];
  cards.push({
   id:whole?original.id:'cut:'+first.key+'|'+last.key,
   chapter:base[first.baseIndex].chapter, line:base[first.baseIndex].line,
   segments:group.map(u=>u.text), segmentRuby:group.map(u=>u.ruby),segmentGloss:group.map(u=>u.gloss),
   sourceMap:group.map(u=>({id:u.baseId,index:u.originIndex,baseIndex:u.baseIndex,key:u.key})),
   firstUnit:start,lastUnit:i,originIds:ids,
   firstBaseIndex:first.baseIndex,text:group.map(u=>u.text).join(''),
   parts:ids.map(id=>base.find(x=>x.id===id))
  });
  start=i+1;
 }
}
function validRandom(a){return Array.isArray(a)&&a.length===cards.length&&new Set(a).size===cards.length&&a.every(id=>cards.some(c=>c.id===id));}
function shuffle(){
 const a=cards.map(c=>c.id);
 for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
 state.randomOrder=a;
}
function ensureRandom(){
 if(!validRandom(state.randomOrder))shuffle();
 state.randomPos=Math.max(0,state.randomOrder.indexOf(cards[state.i]?.id));
}
function persist(){
 try{
  localStorage.setItem(KEY,JSON.stringify({
   i:state.i,cardKey:state.cardKey,direction:state.direction,edits:state.edits,
   glossEdits:state.glossEdits,sideGlossEdits:state.sideGlossEdits,
   orderMode:state.orderMode,randomOrder:state.randomOrder,randomPos:state.randomPos,
   boundaries:state.boundaries,showPinyin:state.showPinyin
  }));
  $('#autoSaveStatus').textContent='已自动保存';
 }catch{$('#autoSaveStatus').textContent='本地保存不可用';}
}
function restore(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(OLD_KEY)||'{}');
  state.i=Math.max(0,Math.min(base.length-1,Number(x.i)||0));
  state.direction=x.direction==='reverse'?'reverse':'forward';
  state.edits=x.edits||{};state.glossEdits=x.glossEdits||{};
  state.sideGlossEdits=x.sideGlossEdits||{};
  state.orderMode=x.orderMode==='random'?'random':'sequential';
  state.boundaries=x.boundaries&&typeof x.boundaries==='object'?x.boundaries:{};
  state.cardKey=x.cardKey||units.find(u=>u.baseIndex===state.i)?.key||units[0]?.key;
  state.randomOrder=x.randomOrder||[];state.showPinyin=x.showPinyin!==false;
 }catch{}
 constructCards();locate();
}
function locate(){
 const u=units.findIndex(x=>x.key===state.cardKey);
 const pos=u<0?0:u;
 const i=cards.findIndex(c=>c.firstUnit<=pos&&c.lastUnit>=pos);
 state.i=Math.max(0,i);
 state.cardKey=units[cards[state.i]?.firstUnit]?.key||null;
 if(state.orderMode==='random')ensureRandom();
}
function current(){return cards[state.i];}
function unitLabel(u){
 const arr=state.edits[u.baseId];
 return Array.isArray(arr)&&arr.length===base[u.baseIndex].segments.length?arr[u.originIndex]:u.defaultLabel;
}
function labels(c){return c.sourceMap.map(m=>unitLabel(units.find(u=>u.key===m.key)));}
function groups(c,kind){
 const lab=labels(c),out=[];let buf=[];
 for(let i=0;i<lab.length;i++){
  if(lab[i]===kind)buf.push(i);
  else if(buf.length){out.push(buf);buf=[];}
 }
 if(buf.length)out.push(buf);return out;
}
function automaticGloss(c,kind){return groups(c,kind).flat().map(i=>c.segmentGloss[i]||'').join('');}
function savedGloss(c,kind){return state.sideGlossEdits[c.id]?.[kind];}
function gloss(c,kind){return savedGloss(c,kind)??automaticGloss(c,kind);}
function rubyHTML(c,i){
 const toks=c.segmentRuby[i];
 if(selectingText||!state.showPinyin||!Array.isArray(toks))return esc(c.segments[i]);
 // Pinyin is CSS generated content. It never exists as DOM text and cannot
 // contaminate native Android/iOS selection, dictionary lookup or clipboard.
 return toks.map(t=>{
  const ch=esc(t.c||'');
  return t.p?'<span class="phonetic-char" data-py="'+esc(t.p)+'">'+ch+'</span>':ch;
 }).join('');
}
function renderFaces(){
 const c=current(),fk=state.direction==='forward'?'p':'c',bk=fk==='p'?'c':'p';
 $('#front').innerHTML=face(c,fk);
 $('#back').innerHTML=face(c,bk);
 $('#flashcard').classList.toggle('flipped',state.flipped);
 $('#selectText').textContent=selectingText?'退出选字':'选字复制';
 $('#selectText').setAttribute('aria-pressed',selectingText?'true':'false');
}
function face(c,kind){
 const custom=savedGloss(c,kind),hasCustom=custom!==undefined;
 let out='<div class="face-label">'+(kind==='p'?'问题 / 前提':'答案 / 结论')+'</div><div class="face-lines">';
 const gs=groups(c,kind);
 if(!gs.length)out+='<p class="empty-face">本面尚无标注内容</p>';
 for(const g of gs){
  out+='<section class="recall-group"><p class="group-text ruby-text">'+g.map(i=>'<span class="clause-segment" data-seg-index="'+i+'">'+rubyHTML(c,i)+'</span>').join('')+'</p>';
  if(!hasCustom)out+='<p class="group-gloss">'+esc(g.map(i=>c.segmentGloss[i]||'').join(''))+'</p>';
  out+='</section>';
 }
 if(hasCustom)out+='<div class="custom-gloss"><b>我保存的白话</b><p>'+esc(custom)+'</p></div>';
 const inherited=c.originIds.filter(id=>id!==c.id&&state.sideGlossEdits[id]&&Object.prototype.hasOwnProperty.call(state.sideGlossEdits[id],kind));
 if(inherited.length){
  out+='<details class="inherited-gloss"><summary>原卡保存的白话（保留）</summary>';
  for(const id of inherited)out+='<p>'+esc(state.sideGlossEdits[id][kind]||'')+'</p>';
  out+='</details>';
 }

 out+='</div>';
 return out;
}
function legacyNotes(c){
 const html=[];
 for(const id of c.originIds){
  const box=state.sideGlossEdits[id];
  if(id===c.id||!box)continue;
  const title=base.find(b=>b.id===id)?.text.slice(0,32)||id;
  html.push('<p><b>'+esc(title)+'</b>　前提：'+esc(box.p??'')+'　结论：'+esc(box.c??'')+'</p>');
 }
 if(state.glossEdits[c.id])html.push('<p>'+esc(state.glossEdits[c.id])+'</p>');
 $('#legacyGloss').hidden=!html.length;$('#legacyGlossText').innerHTML=html.join('');
}
function render(){
 const c=current();if(!c)return;
 const fk=state.direction==='forward'?'p':'c',bk=fk==='p'?'c':'p';
 renderFaces();
 $('#progress').textContent=(state.orderMode==='random'?String(state.randomPos+1):String(state.i+1))+' / '+cards.length+' · 原条 '+(c.firstBaseIndex+1);
 $('#chapter').textContent=c.chapter+' · 原文行 '+c.line+(c.originIds.length>1?' · 合并 '+c.originIds.length+' 条':'');
 $('#direction').textContent=state.direction==='forward'?'正向：前提 → 结论':'反向：结论 → 前提';
 $('#orderMode').textContent=state.orderMode==='random'?'随机':'顺序';
 $('#pinyinToggle').textContent=state.showPinyin?'拼音：开':'拼音：关';
 $('#jump').max=cards.length;$('#jump').value=state.i+1;
 $('#original').textContent=c.text;
 $('#segments').innerHTML=c.segments.map((phrase,i)=>{
  const l=labels(c)[i];
  return '<span class="clause-edit-unit"><button class="seg '+(l==='p'?'premise':'conclusion')+'" data-seg="'+i+'" type="button" title="点击切换前提／结论"><small>'+(l==='p'?'问':'答')+'</small>'+esc(phrase)+'</button>'+
   (i<c.segments.length-1?'<button class="split-here" data-split="'+i+'" type="button" title="在此句段后拆成下一张卡" aria-label="第'+(i+1)+'段后拆卡">✂</button>':'')+'</span>';
 }).join('');
 $('#premiseGlossEdit').value=gloss(c,'p');$('#conclusionGlossEdit').value=gloss(c,'c');
 $('#mergePrev').disabled=c.firstUnit===0;
 $('#mergeNext').disabled=c.lastUnit>=units.length-1;
 $('#splitCard').disabled=c.segments.length<2;
 $('#mergeNote').textContent='拆分/合并仅改变卡片边界，不会改动原文；原有标注和旧白话记录继续保留。';
 legacyNotes(c);persist();
 window.recallStudyCardChanged?.(c);
}
function navigate(delta){
 let idx=state.i;
 if(state.orderMode==='random'){
  ensureRandom();
  const pos=Math.max(0,Math.min(cards.length-1,state.randomPos+delta));
  idx=cards.findIndex(c=>c.id===state.randomOrder[pos]);
 }else idx=Math.max(0,Math.min(cards.length-1,state.i+delta));
 if(idx===state.i||idx<0)return;
 state.i=idx;state.cardKey=units[current().firstUnit].key;state.flipped=false;
 if(state.orderMode==='random')ensureRandom();
 render();
}
function jumpToBase(i){
 const bi=Math.max(0,Math.min(base.length-1,Number(i)||0));
 const pos=units.findIndex(u=>u.baseIndex===bi);
 const ix=cards.findIndex(c=>c.firstUnit<=pos&&c.lastUnit>=pos);
 if(ix<0)return;
 state.i=ix;state.cardKey=units[current().firstUnit].key;
 if(state.orderMode==='random')ensureRandom();
 state.flipped=false;render();
}
function resetLayoutBoundary(pos,split){
 if(pos>=units.length-1||pos<0)return;
 const key=units[pos].key;
 const original=units[pos].baseId!==units[pos+1].baseId;
 if(split===original)delete state.boundaries[key];
 else state.boundaries[key]=split;
 const oldKey=state.cardKey;
 constructCards();
 state.cardKey=oldKey;locate();state.flipped=false;
 if(state.orderMode==='random')shuffle(),ensureRandom();
 render();
}
function setSplit(i){
 const c=current();
 if(i<0||i>=c.segments.length-1)return;
 resetLayoutBoundary(c.firstUnit+i,true);
 $('#editor').classList.add('open');
}
function merge(direction){
 const c=current(),boundary=direction==='prev'?c.firstUnit-1:c.lastUnit;
 resetLayoutBoundary(boundary,false);
}
function flip(){window.getSelection()?.removeAllRanges();state.flipped=!state.flipped;$('#flashcard').classList.toggle('flipped',state.flipped);}
function setLabel(i){
 const c=current(),src=c.sourceMap[i],old=base[src.baseIndex];
 const arr=Array.isArray(state.edits[src.id])&&state.edits[src.id].length===old.segments.length?[...state.edits[src.id]]:[...old.defaults];
 arr[src.index]=arr[src.index]==='p'?'c':'p';state.edits[src.id]=arr;render();
}
function onGlossInput(kind,selector){
 const c=current(),v=$(selector).value;
 state.sideGlossEdits[c.id]??={};
 state.sideGlossEdits[c.id][kind]=v;persist();
}
function copyText(){
 const c=current(),kind=(state.direction==='forward')===(state.flipped===false)?'p':'c';
 const value=groups(c,kind).map(a=>a.map(i=>c.segments[i]).join('')).join('\n');
 const done=()=>{$('#autoSaveStatus').textContent='原文已复制';};
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(done).catch(()=>copyFallback(value,done));
 else copyFallback(value,done);
}
function copyFallback(value,done){
 const t=document.createElement('textarea');t.value=value;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();
 try{document.execCommand('copy');done();}finally{t.remove();}
}
let selectTime=0;
$('#flashcard').addEventListener('pointerdown',e=>{startPoint={x:e.clientX,y:e.clientY};});
$('#flashcard').addEventListener('pointerup',e=>{if(startPoint&&Math.hypot(e.clientX-startPoint.x,e.clientY-startPoint.y)>5)selectTime=Date.now();});
$('#flashcard').addEventListener('click',e=>{
 // Phone taps are for selection/reading. Flips must be explicit on touch screens.
 if(window.matchMedia('(pointer:coarse)').matches)return;
 if(e.target.closest('button,a,.group-text,.group-gloss,.custom-gloss'))return;
 if(Date.now()-selectTime<700)return;
 if(!window.getSelection()?.isCollapsed)return;
 flip();
});
document.addEventListener('copy',e=>{
 const s=window.getSelection();
 if(!s||s.isCollapsed||!s.rangeCount)return;
 const a=s.anchorNode?.parentElement,b=s.focusNode?.parentElement;
 if(!a?.closest('#flashcard')||!b?.closest('#flashcard'))return;
 const box=document.createElement('div');box.appendChild(s.getRangeAt(0).cloneContents());
 box.querySelectorAll('rt').forEach(n=>n.remove());
 e.clipboardData?.setData('text/plain',box.textContent||'');
 if(e.clipboardData)e.preventDefault();
});
$('#prev').onclick=()=>navigate(-1);$('#next').onclick=()=>navigate(1);
$('#direction').onclick=()=>{state.direction=state.direction==='forward'?'reverse':'forward';state.flipped=false;render();};
$('#orderMode').onclick=()=>{state.orderMode=state.orderMode==='random'?'sequential':'random';if(state.orderMode==='random')ensureRandom();state.flipped=false;render();};
$('#pinyinToggle').onclick=()=>{state.showPinyin=!state.showPinyin;render();};
$('#copyFace').onclick=copyText;
$('#flipFace').onclick=flip;
$('#mobileFlip').onclick=flip;
$('#mobilePrev').onclick=()=>navigate(-1);
$('#mobileNext').onclick=()=>navigate(1);
$('#selectText').onclick=()=>{selectingText=!selectingText;window.getSelection()?.removeAllRanges();renderFaces();};
$('#toggleEdit').onclick=()=>{$('#editor').classList.toggle('open');};
$('#splitCard').onclick=()=>{$('#editor').classList.add('open');document.querySelector('.split-here')?.scrollIntoView({block:'nearest'});};
$('#mergePrev').onclick=()=>merge('prev');
$('#mergeNext').onclick=()=>merge('next');
$('#segments').addEventListener('click',e=>{
 const split=e.target.closest('[data-split]'),seg=e.target.closest('[data-seg]');
 if(split)setSplit(Number(split.dataset.split));else if(seg)setLabel(Number(seg.dataset.seg));
});
$('#resetOne').onclick=()=>{
 const c=current();
 for(const id of c.originIds){
  delete state.edits[id];
 }
 delete state.sideGlossEdits[c.id];render();
};
$('#premiseGlossEdit').addEventListener('input',()=>onGlossInput('p','#premiseGlossEdit'));
$('#conclusionGlossEdit').addEventListener('input',()=>onGlossInput('c','#conclusionGlossEdit'));
$('#premiseGlossEdit').addEventListener('blur',render);
$('#conclusionGlossEdit').addEventListener('blur',render);
$('#jump').addEventListener('change',e=>{const n=Math.max(1,Math.min(cards.length,Number(e.target.value)||1));state.i=n-1;state.cardKey=units[current().firstUnit].key;state.flipped=false;if(state.orderMode==='random')ensureRandom();render();});
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea'))return;
 if(e.key==='ArrowDown'||e.key==='PageDown')navigate(1);
 else if(e.key==='ArrowUp'||e.key==='PageUp')navigate(-1);
 else if(e.key===' '||e.key==='Enter'){e.preventDefault();flip();}
});
$('#flashcard').addEventListener('wheel',e=>{
 if(window.matchMedia('(pointer:coarse)').matches||Math.abs(e.deltaY)<24)return;
 e.preventDefault();if(wheelLock)return;
 wheelLock=true;navigate(e.deltaY>0?1:-1);
 setTimeout(()=>wheelLock=false,320);
},{passive:false});
// On touch devices a swipe always scrolls the page. Use the explicit
// navigation buttons to change cards, avoiding conflict with selection,
 // dictionary scrolling, and expandable scholar commentary.
window.recallJumpTo=jumpToBase;
window.recallFocusSegments=indexes=>{
 const c=current(),lab=labels(c),list=(indexes||[]).map(Number).filter(i=>Number.isInteger(i)&&i>=0&&i<c.segments.length);
 const kinds=[...new Set(list.map(i=>lab[i]))];
 if(kinds.length===1){state.flipped=kinds[0]!==(state.direction==='forward'?'p':'c');$('#flashcard').classList.toggle('flipped',state.flipped);}
 document.querySelectorAll('.clause-segment.commentary-target').forEach(x=>x.classList.remove('commentary-target'));
 for(const i of list)document.querySelectorAll('.clause-segment[data-seg-index="'+i+'"]').forEach(x=>x.classList.add('commentary-target'));
};
window.recallClearCommentaryFocus=()=>document.querySelectorAll('.clause-segment.commentary-target').forEach(x=>x.classList.remove('commentary-target'));
restore();render();
})();