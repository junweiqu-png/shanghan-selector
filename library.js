const repoBookCache=new Map();let localBooks=[];let renderSeq=0;let readerState={book:null,start:0,size:150,query:'',anchorLine:0,mode:'read',selection:''};
const dbAll=()=>TCMLocalLibrary.all();
const dbDelete=id=>TCMLocalLibrary.remove(id);
function repoBooks(){return (typeof BOOK_MANIFEST==='undefined'?[]:BOOK_MANIFEST).map(b=>({...b,origin:'repo'}));}
function allBooks(){const m=new Map(repoBooks().map(b=>[b.id,b]));localBooks.forEach(b=>m.set(b.id,b));return [...m.values()];}
function getBook(id){return localBooks.find(b=>b.id===id)||repoBookCache.get(id)||repoBooks().find(b=>b.id===id);}
async function ensureBook(book){if(!book)return null;if(book.text)return book;if(book.origin==='browser')return TCMLocalLibrary.get(book.id);if(repoBookCache.has(book.id))return repoBookCache.get(book.id);const r=await fetch(book.path);if(!r.ok)throw new Error(`古籍正文加载失败 ${r.status}`);const full={...book,text:await r.text(),origin:'repo'};repoBookCache.set(book.id,full);return full;}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function escRe(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
async function highlightRegexes(q){if(!q||typeof TCMSearch==='undefined')return [];const ast=TCMSearch.parse(q),out=[],seen=new Set();for(const group of ast.groups){for(const atom of group.include){let specs=[];if(atom.type==='regex')specs=[{source:atom.value,flags:atom.flags||''}];else{const vars=await TCMSearch.variants(atom.value);specs=vars.map(v=>({source:atom.type==='wildcard'?escRe(v).replace(/\\\*/g,'[\\s\\S]*?').replace(/\\\?/g,'[\\s\\S]'):escRe(v),flags:''}));}for(const spec of specs){let flags=String(spec.flags||'').replace(/[gy]/g,'');if(!flags.includes('i'))flags+='i';if(!flags.includes('u'))flags+='u';if(!flags.includes('g'))flags+='g';const key=`${spec.source}/${flags}`;if(seen.has(key))continue;try{out.push(new RegExp(spec.source,flags));seen.add(key);}catch{}}}}return out;}
function matchRanges(text,regexes,limit=240){const ranges=[];const s=String(text||'');for(const base of regexes){const rx=new RegExp(base.source,base.flags.includes('g')?base.flags:base.flags+'g');let m;while(ranges.length<limit&&(m=rx.exec(s))){if(m[0])ranges.push([m.index,m.index+m[0].length]);else rx.lastIndex++;}if(ranges.length>=limit)break;}ranges.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);const merged=[];for(const r of ranges){const last=merged[merged.length-1];if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push(r.slice());}return merged;}
function markedHtml(text,regexes){const s=String(text||''),ranges=matchRanges(s,regexes);if(!ranges.length)return esc(s);let at=0,out='';for(const [a,b] of ranges){out+=esc(s.slice(at,a))+`<mark class="search-mark">${esc(s.slice(a,b))}</mark>`;at=b;}return out+esc(s.slice(at));}
async function highlightHtml(text,q){try{return markedHtml(text,await highlightRegexes(q));}catch{return esc(text);}}
function bookTitleFromFile(name){return name.replace(/\.txt$/i,'').replace(/[-_]/g,' ');}
function setView(name){document.querySelectorAll('.app-view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));document.querySelectorAll('.mode-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));location.hash=name;}
window.openLocalSearch=function(term){setView('search');const input=document.getElementById('librarySearch');input.value=term;runLibrarySearch();input.focus();};
async function queryVariants(q){return typeof TCMSearch!=='undefined'?TCMSearch.variants(q):[String(q||'').trim()].filter(Boolean);}
function bookMatches(b,variants){if(!variants.length)return true;const s=[b.title,b.author,b.category,b.edition,b.relativePath].join(' ').toLowerCase();return variants.some(v=>v.split(/\s+/).every(x=>s.includes(x.toLowerCase())));}
function captureLabel(b){if(b.origin==='browser')return '我的本地 TXT';return b.captureStatus||(b.complete===false?'部分抓取':b.expanded?'分卷收录':'单页收录');}
function splitStatus(b){if(!b.subpagesTotal)return '';const accounted=(b.subpagesFetched||0)+(b.subpagesEmpty||0);return ` · 分卷 ${accounted}/${b.subpagesTotal}${b.subpagesFailed?` · 失败 ${b.subpagesFailed}`:''}`;}
function charsLabel(n){return n?`${Math.round(n/1000).toLocaleString()}k 字符`:'';}
async function renderBooks(filter=''){const seq=++renderSeq,variants=filter?await queryVariants(filter):[];if(seq!==renderSeq)return;const box=document.getElementById('localBookList');if(!box)return;const books=allBooks().filter(b=>bookMatches(b,variants));box.innerHTML=books.map(b=>b.origin==='browser'?`<div class="book-card ready user-book"><button data-book="${b.id}"><b>${esc(b.title)}</b><span>${esc(b.relativePath||'我的本地 TXT')}</span><small>${charsLabel(b.chars||0)}</small></button><button class="book-delete" data-delete-book="${b.id}" title="移除">×</button></div>`:`<button class="book-card ready" data-book="${b.id}"><b>${esc(b.title)}</b><span>${esc(b.author||b.category||'古代医籍')}</span><small>${esc(b.category||'综合医籍')} · ${charsLabel(b.chars||0)} · ${esc(captureLabel(b))}${esc(splitStatus(b))}</small></button>`).join('')||'<div class="empty">没有匹配的书目。</div>';box.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>openBook(b.dataset.book));box.querySelectorAll('[data-delete-book]').forEach(b=>b.onclick=async e=>{e.stopPropagation();await dbDelete(b.dataset.deleteBook);localBooks=await dbAll();renderBooks(document.getElementById('bookFilter')?.value||'');});const stats=document.getElementById('bookStats');if(stats){const repo=repoBooks(),totalChars=repo.reduce((s,b)=>s+(b.chars||0),0);stats.textContent=`古籍库 ${repo.length} 部/篇 · 约 ${Math.round(totalChars/10000).toLocaleString()} 万字符 · 我的 TXT ${localBooks.length} 本`;}}
function lineArray(book){return (book.text||'').replace(/\r\n/g,'\n').split('\n');}
function firstContentLine(book){if(!book?.expanded)return 1;const text=book.text||'',idx=text.indexOf('===== ');if(idx<0)return 1;return text.slice(0,idx).split('\n').length;}
function minReaderStart(book){return Math.max(0,firstContentLine(book)-1);}
function chapterTitle(line){const m=String(line||'').match(/^=====\s*(.*?)\s*=====$/);return m?m[1].replace(/^.*?\//,''):'';}
async function readerLineHtml(line,regexes=[]){const title=chapterTitle(line);const html=regexes.length?markedHtml(title||line,regexes):esc(title||line);return title?`<h4 class="reader-chapter">${html}</h4>`:html;}
function scrollToReaderAnchor(){requestAnimationFrame(()=>{const el=document.querySelector('#readerBody .hit-anchor');if(el)el.scrollIntoView({behavior:'smooth',block:'center'});else document.getElementById('readerPanel')?.scrollIntoView({behavior:'smooth',block:'start'});});}
async function renderReader({focusAnchor=false}={}){const {book,start,size,query,anchorLine,mode}=readerState;if(!book)return;const lines=lineArray(book),end=Math.min(lines.length,start+size),body=document.getElementById('readerBody'),meta=document.getElementById('readerMeta');document.getElementById('readerTitle').textContent=book.title;let provenance='';if(book.origin==='repo'){const bits=[captureLabel(book)+splitStatus(book),charsLabel(book.chars||book.text?.length||0),book.license||''].filter(Boolean).map(esc);if(book.sourceUrl)bits.push(`<a href="${esc(book.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(book.source||'原始来源')}</a>`);provenance=' · '+bits.join(' · ');}const modeText=mode==='search'&&anchorLine?` · 搜索上下文：命中约第 ${anchorLine} 行`:'';meta.innerHTML=`${esc(book.author||book.category||'古籍')} · ${esc(book.edition||'')}${provenance}${modeText} · 当前 ${start+1}-${end} / ${lines.length}`;let regexes=[];if(query){try{regexes=await highlightRegexes(query);}catch{}}const html=[];for(let i=start;i<end;i++){const line=lines[i],lineNo=i+1;if(!line.trim()){html.push('<div class="reader-gap" aria-hidden="true"></div>');continue;}const inner=await readerLineHtml(line,regexes);const cls=['reader-line'];if(anchorLine===lineNo)cls.push('hit-anchor');html.push(`<div class="${cls.join(' ')}" data-line="${lineNo}">${inner}</div>`);}body.innerHTML=html.join('');const floor=minReaderStart(book);document.getElementById('readerPrev').disabled=start<=floor;document.getElementById('readerNext').disabled=end>=lines.length;const back=document.getElementById('readerBackToHit');if(back)back.hidden=!(mode==='search'&&anchorLine);const lookup=document.getElementById('readerLookup');if(lookup){lookup.disabled=!readerState.selection;lookup.textContent=readerState.selection?`查“${readerState.selection.slice(0,12)}${readerState.selection.length>12?'…':''}”`:'选中文字后查';}document.getElementById('readerPanel').hidden=false;if(focusAnchor)scrollToReaderAnchor();}
async function bestLine(book,q,{preferBody=true}={}){if(typeof TCMSearch==='undefined')return 1;const floor=preferBody?firstContentLine(book):1,lines=lineArray(book),slice=lines.slice(Math.max(0,floor-1)).join('\n');const hits=await TCMSearch.searchText(slice,q,{maxHits:1,windowSize:1000});return hits[0]?Math.max(1,floor-1+hits[0].line):1;}
async function preferredHit(book,q,hits=[]){const floor=firstContentLine(book);const direct=hits.find(h=>h.line>=floor);if(direct)return direct;if(floor>1){const lines=lineArray(book),slice=lines.slice(floor-1).join('\n'),more=await TCMSearch.searchText(slice,q,{maxHits:1,windowSize:900});if(more[0])return {...more[0],line:floor-1+more[0].line};}return hits[0]||null;}
async function openBook(id,line=0,q=''){let book=getBook(id);if(!book)return;setView('library');const body=document.getElementById('readerBody');body.innerHTML='<div class="empty">正在载入原文…</div>';document.getElementById('readerPanel').hidden=false;try{book=await ensureBook(book);const floor=firstContentLine(book);let target=Number(line||0);if(q){if(!target||target<floor)target=await bestLine(book,q,{preferBody:true});target=Math.max(floor,target||floor);readerState={book,start:Math.max(floor-1,target-45),size:130,query:q,anchorLine:target,mode:'search',selection:''};}else{target=floor;readerState={book,start:Math.max(0,floor-1),size:170,query:'',anchorLine:0,mode:'read',selection:''};}await renderReader({focusAnchor:!!q});}catch(e){body.innerHTML=`<div class="danger">${esc(e.message)}</div>`;}}
async function localSearchBook(book,q){if(typeof TCMSearch==='undefined')return [];return TCMSearch.searchText(book.text||'',q,{maxHits:50,windowSize:900});}
async function corpusSearch(q){if(typeof TCMSearch==='undefined')return [];const rows=await TCMSearch.searchCorpus(q,async doc=>{const b=getBook(doc.id)||{...doc,origin:'repo'};return ensureBook(b);},{maxResults:220,concurrency:8});const out=await Promise.all(rows.map(async r=>{const h=await preferredHit(r.book,q,r.hits);return {bookId:r.book.id,title:r.book.title||r.doc.title||'古籍',category:r.book.category||r.doc.category||'',excerpt:await highlightHtml(h?.excerpt||'',q),line:h?.line||firstContentLine(r.book),hitCount:r.hits.length};}));out.totalMatches=rows.totalMatches||out.length;out.candidateCount=rows.candidateCount||0;out.ast=rows.ast;return out;}
window.corpusSearch=corpusSearch;window.openCorpusBook=openBook;
async function experienceHits(q){let entries=[];try{entries=Object.entries(JSON.parse(localStorage.getItem('tcm_experience_notes')||'{}'));}catch{return [];}const out=[];for(const [k,v] of entries){try{const hits=await TCMSearch.searchText(String(v),q,{maxHits:1,windowSize:3000});if(hits.length)out.push([k,v]);}catch{}}return out;}
let searchSerial=0;
async function runLibrarySearch(){
 const q=document.getElementById('librarySearch').value.trim(),box=document.getElementById('searchResults'),seq=++searchSerial;
 if(!q){box.innerHTML='<div class="empty">默认空格 AND；支持引号、减号、OR、通配符与正则。</div>';return;}
 box.innerHTML='<div class="empty">正在用统一搜索引擎查询：公共古籍倒排索引 + 我的 TXT 严格全文复核…</div>';
 try{
  const {ast,repo,local,errors}=await TCMCorpusLookup.search(q,{maxRepo:80,maxLocal:100,repoHits:4,localHits:4,concurrency:8});
  if(seq!==searchSerial)return;
  const corpusRendered=await Promise.all(repo.map(async r=>{
   const book=r.book||r.doc,h=await preferredHit(book,q,r.hits);
   return '<button class="search-hit" data-book="'+esc(book.id)+'" data-line="'+(h?.line||1)+'" data-q="'+esc(q)+'"><b>'+esc(book.title||'古籍')+'</b><span>'+esc(book.category||'公共古籍')+' · 严格复核命中 '+r.hits.length+' 处</span><p>'+await highlightHtml(h?.excerpt||'',q)+'</p><small>打开命中位置，前后连续阅读</small></button>';
  }));
  const localRendered=await Promise.all(local.rows.flatMap(r=>r.hits.map(h=>({r,h}))).slice(0,180).map(async ({r,h})=>{
   const b=r.book;return '<button class="search-hit" data-book="'+esc(b.id)+'" data-line="'+h.line+'" data-q="'+esc(q)+'"><b>'+esc(b.title)+'</b><span>我的 TXT · '+esc(b.relativePath||b.filename||'')+' · 第 '+h.line+' 行</span><p>'+await highlightHtml(h.excerpt,q)+'</p></button>';
  }));
  const notes=await experienceHits(q);
  if(seq!==searchSerial)return;
  const more=repo.totalMatches===null?'（前 '+repo.length+' 本，尚未查完全部）':'（共 '+repo.length+' 本）';
  const status=errors.length?'<p class="search-warnings">'+errors.map(esc).join('；')+'</p>':'';
  box.innerHTML='<div class="search-summary">查询：'+esc(TCMSearch.describe(ast))+
   ' · 公共古籍严格命中 '+repo.length+' 本'+more+
   ' · 本地 TXT 命中 '+local.rows.length+' 本（扫描 '+local.scanned+'/'+local.total+'）'+
   ' · 当前浏览器书库 '+local.total+' 本</div>'+status+
   (corpusRendered.join('')+localRendered.join('')||'<div class="empty">没有命中。</div>')+
   (notes.length?'<div class="note-hits"><h3>我的经验</h3>'+(await Promise.all(notes.map(async ([,v])=>'<div>'+await highlightHtml(v,q)+'</div>'))).join('')+'</div>':'');
  box.querySelectorAll('.search-hit').forEach(b=>b.onclick=()=>openBook(b.dataset.book,Number(b.dataset.line||0),b.dataset.q));
 }catch(e){if(seq===searchSerial)box.innerHTML='<div class="danger">检索失败：'+esc(e.message)+'</div>';}
}
let importing=false;
async function importTxt(files){
 if(importing)return;
 importing=true;
 const stat=document.getElementById('importStatus');
 const items=[...files].filter(f=>/\.txt$/i.test(f.name||''));
 if(!items.length){stat.textContent='所选内容没有 TXT 文件';importing=false;return;}
 stat.textContent='准备导入 '+items.length+' 个 TXT…';
 try{
  const result=await TCMLocalLibrary.importFiles(items,p=>{
   stat.textContent='导入 '+p.done+'/'+p.total+' · 成功 '+p.imported+' · 失败 '+p.failed+' · '+p.file;
  });
  localBooks=await dbAll();
  renderBooks(document.getElementById('bookFilter')?.value||'');
  stat.textContent='完成：成功 '+result.imported+' 本，失败 '+result.failed+' 本。'+
   (result.errors.length?' '+result.errors.join('；'):'')+
   ' 仅保存在此浏览器，主站搜索和背诵字典均可检索。';
 }catch(e){stat.textContent='导入遇到问题：'+e.message;}
 finally{importing=false;}
}
function rememberReaderSelection(){const sel=window.getSelection?.();const body=document.getElementById('readerBody');if(!sel||!body||!sel.rangeCount)return;const node=sel.anchorNode,focus=sel.focusNode;if(!body.contains(node)||!body.contains(focus))return;const text=sel.toString().replace(/\s+/g,' ').trim();readerState.selection=text.length>0&&text.length<=40?text:'';const btn=document.getElementById('readerLookup');if(btn){btn.disabled=!readerState.selection;btn.textContent=readerState.selection?`查“${readerState.selection.slice(0,12)}${readerState.selection.length>12?'…':''}”`:'选中文字后查';}}
function lookupSelection(){const text=readerState.selection.trim();if(!text)return;if(typeof FORMULA_DATA!=='undefined'&&FORMULA_DATA[text]&&typeof openCompareFor==='function'){openCompareFor(text);return;}openLocalSearch(text);}
function bindLibraryUI(){document.querySelectorAll('.mode-nav button').forEach(b=>b.onclick=()=>setView(b.dataset.view));document.getElementById('librarySearchBtn').onclick=runLibrarySearch;document.getElementById('librarySearch').addEventListener('keydown',e=>{if(e.key==='Enter')runLibrarySearch();});document.getElementById('txtImport').onchange=e=>{importTxt(e.target.files);e.target.value='';};
document.getElementById('txtFolderImport').onchange=e=>{importTxt(e.target.files);e.target.value='';};document.getElementById('bookFilter')?.addEventListener('input',e=>renderBooks(e.target.value.trim()));document.getElementById('readerPrev').onclick=async()=>{const floor=minReaderStart(readerState.book);readerState.start=Math.max(floor,readerState.start-readerState.size);await renderReader();document.getElementById('readerPanel')?.scrollIntoView({behavior:'smooth',block:'start'});};document.getElementById('readerNext').onclick=async()=>{readerState.start+=readerState.size;await renderReader();document.getElementById('readerPanel')?.scrollIntoView({behavior:'smooth',block:'start'});};document.getElementById('readerBackToHit')?.addEventListener('click',async()=>{if(!readerState.anchorLine)return;const floor=minReaderStart(readerState.book);readerState.start=Math.max(floor,readerState.anchorLine-45);await renderReader({focusAnchor:true});});document.getElementById('readerLookup')?.addEventListener('click',lookupSelection);document.addEventListener('selectionchange',rememberReaderSelection);document.getElementById('readerFind').addEventListener('keydown',async e=>{if(e.key==='Enter'){const q=e.target.value.trim();if(!q||!readerState.book)return;try{const line=await bestLine(readerState.book,q,{preferBody:true});const floor=firstContentLine(readerState.book);readerState.start=Math.max(floor-1,line-45);readerState.query=q;readerState.anchorLine=line;readerState.mode='search';await renderReader({focusAnchor:true});}catch(err){e.target.title=err.message;}}});document.addEventListener('click',e=>{const a=e.target.closest?.('.term-more a');if(a){e.preventDefault();const m=a.textContent.match(/“(.+?)”/);if(m)openLocalSearch(m[1]);}});}
(async()=>{try{localBooks=await dbAll();}catch{localBooks=[];}renderBooks();bindLibraryUI();const initial=location.hash.replace('#','');setView(['library','search','diagnosis'].includes(initial)?initial:'diagnosis');
const params=new URLSearchParams(location.search),book=params.get('book'),term=params.get('term')||'';
if(book){openBook(book,Number(params.get('line'))||0,term);}
else if(params.get('query')){
  setView('search');document.getElementById('librarySearch').value=params.get('query');runLibrarySearch();
}
})();
