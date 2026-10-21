(()=>{
'use strict';
const C=globalThis.TCMImportReviewCore;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={pending:[],added:0,duplicates:0,changed:0,failed:[],busy:false,total:0};
let docsPromise=null,serial=0;
async function fingerprints(){
 if(!docsPromise)docsPromise=fetch('books/import-fingerprints.json').then(r=>{
   if(!r.ok)throw new Error('公共古籍全文指纹未就绪（'+r.status+'）');
   return r.json();
 }).then(d=>d.docs.map(x=>({...x,origin:'repo'})));
 return docsPromise;
}
async function sha(text){
 const bytes=new TextEncoder().encode(text);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
async function analyzedText(text){
 const canonical=(await TCMSearch.canonical(text)).replace(/\s+/g,'');
 return {digest:await sha(canonical),signature:C.signature(canonical),canonicalChars:canonical.length};
}
function sourceLabel(meta){
 return (meta.origin==='repo'?'公共古籍':'我的 TXT')+' · '+(meta.relativePath||meta.title||'');
}
async function existingLocal(onProgress){
 const metas=await TCMLocalLibrary.all(),enriched=[];
 for(let i=0;i<metas.length;i++){
   const meta=metas[i];
   if(meta.digest&&meta.signature){enriched.push({...meta,origin:'browser'});continue;}
   const existing=await TCMLocalLibrary.get(meta.id);
   if(!existing){continue;}
   const fp=await analyzedText(existing.text||'');
   await TCMLocalLibrary.patchMeta(meta.id,fp);
   enriched.push({...meta,...fp,origin:'browser'});
   if(i%15===0)onProgress?.('正在校验已导入的旧 TXT：'+(i+1)+' / '+metas.length);
 }
 return enriched;
}
function candidatesFor(doc,records){
 const title=doc.foldedTitle||C.normalizedTitle(doc.title);
 const list=[];
 for(const old of records){
   const exact=old.digest===doc.digest&&!!old.digest;
   const samePath=old.id===doc.id&&old.origin==='browser';
   const sameName=(old.foldedTitle||C.normalizedTitle(old.title))===title;
   const sim=C.similarity(old.signature,doc.signature);
   const ratio=Math.min(doc.canonicalChars||1,old.canonicalChars||old.chars||1)/Math.max(doc.canonicalChars||1,old.canonicalChars||old.chars||1);
   if(!exact&&!samePath&&!sameName&&!(sim>=.32&&ratio>=.20))continue;
   const score=(exact?1000:0)+(samePath?400:0)+(sameName?180:0)+sim*100;
   list.push({...old,exact,samePath,sameName,similarity:sim,score});
 }
 return list.sort((a,b)=>b.score-a.score);
}
async function oldText(meta){
 if(meta.origin==='browser'){const b=await TCMLocalLibrary.get(meta.id);return b?.text||'';}
 const resp=await fetch(meta.path);
 if(!resp.ok)throw new Error('旧版原文获取失败：'+resp.status);
 return resp.text();
}
function uniqueId(path,forced=false){
 const stem='user:'+path;
 if(!forced&&!state.usedIds.has(stem))return stem;
 let id;
 do{id=stem+'#'+Date.now()+'-'+(++serial);}while(state.usedIds.has(id));
 return id;
}
async function add(entry,force=false){
 const id=uniqueId(entry.relativePath,force);
 const suffix=force?(entry.kind==='exact'?'（重复副本）':'（另存版本）'):'';
 const book={id,title:entry.title+suffix,text:entry.text,
   origin:'browser',filename:entry.filename,
   relativePath:entry.relativePath+(force?suffix:''),
   chars:entry.text.length,addedAt:Date.now(),
   gramBloom:TCMLocalLibrary.buildBloom(await TCMSearch.canonical(entry.text)),gramVersion:2,
   digest:entry.digest,signature:entry.signature,canonicalChars:entry.canonicalChars};
 await TCMLocalLibrary.put(book);
 state.usedIds.add(id);
 state.records.push({...book,text:undefined,origin:'browser'});
 state.added++;
 window.dispatchEvent(new Event('tcm-local-books-changed'));
}
function reviewMarkup(entry,i){
 const isExact=entry.kind==='exact',label=isExact?'全文重复':'存在部分差异',match=entry.matches[0];
 const maybe=entry.diff;
 const details=!isExact?'<details class="import-diff" open><summary>新 TXT 相比旧版新增或改写的句段：'+
  (maybe?.total||0)+' 处'+(maybe?.hidden?'（只展示前'+maybe.additions.length+'处）':'')+'</summary>'+
  (maybe?.additions?.length?'<div class="import-added">'+(entry.showAll?maybe.additions:maybe.additions.slice(0,70)).map((p,n)=>'<p><b>＋ '+(n+1)+'</b> '+esc(p)+'</p>').join('')+'</div>'+ (maybe.additions.length>70&&!entry.showAll?'<button type="button" class="diff-show-all" data-showdiff="'+i+'">展开全部 '+maybe.additions.length+' 处新增或改写</button>':'') :'<p class="import-empty">逐句对比未检测到新增句段，可能是删改、顺序、标点或局部字符发生变化。</p>')+
  '<p class="import-diff-note">对比方法：繁简归一后逐句比较；“新增或改写”不等于已判定校勘版本更正确。旧版始终保留。</p></details>':'';
 const sources=entry.matches.slice(0,6).map(m=>'<div>'+esc(sourceLabel(m))+(m.exact?' · 全文相同':' · 内容相近 '+Math.round(m.similarity*100)+'%')+'</div>').join('');
 return '<section class="import-review-item"><div class="import-review-head"><strong>'+esc(entry.relativePath)+'</strong><span class="'+(isExact?'import-duplicate':'import-changed')+'">'+label+'</span></div>'+
  '<div class="import-match"><b>已收录：</b>'+sources+'</div>'+
  details+'<div class="import-review-actions"><button type="button" data-review="'+i+'" data-action="add">'+
  (isExact?'强制加入副本':'确认加入为新版本')+'</button><button type="button" class="import-ignore" data-review="'+i+'" data-action="skip">拒绝／跳过</button></div></section>';
}
function render(){
 const host=$('#importReviewPanel');if(!host)return;
 const count=state.pending.filter(x=>x.status==='pending').length;
 host.hidden=!(state.total||state.pending.length);
 host.innerHTML='<div class="import-review-title"><h3>TXT 全文去重与差异确认</h3><span>本批次 '+state.total+' 个 · 已自动加入 '+state.added+' · 待确认 '+count+'</span></div>'+
 (count?'<p class="import-instructions">以下项目不会自动导入，也不会覆盖旧书。请逐个选择强制加入／保留新版本，或拒绝。</p>':'<p class="import-instructions">本批次待确认项目已处理完毕。</p>')+
 state.pending.map((x,i)=>x.status==='pending'?reviewMarkup(x,i):'').join('')+
 (state.failed.length?'<details><summary>导入失败 '+state.failed.length+' 项</summary><p>'+state.failed.map(esc).join('；')+'</p></details>':'');
 host.querySelectorAll('[data-review]').forEach(btn=>btn.onclick=()=>resolve(Number(btn.dataset.review),btn.dataset.action));
 host.querySelectorAll('[data-showdiff]').forEach(btn=>btn.onclick=()=>{state.pending[Number(btn.dataset.showdiff)].showAll=true;render();});
}
async function resolve(i,action){
 const row=state.pending[i];if(!row||row.status!=='pending'||state.busy)return;
 state.busy=true;const el=$('#importStatus');
 try{
   if(action==='add'){await add(row,true);el.textContent='已保留 '+row.relativePath+'，旧书未被覆盖。';}
   else el.textContent='已跳过 '+row.relativePath+'，没有修改已收录原文。';
   row.status=action;
 }catch(e){el.textContent='处理失败：'+e.message;}
 finally{state.busy=false;render();}
}
async function begin(files,onProgress){
 if(state.busy)throw new Error('正在比较其他文件');
 if(state.pending.some(r=>r.status==='pending'))throw new Error('请先处理上一批重复／差异确认，再加入新文件夹');
 const chosen=Array.from(files||[]).filter(f=>/\.txt$/i.test(f.name||''));
 if(!chosen.length)throw new Error('没有选择 TXT 文件');
 state.busy=true;state.pending=[];state.added=0;state.duplicates=0;state.changed=0;state.failed=[];state.total=chosen.length;
 state.usedIds=new Set();state.records=[];
 const progress=t=>{onProgress?.(t);};
 try{
   progress('正在读取本站古籍的全文指纹，校验已有书库…');
   const [remote,local]=await Promise.all([fingerprints(),existingLocal(progress)]);
   state.records=await Promise.all([...remote,...local].map(async r=>({...r,foldedTitle:C.normalizedTitle(await TCMSearch.canonical(r.title))})));
   local.forEach(x=>state.usedIds.add(x.id));
   for(let i=0;i<chosen.length;i++){
     const file=chosen[i],rel=file.webkitRelativePath||file.relativePath||file.name;
     progress('逐本比较 '+(i+1)+' / '+chosen.length+'：'+rel);
     try{
       const text=await TCMLocalLibrary.textFromFile(file);
       if(!text.trim())throw new Error('空文件');
       const title=file.name.replace(/\.txt$/i,'').replace(/[-_]/g,' ');
       const info=await analyzedText(text);
       const item={id:'user:'+rel,title,text,filename:file.name,relativePath:rel,foldedTitle:C.normalizedTitle(await TCMSearch.canonical(title)),...info};
       const matches=candidatesFor(item,state.records);
       if(!matches.length){await add(item,false);continue;}
       if(matches[0].exact){state.duplicates++;state.pending.push({...item,matches,kind:'exact',status:'pending'});continue;}
       const source=matches[0];
       // A full-text comparison is performed against the closest candidate,
       // not merely a comparison of names or file sizes.
       const old=await oldText(source);
       const diff=await C.addedSentences(text,old,TCMSearch.canonical,Number.POSITIVE_INFINITY);
       state.changed++;state.pending.push({...item,matches,kind:'changed',diff,status:'pending'});
     }catch(e){state.failed.push(rel+'：'+String(e.message||e));}
   }
   progress('对比完成：无冲突已直接加入 '+state.added+' 本；全文重复 '+state.duplicates+' 本；有差异 '+state.changed+' 本；失败 '+state.failed.length+' 本。请在下方列表确认有冲突的文件。');
 }finally{state.busy=false;render();}
 return {added:state.added,duplicates:state.duplicates,changed:state.changed,failed:state.failed.length};
}
globalThis.TCMImportReview={begin,resolve,render};
})();