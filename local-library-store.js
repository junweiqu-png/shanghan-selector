(()=>{
  'use strict';
  const DB_NAME='tcm-local-library',VERSION=2;
  let opening=null;
  const toMeta=b=>({
    id:b.id,title:b.title,origin:'browser',filename:b.filename||'',
    relativePath:b.relativePath||b.filename||'',addedAt:b.addedAt||Date.now(),
    chars:b.chars||b.text?.length||0,category:b.category||'我的 TXT'
  });
  function open(){
    if(opening)return opening;
    opening=new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB_NAME,VERSION);
      r.onupgradeneeded=()=>{
        const db=r.result,tx=r.transaction;
        const books=db.objectStoreNames.contains('books')?tx.objectStore('books'):db.createObjectStore('books',{keyPath:'id'});
        if(!db.objectStoreNames.contains('catalog')){
          const catalog=db.createObjectStore('catalog',{keyPath:'id'});
          const cursor=books.openCursor();
          cursor.onsuccess=()=>{const c=cursor.result;if(c){catalog.put(toMeta(c.value));c.continue();}};
        }
      };
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>{opening=null;reject(r.error);};
      r.onblocked=()=>console.warn('Local library database is open in another tab');
    });
    return opening;
  }
  async function all(){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const r=db.transaction('catalog','readonly').objectStore('catalog').getAll();
      r.onsuccess=()=>resolve(r.result||[]);
      r.onerror=()=>reject(r.error);
    });
  }
  async function get(id){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const r=db.transaction('books','readonly').objectStore('books').get(id);
      r.onsuccess=()=>resolve(r.result||null);
      r.onerror=()=>reject(r.error);
    });
  }
  async function put(book){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(['books','catalog'],'readwrite');
      tx.objectStore('books').put(book);
      tx.objectStore('catalog').put(toMeta(book));
      tx.oncomplete=()=>resolve(toMeta(book));
      tx.onerror=()=>reject(tx.error||new Error('浏览器存储空间不足'));
      tx.onabort=()=>reject(tx.error||new Error('导入写入失败'));
    });
  }
  async function remove(id){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(['books','catalog'],'readwrite');
      tx.objectStore('books').delete(id);
      tx.objectStore('catalog').delete(id);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);
    });
  }
  function textFromFile(file){
    return file.arrayBuffer().then(buffer=>{
      const bytes=new Uint8Array(buffer);
      if(bytes.length>=2&&bytes[0]===0xff&&bytes[1]===0xfe)return new TextDecoder('utf-16le').decode(buffer);
      if(bytes.length>=2&&bytes[0]===0xfe&&bytes[1]===0xff)return new TextDecoder('utf-16be').decode(buffer);
      try{return new TextDecoder('utf-8',{fatal:true}).decode(buffer);}
      catch{return new TextDecoder('gb18030').decode(buffer);}
    });
  }
  async function importFiles(files,onProgress){
    const chosen=Array.from(files||[]).filter(f=>/\.txt$/i.test(f.name||''));
    const summary={total:chosen.length,imported:0,failed:0,errors:[]};
    for(let i=0;i<chosen.length;i++){
      const file=chosen[i],rel=file.webkitRelativePath||file.relativePath||file.name;
      try{
        const text=await textFromFile(file);
        if(!text.trim())throw new Error('文件为空');
        const id='user:'+rel;
        await put({id,title:file.name.replace(/\.txt$/i,'').replace(/[-_]/g,' '),
          text,origin:'browser',filename:file.name,relativePath:rel,addedAt:Date.now(),chars:text.length});
        summary.imported++;
      }catch(e){
        summary.failed++;
        if(summary.errors.length<8)summary.errors.push(rel+': '+String(e.message||e));
      }
      onProgress?.({done:i+1,file:rel,...summary});
    }
    return summary;
  }
  async function search(raw,{maxBooks=100,maxHits=3,concurrency=4}={}){
    if(!globalThis.TCMSearch)throw new Error('搜索引擎还没有加载');
    const metas=await all();
    const ast=TCMSearch.parse(raw),rows=[],errors=[];
    let cursor=0,checked=0,stop=false;
    // The same strict text verification as main-site full-text search.
    async function worker(){
      while(true){
        if(rows.length>=maxBooks){stop=true;return;}
        const ix=cursor++;if(ix>=metas.length)return;
        const meta=metas[ix];
        try{
          const full=await get(meta.id);
          if(!full)continue;
          const hits=await TCMSearch.searchText(full.text||'',ast,{maxHits,windowSize:900});
          checked++;
          if(hits.length)rows.push({doc:meta,book:meta,hits});
        }catch(e){checked++;if(errors.length<6)errors.push(meta.title+': '+String(e.message||e));}
      }
    }
    await Promise.all(Array.from({length:Math.min(concurrency,Math.max(1,metas.length))},worker));
    return {rows:rows.slice(0,maxBooks),scanned:checked,total:metas.length,partial:stop||cursor<metas.length,errors};
  }
  globalThis.TCMLocalLibrary={open,all,get,put,remove,importFiles,search};
})();