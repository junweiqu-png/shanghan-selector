import { promises as fs } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

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
function inlineMods(section){return String(section||'').split('\n').map(cleanLine).filter(x=>x&&/(?:若|或).{0,100}(?:加|去)|(?:加|去).{0,80}(?:兩|两|枚|升|合)/u.test(x)).slice(0,20);}
function splitHerbPhrase(s){return String(s||'').replace(/[。；;].*$/,'').split(/[、，,及與与]/u).map(x=>x.trim()).filter(Boolean).slice(0,8);}
function extractVariations(section,baseName){
  const flat=String(section||'').replace(/\n+/g,'，').replace(/；/g,'；');
  const starts=[];const rx=/(?:^|[；。])\s*((?:若|或)[^；。]{0,220}(?:加|去)[^；。]{0,220})/gu;let m;
  while((m=rx.exec(flat)))starts.push(m[1].trim());
  const chunks=[];
  for(const s of starts){for(const x of s.split(/(?=，(?:若|或))/u)){const c=x.replace(/^，/,'').trim();if(c)chunks.push(c);}}
  const out=[];let n=0;
  for(const raw of chunks){
    if(!/(?:加|去)/u.test(raw))continue;
    const opAt=raw.search(/[加去]/u);if(opAt<0)continue;
    const trigger=raw.slice(0,opAt).replace(/^(若|或)/u,'').replace(/[，,:：]+$/,'').trim();
    if(!trigger||trigger.length>100)continue;
    const removed=[],added=[];
    const rr=/去([^；。加]{1,60})/gu;let q;while((q=rr.exec(raw)))removed.push(...splitHerbPhrase(q[1]));
    const ar=/加([^；。去]{1,90})/gu;while((q=ar.exec(raw)))added.push(...splitHerbPhrase(q[1]));
    const uniq=a=>[...new Set(a.map(x=>x.replace(/^(者|之|其)/u,'').trim()).filter(Boolean))];
    const r2=uniq(removed),a2=uniq(added);
    out.push({id:`${baseName}::variation::${++n}`,baseFormula:baseName,trigger,raw,removed:r2,added:a2,operationCount:r2.length+a2.length,comparability:(r2.length+a2.length)<=1?'A':(r2.length+a2.length)<=3?'B':'C'});
  }
  return out.slice(0,30);
}
function inferParent(name){const rules=[[/^桂枝(?:加|去)/u,'桂枝汤'],[/^白虎加/u,'白虎汤'],[/^四逆加/u,'四逆汤'],[/^通脉四逆加/u,'通脉四逆汤'],[/^理中/u,'理中丸'],[/^小青龙加/u,'小青龙汤'],[/^真武加/u,'真武汤']];for(const [rx,p] of rules)if(rx.test(name))return p;return '';}

const SIMPLE_MAP={
  '傷':'伤','論':'论','湯':'汤','藥':'药','脈':'脉','陽':'阳','陰':'阴','薑':'姜','棗':'枣','朮':'术','黃':'黄','瀉':'泻','豬':'猪','膽':'胆','龍':'龙','礬':'矾','麥':'麦','蔥':'葱','連':'连','參':'参','歸':'归','澤':'泽','瀝':'沥','餘':'余','劑':'剂','證':'证','裏':'里','裡':'里',
  '調':'调','氣':'气','實':'实','發':'发','熱':'热','惡':'恶','無':'无','嘔':'呕','煩':'烦','滿':'满','頭':'头','項':'项','強':'强','緊':'紧','緩':'缓','數':'数','澀':'涩','結':'结','遲':'迟','飲':'饮','脅':'胁','風':'风','溫':'温','燒':'烧','針':'针','過':'过','經':'经','後':'后','續':'续','體':'体','輕':'轻','穀':'谷','絕':'绝','與':'与','從':'从','復':'复','難':'难','導':'导','諸':'诸','減':'减','莖':'茎','兩':'两','銖':'铢','箇':'个','濕':'湿'
};
function normalizeSimple(s){return [...String(s||'')].map(ch=>SIMPLE_MAP[ch]||ch).join('');}

async function validateExpertBenchmarks(formulas){
  const source=await fs.readFile(path.join(ROOT,'formula-data.js'),'utf8');
  const raw=vm.runInNewContext(`${source}\nJSON.stringify({manual:Object.keys(FORMULA_DATA),bench:Object.keys(EXPERT_BENCHMARKS)})`,Object.create(null),{timeout:1000});
  const parsed=JSON.parse(raw),available=new Set([...Object.keys(formulas),...parsed.manual]);
  const missingPairs=[];
  for(const key of parsed.bench){const [a,b]=key.split('|');const missing=[a,b].filter(n=>!available.has(n));if(missing.length)missingPairs.push(`${key} 缺 ${missing.join('、')}`);}
  console.log(`Expert differentiation benchmarks ready: ${parsed.bench.length-missingPairs.length}/${parsed.bench.length} pairs`);
  if(missingPairs.length)throw new Error(`Expert benchmark coverage failed: ${missingPairs.join('; ')}`);
}

async function main(){
  const manifest=parseManifest(await fs.readFile(path.join(DIST,'books','manifest.js'),'utf8'));
  const book=manifest.find(b=>/傷寒論|伤寒论/u.test(b.title||''));if(!book)throw new Error('Shanghan Lun not found in corpus manifest');
  const text=await fs.readFile(path.join(DIST,book.path),'utf8'),lines=text.replace(/\r\n/g,'\n').split('\n'),found=[];
  for(let i=0;i<lines.length;i++){
    const rawName=headingName(lines[i]);if(!rawName)continue;let end=i+1;while(end<lines.length&&end<i+32&&!headingName(lines[end]))end++;
    const section=lines.slice(i+1,end).join('\n').trim(),simple=normalizeSimple(rawName);found.push({rawName,name:simple,line:i+1,section});
  }
  const byName=new Map();
  for(const f of found){
    if(byName.has(f.name))continue;
    const simpleSection=normalizeSimple(f.section),clauses=[...contextAround(text,f.rawName),...contextAround(text,f.name)].map(normalizeSimple);
    byName.set(f.name,{name:f.name,rawName:f.rawName,source:'《伤寒论》',sourceBookId:book.id,line:f.line,formulaText:simpleSection.slice(0,2400),ingredients:parseIngredients(simpleSection),clauses:[...new Set(clauses)].slice(0,8),inlineMods:inlineMods(simpleSection),variations:extractVariations(simpleSection,f.name),parent:inferParent(f.name)});
  }
  const formulas=Object.fromEntries([...byName.entries()].sort((a,b)=>a[0].localeCompare(b[0],'zh-CN'))),variationCount=Object.values(formulas).reduce((n,f)=>n+(f.variations?.length||0),0);
  await validateExpertBenchmarks(formulas);
  const payload={generatedAt:new Date().toISOString(),sourceBookId:book.id,sourceTitle:book.title,count:Object.keys(formulas).length,variationCount,formulas};
  await fs.writeFile(path.join(DIST,'shanghan-catalog.generated.js'),`const SHANGHAN_CATALOG = ${JSON.stringify(payload)};\n`,'utf8');
  await fs.writeFile(path.join(DIST,'shanghan-catalog.json'),JSON.stringify(payload,null,2),'utf8');
  console.log(`Shanghan formula catalog ready: ${payload.count} direct formula headings; ${variationCount} inline variation events`);
}
main().catch(e=>{console.error(e);process.exit(1);});