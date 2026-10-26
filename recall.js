(()=>{
'use strict';
const DATA=window.SHANGHAN_RECALL||SHANGHAN_RECALL;
const KEY='shanghan-recall-v2', OLD_KEY='shanghan-recall-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const base=DATA.cards;
// Each original article stays one card, regardless of how many Q/A sections it has.
const cards=base.map((c,i)=>({
 ...c,
 firstBaseIndex:i,
 sourceMap:c.segments.map((_,j)=>({id:c.id,index:j,baseIndex:i,key:c.id+':'+j})),
 originIds:[c.id]
}));
const state={i:0,cardKey:null,flipped:false,direction:'forward',edits:{},glossEdits:{},sideGlossEdits:{},orderMode:'sequential',randomOrder:[],randomPos:0,boundaries:{},lineBreaks:{},showPinyin:true};
let wheelLock=false,selectingText=false;
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
   boundaries:state.boundaries,lineBreaks:state.lineBreaks,showPinyin:state.showPinyin
  }));
  $('#autoSaveStatus').textContent='已自动保存';
 }catch{$('#autoSaveStatus').textContent='本地保存不可用';}
}
function restore(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem(OLD_KEY)||'{}');
  state.direction=x.direction==='reverse'?'reverse':'forward';
  state.edits=x.edits||{};state.glossEdits=x.glossEdits||{};
  state.sideGlossEdits=x.sideGlossEdits||{};
  state.orderMode=x.orderMode==='random'?'random':'sequential';
  state.boundaries=x.boundaries&&typeof x.boundaries==='object'?x.boundaries:{};
  state.lineBreaks=x.lineBreaks&&typeof x.lineBreaks==='object'?x.lineBreaks:{};
  state.randomOrder=x.randomOrder||[];state.showPinyin=x.showPinyin!==false;
  // Convert previous "split this into another card" markers into intra-card
  // line breaks. Never merge or split the original clauses themselves.
  for(const c of cards){
   if(Object.prototype.hasOwnProperty.call(state.lineBreaks,c.id))continue;
   const lines=[];
   for(let i=0;i<c.segments.length-1;i++){
    if(state.boundaries[c.id+':'+i]===true)lines.push(i+1);
   }
   if(lines.length)state.lineBreaks[c.id]=lines;
  }
  const key=x.cardKey||'';
  const matched=cards.findIndex(c=>key===c.id||key.startsWith(c.id+':'));
  state.i=matched>=0?matched:Math.max(0,Math.min(cards.length-1,Number(x.i)||0));
 }catch{}
 state.cardKey=cards[state.i]?.id||null;
 if(state.orderMode==='random')ensureRandom();
}
function current(){return cards[state.i];}
function labels(c){
 const saved=state.edits[c.id];
 return Array.isArray(saved)&&saved.length===c.segments.length?saved:c.defaults;
}
function breaks(c){return Array.isArray(state.lineBreaks[c.id])?state.lineBreaks[c.id]:[];}
function groups(c,kind){
 const lab=labels(c),custom=new Set(breaks(c)),out=[];let buf=[];
 for(let i=0;i<lab.length;i++){
  if(lab[i]!==kind){if(buf.length){out.push(buf);buf=[];}continue;}
  if(buf.length&&custom.has(i)){out.push(buf);buf=[];}
  buf.push(i);
 }
 if(buf.length)out.push(buf);
 return out;
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
// Fit both sides of ordinary desktop cards without creating an inner
// scrollbar. If an unusually long original will not fit legibly, allow
// the card itself to grow; never crop the text.
function fitCard(){
 const wrap=$('.card-wrap'),card=$('#flashcard');
 if(!wrap||!card||!wrap.style?.setProperty)return;
 if(!window.matchMedia('(min-width: 901px)').matches){
  wrap.classList.remove('card-expanded');
  wrap.style.removeProperty('--card-text-size');
  wrap.style.removeProperty('--card-gloss-size');
  return;
 }
 wrap.classList.remove('card-expanded');
 const wasFlipped=state.flipped;
 let fits=false;
 for(let size=22;size>=16;size--){
  wrap.style.setProperty('--card-text-size',size+'px');
  wrap.style.setProperty('--card-gloss-size',Math.max(12,size-8)+'px');
  let tooTall=false,measured=true;
  for(const flipped of [false,true]){
   card.classList.toggle('flipped',flipped);
   const face=$(flipped?'#back':'#front');
   if(!face?.clientHeight){measured=false;break;}
   if(face.scrollHeight>face.clientHeight+2){tooTall=true;break;}
  }
  if(measured&&!tooTall){fits=true;break;}
  if(!measured)break;
 }
 card.classList.toggle('flipped',wasFlipped);
 if(!fits)wrap.classList.add('card-expanded');
}
function renderFaces(){
 const c=current(),fk=state.direction==='forward'?'p':'c',bk=fk==='p'?'c':'p';
 $('#front').innerHTML=face(c,fk);
 $('#back').innerHTML=face(c,bk);
 $('#flashcard').classList.toggle('flipped',state.flipped);
 $('#selectText').textContent=selectingText?'退出选字':'选字复制';
 $('#selectText').setAttribute('aria-pressed',selectingText?'true':'false');
 fitCard();
}
function face(c,kind){
 const custom=savedGloss(c,kind),hasCustom=custom!==undefined;
 let out='<div class="face-label">'+(kind==='p'?'问题 / 前提':'答案 / 结论')+'</div><div class="face-lines">';
 const gs=groups(c,kind);
 if(!gs.length)out+='<p class="empty-face">本面尚无标注内容</p>';
 for(const [groupNumber,g] of gs.entries()){
  out+='<section class="recall-group">'+(gs.length>1?'<div class="question-group-number">'+(kind==='p'?'问题 ':'答案 ')+(groupNumber+1)+'</div>':'')+
  '<p class="group-text ruby-text">'+g.map(i=>'<span class="clause-segment" data-seg-index="'+i+'">'+rubyHTML(c,i)+'</span>').join('')+'</p>';
  if(!hasCustom)out+='<p class="group-gloss">'+esc(g.map(i=>c.segmentGloss[i]||'').join(''))+'</p>';
  out+='</section>';
 }
 if(hasCustom)out+='<div class="custom-gloss"><b>我保存的白话</b><p>'+esc(custom)+'</p></div>';
 // Old split-card translations are retained under their former cut IDs
 // and remain readable here; do not silently delete old user content.
 const oldSplits=Object.keys(state.sideGlossEdits).filter(id=>
  id.startsWith('cut:')&&(id.includes('cut:'+c.id+':')||id.includes('|'+c.id+':'))&&
  Object.prototype.hasOwnProperty.call(state.sideGlossEdits[id],kind)
 );
 if(oldSplits.length){
  out+='<details class="inherited-gloss"><summary>以前拆卡时保存的白话（已保留）</summary>';
  for(const id of oldSplits)out+='<p>'+esc(state.sideGlossEdits[id][kind]||'')+'</p>';
  out+='</details>';
 }
 out+='</div>';
 return out;
}
function legacyNotes(c){
 const html=[];
 if(state.glossEdits[c.id])html.push('<p>'+esc(state.glossEdits[c.id])+'</p>');
 const related=Object.entries(state.sideGlossEdits).filter(([id])=>id.startsWith('cut:')&&(id.includes('cut:'+c.id+':')||id.includes('|'+c.id+':')));
 for(const [id,box] of related){
  html.push('<p><b>旧拆卡记录</b>　'+esc(id)+'<p>前提：'+esc(box.p??'')+'　结论：'+esc(box.c??'')+'</p></p>');
 }
 $('#legacyGloss').hidden=!html.length;
 $('#legacyGlossText').innerHTML=html.join('');
}
function render(){
 const c=current();if(!c)return;
 const fk=state.direction==='forward'?'p':'c',bk=fk==='p'?'c':'p';
 renderFaces();
 $('#progress').textContent=(state.orderMode==='random'?String(state.randomPos+1):String(state.i+1))+' / '+cards.length+(state.orderMode==='random'?' · 原序 '+(state.i+1):'');
 $('#chapter').textContent=c.chapter+' · 原文行 '+c.line;
 $('#direction').textContent=state.direction==='forward'?'正向：前提 → 结论':'反向：结论 → 前提';
 $('#orderMode').textContent=state.orderMode==='random'?'随机':'顺序';
 $('#pinyinToggle').textContent=state.showPinyin?'拼音：开':'拼音：关';
 $('#jump').max=cards.length;$('#jump').value=state.i+1;
 $('#original').textContent=c.text;
 $('#segments').innerHTML=c.segments.map((phrase,i)=>{
  const l=labels(c)[i],line=breaks(c).includes(i);
  return '<span class="clause-edit-unit">'+
   (i>0?'<button class="line-break-toggle'+(line?' active':'')+'" data-break="'+i+'" type="button" aria-pressed="'+line+'" title="本句在本张卡片上另起一行（不产生新卡）">'+(line?'↵':'·')+'</button>':'')+
   '<button class="seg '+(l==='p'?'premise':'conclusion')+'" data-seg="'+i+'" type="button" title="点击切换问题／答案"><small>'+(l==='p'?'问':'答')+'</small>'+esc(phrase)+'</button></span>';
 }).join('');
 $('#premiseGlossEdit').value=gloss(c,'p');$('#conclusionGlossEdit').value=gloss(c,'c');
 $('#mergeNote').textContent='一条原文始终是一张卡。点句段切换「问／答」，点句段左侧的 · 设为 ↵ 换行；自动保存。';
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
 state.i=idx;state.cardKey=current().id;state.flipped=false;
 if(state.orderMode==='random')ensureRandom();
 render();
}
function jumpToBase(i){
 const ix=Math.max(0,Math.min(cards.length-1,Number(i)||0));
 state.i=ix;state.cardKey=current().id;
 if(state.orderMode==='random')ensureRandom();
 state.flipped=false;render();
}
function flip(){window.getSelection()?.removeAllRanges();state.flipped=!state.flipped;$('#flashcard').classList.toggle('flipped',state.flipped);}
function setLabel(i){
 const c=current(),arr=[...labels(c)];
 arr[i]=arr[i]==='p'?'c':'p';state.edits[c.id]=arr;render();
}
function toggleLineBreak(i){
 const c=current();if(i<1||i>=c.segments.length)return;
 const set=new Set(breaks(c));
 if(set.has(i))set.delete(i);else set.add(i);
 state.lineBreaks[c.id]=[...set].sort((a,b)=>a-b);
 render();
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
// A short, stationary tap flips either face on phones. Swipes, long-press
// text selection and active "选字复制" mode never flip the card.
let tapGesture=null,lastTapEnd=null;
const tapDistance=e=>tapGesture?Math.hypot(e.clientX-tapGesture.x,e.clientY-tapGesture.y):0;
$('#flashcard').addEventListener('pointerdown',e=>{
 if(!e.isPrimary)return;
 tapGesture={x:e.clientX,y:e.clientY,started:Date.now(),moved:false};
});
$('#flashcard').addEventListener('pointermove',e=>{
 if(tapGesture&&tapDistance(e)>12)tapGesture.moved=true;
});
$('#flashcard').addEventListener('pointerup',e=>{
 if(!tapGesture)return;
 lastTapEnd={time:Date.now(),rejected:tapGesture.moved||tapDistance(e)>12||Date.now()-tapGesture.started>=500};
 tapGesture=null;
});
$('#flashcard').addEventListener('pointercancel',()=>{
 tapGesture=null;lastTapEnd={time:Date.now(),rejected:true};
});
$('#flashcard').addEventListener('click',e=>{
 if(selectingText||e.target.closest('button,a,input,textarea'))return;
 if(lastTapEnd&&Date.now()-lastTapEnd.time<450&&lastTapEnd.rejected)return;
 if(!window.getSelection()?.isCollapsed)return;
 // On desktop keep text taps selectable; on phones short taps on the actual
 // Chinese characters flip, while long-press still opens native selection.
 if(!window.matchMedia('(pointer:coarse)').matches&&
    e.target.closest('.group-text,.group-gloss,.custom-gloss'))return;
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
$('#segments').addEventListener('click',e=>{
 const br=e.target.closest('[data-break]'),seg=e.target.closest('[data-seg]');
 if(br)toggleLineBreak(Number(br.dataset.break));
 else if(seg)setLabel(Number(seg.dataset.seg));
});
$('#resetOne').onclick=()=>{
 const c=current();
 delete state.edits[c.id];
 state.lineBreaks[c.id]=[]; // Explicitly clear: do not re-migrate old split markers after reload.
 delete state.sideGlossEdits[c.id];render();
};
$('#premiseGlossEdit').addEventListener('input',()=>onGlossInput('p','#premiseGlossEdit'));
$('#conclusionGlossEdit').addEventListener('input',()=>onGlossInput('c','#conclusionGlossEdit'));
$('#premiseGlossEdit').addEventListener('blur',render);
$('#conclusionGlossEdit').addEventListener('blur',render);
$('#jump').addEventListener('change',e=>{const n=Math.max(1,Math.min(cards.length,Number(e.target.value)||1));state.i=n-1;state.cardKey=current().id;state.flipped=false;if(state.orderMode==='random')ensureRandom();render();});
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
window.addEventListener?.('resize',()=>fitCard());
restore();render();
})();