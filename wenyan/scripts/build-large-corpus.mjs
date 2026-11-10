/**
 * Compact, attributed background search index for the CC0 gujilab classical corpus.
 * Source archive: https://huggingface.co/datasets/gujilab/chinese-classical-corpus
 * 13 classics, selected 15 of 24 official histories, full Zizhi Tongjian, etc.
 * The 17M+ character original corpus DOES NOT supply trusted sentence translations.
 * Only trained teacher-authored excerpts may enter the visible student study cards.
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const SOURCE='https://huggingface.co/datasets/gujilab/chinese-classical-corpus/resolve/main/corpus.jsonl';
const PROVENANCE='https://github.com/gujilab/chinese-classical-corpus';
const RAW=process.env.WENYAN_LARGE_SOURCE||'.evidence-cache/gujilab-corpus-v13.jsonl';
const OUT='dist/wenyan/evidence',MAX_PER_CHAR=150;
const sha=s=>crypto.createHash('sha1').update(String(s)).digest('hex');
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const clean=s=>String(s||'').replace(/\u200b/g,'').replace(/[ \t]+/g,' ').replace(/\r\n/g,'\n').trim();
const primary=new Set(['论语','孟子','诗经','礼记','荀子','春秋左传','尚书','孝经','大学','中庸','庄子','老子']);
const groupOf=src=>src==='资治通鉴'?'资治通鉴':src.includes('史记')?'史记':src.includes('汉书')?'汉书':primary.has(src)?'经史名言':'二十四史及古籍';
const rankGroup=g=>({'经史名言':0.35,'史记':0.55,'资治通鉴':0.6,'汉书':0.7,'二十四史及古籍':1})[g]||1;
function quoteContext(s,at,word){
 const start=s.lastIndexOf('。',at-1)+1;
 const close=s.indexOf('。',at+word.length);
 const lo=Math.max(0,Math.max(start,at-75)),hi=Math.min(s.length,close>=0&&close-at<105?close+1:at+word.length+100);
 return (lo>0?'…':'')+clean(s.slice(lo,hi))+(hi<s.length?'…':'');
}
async function download(){
 try{const st=await fsp.stat(RAW);if(st.size>40000000){console.log('large corpus cached',st.size);return true;}}catch{}
 await fsp.mkdir(path.dirname(RAW),{recursive:true});
 const t=RAW+'.tmp';const urls=[SOURCE,'https://raw.githubusercontent.com/gujilab/chinese-classical-corpus/main/output/corpus.jsonl'];
 for(const url of urls){
  for(let attempt=0;attempt<2;attempt++){
   try{
    const r=await fetch(url,{headers:{'user-agent':'WenyanClassicsStudy/2.0 (https://github.com/junweiqu-png/shanghan-selector)'},signal:AbortSignal.timeout(240000)});
    if(!r.ok||!r.body)throw Error('HTTP '+r.status);
    await pipeline(Readable.fromWeb(r.body),fs.createWriteStream(t));
    const st=await fsp.stat(t);if(st.size<40000000)throw Error('truncated large dataset '+st.size);
    await fsp.rename(t,RAW);console.log('large dataset retrieved',st.size);return true;
   }catch(e){console.warn('large source attempt',attempt+1,url,e.message);await fsp.rm(t,{force:true});}
  }
 }
 return false;
}
const manifestPath=path.join(OUT,'expanded-manifest.json');
const manifest=JSON.parse(await fsp.readFile(manifestPath,'utf8'));
if(!await download()){
 manifest.large={available:false,source:PROVENANCE,reason:'公开语料源暂时不可达，本次仍可用小学初高中、世说新语及既有原典索引'};
 await fsp.writeFile(manifestPath,JSON.stringify(manifest,null,2));console.warn('large corpus skipped; existing site remains functional');process.exit(0);
}
const buckets=Array.from({length:64},()=>Object.create(null));
const texts=Array.from({length:32},()=>[]);
const stats={},charsByBook={};
let rows=0,chars=0,quoteEntries=0,excluded=0;
const input=readline.createInterface({input:fs.createReadStream(RAW,{encoding:'utf8'}),crlfDelay:Infinity});
for await(const raw of input){
 if(!raw.trim())continue;
 let x;try{x=JSON.parse(raw);}catch{excluded++;continue;}
 const source=clean(x.source),chapter=clean(x.chapter||x.title||x.section||('第'+(x.volume||x.id)+'篇'));
 const full=clean(x.content),id=String(x.id||sha(source+chapter));
 if(!full||full.length<8){excluded++;continue;}
 const group=groupOf(source),title=source+'·'+chapter,part={id,source,chapter,title,group,text:full};
 texts[hash(id)%32].push(part);
 rows++;chars+=full.length;stats[source]=(stats[source]||0)+1;charsByBook[source]=(charsByBook[source]||0)+full.length;
 if(source==="说文解字")continue; // 字书提供词典，避免将释文混作教学文章的句式例句
 // One evidence sample from each book chapter, selected by stable hash, not by arbitrary first 100.
 const seen=new Set(),candidates=[];
 for(const ch of full.match(/[\u3400-\u9fff]/g)||[]){
  if(seen.has(ch))continue;seen.add(ch);
  const at=full.indexOf(ch),key=ch,code=ch.codePointAt(0)%64;
  const score=(hash(key+'|'+id)/4294967296)*rankGroup(group);
  const bucket=buckets[code],arr=bucket[key]||(bucket[key]=[]);
  if(arr.length===MAX_PER_CHAR&&arr[arr.length-1][0]<=score)continue;
  const q=quoteContext(full,at,ch);
  const item=[score,source,chapter,q,id,group];
  if(arr.length<MAX_PER_CHAR){arr.push(item);arr.sort((a,b)=>a[0]-b[0]);}
  else{arr[arr.length-1]=item;arr.sort((a,b)=>a[0]-b[0]);}
 }
 if(rows%2500===0)console.log('large index',rows,'rows',Object.keys(stats).length,'books');
}
await fsp.mkdir(path.join(OUT,'large-index'),{recursive:true});
await fsp.mkdir(path.join(OUT,'large-texts'),{recursive:true});
const indexFiles=[];
for(let i=0;i<64;i++){
 const name=i.toString().padStart(2,'0')+'.json';
 const out={};for(const [ch,arr] of Object.entries(buckets[i])){
  out[ch]=arr.map(x=>({source:x[1],chapter:x[2],text:x[3],id:x[4],group:x[5]}));
  quoteEntries+=arr.length;
 }
 await fsp.writeFile(path.join(OUT,'large-index',name),JSON.stringify(out),'utf8');
 indexFiles.push(name);
}
for(let i=0;i<32;i++)await fsp.writeFile(path.join(OUT,'large-texts',i.toString().padStart(2,'0')+'.json'),JSON.stringify(texts[i]),'utf8');
manifest.large={available:true,source:PROVENANCE,license:'CC0 1.0（数据集标识）；古籍底本另见数据集出处',
 sourceRecords:rows,sourceBooks:Object.keys(stats).length,originalChars:chars,
 indexedSnippets:quoteEntries,excluded,indexShards:64,textShards:32,maxSamplesPerCharacter:MAX_PER_CHAR,
 bookCounts:stats,bookChars:charsByBook,
 explain:'原典全文和单字候选索引仅供教师查询；未逐句确认翻译和字义者不会自动作为学生关联学习答案展示'};
await fsp.writeFile(manifestPath,JSON.stringify(manifest,null,2),'utf8');
console.log('LARGE CORPUS READY',JSON.stringify({records:rows,books:Object.keys(stats).length,chars,snippets:quoteEntries,excluded,indexShards:64,textShards:32}));
