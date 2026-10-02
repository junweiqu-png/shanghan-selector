import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT=process.cwd(), DIST=path.join(ROOT,'dist');
const API='https://zh.wikisource.org/w/api.php';
const MAX=Number(process.env.CORPUS_MAX_BOOKS||700);
const EXPAND_BELOW=Number(process.env.CORPUS_EXPAND_BELOW||25000);
const MAX_SUBPAGES=Number(process.env.CORPUS_MAX_SUBPAGES||500);
const REQUEST_GAP=Number(process.env.CORPUS_REQUEST_GAP_MS||320);
const CACHE_DIR=process.env.CORPUS_CACHE_DIR||path.join(ROOT,'.corpus-cache','api');
const CACHE_TTL_MS=Number(process.env.CORPUS_CACHE_TTL_MS||6*24*60*60*1000);
const UA='TCMClassicsCorpus/0.4 (https://github.com/junweiqu-png/shanghan-selector)';
const SKIP=new Set(['.git','.github','dist','node_modules','scripts','.corpus-cache']);

const CORE=['傷寒論','金匱要略','黃帝內經','難經','脈經','神農本草經','備急千金要方','外臺秘要','傷寒明理論','本草綱目','溫病條辨','醫學源流論','針灸甲乙經','針灸大成','臨證指南醫案','四聖心源'];
const META={
  '傷寒論':{author:'漢·張仲景',edition:'宋本'},'金匱要略':{author:'漢·張仲景'},'脈經':{author:'西晉·王叔和'},
  '備急千金要方':{author:'唐·孫思邈'},'傷寒明理論':{author:'金·成無己'},'溫病條辨':{author:'清·吳鞠通'},
  '醫學源流論':{author:'清·徐靈胎'},'四聖心源':{author:'清·黃元御'}
};
const failures=[];
const cacheStats={freshHits:0,staleFallbacks:0,writes:0};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let requestChain=Promise.resolve(), lastRequestAt=0;

function requestSlot(){
  const task=requestChain.then(async()=>{
    const jitter=Math.floor(Math.random()*90);
    const wait=Math.max(0,lastRequestAt+REQUEST_GAP+jitter-Date.now());
    if(wait)await sleep(wait);
    lastRequestAt=Date.now();
  });
  requestChain=task.catch(()=>{});
  return task;
}
function retryDelay(res,attempt){
  const retryAfter=Number(res?.headers?.get?.('retry-after')||0);
  if(retryAfter>0)return Math.min(30000,retryAfter*1000);
  const seq=[1200,2200,4000,6500,10000,15000,22000,28000];
  return seq[Math.min(attempt,seq.length-1)]+Math.floor(Math.random()*700);
}
function cachePath(url){return path.join(CACHE_DIR,crypto.createHash('sha1').update(String(url)).digest('hex')+'.json');}
async function readCache(url){
  try{const raw=JSON.parse(await fs.readFile(cachePath(url),'utf8'));if(raw&&raw.data&&raw.savedAt)return raw;}catch{}
  return null;
}
async function writeCache(url,data){
  try{await fs.mkdir(CACHE_DIR,{recursive:true});await fs.writeFile(cachePath(url),JSON.stringify({savedAt:Date.now(),data}),'utf8');cacheStats.writes++;}catch(e){console.warn('cache write skipped',e.message);}
}
async function getJSON(url,tries=8){
  const cached=await readCache(url);
  if(cached&&Date.now()-cached.savedAt<=CACHE_TTL_MS){cacheStats.freshHits++;return cached.data;}
  let lastError=null;
  for(let i=0;i<tries;i++){
    await requestSlot();
    let r;
    try{r=await fetch(url,{headers:{'user-agent':UA,'accept':'application/json'}});}catch(e){lastError=e;if(i===tries-1)break;await sleep(retryDelay(null,i));continue;}
    if(r.ok){
      const j=await r.json();
      if(j?.error?.code==='maxlag'){lastError=new Error('MediaWiki maxlag');await sleep(retryDelay(r,i));continue;}
      await writeCache(url,j);return j;
    }
    lastError=new Error(`${r.status} ${url}`);
    if(r.status===429||r.status===408||r.status>=500){if(i===tries-1)break;await sleep(retryDelay(r,i));continue;}
    throw lastError;
  }
  if(cached){cacheStats.staleFallbacks++;console.warn(`using stale cache after live fetch failure: ${url}`);return cached.data;}
  throw lastError||new Error(`retry exhausted: ${url}`);
}
function apiURL(params){const u=new URL(API);u.search=new URLSearchParams({...params,maxlag:'5',format:'json',formatversion:'2'});return u;}
async function categoryMembers(cat,depth=0,seenCats=new Set()){
  if(seenCats.has(cat))return [];
  seenCats.add(cat);let cont='',out=[];
  do{const j=await getJSON(apiURL({action:'query',list:'categorymembers',cmtitle:cat,cmtype:'page|subcat',cmnamespace:'0|14',cmlimit:'500',...(cont?{cmcontinue:cont}:{})}));out.push(...(j.query?.categorymembers||[]));cont=j.continue?.cmcontinue||'';}while(cont);
  if(depth<2){for(const m of out.filter(x=>x.ns===14))out.push(...await categoryMembers(m.title,depth+1,seenCats));}
  return out;
}
async function listSubpages(title){
  let cont='',out=[];
  do{const j=await getJSON(apiURL({action:'query',list:'allpages',apprefix:title+'/',apnamespace:'0',aplimit:'500',...(cont?{apcontinue:cont}:{})}));out.push(...(j.query?.allpages||[]).map(x=>x.title));cont=j.continue?.apcontinue||'';if(out.length>=MAX_SUBPAGES)break;}while(cont);
  return [...new Set(out)].slice(0,MAX_SUBPAGES);
}
function decodeEntities(s){return s.replace(/&#x([0-9a-f]+);/gi,(_,x)=>String.fromCodePoint(parseInt(x,16))).replace(/&#(\d+);/g,(_,x)=>String.fromCodePoint(Number(x))).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'");}
function htmlToText(html){return decodeEntities(String(html||'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<sup[\s\S]*?<\/sup>/gi,'').replace(/<!--([\s\S]*?)-->/g,'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(p|div|li|tr|h[1-6]|section|blockquote)>/gi,'\n').replace(/<li[^>]*>/gi,'• ').replace(/<[^>]+>/g,'')).replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
async function pageText(title){const j=await getJSON(apiURL({action:'parse',page:title,prop:'text',disableeditsection:'1',redirects:'1'}));return htmlToText(j.parse?.text||'');}
function catFor(t){if(/傷寒|仲景|金匱|柴胡|桂枝/.test(t))return '伤寒经方';if(/本草|藥|食療/.test(t))return '本草药物';if(/脈|診|舌/.test(t))return '诊法脉学';if(/針|鍼|灸|穴/.test(t))return '针灸';if(/溫病|溫熱|濕熱/.test(t))return '温病';if(/醫案|驗案|臨證/.test(t))return '医案';if(/女科|婦|產/.test(t))return '妇科';if(/兒|幼|嬰|小兒/.test(t))return '儿科';if(/外科|瘍|瘡|傷科|骨/.test(t))return '外伤科';if(/方|湯|丸|散/.test(t))return '方书';return '综合医籍';}
function safeId(t){return 'ws-'+crypto.createHash('sha1').update(t).digest('hex').slice(0,14);}
function sourceUrl(t){return 'https://zh.wikisource.org/wiki/'+encodeURIComponent(t).replace(/%2F/g,'/');}
function escHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
async function mapLimit(items,n,fn){let i=0,res=[];async function worker(){while(i<items.length){const idx=i++;try{res[idx]=await fn(items[idx],idx);}catch(e){res[idx]={__error:e};}}}await Promise.all(Array.from({length:n},worker));return res;}

async function fetchWork(title){
  const core=CORE.includes(title);
  let rootText='';
  try{rootText=await pageText(title);}catch(e){throw new Error(`root: ${e.message}`);}
  let subpages=[],discoveryError='';
  if(rootText.length<EXPAND_BELOW||core){try{subpages=await listSubpages(title);}catch(e){discoveryError=e.message;failures.push({type:'subpage-discovery',work:title,error:e.message});}}
  let fetchedSubpages=0,emptySubpages=0,failedSubpages=0,pieces=[];
  if(subpages.length){
    const rows=await mapLimit(subpages,2,async s=>{try{return {title:s,text:await pageText(s)};}catch(e){return {title:s,error:e.message};}});
    for(const row of rows){
      if(typeof row?.text==='string'){
        if(row.text.trim()){fetchedSubpages++;pieces.push(`\n\n===== ${row.title} =====\n\n${row.text}`);}else emptySubpages++;
      }else if(row?.error){failedSubpages++;failures.push({type:'subpage',work:title,page:row.title,error:row.error});}
    }
  }
  const text=rootText+(pieces.length?pieces.join(''):'');
  if(text.length<300){if(discoveryError)throw new Error(`too short and subpage discovery failed: ${discoveryError}`);return null;}
  const id=safeId(title),meta=META[title]||{};
  const fetchComplete=!discoveryError&&failedSubpages===0;
  const captureStatus=!fetchComplete?'部分抓取':subpages.length?`分卷抓取完成${emptySubpages?`（${emptySubpages} 个空页）`:''}`:'单页收录';
  return {id,title:`《${title}》`,rawTitle:title,author:meta.author||'',edition:meta.edition||'维基文库校录本',category:catFor(title),path:`books/ws/${id}.txt`,source:'中文维基文库',sourceUrl:sourceUrl(title),license:'CC BY-SA 4.0 / 原作公版或自由许可',chars:text.length,subpagesTotal:subpages.length,subpagesFetched:fetchedSubpages,subpagesEmpty:emptySubpages,subpagesFailed:failedSubpages,expanded:subpages.length>0,complete:fetchComplete,captureStatus,text};
}
async function copyBase(){await fs.rm(DIST,{recursive:true,force:true});await fs.mkdir(DIST,{recursive:true});for(const e of await fs.readdir(ROOT,{withFileTypes:true})){if(SKIP.has(e.name))continue;await fs.cp(path.join(ROOT,e.name),path.join(DIST,e.name),{recursive:true});}}
async function fetchOne(title){try{return await fetchWork(title);}catch(e){failures.push({type:'root',work:title,error:e.message});return null;}}
async function main(){
  await copyBase();
  const members=await categoryMembers('Category:中醫');
  let titles=[...new Set(members.filter(x=>x.ns===0).map(x=>x.title).filter(t=>!t.includes('/')&&!/^(Template|Portal|Index):/.test(t)))];
  titles.sort((a,b)=>(CORE.indexOf(a)<0?999:CORE.indexOf(a))-(CORE.indexOf(b)<0?999:CORE.indexOf(b))||a.localeCompare(b,'zh-Hant'));
  titles=titles.slice(0,MAX);console.log(`Corpus candidates: ${titles.length}; global gap ${REQUEST_GAP}ms; cache TTL ${Math.round(CACHE_TTL_MS/3600000)}h`);
  const rows=await mapLimit(titles,3,async(t,idx)=>{const w=await fetchOne(t);if((idx+1)%20===0)console.log(`Fetched ${idx+1}/${titles.length}`);return w;});
  let works=rows.filter(x=>x&&!x.__error);
  const missingCore=CORE.filter(t=>titles.includes(t)&&!works.some(w=>w.rawTitle===t));
  if(missingCore.length){console.log(`Retrying missing core works sequentially: ${missingCore.join(', ')}`);await sleep(5000);for(const t of missingCore){const w=await fetchOne(t);if(w){works=works.filter(x=>x.rawTitle!==t);works.push(w);}await sleep(1200);}}
  works.sort((a,b)=>titles.indexOf(a.rawTitle)-titles.indexOf(b.rawTitle));
  await fs.mkdir(path.join(DIST,'books','ws'),{recursive:true});await fs.mkdir(path.join(DIST,'corpus-pages'),{recursive:true});
  for(const w of works){await fs.writeFile(path.join(DIST,w.path),w.text,'utf8');const html=`<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>${escHtml(w.title)}</title></head><body><main data-pagefind-body><h1 data-pagefind-meta="title">${escHtml(w.title)}</h1><span data-pagefind-meta="book_id:${w.id}"></span><span data-pagefind-meta="category:${escHtml(w.category)}"></span><span data-pagefind-meta="source:中文维基文库"></span><pre>${escHtml(w.text)}</pre></main></body></html>`;await fs.writeFile(path.join(DIST,'corpus-pages',w.id+'.html'),html,'utf8');}
  const manifest=works.map(({text,rawTitle,...w})=>w);
  const expandedWorks=works.filter(w=>w.expanded).length,totalSubpages=works.reduce((s,w)=>s+w.subpagesTotal,0),fetchedSubpages=works.reduce((s,w)=>s+w.subpagesFetched,0),emptySubpages=works.reduce((s,w)=>s+(w.subpagesEmpty||0),0),failedSubpages=works.reduce((s,w)=>s+w.subpagesFailed,0),missingRoots=titles.filter(t=>!works.some(w=>w.rawTitle===t));
  const core=CORE.map(title=>{const w=works.find(x=>x.rawTitle===title);return {title,present:!!w,fetchComplete:!!w?.complete,captureStatus:w?.captureStatus||'',chars:w?.chars||0,subpagesTotal:w?.subpagesTotal||0,subpagesFetched:w?.subpagesFetched||0,subpagesEmpty:w?.subpagesEmpty||0,subpagesFailed:w?.subpagesFailed||0};});
  const stats={generatedAt:new Date().toISOString(),candidateCount:titles.length,count:works.length,missingRoots:missingRoots.length,totalChars:works.reduce((s,w)=>s+w.chars,0),expandedWorks,totalSubpages,fetchedSubpages,emptySubpages,failedSubpages,accountedSubpages:fetchedSubpages+emptySubpages+failedSubpages,fetchCompleteWorks:works.filter(w=>w.complete).length,partialWorks:works.filter(w=>!w.complete).length,cache:cacheStats,core,source:'中文维基文库 Category:中醫（含子分类与书籍子页）',license:'Wikisource CC BY-SA；原作版权状态以源页面为准'};
  await fs.writeFile(path.join(DIST,'books','manifest.js'),'const BOOK_MANIFEST = '+JSON.stringify(manifest,null,2)+';\n','utf8');
  await fs.writeFile(path.join(DIST,'books','corpus-stats.json'),JSON.stringify(stats,null,2),'utf8');
  await fs.writeFile(path.join(DIST,'books','corpus-failures.json'),JSON.stringify({generatedAt:stats.generatedAt,missingRoots,failures},null,2),'utf8');
  console.log(`Corpus ready: ${works.length}/${titles.length} works; ${stats.fetchCompleteWorks} fetch-complete, ${stats.partialWorks} partial; ${fetchedSubpages} text + ${emptySubpages} empty + ${failedSubpages} failed = ${stats.accountedSubpages}/${totalSubpages} subpages; ${stats.totalChars.toLocaleString()} chars`);
  console.log(`Core present ${core.filter(x=>x.present).length}/${core.length}; core fetch-complete ${core.filter(x=>x.present&&x.fetchComplete).length}/${core.length}`);
  console.log(`API cache: ${cacheStats.freshHits} fresh hits, ${cacheStats.staleFallbacks} stale fallbacks, ${cacheStats.writes} writes`);
}
await main();
