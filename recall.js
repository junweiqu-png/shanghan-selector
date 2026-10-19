(()=>{
const DATA=window.SHANGHAN_RECALL||SHANGHAN_RECALL;
const KEY='shanghan-recall-v2',OLD_KEY='shanghan-recall-v1';
const state={i:0,flipped:false,direction:'forward',edits:{},glossEdits:{},sideGlossEdits:{}};
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function restore(){
  try{
    let raw=localStorage.getItem(KEY);
    if(!raw)raw=localStorage.getItem(OLD_KEY);
    const x=JSON.parse(raw||'{}');
    state.i=Math.max(0,Math.min(DATA.cards.length-1,Number(x.i)||0));
    state.direction=x.direction==='reverse'?'reverse':'forward';
    state.edits=x.edits||{};
    state.glossEdits=x.glossEdits||{};
    state.sideGlossEdits=x.sideGlossEdits||{};
  }catch{}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify({i:state.i,direction:state.direction,edits:state.edits,glossEdits:state.glossEdits,sideGlossEdits:state.sideGlossEdits}));}catch{}}
function labels(card){const e=state.edits[card.id];return Array.isArray(e)&&e.length===card.segments.length?e:[...card.defaults];}
function groups(card,kind){
  const ls=labels(card),out=[];let cur=[];
  card.segments.forEach((_,i)=>{if(ls[i]===kind)cur.push(i);else if(cur.length){out.push(cur);cur=[];}});
  if(cur.length)out.push(cur);return out;
}
function autoSideGloss(card,kind){
  const ids=groups(card,kind).flat();
  const arr=card.segmentGloss||card.segments.map(()=> '');
  return ids.map(i=>arr[i]||'').filter(Boolean).join('');
}
function savedSideGloss(card,kind){
  return state.sideGlossEdits[card.id]?.[kind]||'';
}
function sideGloss(card,kind){return savedSideGloss(card,kind)||autoSideGloss(card,kind)||'暂无白话释义';}
function sidePinyin(card,ids){
  const arr=card.segmentPinyin||[];
  if(arr.length===card.segments.length)return ids.map(i=>arr[i]||'').filter(Boolean).join(' ');
  return '';
}
function renderGroup(card,ids){
  const text=ids.map(i=>card.segments[i]).join('');
  const py=sidePinyin(card,ids);
  const gl=(card.segmentGloss&&card.segmentGloss.length===card.segments.length)?ids.map(i=>card.segmentGloss[i]||'').join(''):'';
  return '<section class="recall-group"><p class="group-text">'+esc(text)+'</p>'+
    (py?'<p class="group-pinyin">'+esc(py)+'</p>':'')+
    (gl?'<p class="group-gloss">'+esc(gl)+'</p>':'')+'</section>';
}
function face(card,kind,title){
  const gs=groups(card,kind);
  const custom=savedSideGloss(card,kind);
  return '<div class="face-label">'+title+'</div><div class="face-lines">'+
    (gs.length?gs.map(ids=>renderGroup(card,ids)).join(''):'<p class="empty-face">尚未标注</p>')+
    (custom?'<div class="custom-gloss"><b>我保存的白话</b><p>'+esc(custom)+'</p></div>':'')+
    '</div>';
}
function render(){
 const c=DATA.cards[state.i],ls=labels(c),frontKind=state.direction==='forward'?'p':'c',backKind=frontKind==='p'?'c':'p';
 $('#progress').textContent=(state.i+1)+' / '+DATA.cards.length;
 $('#chapter').textContent=c.chapter+' · 原文行 '+c.line;
 $('#direction').textContent=state.direction==='forward'?'正向：前提 → 结论':'反向：结论 → 前提';
 $('#flashcard').classList.toggle('flipped',state.flipped);
 $('#front').innerHTML=face(c,frontKind,frontKind==='p'?'问题 / 前提':'答案 / 结论');
 $('#back').innerHTML=face(c,backKind,backKind==='p'?'问题 / 前提':'答案 / 结论');
 $('#segments').innerHTML=c.segments.map((s,i)=>'<button type="button" data-seg="'+i+'" class="seg '+(ls[i]==='p'?'premise':'conclusion')+'"><span>'+(ls[i]==='p'?'前提':'结论')+'</span>'+esc(s)+'</button>').join('');
 $('#original').textContent=c.text;
 $('#premiseGlossEdit').value=sideGloss(c,'p');
 $('#conclusionGlossEdit').value=sideGloss(c,'c');
 const legacy=state.glossEdits[c.id]||'';
 $('#legacyGloss').hidden=!legacy;
 $('#legacyGlossText').textContent=legacy;
 $('#jump').value=state.i+1;save();
}
function go(delta){const n=Math.max(0,Math.min(DATA.cards.length-1,state.i+delta));if(n===state.i)return;state.i=n;state.flipped=false;render();}
function flip(){state.flipped=!state.flipped;$('#flashcard').classList.toggle('flipped',state.flipped);}
function cycle(idx){const c=DATA.cards[state.i],ls=labels(c);ls[idx]=ls[idx]==='p'?'c':'p';state.edits[c.id]=ls;render();}
function saveSideGloss(kind,selector){
  const c=DATA.cards[state.i],v=$(selector).value.trim();
  state.sideGlossEdits[c.id]=state.sideGlossEdits[c.id]||{};
  if(v&&v!==autoSideGloss(c,kind))state.sideGlossEdits[c.id][kind]=v;else delete state.sideGlossEdits[c.id][kind];
  if(!Object.keys(state.sideGlossEdits[c.id]).length)delete state.sideGlossEdits[c.id];
  save();render();
}
$('#flashcard').addEventListener('click',e=>{if(e.target.closest('button,input,textarea'))return;flip();});
$('#prev').onclick=()=>go(-1);$('#next').onclick=()=>go(1);
$('#direction').onclick=()=>{state.direction=state.direction==='forward'?'reverse':'forward';state.flipped=false;render();};
$('#segments').addEventListener('click',e=>{const b=e.target.closest('[data-seg]');if(b)cycle(Number(b.dataset.seg));});
$('#resetOne').onclick=()=>{const id=DATA.cards[state.i].id;delete state.edits[id];delete state.sideGlossEdits[id];render();};
$('#resetAll').onclick=()=>{if(confirm('恢复全部自动标注和分面白话？你之前保存的旧版整条白话仍保留。')){state.edits={};state.sideGlossEdits={};render();}};
$('#savePremiseGloss').onclick=()=>saveSideGloss('p','#premiseGlossEdit');
$('#saveConclusionGloss').onclick=()=>saveSideGloss('c','#conclusionGlossEdit');
$('#jump').addEventListener('change',e=>{const n=Math.max(1,Math.min(DATA.cards.length,Number(e.target.value)||1));state.i=n-1;state.flipped=false;render();});
$('#toggleEdit').onclick=()=>$('#editor').classList.toggle('open');
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.key==='ArrowDown'||e.key==='PageDown')go(1);else if(e.key==='ArrowUp'||e.key==='PageUp')go(-1);else if(e.key===' '||e.key==='Enter'){e.preventDefault();flip();}});
let wheelLock=false;
$('#stage').addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<24)return;e.preventDefault();if(wheelLock)return;wheelLock=true;go(e.deltaY>0?1:-1);setTimeout(()=>wheelLock=false,320);},{passive:false});
let touchY=null;
$('#stage').addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY??null;},{passive:true});
$('#stage').addEventListener('touchend',e=>{if(touchY==null)return;const y=e.changedTouches[0]?.clientY??touchY,d=touchY-y;touchY=null;if(Math.abs(d)>55)go(d>0?1:-1);},{passive:true});
restore();render();
})();