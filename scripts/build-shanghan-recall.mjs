import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pinyin } from 'pinyin-pro';
import OpenCC from 'opencc-js';

const ROOT=process.cwd(),DIST=path.join(ROOT,'dist');

function parseManifest(raw){
  const m=raw.match(/const\s+BOOK_MANIFEST\s*=\s*([\s\S]*);\s*$/);
  if(!m)throw new Error('Unable to parse dist/books/manifest.js');
  return JSON.parse(m[1]);
}
const clean=s=>String(s||'').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').trim();
const hash=s=>crypto.createHash('sha1').update(s).digest('hex').slice(0,12);
const toSimple=OpenCC.Converter({from:'t',to:'cn'});
function toPinyin(text){
  return pinyin(String(text||''),{nonZh:'consecutive',traditional:true}).replace(/\s+([，。；！？?!：:])/g,'$1').replace(/([，。；！？?!：:])\s*/g,'$1 ');
}
function toRubyTokens(text){
  return pinyin(String(text||''),{type:'all',traditional:true}).map(x=>({
    c:x.origin,
    p:x.isZh?x.pinyin:''
  }));
}
function autoGloss(text){
  let x=toSimple(String(text||'')).trim();
  x=x.replace(/问曰[:：]?/g,'问：').replace(/答曰[:：]?/g,'答：');
  x=x.replace(/何谓也[？?]?/g,'是什么意思？').replace(/何谓/g,'是什么意思');
  x=x.replace(/假令/g,'假如').replace(/凡/g,'一般来说').replace(/若/g,'如果').replace(/或/g,'有时');
  x=x.replace(/此为/g,'这属于').replace(/此名/g,'这叫做').replace(/名曰/g,'称为');
  x=x.replace(/不可与([^，。；]{1,16}(?:汤|丸|散))/g,'不可给予$1');
  x=x.replace(/可与([^，。；]{1,16}(?:汤|丸|散))/g,'可以给予$1');
  x=x.replace(/宜([^，。；]{1,16}(?:汤|丸|散))/g,'适宜使用$1');
  x=x.replace(/([\u3400-\u9fff]{2,16}(?:汤|丸|散))主之/g,'应以$1治疗');
  x=x.replace(/法当/g,'按治法应当').replace(/当/g,'应当').replace(/则/g,'就').replace(/故/g,'所以').replace(/乃/g,'才');
  x=x.replace(/复/g,'又').replace(/反/g,'反而');
  x=x.replace(/恶寒/g,'怕冷').replace(/恶风/g,'怕风').replace(/下利/g,'腹泻').replace(/不大便/g,'大便不通');
  x=x.replace(/小便不利/g,'小便不畅').replace(/但欲寐/g,'只想睡觉').replace(/心下/g,'心下（胃脘部）').replace(/胸胁/g,'胸胁部');
  x=x.replace(/身体/g,'身体').replace(/身重/g,'身体沉重');
  x=x.replace(/\s+/g,' ').replace(/([，。；！？：])\s+/g,'$1');
  return x;
}
const chapterRx=/^(?:(?:辨[^。；，]{1,28})|(?:平[脉脈]法)|(?:[伤傷]寒例))第[一二三四五六七八九十百廿卅]+$/u;
const volumeRx=/^(?:卷第[一二三四五六七八九十]+|=====.+=====)$/u;
const formulaHeadingRx=/^[\p{Script=Han}]{2,28}(?:湯|汤|丸|散|煎|膏|飲|饮|汁)方?$/u;

function splitSegments(text){
  const parts=String(text||'').match(/[^，。；！？?!：:]+[，。；！？?!：:]?/gu)||[];
  return parts.map(clean).filter(Boolean);
}
function isFormulaHeavy(s){
  let n=0;
  const tests=[
    /上[一二三四五六七八九十百]+味/u,/以水[一二三四五六七八九十百]+升/u,/煮取/u,/去滓/u,
    /溫服|温服/u,/分[一二三四五六七八九十百]+服/u,/[一二三四五六七八九十百半]+(?:兩|两|銖|铢|升|合|枚|斤)/u
  ];
  for(const rx of tests)if(rx.test(s))n++;
  return n>=2||/^上[一二三四五六七八九十百]+味/u.test(s);
}
function looksArticle(s){
  if(!s||s.length<8||s.length>5000)return false;
  if(volumeRx.test(s)||chapterRx.test(s)||formulaHeadingRx.test(s))return false;
  if(/^林億校序|^張仲景原序|^伤寒论序|^傷寒論序/u.test(s))return false;
  if(!/[，。；！？?!]/u.test(s))return false;
  if(isFormulaHeavy(s))return false;
  return true;
}
function initialLabels(segments){
  if(!segments.length)return [];
  const premiseCue=/^(?:若|或|假令|凡|病|傷寒|伤寒|太陽病|太阳病|陽明病|阳明病|少陽病|少阳病|太陰病|太阴病|少陰病|少阴病|厥陰病|厥阴病|脈|脉|趺陽|趺阳|寸口|問曰|问曰|何以|其人|其脈|其脉|發汗|发汗|下後|下后|吐後|吐后|既|初|本)/u;
  const resultCue=/(?:主之|宜\S{0,14}(?:湯|汤|丸|散)|(?:與|与)\S{0,14}(?:湯|汤|丸|散)|不可(?:與|与)|可(?:與|与)|法當|法当|法宜|當以|当以|此為|此为|名曰|則|则|故|必|當|当|宜|可|不可)/u;
  let boundary=-1;
  for(let i=0;i<segments.length;i++){ if(resultCue.test(segments[i])){boundary=i;break;} }
  if(boundary<0)boundary=Math.max(1,segments.length-1);
  const out=segments.map((seg,i)=>i<boundary?'p':'c');
  for(let i=0;i<segments.length;i++){
    const seg=segments[i].replace(/^[，。；！？?!：:\s]+/u,'');
    if(/^答曰|^荅曰/u.test(seg))out[i]='c';
    else if(/^問曰|^问曰/u.test(seg)||premiseCue.test(seg))out[i]='p';
    if(resultCue.test(seg)&&!/^(?:若|或)/u.test(seg))out[i]='c';
  }
  if(!out.includes('p')&&out.length>1)out[0]='p';
  if(!out.includes('c'))out[out.length-1]='c';
  return out;
}

async function main(){
  const manifest=parseManifest(await fs.readFile(path.join(DIST,'books','manifest.js'),'utf8'));
  const book=manifest.find(b=>/傷寒論|伤寒论/u.test(b.title||''));
  if(!book)throw new Error('Shanghan Lun not found');
  const text=await fs.readFile(path.join(DIST,book.path),'utf8');
  const lines=text.replace(/\r\n/g,'\n').split('\n').map(clean);
  let chapter='',started=false,skipFormula=false;
  const cards=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    if(!line)continue;
    if(chapterRx.test(line)){chapter=line;started=true;skipFormula=false;continue;}
    if(!started)continue;
    if(volumeRx.test(line))continue;
    if(formulaHeadingRx.test(line)){skipFormula=true;continue;}
    if(skipFormula){
      if(!looksArticle(line))continue;
      skipFormula=false;
    }
    if(!looksArticle(line))continue;
    const segments=splitSegments(line);
    if(segments.length<1)continue;
    cards.push({
      id:'sh-'+hash(chapter+'|'+line),
      chapter:chapter||'《伤寒论》',
      line:i+1,
      text:line,
      segments,
      defaults:initialLabels(segments),
      pinyin:toPinyin(line),
      gloss:autoGloss(line),
      segmentPinyin:segments.map(toPinyin),
      segmentRuby:segments.map(toRubyTokens),
      segmentGloss:segments.map(autoGloss)
    });
  }
  const payload={generatedAt:new Date().toISOString(),sourceBookId:book.id,sourceTitle:book.title,count:cards.length,cards};
  await fs.writeFile(path.join(DIST,'shanghan-recall.generated.js'),`const SHANGHAN_RECALL = ${JSON.stringify(payload)};\n`,'utf8');
  await fs.writeFile(path.join(DIST,'shanghan-recall.json'),JSON.stringify(payload,null,2),'utf8');
  console.log(`Shanghan recall cards ready: ${cards.length} clauses across ${new Set(cards.map(x=>x.chapter)).size} chapters`);
}
main().catch(e=>{console.error(e);process.exit(1);});
