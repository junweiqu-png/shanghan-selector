import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT=process.cwd(), DIST=path.join(ROOT,'dist');
const API='https://zh.wikisource.org/w/api.php';
const MAX=Number(process.env.CORPUS_MAX_BOOKS||700);
const UA='TCMClassicsCorpus/0.1 (https://github.com/junweiqu-png/shanghan-selector)';
const SKIP=new Set(['.git','.github','dist','node_modules','scripts']);

const CORE=['傷寒論','金匱要略','黃帝內經','難經','脈經','神農本草經','備急千金要方','外臺秘要','傷寒明理論','本草綱目','溫病條辨','醫學源流論','針灸甲乙經','針灸大成','臨證指南醫案','四聖心源'];
const META={
  '傷寒論':{author:'漢·張仲景',edition:'宋本'},'金匱要略':{author:'漢·張仲景'},'脈經':{author:'西晉·王叔和'},
  '備急千金要方':{author:'唐·孫思邈'},'傷寒明理論':{author:'金·成無己'},'溫病條辨':{author:'清·吳鞠通'},
  '醫學源流論':{author:'清·徐靈胎'},'四聖心源':{author:'清·黃元御'}
};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function getJSON(url,tries=4){
  for(let i=0;i<tries;i++){
    const r=await fetch(url,{headers:{'user-agent':UA}});
    if(r.ok)return r.json();
    if(r.status===429||r.status>=500){await sleep(800*(i+1));continue;}
    throw new Error(`${r.status} ${url}`);
  }
  throw new Error(`retry exhausted: ${url}`);
}
async function categoryMembers(cat,depth=0,seenCats=new Set()){
  if(seenCats.has(cat))return [];
  seenCats.add(cat); let cont='', out=[];
  do{
    const u=new URL(API);u.search=new URLSearchParams({action:'query',list:'categorymembers',cmtitle:cat,cmtype:'page|subcat',cmnamespace:'0|14',cmlimit:'500',format:'json',formatversion:'2',...(cont?{cmcontinue:cont}:{})});
    const j=await getJSON(u); out.push(...(j.query?.categorymembers||[])); cont=j.continue?.cmcontinue||'';
  }while(cont);
  if(depth<2){
    for(const m of out.filter(x=>x.ns===14)) out.push(...await categoryMembers(m.title,depth+1,seenCats));
  }
  return out;
}
function decodeEntities(s){return s.replace(/&#x([0-9a-f]+);/gi,(_,x)=>String.fromCodePoint(parseInt(x,16))).replace(/&#(\d+);/g,(_,x)=>String.fromCodePoint(Number(x))).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'");}
function htmlToText(html){
  return decodeEntities(String(html||'')
    .replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<script[\s\S]*?<\/script>/gi,'')
    .replace(/<sup[\s\S]*?<\/sup>/gi,'').replace(/<!--([\s\S]*?)-->/g,'')
    .replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(p|div|li|tr|h[1-6]|section|blockquote)>/gi,'\n')
    .replace(/<li[^>]*>/gi,'• ').replace(/<[^>]+>/g,''))
    .replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}
function catFor(t){
  if(/傷寒|仲景|金匱|柴胡|桂枝/.test(t))return '伤寒经方'; if(/本草|藥|食療/.test(t))return '本草药物';
  if(/脈|診|舌/.test(t))return '诊法脉学'; if(/針|鍼|灸|穴/.test(t))return '针灸'; if(/溫病|溫熱|濕熱/.test(t))return '温病';
  if(/醫案|驗案|臨證/.test(t))return '医案'; if(/女科|婦|產/.test(t))return '妇科'; if(/兒|幼|嬰|小兒/.test(t))return '儿科';
  if(/外科|瘍|瘡|傷科|骨/.test(t))return '外伤科'; if(/方|湯|丸|散/.test(t))return '方书'; return '综合医籍';
}
function safeId(t){return 'ws-'+crypto.createHash('sha1').update(t).digest('hex').slice(0,14);}
function sourceUrl(t){return 'https://zh.wikisource.org/wiki/'+encodeURIComponent(t).replace(/%2F/g,'/');}
function escHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
async function fetchWork(title){
  const u=new URL(API);u.search=new URLSearchParams({action:'parse',page:title,prop:'text',disableeditsection:'1',redirects:'1',format:'json',formatversion:'2'});
  const j=await getJSON(u); const text=htmlToText(j.parse?.text||'');
  if(text.length<300)return null;
  const id=safeId(title), meta=META[title]||{};
  return {id,title:`《${title}》`,rawTitle:title,author:meta.author||'',edition:meta.edition||'维基文库校录本',category:catFor(title),path:`books/ws/${id}.txt`,source:'中文维基文库',sourceUrl:sourceUrl(title),license:'CC BY-SA 4.0 / 原作公版或自由许可',chars:text.length,text};
}
async function mapLimit(items,n,fn){let i=0,res=[];async function worker(){while(i<items.length){const idx=i++;try{res[idx]=await fn(items[idx],idx);}catch(e){console.warn('skip',items[idx],e.message);res[idx]=null;}}}await Promise.all(Array.from({length:n},worker));return res;}
async function copyBase(){await fs.rm(DIST,{recursive:true,force:true});await fs.mkdir(DIST,{recursive:true});for(const e of await fs.readdir(ROOT,{withFileTypes:true})){if(SKIP.has(e.name))continue;await fs.cp(path.join(ROOT,e.name),path.join(DIST,e.name),{recursive:true});}}
async function main(){
  await copyBase();
  const members=await categoryMembers('Category:中醫');
  let titles=[...new Set(members.filter(x=>x.ns===0).map(x=>x.title).filter(t=>!t.includes('/')&&!/^(Template|Portal|Index):/.test(t)))];
  titles.sort((a,b)=>(CORE.indexOf(a)<0?999:CORE.indexOf(a))-(CORE.indexOf(b)<0?999:CORE.indexOf(b))||a.localeCompare(b,'zh-Hant'));
  titles=titles.slice(0,MAX); console.log(`Corpus candidates: ${titles.length}`);
  const works=(await mapLimit(titles,6,async(t,idx)=>{const w=await fetchWork(t);if((idx+1)%25===0)console.log(`Fetched ${idx+1}/${titles.length}`);return w;})).filter(Boolean);
  await fs.mkdir(path.join(DIST,'books','ws'),{recursive:true}); await fs.mkdir(path.join(DIST,'corpus-pages'),{recursive:true});
  for(const w of works){
    await fs.writeFile(path.join(DIST,w.path),w.text,'utf8');
    const html=`<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>${escHtml(w.title)}</title></head><body><main data-pagefind-body><h1 data-pagefind-meta="title">${escHtml(w.title)}</h1><span data-pagefind-meta="book_id:${w.id},category:${escHtml(w.category)},source:中文维基文库"></span><pre>${escHtml(w.text)}</pre></main></body></html>`;
    await fs.writeFile(path.join(DIST,'corpus-pages',w.id+'.html'),html,'utf8');
  }
  const manifest=works.map(({text,rawTitle,...w})=>w);
  await fs.writeFile(path.join(DIST,'books','manifest.js'),'const BOOK_MANIFEST = '+JSON.stringify(manifest,null,2)+';\n','utf8');
  await fs.writeFile(path.join(DIST,'books','corpus-stats.json'),JSON.stringify({generatedAt:new Date().toISOString(),count:works.length,totalChars:works.reduce((s,w)=>s+w.chars,0),source:'中文维基文库 Category:中醫（含子分类）',license:'Wikisource CC BY-SA；原作版权状态以源页面为准'},null,2),'utf8');
  console.log(`Corpus ready: ${works.length} works, ${works.reduce((s,w)=>s+w.chars,0).toLocaleString()} chars`);
}
await main();
