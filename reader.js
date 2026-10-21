(()=>{
'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const params=new URLSearchParams(location.search),id=params.get('book')||'',searchLine=Math.max(0,Number(params.get('line'))||0),q=params.get('term')||'',origin=params.get('from')||'library';
const BACK='index.html'+(origin==='search'&&q?'?'+new URLSearchParams({query:q}):'')+'#'+(origin==='search'?'search':'library');
const CHUNK=65;
let book=null,lines=[],pos=0,minLine=0,chapters=[],activeQuery=[],font=21,night=false,preserveSearch=!!q,initialFocus=true;
const storageKey='tcm-reader:'+id;
function saveProgress(){
 try{localStorage.setItem(storageKey,JSON.stringify({pos,font,night,time:Date.now()}));}catch{}
}
function readProgress(){
 try{return JSON.parse(localStorage.getItem(storageKey)||'{}');}catch{return {};}
}
function chapterName(s){
 const m=String(s||'').match(/^=====\s*(.*?)\s*=====$/);
 return m?m[1].replace(/^.*?\//,''):null;
}
function heading(s){
 return chapterName(s)||(/^(?:辨.{2,30}第[一二三四五六七八九十百廿卅]+|平[脉脈]法第\S+|[伤傷]寒例第\S+)$/u.test(String(s||'').trim())?s.trim():null);
}
function splitLines(text){return String(text||'').replace(/\r\n?/g,'\n').split('\n');}
function pageFloor(){
 if(!book.expanded)return 0;
 const i=lines.findIndex(line=>line.startsWith('===== '));
 return i<0?0:i;
}
function updateUI(){
 $('#prevPage').disabled=pos<=minLine;$('#nextPage').disabled=pos+CHUNK>=lines.length;
 $('#progressSlider').value=String(Math.round(pos/Math.max(1,lines.length-1)*1000));
 $('#progressLabel').textContent=Math.round(pos/Math.max(1,lines.length-1)*100)+'% · '+Math.min(lines.length,pos+CHUNK)+' / '+lines.length+' 行';
}
function markHtml(text){
 if(!activeQuery.length)return esc(text);
 const patterns=activeQuery.filter(Boolean).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 if(!patterns.length)return esc(text);
 const rx=new RegExp(patterns.join('|'),'giu'),ranges=[];let m;
 while((m=rx.exec(text))&&ranges.length<70){ranges.push([m.index,m.index+m[0].length]);if(!m[0])rx.lastIndex++;}
 if(!ranges.length)return esc(text);
 let start=0,out='';for(const [a,b] of ranges){if(a<start)continue;out+=esc(text.slice(start,a))+'<mark>'+esc(text.slice(a,b))+'</mark>';start=b;}
 return out+esc(text.slice(start));
}
function paint(focusLine=0){
 pos=Math.max(minLine,Math.min(Math.max(minLine,lines.length-1),pos));
 const end=Math.min(lines.length,pos+CHUNK),parts=[];
 for(let i=pos;i<end;i++){
  const line=lines[i];
  if(!line.trim())continue;
  const title=heading(line);
  if(title)parts.push('<h2 class="chapter-head">'+esc(title)+'</h2>');
  else parts.push('<p class="book-paragraph '+(i+1===focusLine?'search-anchor':'')+'" data-line="'+(i+1)+'">'+markHtml(line)+'</p>');
 }
 $('#textBody').innerHTML=parts.join('')||'<p>本页没有正文。</p>';
 $('#textBody').hidden=false;$('#loading').hidden=true;
 $('#bookInfo').textContent=(book.relativePath||book.author||book.category||'古籍全文')+' · '+(book.chars||book.text.length).toLocaleString()+' 字';
 updateUI();saveProgress();
 if(focusLine){
  requestAnimationFrame(()=>document.querySelector('.search-anchor')?.scrollIntoView({block:'center'}));
 }else window.scrollTo({top:0,behavior:'instant'});
}
function showPage(n){pos=Math.max(minLine,Math.min(Math.max(minLine,lines.length-1),n));paint();}
function openToc(){
 const html=chapters.map(c=>'<button type="button" data-line="'+c.line+'">'+esc(c.title)+'</button>').join('');
 $('#tocContents').innerHTML=html||'<p class="toc-empty">本 TXT 没有可自动识别的章节标题，可以用下方阅读进度拖动跳转。</p>';
 $('#tocPanel').hidden=false;
 $('#tocContents').querySelectorAll('[data-line]').forEach(btn=>btn.onclick=()=>{$('#tocPanel').hidden=true;showPage(Number(btn.dataset.line));});
}
function settings(){
 document.documentElement.style.setProperty('--fontsize',font+'px');
 document.body.classList.toggle('reading-night',night);document.body.classList.toggle('reading-day',!night);
 $('#fontSize').textContent=font;saveProgress();
}
function back(){
 // Browser back normally restores the original book list/search results with its state.
 if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1)history.back();
 else location.href=BACK;
}
async function boot(){
 if(!id){$('#loading').hidden=true;$('#readerError').hidden=false;$('#readerError').textContent='缺少书籍编号。';return;}
 try{
  const found=typeof BOOK_MANIFEST!=='undefined'?BOOK_MANIFEST.find(b=>b.id===id):null;
  if(found){
   const r=await fetch(found.path);
   if(!r.ok)throw new Error('正文读取失败 '+r.status);
   book={...found,origin:'repo',text:await r.text()};
  }else{
   book=await TCMLocalLibrary.get(id);
   if(!book)throw new Error('未找到这本 TXT。它可能保存在另一浏览器或已被删除。');
  }
  lines=splitLines(book.text);minLine=pageFloor();
  chapters=lines.map((s,i)=>({title:heading(s),line:i})).filter(x=>x.title);
  const saved=readProgress();
  font=Math.min(34,Math.max(16,Number(saved.font)||21));night=!!saved.night;
  settings();$('#bookTitle').textContent=book.title||'古籍阅读';
  pos=searchLine?Math.max(minLine,searchLine-20):Math.max(minLine,Number(saved.pos)||minLine);
  if(q){
   activeQuery=await TCMSearch.variants(q).catch(()=>[q]);
  }
  paint(searchLine||0);
 }catch(e){$('#loading').hidden=true;$('#readerError').hidden=false;$('#readerError').textContent=e.message;}
}
$('#goBack').onclick=back;$('#prevPage').onclick=()=>showPage(pos-CHUNK);$('#nextPage').onclick=()=>showPage(pos+CHUNK);
$('#tocToggle').onclick=openToc;$('#tocClose').onclick=()=>$('#tocPanel').hidden=true;
$('#settingsToggle').onclick=()=>$('#settings').hidden=!$('#settings').hidden;
$('#fontDown').onclick=()=>{font=Math.max(16,font-2);settings();};
$('#fontUp').onclick=()=>{font=Math.min(34,font+2);settings();};
$('#themeDay').onclick=()=>{night=false;settings();};$('#themeNight').onclick=()=>{night=true;settings();};
$('#progressSlider').addEventListener('change',e=>showPage(Math.round((lines.length-1)*Number(e.target.value)/1000)));
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea'))return;
 if(e.key==='ArrowRight'||e.key==='PageDown')showPage(pos+CHUNK);
 else if(e.key==='ArrowLeft'||e.key==='PageUp')showPage(pos-CHUNK);
 else if(e.key==='Escape'){$('#tocPanel').hidden=true;$('#settings').hidden=true;}
});
boot();
})();