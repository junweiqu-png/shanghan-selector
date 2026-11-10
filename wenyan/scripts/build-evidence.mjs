/**
 * Evidence corpus builder: unannotated original-story text from Wikisource.
 * Removes Liu Xiaobiao's SMALL commentary in 世說新語; never manufactures translations.
 * Output is a source-backed reference corpus for browsing, NOT a verified interpretation database.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {load} from 'cheerio';
import {Converter} from 'opencc-js';

const root=process.cwd();
const output=path.join(root,'dist','wenyan','evidence');
const cache=path.join(root,'.evidence-cache');
const toCN=Converter({from:'tw',to:'cn'});
const sections=['德行','言語','政事','文學','方正','雅量','識鑒','賞譽','品藻','規箴','捷悟','夙惠','豪爽','容止','自新','企羡','傷逝','棲逸','賢媛','術解','巧蓺','寵禮','任誕','簡傲','排調','輕詆','假譎','黜免','儉嗇','汰侈','忿狷','讒險','尤悔','紕漏','惑溺','仇隟'];
// 初中教材常见或课外高频原典；存在题名歧义者宁缺毋错。
const junior=[
 ['陋室铭','陋室銘'],['爱莲说','愛蓮說'],['三峡','三峽'],['桃花源记','桃花源記'],
 ['小石潭记','至小丘西小石潭記'],['记承天寺夜游','承天夜遊'],
 ['答谢中书书','答謝中書書'],['与朱元思书','與朱元思書'],
 ['岳阳楼记','岳陽樓記'],['醉翁亭记','醉翁亭記'],
 ['马说','雜說四·馬說'],['送东阳马生序','送東陽馬生序'],
 ['出师表','前出師表'],['曹刿论战','曹劌論戰'],
 ['邹忌讽齐王纳谏','戰國策/齊一'],['唐雎不辱使命','戰國策/魏四'],
 ['陈涉世家','史記/卷048'],['鱼我所欲也','孟子/告子上'],
 ['生于忧患死于安乐','孟子/告子下'],['富贵不能淫','孟子/滕文公下'],
 ['得道多助失道寡助','孟子/公孫丑下'],['愚公移山','列子/湯問'],
 ['杞人忧天','列子/天瑞'],['两小儿辩日','列子/湯問'],
 ['论语学而','論語/學而第一'],['论语为政','論語/為政第二'],['论语述而','論語/述而第七'],
 ['论语子罕','論語/子罕第九'],['论语雍也','論語/雍也第六'],['论语泰伯','論語/泰伯第八'],
 ['学弈','孟子/告子上'],['劝学','荀子/勸學'],['卖油翁','賣油翁'],
 ['湖心亭看雪','湖心亭看雪'],['核舟记','核舟記'],
 ['虽有嘉肴','禮記/學記'],['大道之行也','禮記/禮運'],
 ['庄子濠梁辩','莊子/秋水'],['北冥有鱼','莊子/逍遙遊'],
 ['孙权劝学','資治通鑑/卷066'],['狼','聊齋志異/狼'],
 ['木兰诗','木蘭詩']
];
const clean=s=>String(s||'').replace(/\u00a0/g,' ').replace(/[\u200b\u200e\u200f]/g,'').replace(/[ \t\r\n]+/g,' ').trim();
const pageURL=t=>'https://zh.wikisource.org/wiki/'+t.split('/').map(encodeURIComponent).join('/');
const cacheName=key=>path.join(cache,crypto.createHash('sha1').update(key).digest('hex')+'.json');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchPage(page){
  const saved=cacheName(page);
  try{const hit=JSON.parse(await fs.readFile(saved,'utf8'));if(hit?.html)return hit.html;}catch{}
  const url=new URL('https://zh.wikisource.org/w/api.php');
  url.search=new URLSearchParams({action:'parse',page,prop:'text',format:'json',formatversion:'2',redirects:'1',maxlag:'5'}).toString();
  let reason;
  for(let attempt=0;attempt<5;attempt++){
    try{
      const res=await fetch(url,{headers:{'accept':'application/json','user-agent':'WenyanEvidenceStudy/1.0 (https://github.com/junweiqu-png/shanghan-selector; public education)'},
        signal:AbortSignal.timeout(25000)});
      if(res.status===404)throw new Error('NOT_FOUND '+res.status);
      if(!res.ok)throw new Error('HTTP '+res.status);
      const data=await res.json();
      if(data.error)throw new Error((data.error.code==='missingtitle'?'NOT_FOUND ':'')+(data.error.code||'MediaWiki parse error'));
      const html=data.parse?.text||data.parse?.text?.['*'];
      if(!html||typeof html!=='string')throw new Error('No parsed HTML');
      await fs.mkdir(cache,{recursive:true});
      await fs.writeFile(saved,JSON.stringify({page,html}), 'utf8');
      return html;
    }catch(e){reason=e.message;if(reason.startsWith('NOT_FOUND'))break;await sleep(Math.min(11000,800*(attempt+1)**2));}
  }
  throw new Error(page+': '+reason);
}
function removeExtras($,el){
  const clone=$(el).clone();
  clone.find('small, sup.reference, span.reference, .mw-editsection, .mw-cite-backlink, .mw-references-wrap, style, script, .reference-text, .poem-info').remove();
  return clean(toCN(clone.text()));
}
function splitSentences(s){
  return (s.match(/[^。！？；]+[。！？；]?/gu)||[s]).map(clean).filter(Boolean);
}
function record({group,title,section,n,text,url}){
  if(text.length<9||text.length>16000)return null;
  return {id:group==='世说新语'?'ss-'+section+'-'+n:'jh-'+section+'-'+n,
    group,title,section,text,sentences:splitSentences(text),url};
}
function sectionEntries(html,section,index){
 const $=load(html);
 // Direct child list items: avoid commentary footnotes and unrelated navigation lists.
 let items=$('.mw-parser-output > ol > li').toArray();
 if(items.length<2)items=$('ol').first().children('li').toArray();
 return items.map((el,i)=>record({group:'世说新语',title:'《世说新语·'+toCN(section)+'》 第'+(i+1)+'则',section:String(index+1).padStart(2,'0'),
   n:i+1,text:removeExtras($,el),url:pageURL('世說新語/'+section)})).filter(Boolean);
}
function juniorEntries(html,label,page){
 const $=load(html),rootEl=$('.mw-parser-output').first();
 if(!rootEl.length)return [];
 rootEl.find('small, sup.reference, .reference, .mw-editsection, style, script, .noprint, .mw-references-wrap, .plainlinks').remove();
 // exclude the first navigation/metadata table, footers, and page links, retaining work body.
 let blocks=rootEl.children('p,div.poem,blockquote,div.mw-poem-indented,ol,ul').toArray();
 let lines=blocks.map(n=>{
   if($(n).is('ol,ul'))return $(n).children('li').toArray().map(k=>clean(toCN($(k).text()))).join(' ');
   return clean(toCN($(n).text()));
 }).filter(t=>t.length>5&&!/^(返回|上页|下页|目录|译文|注释|作者|参考资料|本书)/.test(t));
 let text=lines.join('\n');
 // Stop at absurdly long chapters; preserve a bounded original slice for context search.
 if(text.length>13000)text=text.slice(0,13000);
 if(text.length<20){const candidate=clean(toCN(rootEl.find('table,.mw-editsection,.mw-references-wrap').remove().end().text()));if(candidate.length>=40&&candidate.length<=13000)text=candidate;}\n if(text.length<20)return [];
 return [record({group:'初中文言拓展',title:'《'+(text.length>1900&&page.includes('/')?page.replace('/', '·'):label)+'》',section:label,n:1,text,url:pageURL(page)})].filter(Boolean);
}
async function main(){
 await fs.mkdir(output,{recursive:true});
 let ss=[],jh=[],missing=[],stats=[];
 for(let i=0;i<sections.length;i++){
   const sec=sections[i],page='世說新語/'+sec;
   try{const html=await fetchPage(page),entries=sectionEntries(html,sec,i);
     if(entries.length<1)throw new Error('only '+entries.length+' narrative entries');
     ss.push(...entries);stats.push({section:toCN(sec),count:entries.length});
     console.log('世说',i+1+'/'+sections.length,sec,entries.length);
   }catch(e){missing.push({group:'世说新语',page,error:e.message});console.warn('MISSING SECTION',page,e.message);}
   await sleep(150);
 }
 const seenJuniorPages=new Set();
 for(let i=0;i<junior.length;i++){
   const [label,page]=junior[i];
   if(seenJuniorPages.has(page))continue;
   seenJuniorPages.add(page);
   try{const entries=juniorEntries(await fetchPage(page),label,page);
     if(!entries.length)throw new Error('no reliable body');
     jh.push(...entries);
     console.log('初中',i+1+'/'+junior.length,label,entries[0].text.length);
   }catch(e){missing.push({group:'初中文言拓展',page,label,error:e.message});console.warn('MISSING JUNIOR',label,e.message);}
   await sleep(110);
 }
 if(ss.length<850)throw new Error('Refusing incomplete 世说 corpus: only '+ss.length+' entries; missing='+missing.filter(x=>x.group==='世说新语').length);
 // Section-level evidence is original text (with commentary stripped and Traditional→Simplified conversion);
 // do not manufacture translations or label raw original text as textbook approved.
 const all=[...ss,...jh];
 const info={generatedAt:new Date().toISOString(),ssCount:ss.length,ssSections:stats.length,ssSectionDetails:stats,
   juniorCount:jh.length,juniorExpected:junior.length,missing,source:'中文维基文库《世说新语》36门及初中文言参考篇目',
   transform:'移除刘孝标注文与网页导航，简繁转写；初中文言参考篇目含部分书/卷原文而非仅教材节选',
   license:'原始古籍公版；维基文库校录文本按 CC BY-SA 4.0 署名与相同方式共享，参见每条来源链接'};
 await fs.writeFile(path.join(output,'catalog.json'),JSON.stringify({info,entries:all}), 'utf8');
 await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(info,null,2),'utf8');
 console.log('EVIDENCE READY',JSON.stringify({ss:ss.length,junior:jh.length,missing:missing.length,chars:all.reduce((n,x)=>n+x.text.length,0)}));
}
await main();
