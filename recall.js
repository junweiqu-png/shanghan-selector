(()=>{
const DATA=window.SHANGHAN_RECALL||SHANGHAN_RECALL;
const KEY='shanghan-recall-v1';
const state={i:0,flipped:false,direction:'forward',edits:{}};
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function restore(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');state.i=Math.max(0,Math.min(DATA.cards.length-1,Number(x.i)||0));state.direction=x.direction==='reverse'?'reverse':'forward';state.edits=x.edits||{};}catch{}}
function save(){try{localStorage.setItem(KEY,JSON.stringify({i:state.i,direction:state.direction,edits:state.edits}));}catch{}}
function labels(card){const e=state.edits[card.id];return Array.isArray(e)&&e.length===card.segments.length?e:[...card.defaults];}
function groups(card,kind){const ls=labels(card),out=[];let cur=[];card.segments.forEach((s,i)=>{if(ls[i]===kind)cur.push(s);else if(cur.length){out.push(cur.join(''));cur=[];}});if(cur.length)out.push(cur.join(''));return out;}
function face(card,kind,title){const gs=groups(card,kind);return '<div class="face-label">'+title+'</div><div class="face-lines">'+(gs.length?gs.map(x=>'<p>'+esc(x)+'</p>').join(''):'<p class="empty-face">尚未标注</p>')+'</div>';}
function render(){
 const c=DATA.cards[state.i],ls=labels(c),frontKind=state.direction==='forward'?'p':'c',backKind=frontKind==='p'?'c':'p';
 $('#progress').textContent=(state.i+1)+' / '+DATA.cards.length;
 $('#chapter').textContent=c.chapter+' · 原文行 '+c.line;
 $('#direction').textContent=state.direction==='forward'?'正向：前提 → 结论':'反向：结论 → 前提';
 const card=$('#flashcard');card.classList.toggle('flipped',state.flipped);
 $('#front').innerHTML=face(c,frontKind,frontKind==='p'?'前提':'结论');
 $('#back').innerHTML=face(c,backKind,backKind==='p'?'前提':'结论');
 $('#segments').innerHTML=c.segments.map((s,i)=>'<button type="button" data-seg="'+i+'" class="seg '+(ls[i]==='p'?'premise':'conclusion')+'"><span>'+(ls[i]==='p'?'前提':'结论')+'</span>'+esc(s)+'</button>').join('');
 $('#original').textContent=c.text;
 $('#jump').value=state.i+1; save();
}
function go(delta){const n=Math.max(0,Math.min(DATA.cards.length-1,state.i+delta));if(n===state.i)return;state.i=n;state.flipped=false;render();}
function flip(){state.flipped=!state.flipped;$('#flashcard').classList.toggle('flipped',state.flipped);}
function cycle(idx){const c=DATA.cards[state.i],ls=labels(c),next=ls[idx]==='p'?'c':ls[idx]==='c'?'u':'p';ls[idx]=next;state.edits[c.id]=ls;render();}
$('#flashcard').addEventListener('click',e=>{if(e.target.closest('button'))return;flip();});
$('#prev').onclick=()=>go(-1); $('#next').onclick=()=>go(1);
$('#direction').onclick=()=>{state.direction=state.direction==='forward'?'reverse':'forward';state.flipped=false;render();};
$('#segments').addEventListener('click',e=>{const b=e.target.closest('[data-seg]');if(b)cycle(Number(b.dataset.seg));});
$('#resetOne').onclick=()=>{delete state.edits[DATA.cards[state.i].id];render();};
$('#resetAll').onclick=()=>{if(confirm('恢复全部自动标注？你手工修改的前提/结论标记将被清空。')){state.edits={};render();}};
$('#jump').addEventListener('change',e=>{const n=Math.max(1,Math.min(DATA.cards.length,Number(e.target.value)||1));state.i=n-1;state.flipped=false;render();});
$('#toggleEdit').onclick=()=>$('#editor').classList.toggle('open');
document.addEventListener('keydown',e=>{if(e.target.matches('input'))return;if(e.key==='ArrowDown'||e.key==='PageDown')go(1);else if(e.key==='ArrowUp'||e.key==='PageUp')go(-1);else if(e.key===' '||e.key==='Enter'){e.preventDefault();flip();}});
let wheelLock=false;
$('#stage').addEventListener('wheel',e=>{if(e.target.closest('#editor'))return;if(Math.abs(e.deltaY)<24)return;e.preventDefault();if(wheelLock)return;wheelLock=true;go(e.deltaY>0?1:-1);setTimeout(()=>wheelLock=false,320);},{passive:false});
let touchY=null;
$('#stage').addEventListener('touchstart',e=>{if(e.target.closest('#editor'))return;touchY=e.touches[0]?.clientY??null;},{passive:true});
$('#stage').addEventListener('touchend',e=>{if(touchY==null)return;const y=e.changedTouches[0]?.clientY??touchY,d=touchY-y;touchY=null;if(Math.abs(d)>55)go(d>0?1:-1);},{passive:true});
restore();render();
})();