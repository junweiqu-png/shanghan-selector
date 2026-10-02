import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const DIST=path.join(ROOT,'dist');
const OUT=path.join(DIST,'search-index');
const SHARD_COUNT=64;
const GRAM_SIZE=2;

function compact(s){
  return String(s||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,'');
}
function bucketFor(gram){
  const a=gram.codePointAt(0)||0;
  const rest=[...gram];
  const b=rest.length>1?(rest[1].codePointAt(0)||0):0;
  return ((a*31+b)>>>0)%SHARD_COUNT;
}
function parseManifest(raw){
  const m=raw.match(/const\s+BOOK_MANIFEST\s*=\s*([\s\S]*);\s*$/);
  if(!m)throw new Error('Unable to parse dist/books/manifest.js');
  return JSON.parse(m[1]);
}

async function main(){
  const manifest=parseManifest(await fs.readFile(path.join(DIST,'books','manifest.js'),'utf8'));
  const shards=Array.from({length:SHARD_COUNT},()=>new Map());
  let totalChars=0,totalUniqueBookGrams=0;

  for(let i=0;i<manifest.length;i++){
    const book=manifest[i];
    const text=await fs.readFile(path.join(DIST,book.path),'utf8');
    totalChars+=text.length;
    const chars=[...compact(text)];
    const seen=new Set();
    for(let j=0;j+GRAM_SIZE<=chars.length;j++)seen.add(chars.slice(j,j+GRAM_SIZE).join(''));
    totalUniqueBookGrams+=seen.size;
    for(const gram of seen){
      const map=shards[bucketFor(gram)];
      let posting=map.get(gram);
      if(!posting){posting=[];map.set(gram,posting);}
      posting.push(i);
    }
    if((i+1)%40===0||i===manifest.length-1)console.log(`n-gram indexed ${i+1}/${manifest.length}`);
  }

  await fs.rm(OUT,{recursive:true,force:true});
  await fs.mkdir(path.join(OUT,'shards'),{recursive:true});
  const docs=manifest.map((b,i)=>({i,id:b.id,path:b.path,title:b.title,author:b.author||'',category:b.category||'',edition:b.edition||'',chars:b.chars||0,complete:b.complete!==false,captureStatus:b.captureStatus||'',source:b.source||'',sourceUrl:b.sourceUrl||'',license:b.license||''}));
  const meta={version:1,generatedAt:new Date().toISOString(),gramSize:GRAM_SIZE,shardCount:SHARD_COUNT,documentCount:docs.length,totalChars,documents:docs};
  await fs.writeFile(path.join(OUT,'meta.json'),JSON.stringify(meta),'utf8');

  let indexBytes=0,gramCount=0;
  for(let i=0;i<SHARD_COUNT;i++){
    const obj=Object.fromEntries([...shards[i].entries()].sort((a,b)=>a[0].localeCompare(b[0],'zh')));
    gramCount+=Object.keys(obj).length;
    const raw=JSON.stringify(obj);
    indexBytes+=Buffer.byteLength(raw);
    await fs.writeFile(path.join(OUT,'shards',`${String(i).padStart(2,'0')}.json`),raw,'utf8');
  }
  const stats={...meta,documents:undefined,gramCount,totalUniqueBookGrams,indexBytes};
  await fs.writeFile(path.join(OUT,'stats.json'),JSON.stringify(stats,null,2),'utf8');
  console.log(`n-gram index ready: ${docs.length} docs; ${gramCount.toLocaleString()} unique 2-grams; ${(indexBytes/1024/1024).toFixed(1)} MiB JSON shards`);
}

main().catch(e=>{console.error(e);process.exit(1);});
