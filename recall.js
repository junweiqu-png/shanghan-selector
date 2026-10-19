(()=>{
const DATA=window.SHANGHAN_RECALL||SHANGHAN_RECALL;
const KEY='shanghan-recall-v2',OLD_KEY='shanghan-recall-v1';
const state={i:0,flipped:false,direction:'forward',edits:{},glossEdits:{},sideGlossEdits:{},orderMode:'sequential',randomOrder:[],randomPos:0};
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function validRandomOrder(a){return Array.isArray(a)&&a.length===DATA.cards.length&&new Set(a).size===DATA.cards.length&&a.every(n=>Number.isInteger(n)&&n>=0&&n<DATA.cards.length);}
function shuffleOrder(){
  const a=Array.from({length:DATA.cards.length},(_,i)=>i);
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  state.randomOrder=a;state.randomPos=Math.max(0,a.indexOf(state.i));
}
function ensureRandomOrder(){if(!validRandomOrder(state.randomOrder))shuffleOrder();else state.randomPos=Math.max(0,state.randomOrder.indexOf(state.i));}
function restore(){
  try{
    let raw=localStorage.getItem(KEY);if(!raw)raw=localStorage.getItem(OLD_KEY);
    const x=JSON.parse(raw||'{}');
    state.i=Math.max(0,Math.min(DATA.cards.length-1,Number(x.i)||0));
    state.direction=x.direction==='reverse'?'reverse':'forward';
    state.edits=x.edits||{};state.glossEdits=x.glossEdits||{};state.sideGlossEdits=x.sideGlossEdits||{};
    state.orderMode=x.orderMode==='random'?'random':'sequential';
    state.randomOrder=validRandomOrder(x.randomOrder)?x.randomOrder:[];
    state.randomPos=Number.isInteger(x.randomPos)?x.randomPos:0;
    if(state.orderMode==='random')ensureRandomOrder();
  }catch{}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify({i:state.i,direction:state.direction,edits:state.edits,glossEdits:state.glossEdits,sideGlossEdits:state.sideGlossEdits,orderMode:state.orderMode,randomOrder:state.randomOrder,randomPos:state.randomPos}));}catch{}}
function labels(card){const e=state.edits[card.id];return Array.isArray(e)&&e.length===card.segments.length?e:[...card.defaults];}
function groups(card,kind){
  const ls=labels(card),out=[];let cur=[];
  card.segments.forEach((_,i)=>{if(ls[i]===kind)cur.push(i);else if(cur.length){out.push(cur);cur=[];}});
  if(cur.length)out.push(cur);return out;
}
function autoSideGloss(card,kind){
  const ids=groups(card,kind).flat(),arr=card.segmentGloss||card.segments.map(()=> '');
  return ids.map(i=>arr[i]||'').filter(Boolean).join('');
}
function savedSideGloss(card,kind){
  const box=state.sideGlossEdits[card.id];
  return box&&Object.prototype.hasOwnProperty.call(box,kind)?box[kind]:undefined;
}
function sideGloss(card,kind){const saved=savedSideGloss(card,kind);return saved!==undefined?saved:(autoSideGloss(card,kind)||'暂无白话释义');}
function rubyTokens(card,ids){
  const arr=card.segmentRuby||[];
  if(arr.length!==card.segments.length)return null;
  return ids.flatMap(i=>arr[i]||[]);
}
function rubyHTML(card,ids){
  const toks=rubyTokens(card,ids);
  if(!toks)return esc(ids.map(i=>card.segments[i]).join(''));
  return toks.map(t=>{
    const ch=esc(t.c||'');
    return t.p?'<ruby><rb>'+ch+'</rb><rt>'+esc(t.p)+'</rt></ruby>':'<span class="punct">'+ch+'</span>';
  }).join('');
}
function renderGroup(card,ids,showGloss=true){
  const gl=(card.segmentGloss&&card.segmentGloss.length===card.segments.length)?ids.map(i=>card.segmentGloss[i]||'').join(''):'';
  return '<section class="recall-group"><p class="group-text ruby-text">'+rubyHTML(card,ids)+'</p>'+
    (showGloss&&gl?'<p class="group-gloss">'+esc(gl)+'</p>':'')+'</section>';
}
function face(card,kind,title){
  const gs=groups(card,kind),custom=savedSideGloss(card,kind),hasCustom=custom!==undefined;
  return '<div class="face-label">'+title+'</div><div class="face-lines">'+
    (gs.length?gs.map(ids=>renderGroup(card,ids,!hasCustom)).join(''):'<p class="empty-face">尚未标注</p>')+
    (hasCustom?'<div class="custom-gloss"><b>白话</b><p>'+esc(custom||'')+'</p></div>':'')+
    '</div>';
}
function progressText(){
  if(state.orderMode==='random'){ensureRandomOrder();return (state.randomPos+1)+' / '+DATA.cards.length+' · 原序 '+(state.i+1);}
  return (state.i+1)+' / '+DATA.cards.length;
}
function render(){
 const c=DATA.cards[state.i],ls=labels(c),frontKind=state.direction==='forward'?'p':'c',backKind=frontKind==='p'?'c':'p';
 $('#progress').textContent=progressText();
 $('#chapter').textContent=c.chapter+' · 原文行 '+c.line;
 $('#direction').textContent=state.direction==='forward'?'正向：前提 → 结论':'反向：结论 → 前提';
 $('#orderMode').textContent=state.orderMode==='random'?'随机':'顺序';
 $('#orderMode').title=state.orderMode==='random'?'当前按固定随机顺序浏览，点击切回原书顺序':'当前按《伤寒论》原书顺序浏览，点击切换随机';
 $('#flashcard').classList.toggle('flipped',state.flipped);
 $('#front').innerHTML=face(c,frontKind,frontKind==='p'?'问题 / 前提':'答案 / 结论');
 $('#back').innerHTML=face(c,backKind,backKind==='p'?'问题 / 前提':'答案 / 结论');
 $('#segments').innerHTML=c.segments.map((s,i)=>'<button type="button" data-seg="'+i+'" class="seg '+(ls[i]==='p'?'premise':'conclusion')+'"><span>'+(ls[i]==='p'?'前提':'结论')+'</span>'+esc(s)+'</button>').join('');
 $('#original').textContent=c.text;
 $('#premiseGlossEdit').value=sideGloss(c,'p');
 $('#conclusionGlossEdit').value=sideGloss(c,'c');
 const legacy=state.glossEdits[c.id]||'';
 $('#legacyGloss').hidden=!legacy;$('#legacyGlossText').textContent=legacy;
 $('#jump').value=state.i+1;save();
 window.recallStudyCardChanged?.(c);
}
function go(delta){
  if(state.orderMode==='random'){
    ensureRandomOrder();
    const p=Math.max(0,Math.min(DATA.cards.length-1,state.randomPos+delta));
    if(p===state.randomPos)return;state.randomPos=p;state.i=state.randomOrder[p];
  }else{
    const n=Math.max(0,Math.min(DATA.cards.length-1,state.i+delta));if(n===state.i)return;state.i=n;
  }
  state.flipped=false;render();
}
function flip(){state.flipped=!state.flipped;$('#flashcard').classList.toggle('flipped',state.flipped);}
function cycle(idx){const c=DATA.cards[state.i],ls=labels(c);ls[idx]=ls[idx]==='p'?'c':'p';state.edits[c.id]=ls;save();render();}
function autoSaveGloss(kind,selector){
  const c=DATA.cards[state.i],v=$(selector).value;
  state.sideGlossEdits[c.id]=state.sideGlossEdits[c.id]||{};
  state.sideGlossEdits[c.id][kind]=v;save();
  $('#autoSaveStatus').textContent='已自动保存';
}
$('#flashcard').addEventListener('click',e=>{if(e.target.closest('button,input,textarea'))return;const s=window.getSelection?.();if(s&&!s.isCollapsed&&s.toString().trim())return;flip();});
$('#prev').onclick=()=>go(-1);$('#next').onclick=()=>go(1);
$('#direction').onclick=()=>{state.direction=state.direction==='forward'?'reverse':'forward';state.flipped=false;render();};
$('#orderMode').onclick=()=>{state.orderMode=state.orderMode==='random'?'sequential':'random';if(state.orderMode==='random')ensureRandomOrder();state.flipped=false;render();};
$('#segments').addEventListener('click',e=>{const b=e.target.closest('[data-seg]');if(b)cycle(Number(b.dataset.seg));});
$('#resetOne').onclick=()=>{const id=DATA.cards[state.i].id;delete state.edits[id];delete state.sideGlossEdits[id];save();render();};
$('#premiseGlossEdit').addEventListener('input',()=>autoSaveGloss('p','#premiseGlossEdit'));
$('#conclusionGlossEdit').addEventListener('input',()=>autoSaveGloss('c','#conclusionGlossEdit'));
$('#premiseGlossEdit').addEventListener('blur',render);$('#conclusionGlossEdit').addEventListener('blur',render);
$('#jump').addEventListener('change',e=>{const n=Math.max(1,Math.min(DATA.cards.length,Number(e.target.value)||1));state.i=n-1;if(state.orderMode==='random')ensureRandomOrder();state.flipped=false;render();});
$('#toggleEdit').onclick=()=>{const ed=$('#editor'),wasOpen=ed.classList.contains('open');ed.classList.toggle('open');if(wasOpen)render();};
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.key==='ArrowDown'||e.key==='PageDown')go(1);else if(e.key==='ArrowUp'||e.key==='PageUp')go(-1);else if(e.key===' '||e.key==='Enter'){e.preventDefault();flip();}});
let wheelLock=false;
$('#flashcard').addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<24)return;e.preventDefault();if(wheelLock)return;wheelLock=true;go(e.deltaY>0?1:-1);setTimeout(()=>wheelLock=false,320);},{passive:false});
let touchY=null;
$('#flashcard').addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY??null;},{passive:true});
$('#flashcard').addEventListener('touchend',e=>{if(touchY==null)return;const y=e.changedTouches[0]?.clientY??touchY,d=touchY-y;touchY=null;if(Math.abs(d)>55)go(d>0?1:-1);},{passive:true});
window.recallJumpTo=idx=>{const n=Math.max(0,Math.min(DATA.cards.length-1,Number(idx)||0));state.i=n;if(state.orderMode==='random')ensureRandomOrder();state.flipped=false;render();};
restore();render();
})();