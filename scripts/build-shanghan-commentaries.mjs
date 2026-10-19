import { promises as fs } from 'node:fs';
import path from 'node:path';
import OpenCC from 'opencc-js';

const ROOT=process.cwd(),DIST=path.join(ROOT,'dist');
const toSimple=OpenCC.Converter({from:'t',to:'cn'});

function parseManifest(raw){
  const m=raw.match(/const\s+BOOK_MANIFEST\s*=\s*([\s\S]*);\s*$/);
  if(!m)throw new Error('Unable to parse dist/books/manifest.js');
  return JSON.parse(m[1]);
}
const DEFS=[
  {id:'cheng',name:'成无己',book:'《注解伤寒论》',rx:/[注註]解[伤傷]寒[论論]/u,url:'https://zh.wikisource.org/zh-hant/%E6%B3%A8%E8%A7%A3%E5%82%B7%E5%AF%92%E8%AB%96_(%E5%9B%9B%E9%83%A8%E5%8F%A2%E5%88%8A%E6%9C%AC)'},
  {id:'ke',name:'柯琴',book:'《伤寒论翼》',rx:/[伤傷]寒[论論]翼/u,url:'https://zh.wikisource.org/zh-hant/%E5%82%B7%E5%AF%92%E8%AB%96%E7%BF%BC'},
  {id:'you',name:'尤怡',book:'《伤寒贯珠集》',rx:/[伤傷]寒[贯貫]珠集/u,url:'https://zh.wikisource.org/zh-hant/%E5%82%B7%E5%AF%92%E8%B2%AB%E7%8F%A0%E9%9B%86'},
  {id:'xu',name:'徐灵胎',book:'《伤寒论类方》',rx:/[伤傷]寒[论論][类類]方/u,url:'https://zh.wikisource.org/zh-hant/%E5%82%B7%E5%AF%92%E8%AB%96%E9%A1%9E%E6%96%B9'},
  {id:'wu',name:'吴谦等',book:'《订正仲景全书伤寒论注》',rx:/[订訂]正仲景全[书書][伤傷]寒[论論]注/u,url:'https://zh.wikisource.org/zh-hant/%E8%A8%82%E6%AD%A3%E4%BB%B2%E6%99%AF%E5%85%A8%E6%9B%B8%E5%82%B7%E5%AF%92%E8%AB%96%E6%B3%A8'}
];

function norm(s){
  return [...toSimple(String(s||''))].filter(ch=>/[\p{Script=Han}A-Za-z0-9]/u.test(ch)).join('').toLowerCase();
}
function normWithMap(text){
  let normalized='',map=[],offset=0;
  for(const ch of String(text||'')){
    const simp=toSimple(ch);
    for(const c of simp){
      if(/[\p{Script=Han}A-Za-z0-9]/u.test(c)){normalized+=c.toLowerCase();map.push(offset);}
    }
    offset+=ch.length;
  }
  return {normalized,map};
}
function snippet(text,pos,len=920){
  let start=Math.max(0,pos-120),end=Math.min(text.length,pos+len);
  const prev=text.lastIndexOf('\n',start); if(prev>=0)start=prev+1;
  const next=text.indexOf('\n\n',end); if(next>=0&&next-end<350)end=next;
  return text.slice(start,end).replace(/\n{3,}/g,'\n\n').trim();
}
function matchCard(card,source){
  const full=norm(card.text);
  let at=-1,match='direct';
  if(full.length>=8)at=source.n.normalized.indexOf(full);
  if(at<0){
    match='related';
    const seeds=(card.segments||[]).map(s=>({raw:s,n: norm(s)})).filter(x=>x.n.length>=6).sort((a,b)=>b.n.length-a.n.length);
    for(const seed of seeds){const i=source.n.normalized.indexOf(seed.n);if(i>=0){at=i;break;}}
  }
  if(at<0)return null;
  const pos=source.n.map[at]??0;
  return {sourceId:source.def.id,name:source.def.name,book:source.def.book,bookTitle:source.book.title,url:source.def.url,match,snippet:snippet(source.text,pos)};
}

async function main(){
  const manifest=parseManifest(await fs.readFile(path.join(DIST,'books','manifest.js'),'utf8'));
  const recall=JSON.parse(await fs.readFile(path.join(DIST,'shanghan-recall.json'),'utf8'));
  const sources=[];
  for(const def of DEFS){
    const book=manifest.find(b=>def.rx.test(b.title||''));
    if(!book){sources.push({def,book:null,text:'',n:{normalized:'',map:[]}});continue;}
    const text=await fs.readFile(path.join(DIST,book.path),'utf8');
    sources.push({def,book,text,n:normWithMap(text)});
  }
  const cards={}; let hits=0;
  for(const card of recall.cards){
    const entries=[];
    for(const source of sources){
      if(!source.book)continue;
      const e=matchCard(card,source);if(e){entries.push(e);hits++;}
    }
    if(entries.length)cards[card.id]=entries;
  }
  const payload={
    generatedAt:new Date().toISOString(),
    sources:sources.map(s=>({id:s.def.id,name:s.def.name,book:s.def.book,url:s.def.url,available:!!s.book,bookTitle:s.book?.title||''})),
    cardCount:recall.cards.length,
    hitCount:hits,
    cards
  };
  await fs.writeFile(path.join(DIST,'shanghan-commentaries.generated.js'),`const SHANGHAN_COMMENTARIES = ${JSON.stringify(payload)};\n`,'utf8');
  await fs.writeFile(path.join(DIST,'shanghan-commentaries.json'),JSON.stringify(payload,null,2),'utf8');
  console.log(`Shanghan commentary index ready: ${payload.sources.filter(x=>x.available).length}/${payload.sources.length} sources; ${hits} card-source matches across ${Object.keys(cards).length}/${recall.cards.length} cards`);
}
main().catch(e=>{console.error(e);process.exit(1);});
