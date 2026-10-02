const repoBookCache=new Map();let localBooks=[];let renderSeq=0;let readerState={book:null,start:0,size:320,query:''};
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('tcm-local-library',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('books'))r.result.createObjectStore('books',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function dbAll(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction('books').objectStore('books').getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error);});}
async function dbPut(book){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('books','readwrite');t.objectStore('books').put(book);t.oncomplete=res;t.onerror=()=>rej(t.error);});}
async function dbDelete(id){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction('books','readwrite');t.objectStore('books').delete(id);t.oncomplete=res;t.onerror=()=>rej(t.error);});}
function repoBooks(){return (typeof BOOK_MANIFEST==='undefined'?[]:BOOK_MANIFEST).map(b=>({...b,origin:'repo'}));}
function allBooks(){const m=new Map(repoBooks().map(b=>[b.id,b]));localBooks.forEach(b=>m.set(b.id,b));return [...m.values()];}
function getBook(id){return localBooks.find(b=>b.id===id)||repoBookCache.get(id)||repoBooks().find(b=>b.id===id);}
async function ensureBook(book){if(!book)return null;if(book.text)return book;if(repoBookCache.has(book.id))return repoBookCache.get(book.id);const r=await fetch(book.path);if(!r.ok)throw new Error(`古籍正文加载失败 ${r.status}`);const full={...book,text:await r.text(),origin:'repo'};repoBookCache.set(book.id,full);return full;}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function escRe(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
async function highlightRegexes(q){
  if(!q||typeof TCMSearch==='undefined')return [];
  const ast=TCMSearch.parse(q),out=[],seen=new Set();
  for(const group of ast.groups){for(const atom of group.include){
    let specs=[];
    if(atom.type==='regex')specs=[{source:atom.value,flags:atom.flags||''}];
    else{
      const vars=await TCMSearch.variants(atom.value);
      specs=vars.map(v=>({source:atom.type==='wildcard'?escRe(v).replace(/\\\*/g,'[\\s\\S]*?').replace(/\\\?/g,'[\\s\\S]'):escRe(v),flags:''}));
    }
    for(const spec of specs){
      let flags=String(spec.flags||'').replace(/[gy]/g,'');if(!flags.includes('i'))flags+='i';if(!flags.includes('u'))flags+='u';if(!flags.includes('g'))flags+='g';
      const key=`${spec.source}/${flags}`;if(seen.has(key))continue;
      try{out.push(new RegExp(spec.source,flags));seen.add(key);}catch{}
    }
  }}
  return out;
}
function matchRanges(text,regexes,limit=240){
  const ranges=[];const s=String(text||'');
  for(const base of regexes){
    const rx=new RegExp(base.source,base.flags.includes('g')?base.flags:base.flags+'g');let m;
    while(ranges.length<limit&&(m=rx.exec(s))){if(m[0])ranges.push([m.index,m.index+m[0].length]);else rx.lastIndex++;}
    if(ranges.length>=limit)break;
  }
  ranges.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);const merged=[];
  for(const r of ranges){const last=merged[merged.length-1];if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else merged.push(r.slice());}
  return merged;
}
function markedHtml(text,regexes){
  const s=String(text||''),ranges=matchRanges(s,regexes);if(!ranges.length)return esc(s);
  let at=0,out='';for(const [a,b] of ranges){out+=esc(s.slice(at,a))+`<mark class="search-mark">${esc(s.slice(a,b))}</mark>`;at=b;}return out+esc(s.slice(at));
}
async function highlightHtml(text,q){try{return markedHtml(text,await highlightRegexes(q));}catch{return esc(text);}}
async function highlightReader(root,q){
  if(!root||!q)return;let regexes=[];try{regexes=await highlightRegexes(q);}catch{return;}if(!regexes.length)return;
  root.querySelectorAll('.term-link,.formula-link').forEach(el=>{if(matchRanges(el.textContent||'',regexes,1).length)el.classList.add('search-match-link');});
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){const p=node.parentElement;if(!p||p.closest('button,a,mark')||!node.nodeValue?.trim())return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}}),nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){const text=node.nodeValue||'',ranges=matchRanges(text,regexes);if(!ranges.length)continue;const frag=document.createDocumentFragment();let at=0;for(const [a,b] of ranges){if(a>at)frag.append(document.createTextNode(text.slice(at,a)));const mark=document.createElement('mark');mark.className='search-mark';mark.textContent=text.slice(a,b);frag.append(mark);at=b;}if(at<text.length)frag.append(document.createTextNode(text.slice(at)));node.replaceWith(frag);}
}
function bookTitleFromFile(name){return name.replace(/\.txt$/i,'').replace(/[-_]/g,' ');}
function setView(name){document.querySelectorAll('.app-view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));document.querySelectorAll('.mode-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));location.hash=name;}
window.openLocalSearch=function(term){setView('search');const input=document.getElementById('librarySearch');input.value=term;runLibrarySearch();input.focus();};
async function queryVariants(q){return typeof TCMSearch!=='undefined'?TCMSearch.variants(q):[String(q||'').trim()].filter(Boolean);}
function bookMatches(b,variants){if(!variants.length)return true;const s=[b.title,b.author,b.category,b.edition].join(' ').toLowerCase();return variants.some(v=>v.split(/\s+/).every(x=>s.includes(x.toLowerCase())));}
function captureLabel(b){if(b.origin==='browser')return '我的本地 TXT';return b.captureStatus||(b.complete===false?'部分抓取':b.expanded?'分卷收录':'单页收录');}
function splitStatus(b){if(!b.subpagesTotal)return '';const accounted=(b.subpagesFetched||0)+(b.subpagesEmpty||0);return ` · 分卷 ${accounted}/${b.subpagesTotal}${b.subpagesFailed?` · 失败 ${b.subpagesFailed}`:''}`;}
function charsLabel(n){return n?`${Math.round(n/1000).toLocaleString()}k 字符`:'';}
async function renderBooks(filter=''){const seq=++renderSeq,variants=filter?await queryVariants(filter):[];if(seq!==renderSeq)return;const box=document.getElementById('localBookList');if(!box)return;const books=allBooks().filter(b=>bookMatches(b,variants));box.innerHTML=books.map(b=>b.origin==='browser'?`<div class="book-card ready user-book"><button data-book="${b.id}"><b>${esc(b.title)}</b><span>我的本地 TXT</span><small>${charsLabel((b.text||'').length)}</small></button><button class="book-delete" data-delete-book="${b.id}" title="移除">×</button></div>`:`<button class="book-card ready" data-book="${b.id}"><b>${esc(b.title)}</b><span>${esc(b.author||b.category||'古代医籍')}</span><small>${esc(b.category||'综合医籍')} · ${charsLabel(b.chars||0)} · ${esc(captureLabel(b))}${esc(splitStatus(b))}</small></button>`).join('')||'<div class="empty">没有匹配的书目。</div>';box.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>openBook(b.dataset.book));box.querySelectorAll('[data-delete-book]').forEach(b=>b.onclick=async e=>{e.stopPropagation();await dbDelete(b.dataset.deleteBook);localBooks=await dbAll();renderBooks(document.getElementById('bookFilter')?.value||'');});const stats=document.getElementById('bookStats');if(stats){const repo=repoBooks(),totalChars=repo.reduce((s,b)=>s+(b.chars||0),0);stats.textContent=`古籍库 ${repo.length} 部/篇 · 约 ${Math.round(totalChars/10000).toLocaleString()} 万字符 · 我的 TXT ${localBooks.length} 本`;}}
function lineArray(book){return (book.text||'').replace(/\r\n/g,'\n').split('\n');}
function linkFormulaNames(html){if(typeof FORMULA_DATA==='undefined')return html;return Object.keys(FORMULA_DATA).sort((a,b)=>b.length-a.length).reduce((out,name)=>out.replace(new RegExp(name,'g'),`<button class="formula-link" type="button" data-formula="${name}">${name}</button>`),html);}
function readerLineHtml(line){let out=typeof linkifyTerms==='function'?linkifyTerms(line):esc(line);return linkFormulaNames(out);}
function renderReader(){const {book,start,size,query}=readerState;if(!book)return;const lines=lineArray(book),end=Math.min(lines.length,start+size),body=document.getElementById('readerBody'),meta=document.getElementById('readerMeta');document.getElementById('readerTitle').textContent=book.title;let provenance='';if(book.origin==='repo'){const bits=[captureLabel(book)+splitStatus(book),charsLabel(book.chars||book.text?.length||0),book.license||''].filter(Boolean).map(esc);if(book.sourceUrl)bits.push(`<a href="${esc(book.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(book.source||'原始来源')}</a>`);provenance=' · '+bits.join(' · ');}meta.innerHTML=`${esc(book.author||book.category||'古籍')} · ${esc(book.edition||'')}${provenance} · 第 ${start+1}-${end} 行 / ${lines.length}`;body.innerHTML=lines.slice(start,end).map((line,i)=>`<p class="reader-line" data-line="${start+i+1}"><span>${start+i+1}</span>${readerLineHtml(line)}</p>`).join('');if(typeof bindTermLinks==='function')bindTermLinks(body);body.querySelectorAll('.formula-link').forEach(b=>b.onclick=()=>openCompareFor(b.dataset.formula));if(query)highlightReader(body,query);document.getElementById('readerPrev').disabled=start<=0;document.getElementById('readerNext').disabled=end>=lines.length;document.getElementById('readerPanel').hidden=false;}
async function bestLine(book,q){if(typeof TCMSearch==='undefined')return 1;const hits=await TCMSearch.searchText(book.text||'',q,{maxHits:1,windowSize:1000});return hits[0]?.line||1;}
async function openBook(id,line=0,q=''){let book=getBook(id);if(!book)return;setView('library');const body=document.getElementById('readerBody');body.innerHTML='<div class="empty">正在载入原文…</div>';document.getElementById('readerPanel').hidden=false;try{book=await ensureBook(book);if(q&&!line)line=await bestLine(book,q);readerState={book,start:Math.max(0,Number(line||1)-60),size:320,query:q};renderReader();document.getElementById('readerPanel').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){body.innerHTML=`<div class="danger">${esc(e.message)}</div>`;}}
async function localSearchBook(book,q){if(typeof TCMSearch==='undefined')return [];return TCMSearch.searchText(book.text||'',q,{maxHits:50,windowSize:900});}
async function corpusSearch(q){if(typeof TCMSearch==='undefined')return [];const rows=await TCMSearch.searchCorpus(q,async doc=>{const b=getBook(doc.id)||{...doc,origin:'repo'};return ensureBook(b);},{maxResults:220,concurrency:8});const out=await Promise.all(rows.map(async r=>({bookId:r.book.id,title:r.book.title||r.doc.title||'古籍',category:r.book.category||r.doc.category||'',excerpt:await highlightHtml(r.hits[0]?.excerpt||'',q),line:r.hits[0]?.line||1,hitCount:r.hits.length})));out.totalMatches=rows.totalMatches||out.length;out.candidateCount=rows.candidateCount||0;out.ast=rows.ast;return out;}
window.corpusSearch=corpusSearch;
window.openCorpusBook=openBook;
async function experienceHits(q){let entries=[];try{entries=Object.entries(JSON.parse(localStorage.getItem('tcm_experience_notes')||'{}'));}catch{return [];}const out=[];for(const [k,v] of entries){try{const hits=await TCMSearch.searchText(String(v),q,{maxHits:1,windowSize:3000});if(hits.length)out.push([k,v]);}catch{} }return out;}
async function runLibrarySearch(){const q=document.getElementById('librarySearch').value.trim(),box=document.getElementById('searchResults');if(!q){box.innerHTML='<div class="empty">默认空格 AND；可用引号、减号、OR，通配符和正则需显式写出。</div>';return;}box.innerHTML='<div class="empty">正在用 n-gram 倒排索引缩小范围，并对候选 TXT 做严格复核…</div>';try{const ast=TCMSearch.parse(q);const corpusHitsPromise=corpusSearch(q),localHits=[],notesPromise=experienceHits(q);for(const b of localBooks){const hits=await localSearchBook(b,q);hits.forEach(h=>localHits.push({...h,bookObj:b}));}const corpusHits=await corpusHitsPromise,notes=await notesPromise;const localRendered=await Promise.all(localHits.slice(0,100).map(async h=>`<button class="search-hit" data-book="${h.bookObj.id}" data-line="${h.line}" data-q="${esc(q)}"><b>${esc(h.bookObj.title)}</b><span>我的 TXT · 第 ${h.line} 行</span><p>${await highlightHtml(h.excerpt,q)}</p></button>`));const noteRendered=await Promise.all(notes.map(async ([,v])=>`<div>${await highlightHtml(v,q)}</div>`));const corpusHtml=corpusHits.map(h=>`<button class="search-hit" data-book="${esc(h.bookId)}" data-line="${h.line}" data-q="${esc(q)}"><b>${esc(h.title)}</b><span>${esc(h.category)} · 严格命中${h.hitCount>1?` ${h.hitCount} 个片段`:''}</span><p>${h.excerpt}</p></button>`).join('');const localHtml=localRendered.join('');const total=corpusHits.totalMatches??corpusHits.length,shown=corpusHits.length;box.innerHTML=`<div class="search-summary">查询：${esc(TCMSearch.describe(ast))} · 倒排候选 ${corpusHits.candidateCount||0} 本 · 严格命中 ${total} 本${shown<total?`（显示前 ${shown} 本）`:''} · 我的 TXT ${localHits.length} 条${notes.length?` · 我的经验 ${notes.length} 条`:''}</div>`+(corpusHtml+localHtml||'<div class="empty">没有命中。</div>')+(notes.length?`<div class="note-hits"><h3>我的经验</h3>${noteRendered.join('')}</div>`:'');box.querySelectorAll('.search-hit').forEach(b=>b.onclick=()=>openBook(b.dataset.book,Number(b.dataset.line||0),b.dataset.q));}catch(e){box.innerHTML=`<div class="danger">检索式有问题：${esc(e.message)}</div>`;}}
async function importTxt(files){for(const file of files){const text=await file.text(),book={id:'user:'+file.name,title:bookTitleFromFile(file.name),text,origin:'browser',filename:file.name,addedAt:Date.now()};await dbPut(book);}localBooks=await dbAll();renderBooks(document.getElementById('bookFilter')?.value||'');}
function bindLibraryUI(){document.querySelectorAll('.mode-nav button').forEach(b=>b.onclick=()=>setView(b.dataset.view));document.getElementById('librarySearchBtn').onclick=runLibrarySearch;document.getElementById('librarySearch').addEventListener('keydown',e=>{if(e.key==='Enter')runLibrarySearch();});document.getElementById('txtImport').onchange=e=>importTxt([...e.target.files]);document.getElementById('bookFilter')?.addEventListener('input',e=>renderBooks(e.target.value.trim()));document.getElementById('readerPrev').onclick=()=>{readerState.start=Math.max(0,readerState.start-readerState.size);renderReader();};document.getElementById('readerNext').onclick=()=>{readerState.start+=readerState.size;renderReader();};document.getElementById('readerFind').addEventListener('keydown',async e=>{if(e.key==='Enter'){const q=e.target.value.trim();if(!q||!readerState.book)return;try{const line=await bestLine(readerState.book,q);readerState.start=Math.max(0,line-40);readerState.query=q;renderReader();}catch(err){e.target.title=err.message;}}});document.addEventListener('click',e=>{const a=e.target.closest?.('.term-more a');if(a){e.preventDefault();const m=a.textContent.match(/“(.+?)”/);if(m)openLocalSearch(m[1]);}});}
(async()=>{try{localBooks=await dbAll();}catch{localBooks=[];}renderBooks();bindLibraryUI();const initial=location.hash.replace('#','');setView(['library','search','diagnosis'].includes(initial)?initial:'diagnosis');})();
