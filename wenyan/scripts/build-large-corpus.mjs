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
import vm from 'node:vm';
import OpenCC from 'opencc-js';
import {gzipSync} from 'node:zlib';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const SOURCE='https://huggingface.co/datasets/gujilab/chinese-classical-corpus/resolve/main/corpus.jsonl';
const PROVENANCE='https://github.com/gujilab/chinese-classical-corpus';
const RAW=process.env.WENYAN_LARGE_SOURCE||'.evidence-cache/gujilab-corpus-v13.jsonl';
const OUT='dist/wenyan/evidence',MAX_PER_CHAR=64,MAX_PER_TERM=80;
const s2t=OpenCC.Converter({from:'cn',to:'tw'});
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
const wordWindow={};
for(const f of ['data-basic.js','data-classic.js','data-extra.js','data-junior.js','data-junior-batch2a.js','data-junior-batch2b.js','data-junior-batch2c.js','study-annotations.js','study-crosslesson.js','study-verified-extra.js','study-verified-more2.js','study-verified-common3.js','study-verified-corpus.js','study-verified-batch4.js','study-verified-batch5.js','study-verified-batch6.js','study-verified-batch7.js','study-verified-batch8.js','study-verified-batch9.js','study-verified-batch10.js']){
 const file=path.join('wenyan',f);
 vm.runInNewContext(await fsp.readFile(file,'utf8'),{window:wordWindow},{filename:file});
}
const searchTerms=[...new Set([
 ...(wordWindow.WENYAN_DATA_1||[]).flatMap(w=>(w.terms||[]).map(t=>t[0])),
 ...(wordWindow.WENYAN_DATA_2||[]).flatMap(w=>(w.terms||[]).map(t=>t[0])),
 ...(wordWindow.WENYAN_DATA_3||[]).flatMap(w=>(w.terms||[]).map(t=>t[0])),
 ...(wordWindow.WENYAN_DATA_4||[]).flatMap(w=>(w.terms||[]).map(t=>t[0])),
 ...[wordWindow.WENYAN_ANNOTATIONS,wordWindow.WENYAN_CROSSLESSON,wordWindow.WENYAN_VERIFIED_EXTRA,wordWindow.WENYAN_VERIFIED_MORE2,wordWindow.WENYAN_VERIFIED_COMMON3,wordWindow.WENYAN_VERIFIED_CORPUS,wordWindow.WENYAN_VERIFIED_BATCH4,wordWindow.WENYAN_VERIFIED_BATCH5,wordWindow.WENYAN_VERIFIED_BATCH6,wordWindow.WENYAN_VERIFIED_BATCH7,wordWindow.WENYAN_VERIFIED_BATCH8,wordWindow.WENYAN_VERIFIED_BATCH9,wordWindow.WENYAN_VERIFIED_BATCH10].flatMap(x=>Object.keys(x?.words||{}))
])].filter(Boolean);
const termAliases={
 '辩斗':['争辩','辩论','论辩'],'沧沧凉凉':['清凉','凉爽','寒凉'],'揠':['拔','拔起'],
 '芒芒然':['茫茫然','疲倦','疲惫'],'搐':['收缩','抽动'],'淡泊':['恬淡'],
 '淫慢':['懈怠','怠惰','放纵'],'险躁':['浮躁','轻薄浮躁'],'刮目':['刮目相待','另眼相看'],
 '空明':['澄澈','清澈','澄明'],'交辉':['交映','辉映','交相辉映'],'沉鳞':['游鱼','水中之鱼'],
 '淤泥':['污泥','泥淖'],'亵玩':['狎玩','轻慢'],'崩坠':['崩塌','坠落'],
 '只使':['即使','纵使','假使'],'舍然':['释然','释怀'],'躇步跐蹈':['行走','践踏','蹈'],
 '苫蔽':['遮蔽','覆盖','掩蔽'],'眈眈':['虎视','注视','瞪视']
};
const termForms=new Map(searchTerms.map(term=>[term,[...new Set([term,s2t(term),...(termAliases[term]||[]),...(termAliases[term]||[]).map(s2t)])]]));
const termBuckets=Object.create(null);
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
 for(const term of searchTerms){
  const variants=termForms.get(term)||[term];let at=-1,matched=term;
  for(const variant of variants){at=full.indexOf(variant);if(at>=0){matched=variant;break;}}
  if(at<0)continue;
  const arr=termBuckets[term]||(termBuckets[term]=[]);
  const score=(hash(term+'|'+id)/4294967296)*rankGroup(group);
  if(arr.length===MAX_PER_TERM&&arr[arr.length-1][0]<=score)continue;
  const item=[score,source,chapter,quoteContext(full,at,matched),id,group,matched,(matched===term||matched===s2t(term))?'exact':'related'];
  if(arr.length<MAX_PER_TERM){arr.push(item);arr.sort((a,b)=>a[0]-b[0]);}
  else{arr[arr.length-1]=item;arr.sort((a,b)=>a[0]-b[0]);}
 }
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
for(const folder of ['large-index','large-texts','large-term-index']){
 await fsp.rm(path.join(OUT,folder),{recursive:true,force:true});
 await fsp.mkdir(path.join(OUT,folder),{recursive:true});
}
const indexFiles=[];
for(let i=0;i<64;i++){
 const name=i.toString().padStart(2,'0')+'.json.gz';
 const out={};for(const [ch,arr] of Object.entries(buckets[i])){
  out[ch]=arr.map(x=>({source:x[1],chapter:x[2],text:x[3],id:x[4],group:x[5]}));
  quoteEntries+=arr.length;
 }
 await fsp.writeFile(path.join(OUT,'large-index',name),gzipSync(Buffer.from(JSON.stringify(out),'utf8'),{level:6}));
 indexFiles.push(name);
}
const termShards=Array.from({length:64},()=>Object.create(null));let termIndexSamples=0;
for(const [term,arr]of Object.entries(termBuckets)){
 const shard=hash(term)%64;
 termShards[shard][term]=arr.map(x=>({source:x[1],chapter:x[2],title:x[1]+'·'+x[2],text:x[3],id:x[4],group:x[5],matched:x[6],matchType:x[7],url:PROVENANCE}));
 termIndexSamples+=arr.length;
}
for(let i=0;i<64;i++)await fsp.writeFile(path.join(OUT,'large-term-index',i.toString().padStart(2,'0')+'.json.gz'),gzipSync(Buffer.from(JSON.stringify(termShards[i]),'utf8'),{level:6}));
for(let i=0;i<32;i++)await fsp.writeFile(path.join(OUT,'large-texts',i.toString().padStart(2,'0')+'.json.gz'),gzipSync(Buffer.from(JSON.stringify(texts[i]),'utf8'),{level:6}));
manifest.large={available:true,source:PROVENANCE,license:'CC0 1.0（数据集标识）；古籍底本另见数据集出处',
 sourceRecords:rows,sourceBooks:Object.keys(stats).length,originalChars:chars,
 indexedSnippets:quoteEntries,excluded,indexShards:64,textShards:32,maxSamplesPerCharacter:MAX_PER_CHAR,
 indexEncoding:'gzip',fullTextEncoding:'gzip',termIndexEncoding:'gzip',termIndexShards:64,termIndexTerms:searchTerms.length,termIndexSamples,termIndexMaxSamples:MAX_PER_TERM,
 bookCounts:stats,bookChars:charsByBook,
 explain:'原典全文、单字和完整词语候选索引仅供教师查询；未逐句确认翻译和字义者不会自动作为学生关联学习答案展示'};
await fsp.writeFile(manifestPath,JSON.stringify(manifest,null,2),'utf8');
console.log('LARGE CORPUS READY',JSON.stringify({records:rows,books:Object.keys(stats).length,chars,snippets:quoteEntries,termIndexTerms:searchTerms.length,termIndexSamples,excluded,indexShards:64,termIndexShards:64,textShards:32}));
