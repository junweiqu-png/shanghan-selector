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
function occurrences(hay,needle,max=12){
  const out=[];if(!needle)return out;
  let p=0;
  while(out.length<max&&(p=hay.indexOf(needle,p))>=0){out.push(p);p+=Math.max(1,needle.length);}
  return out;
}
function charPos(source,npos){
  if(npos<0)return 0;
  if(npos>=source.n.map.length)return source.text.length;
  return source.n.map[npos]??source.text.length;
}
function clean(s){return String(s||'').replace(/\n+/g,' ').replace(/[ \t]+/g,' ').trim();}
function meaningful(s){
  const x=clean(s).replace(/^[，。；！？?!：:、\s]+/u,'');
  const han=(x.match(/[\p{Script=Han}]/gu)||[]).length;
  return han>=8?x:'';
}
function buildAnchors(source,recall){
  const arr=[];
  for(const card of recall.cards){
    for(let i=0;i<card.segments.length;i++){
      const n=norm(card.segments[i]);
      if(n.length<6)continue;
      for(const p of occurrences(source.n.normalized,n,8)){
        arr.push({pos:p,end:p+n.length,cardId:card.id,segIndex:i,len:n.length});
      }
    }
  }
  arr.sort((a,b)=>a.pos-b.pos||b.len-a.len);
  return arr;
}
function nextExternal(anchors,after,cardId){
  for(const a of anchors){
    if(a.pos<=after+2)continue;
    if(a.cardId!==cardId)return a;
  }
  return null;
}
function bestCluster(card,source){
  const segs=card.segments.map((raw,i)=>({i,raw,n:norm(raw)}));
  const occ=segs.map(s=>s.n.length>=5?occurrences(source.n.normalized,s.n,20):[]);
  let best=null;
  for(let i=0;i<segs.length;i++){
    for(const p of occ[i]){
      const chosen=new Map([[i,p]]);
      let last=p;
      for(let j=i+1;j<segs.length;j++){
        const q=occ[j].find(x=>x>last&&x-last<3500);
        if(q!=null){chosen.set(j,q);last=q;}
      }
      last=p;
      for(let j=i-1;j>=0;j--){
        const rev=occ[j].filter(x=>x<last&&last-x<3500);
        const q=rev.length?rev[rev.length-1]:null;
        if(q!=null){chosen.set(j,q);last=q;}
      }
      const vals=[...chosen.entries()].sort((a,b)=>a[0]-b[0]);
      const ps=vals.map(([,x])=>x);
      const matched=vals.length,span=Math.max(...ps)-Math.min(...ps);
      const strength=vals.reduce((a,[idx])=>a+Math.min(20,segs[idx].n.length),0);
      const score=matched*100+strength-span/1000;
      if(!best||score>best.score)best={score,chosen};
    }
  }
  return best;
}
function precisePairs(card,source,anchors){
  const full=norm(card.text),pairs=[];
  const fullAt=full.length>=10?source.n.normalized.indexOf(full):-1;
  if(fullAt>=0){
    const start=charPos(source,fullAt),end=charPos(source,fullAt+full.length);
    const next=nextExternal(anchors,fullAt+full.length,card.id);
    const stop=Math.min(next?charPos(source,next.pos):source.text.length,end+1800);
    const explanation=meaningful(source.text.slice(end,stop));
    if(explanation){
      pairs.push({
        precision:'clause',
        segmentIndexes:card.segments.map((_,i)=>i),
        anchorText:card.text,
        explanation,
        contextBefore:clean(source.text.slice(Math.max(0,start-260),start)),
        contextAfter:clean(source.text.slice(stop,Math.min(source.text.length,stop+260)))
      });
    }
    return pairs;
  }

  const cluster=bestCluster(card,source);
  if(!cluster)return pairs;
  const selected=[...cluster.chosen.entries()].sort((a,b)=>a[0]-b[0]);
  if(selected.length<2&&!selected.some(([i])=>norm(card.segments[i]).length>=12))return pairs;

  for(let k=0;k<selected.length;k++){
    const [i,p]=selected[k],n=norm(card.segments[i]);
    const start=charPos(source,p),end=charPos(source,p+n.length);
    let stopNorm;
    if(k+1<selected.length)stopNorm=selected[k+1][1];
    else{
      const nx=nextExternal(anchors,p+n.length,card.id);
      stopNorm=nx?.pos??(p+n.length+1200);
    }
    const stop=Math.min(charPos(source,stopNorm),end+1800);
    const explanation=meaningful(source.text.slice(end,stop));
    if(!explanation)continue;
    pairs.push({
      precision:'segment',
      segmentIndexes:[i],
      anchorText:card.segments[i],
      explanation,
      contextBefore:clean(source.text.slice(Math.max(0,start-220),start)),
      contextAfter:clean(source.text.slice(stop,Math.min(source.text.length,stop+220)))
    });
  }
  return pairs;
}
function contextReference(card,source){
  const full=norm(card.text);
  let at=full.length>=8?source.n.normalized.indexOf(full):-1,anchorText=card.text;
  if(at<0){
    const seeds=(card.segments||[]).map((raw,i)=>({raw,n:norm(raw),i})).filter(x=>x.n.length>=8).sort((a,b)=>b.n.length-a.n.length);
    for(const seed of seeds){const p=source.n.normalized.indexOf(seed.n);if(p>=0){at=p;anchorText=seed.raw;break;}}
  }
  if(at<0)return null;
  const pos=charPos(source,at);
  return {anchorText,context:clean(source.text.slice(Math.max(0,pos-420),Math.min(source.text.length,pos+1100)))};
}

async function main(){
  const manifest=parseManifest(await fs.readFile(path.join(DIST,'books','manifest.js'),'utf8'));
  const recall=JSON.parse(await fs.readFile(path.join(DIST,'shanghan-recall.json'),'utf8'));
  const sources=[];
  for(const def of DEFS){
    const book=manifest.find(b=>def.rx.test(b.title||''));
    if(!book){sources.push({def,book:null,text:'',n:{normalized:'',map:[]},anchors:[]});continue;}
    const text=await fs.readFile(path.join(DIST,book.path),'utf8');
    const source={def,book,text,n:normWithMap(text),anchors:[]};
    source.anchors=buildAnchors(source,recall);
    sources.push(source);
  }

  const cards={};let exactPairs=0,exactCards=0,contextRefs=0;
  for(const card of recall.cards){
    const entries=[];
    let cardHasExact=false;
    for(const source of sources){
      if(!source.book)continue;
      const pairs=precisePairs(card,source,source.anchors);
      const context=pairs.length?null:contextReference(card,source);
      if(pairs.length){exactPairs+=pairs.length;cardHasExact=true;}
      if(context)contextRefs++;
      if(pairs.length||context){
        entries.push({
          sourceId:source.def.id,name:source.def.name,book:source.def.book,bookTitle:source.book.title,url:source.def.url,
          pairs,context
        });
      }
    }
    if(cardHasExact)exactCards++;
    if(entries.length)cards[card.id]=entries;
  }
  const payload={
    generatedAt:new Date().toISOString(),
    sources:sources.map(s=>({id:s.def.id,name:s.def.name,book:s.def.book,url:s.def.url,available:!!s.book,bookTitle:s.book?.title||''})),
    cardCount:recall.cards.length,
    exactPairCount:exactPairs,
    exactCardCount:exactCards,
    contextRefCount:contextRefs,
    cards
  };
  await fs.writeFile(path.join(DIST,'shanghan-commentaries.generated.js'),`const SHANGHAN_COMMENTARIES = ${JSON.stringify(payload)};\n`,'utf8');
  await fs.writeFile(path.join(DIST,'shanghan-commentaries.json'),JSON.stringify(payload,null,2),'utf8');
  console.log(`Shanghan precise commentary index ready: ${payload.sources.filter(x=>x.available).length}/${payload.sources.length} sources; ${exactPairs} exact clause/segment pairs across ${exactCards}/${recall.cards.length} cards; ${contextRefs} context-only references`);
}
main().catch(e=>{console.error(e);process.exit(1);});
