(()=>{
const DATA=window.SHANGHAN_RECALL||SHANGHAN_RECALL;
const KEY='shanghan-recall-v2';
const state={i:0,phase:0,direction:'forward',edits:{},glossEdits:{}};
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function restore(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');state.i=Math.max(0,Math.min(DATA.cards.length-1,Number(x.i)||0));state.direction=x.direction==='reverse'?'reverse':'forward';state.edits=x.edits||{};state.glossEdits=x.glossEdits||{};}catch{}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({i:state.i,direction:state.direction,edits:state.edits,glossEdits:state.glossEdits}));}catch{}}
function labels(card){const e=state.edits[card.id];return Array.isArray(e)&&e.length===card.segments.length?e:[...card.defaults];}
function groups(card,kind){const ls=labels(card),out=[];let cur=[];card.segments.forEach((s,i)=>{if(ls[i]===kind)cur.push(s);else if(cur.length){out.push(cur.join(''));cur=[];}});if(cur.length)out.push(cur.join(''));return out;}
function face(card,kind,title){const gs=groups(card,kind);return '<div class="face-label">'+title+'</div><div class="face-lines">'+(gs.length?gs.map(x=>'<p>'+esc(x)+'</p>').join(''):'<p class="empty-face">尚未标注</p>')+'</div>';}
function gloss(card){return state.glossEdits[card.id]||card.gloss||'暂无白话释义';}
function assist(card){return '<div class="face-label">拼音 + 白话</div><div class="assist-original">'+esc(card.text)+'</div><div class="assist-block"><b>拼音</b><p class="pinyin">'+esc(card.pinyin||'—')+'</p></div><div class="assist-block"><b>白话释义</b><p class="gloss">'+esc(gloss(card))+'</p><small>本站自动直译辅助，尽量保留医学术语；如有不妥可在下方编辑。</small></div>';}
function applyPhase(){
 const card=$('#flashcard');
 card.classList.toggle('flipped',state.phase===1);
 card.classList.toggle('assist-mode',state.phase===2);
 $('#phaseHint').textContent=state.phase===0?'当前：前提':state.phase===1?'当前：结论':'当前：拼音 + 白话';
}
function render(){
 const c=DATA.cards[state.i],ls=labels(c),frontKind=state.direction==='forward'?'p':'c',backKind=frontKind==='p'?'c':'p';
 $('#progress').textContent=(state.i+1)+' / '+DATA.cards.length;
 $('#chapter').textContent=c.chapter+' · 原文行 '+c.line;
 $('#direction').textContent=state.direction==='forward'?'正向：前提 → 结论':'反向：结论 → 前提';
 $('#front').innerHTML=face(c,frontKind,frontKind==='p'?'前提':'结论');
 $('#back').innerHTML=face(c,backKind,backKind==='p'?'前提':'结论');
 $('#assist').innerHTML=assist(c);
 $('#segments').innerHTML=c.segments.map((s,i)=>'<button type="button" data-seg="'+i+'" class="seg '+(ls[i]==='p'?'premise':'conclusion')+'"><span>'+(ls[i]==='p'?'前提':'结论')+'</span>'+esc(s)+'</button>').join('');
 $('#original').textContent=c.text;
 $('#glossEdit').value=gloss(c);
 $('#jump').value=state.i+1; applyPhase(); save();
}
function go(delta){const n=Math.max(0,Math.min(DATA.cards.length-1,state.i+delta));if(n===state.i)return;state.i=n;state.phase=0;render();}
function flip(){state.phase=(state.phase+1)%3;applyPhase();}
function cycle(idx){const c=DATA.cards[state.i],ls=labels(c);ls[idx]=ls[idx]==='p'?'c':'p';state.edits[c.id]=ls;render();}
$('#flashcard').addEventListener('click',e=>{if(e.target.closest('button,input,textarea'))return;flip();});
$('#prev').onclick=()=>go(-1); $('#next').onclick=()=>go(1);
$('#direction').onclick=()=>{state.direction=state.direction==='forward'?'reverse':'forward';state.phase=0;render();};
$('#segments').addEventListener('click',e=>{const b=e.target.closest('[data-seg]');if(b)cycle(Number(b.dataset.seg));});
$('#resetOne').onclick=()=>{const id=DATA.cards[state.i].id;delete state.edits[id];delete state.glossEdits[id];render();};
$('#resetAll').onclick=()=>{if(confirm('恢复全部自动标注和自动白话？你手工修改的内容将被清空。')){state.edits={};state.glossEdits={};render();}};
$('#saveGloss').onclick=()=>{const c=DATA.cards[state.i],v=$('#glossEdit').value.trim();if(v)state.glossEdits[c.id]=v;else delete state.glossEdits[c.id];save();render();};
$('#jump').addEventListener('change',e=>{const n=Math.max(1,Math.min(DATA.cards.length,Number(e.target.value)||1));state.i=n-1;state.phase=0;render();});
$('#toggleEdit').onclick=()=>$('#editor').classList.toggle('open');
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;if(e.key==='ArrowDown'||e.key==='PageDown')go(1);else if(e.key==='ArrowUp'||e.key==='PageUp')go(-1);else if(e.key===' '||e.key==='Enter'){e.preventDefault();flip();}});
let wheelLock=false;
$('#stage').addEventListener('wheel',e=>{if(e.target.closest('#editor'))return;if(Math.abs(e.deltaY)<24)return;e.preventDefault();if(wheelLock)return;wheelLock=true;go(e.deltaY>0?1:-1);setTimeout(()=>wheelLock=false,320);},{passive:false});
let touchY=null;
$('#stage').addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY??null;},{passive:true});
$('#stage').addEventListener('touchend',e=>{if(touchY==null)return;const y=e.changedTouches[0]?.clientY??touchY,d=touchY-y;touchY=null;if(Math.abs(d)>55)go(d>0?1:-1);},{passive:true});
restore();render();
})();