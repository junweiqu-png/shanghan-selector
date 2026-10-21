(()=>{
'use strict';
const cache=new Map();
async function loadRepo(doc){
  if(cache.has(doc.id))return cache.get(doc.id);
  const r=await fetch(doc.path);
  if(!r.ok)throw new Error('正文获取失败：'+r.status);
  const book={...doc,text:await r.text(),origin:'repo'};
  cache.set(doc.id,book);
  if(cache.size>6)cache.delete(cache.keys().next().value);
  return book;
}
async function search(raw,{maxRepo=80,maxLocal=80,repoHits=4,localHits=4,exhaustive=false,concurrency=8}={}){
 if(!globalThis.TCMSearch)throw new Error('未载入统一古籍搜索引擎');
 const ast=TCMSearch.parse(raw);
 const tasks=await Promise.allSettled([
   TCMSearch.searchCorpus(raw,loadRepo,{maxResults:maxRepo,concurrency,exhaustive}),
   TCMLocalLibrary.search(raw,{maxBooks:maxLocal,maxHits:localHits,concurrency:4})
 ]);
 const err=[];
 const repo=tasks[0].status==='fulfilled'?tasks[0].value:[];
 const local=tasks[1].status==='fulfilled'?tasks[1].value:{rows:[],total:0,scanned:0,errors:[]};
 if(tasks[0].status==='rejected')err.push('公共古籍：'+String(tasks[0].reason?.message||tasks[0].reason));
 if(tasks[1].status==='rejected')err.push('我的 TXT：'+String(tasks[1].reason?.message||tasks[1].reason));
 err.push(...(local.errors||[]));
 return {ast,repo,local,errors:err};
}
function readerUrl(bookId,line,q){
 const params=new URLSearchParams({book:bookId,line:String(line||1),term:q||''});
 return 'index.html?'+params.toString()+'#library';
}
function searchUrl(q){
 return 'index.html?'+new URLSearchParams({query:q}).toString()+'#search';
}
globalThis.TCMCorpusLookup={search,readerUrl,searchUrl,loadRepo};
})();