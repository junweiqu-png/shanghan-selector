import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const DIST=path.join(ROOT,'dist');

function parseManifest(raw){
  const m=raw.match(/const\s+BOOK_MANIFEST\s*=\s*([\s\S]*);\s*$/);
  if(!m)throw new Error('Unable to parse dist/books/manifest.js');
  return JSON.parse(m[1]);
}
function cleanLine(s){return String(s||'').replace(/\u00a0/g,' ').trim();}
function headingName(line){
  const s=cleanLine(line).replace(/[：:]$/,'').replace(/[　\t ]+/g,'');
  if(!s||s.startsWith('=====')||s.length>34)return '';
  const m=s.match(/^([\p{Script=Han}]{2,28})方$/u);
  if(!m)return '';
  const stem=m[1];
  if(/^(本|上|下|右|前|後|后|此|其|諸|诸|凡|治|方中|加減|加减)/u.test(stem))return '';
  if(/(?:湯|汤|丸|散|煎|膏|飲|饮|汁)$/u.test(stem))return stem;
  if(/(?:導|导|膽汁|胆汁)$/u.test(stem))return stem+'方';
  return '';
}
function doseUnitPattern(){return '(?:半?斤|[一二三四五六七八九十百廿卅兩两]+|[一二三四五六七八九十百廿卅]+(?:兩|两|銖|铢|升|合|枚|箇|个|分|寸|尺|片|莖|茎|把|撮))';}
function parseIngredients(text){
  const head=String(text||'').split(/上[一二三四五六七八九十百]+味/u)[0].replace(/\n/g,'　');
  const unit='(?:半斤|[一二三四五六七八九十百廿卅]+(?:兩|两|銖|铢|斤|升|合|枚|箇|个|分|寸|尺|片|莖|茎|把|撮))';
  const rx=new RegExp('([\\p{Script=Han}]{1,10})\\s*('+unit+')','gu');
  const out=[];let m;
  while((m=rx.exec(head))){
    let herb=m[1].replace(/^(各|又|及|與|与|加|去|用)$/u,'').trim();
    herb=herb.replace(/[一二三四五六七八九十百廿卅]+$/u,'').trim();
    if(!herb||herb.length>8)continue;
    if(!out.some(x=>x[0]===herb))out.push([herb,m[2]]);
  }
  return out;
}
function contextAround(text,needle){
  const out=[];let from=0;
  while(out.length<12){
    const i=text.indexOf(needle,from);if(i<0)break;
    const a=Math.max(0,i-260),b=Math.min(text.length,i+needle.length+260);
    let c=text.slice(a,b).replace(/\n{3,}/g,'\n\n').trim();
    if(/主之|宜|與|与|不可與|不可与|可與|可与|服|方/u.test(c)&&!out.includes(c))out.push(c);
    from=i+needle.length;
  }
  return out;
}
function inlineMods(section){
  return String(section||'').split('\n').map(cleanLine).filter(x=>x&&/(?:若|或).{0,80}(?:加|去)|(?:加|去).{0,60}(?:兩|两|枚|升|合)/u.test(x)).slice(0,12);
}
function inferParent(name){
  const rules=[
    [/^桂枝(?:加|去)/u,'桂枝汤'],[/^白虎加/u,'白虎汤'],[/^四逆加/u,'四逆汤'],[/^通脉四逆加/u,'通脉四逆汤'],
    [/^理中/u,'理中丸'],[/^小青龙加/u,'小青龙汤'],[/^真武加/u,'真武汤']
  ];
  for(const [rx,p] of rules)if(rx.test(name))return p;
  return '';
}
function normalizeSimple(s){
  return String(s||'').replace(/傷寒/g,'伤寒').replace(/論/g,'论').replace(/湯/g,'汤').replace(/藥/g,'药').replace(/脈/g,'脉').replace(/陽/g,'阳').replace(/陰/g,'阴').replace(/薑/g,'姜').replace(/棗/g,'枣').replace(/朮/g,'术').replace(/黃/g,'黄').replace(/瀉/g,'泻').replace(/豬/g,'猪').replace(/膽/g,'胆').replace(/龍/g,'龙').replace(/礬/g,'矾').replace(/麥/g,'麦').replace(/蔥/g,'葱').replace(/連/g,'连').replace(/參/g,'参').replace(/歸/g,'归').replace(/澤/g,'泽').replace(/瀝/g,'沥').replace(/餘/g,'余').replace(/劑/g,'剂').replace(/證/g,'证').replace(/裏/g,'里').replace(/裏/g,'里');
}

async function main(){
  const manifest=parseManifest(await fs.readFile(path.join(DIST,'books','manifest.js'),'utf8'));
  const book=manifest.find(b=>/傷寒論|伤寒论/u.test(b.title||''));
  if(!book)throw new Error('Shanghan Lun not found in corpus manifest');
  const text=await fs.readFile(path.join(DIST,book.path),'utf8');
  const lines=text.replace(/\r\n/g,'\n').split('\n');
  const found=[];
  for(let i=0;i<lines.length;i++){
    const rawName=headingName(lines[i]);if(!rawName)continue;
    let end=i+1;
    while(end<lines.length&&end<i+32&&!headingName(lines[end]))end++;
    const section=lines.slice(i+1,end).join('\n').trim();
    const simple=normalizeSimple(rawName);
    found.push({rawName,name:simple,line:i+1,section});
  }
  const byName=new Map();
  for(const f of found){
    if(byName.has(f.name))continue;
    const clauses=[...contextAround(text,f.rawName),...contextAround(text,f.name)].map(normalizeSimple);
    byName.set(f.name,{
      name:f.name,rawName:f.rawName,source:'《伤寒论》',sourceBookId:book.id,line:f.line,
      formulaText:normalizeSimple(f.section.slice(0,2400)),ingredients:parseIngredients(normalizeSimple(f.section)),
      clauses:[...new Set(clauses)].slice(0,8),inlineMods:inlineMods(normalizeSimple(f.section)),parent:inferParent(f.name)
    });
  }
  const formulas=Object.fromEntries([...byName.entries()].sort((a,b)=>a[0].localeCompare(b[0],'zh-CN')));
  const payload={generatedAt:new Date().toISOString(),sourceBookId:book.id,sourceTitle:book.title,count:Object.keys(formulas).length,formulas};
  await fs.writeFile(path.join(DIST,'shanghan-catalog.generated.js'),`const SHANGHAN_CATALOG = ${JSON.stringify(payload)};\n`,'utf8');
  await fs.writeFile(path.join(DIST,'shanghan-catalog.json'),JSON.stringify(payload,null,2),'utf8');
  console.log(`Shanghan formula catalog ready: ${payload.count} direct formula headings`);
}

main().catch(e=>{console.error(e);process.exit(1);});
