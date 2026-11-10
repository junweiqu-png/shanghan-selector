/* MIT-licensed public classical poem and primer collections.
 * Sources: https://github.com/chinese-poetry/chinese-poetry (MIT).
 * Texts are candidate-only; none are promoted to translated student evidence automatically.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {Converter} from 'opencc-js';
const cn=Converter({from:'tw',to:'cn'}),out='dist/wenyan/evidence';
const source='https://github.com/chinese-poetry/chinese-poetry';
const items=[
 ['小学诗文','全唐诗/唐诗三百首.json','唐诗三百首'],
 ['古文名篇','蒙学/guwenguanzhi.json','古文观止'],
 ['小学诗文','蒙学/qianjiashi.json','千家诗'],
 ['古人名言','蒙学/zengguangxianwen.json','增广贤文'],
 ['蒙学经典','蒙学/sanzijing-traditional.json','三字经'],
 ['蒙学经典','蒙学/qianziwen.json','千字文'],
 ['蒙学经典','蒙学/zhuzijiaxun.json','朱子家训'],
 ['蒙学经典','蒙学/shenglvqimeng.json','声律启蒙'],
 ['蒙学经典','蒙学/youxueqionglin.json','幼学琼林']
];
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const hash=s=>crypto.createHash('sha1').update(s).digest('hex').slice(0,16);
async function load(filepath){
 const cache=path.join('.evidence-cache','poetry-'+hash(filepath)+'.json');
 try{return JSON.parse(await fs.readFile(cache,'utf8'));}catch{}
 const paths=filepath.split('/').map(encodeURIComponent).join('/');
 const u='https://api.github.com/repos/chinese-poetry/chinese-poetry/contents/'+paths+'?ref=master';
 const urls=[u,'https://cdn.jsdelivr.net/gh/chinese-poetry/chinese-poetry@master/'+paths];
 let last='';
 for(const url of urls){
  try{
   const r=await fetch(url,{headers:{'user-agent':'WenyanSchoolPrimerIndex/1.0 (open educational study)','accept':'application/vnd.github+json'},signal:AbortSignal.timeout(25000)});
   if(!r.ok)throw Error('HTTP '+r.status);
   let data;if(url.includes('api.github.com')){const x=await r.json();if(!x.content||x.encoding!=='base64')throw Error('API content missing');data=JSON.parse(Buffer.from(x.content.replace(/\s/g,''),'base64').toString('utf8'));}
   else data=await r.json();
   await fs.mkdir(path.dirname(cache),{recursive:true});await fs.writeFile(cache,JSON.stringify(data),'utf8');
   return data;
  }catch(e){last=e.message;}
 }
 throw Error(filepath+' '+last);
}
function record(group,book,title,author,text,page,part=0){
 text=clean(cn(text));if(text.length<5||text.length>8000)return null;
 return {id:'po-'+hash(book+title+part+text.slice(0,30)),group,title:cn(title),work:cn(book),author:cn(author||''),text,
  sentences:text.match(/[^。！？；]+[。！？；]?/gu)?.map(clean).filter(Boolean)||[text],
  url:source+'/blob/master/'+page.split('/').map(encodeURIComponent).join('/'),
  edition:'chinese-poetry 项目 MIT 校录本（非教材审定译注）'};
}
function flatten(data,group,book,filename){
 const list=[];
 function walk(obj,parent=''){
  if(!obj)return;
  if(typeof obj==='string'){if(obj.length>8){const rec=record(group,book,book+(parent?'·'+parent:''),'',obj,filename,list.length);if(rec)list.push(rec);}return;}
  if(Array.isArray(obj)){for(const x of obj)walk(x,parent);return;}
  const title=clean(obj.title||obj.chapter||obj.name||parent||book);
  const author=clean(obj.author||'');
  if(Array.isArray(obj.paragraphs)){
   const parts=obj.paragraphs.filter(x=>typeof x==='string'&&x.trim());
   if(group==='古人名言'||book==='千字文'||book==='三字经'||book==='朱子家训'){
    for(const [i,x] of parts.entries()){const rec=record(group,book,title==='上集'||title==='下集'?book+'·'+title:title,author,x,filename,i);if(rec)list.push(rec);}
   }else{
    const text=parts.join(' ');
    // For extremely long classical prose, split along paragraph boundaries preserving context.
    if(text.length>2600){
     let acc='',part=0;
     for(const piece of parts){if(acc.length+piece.length>1700&&acc){const rec=record(group,book,title+'·'+(++part),author,acc,filename,part);if(rec)list.push(rec);acc='';}acc+=(acc?' ':'')+piece;}
     if(acc){const rec=record(group,book,title+'·'+(++part),author,acc,filename,part);if(rec)list.push(rec);}
    }else{const rec=record(group,book,title,author,text,filename,list.length);if(rec)list.push(rec);}
   }
  }
  if(Array.isArray(obj.content))walk(obj.content,title);
  else if(typeof obj.content==='string'&&!obj.paragraphs)walk(obj.content,title);
  if(Array.isArray(obj.data))walk(obj.data,title);
 }
 walk(data);
 return list;
}
await fs.mkdir(out,{recursive:true});
const manifestPath=path.join(out,'expanded-manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const lists={},missing=[];
for(const [group,filename,book] of items){
 try{
  const list=flatten(await load(filename),group,book,filename);
  if(!list.length)throw Error('zero parsed paragraphs');
  (lists[group]||=[]).push(...list);
  console.log('POETRY ADDED',book,list.length);
 }catch(e){missing.push({group,filename,book,error:e.message});console.warn('POETRY MISSING',book,e.message);}
}
let total=0;
for(const [group,entries] of Object.entries(lists)){
 const f='expanded-'+({'小学诗文':'poetry','古文名篇':'classic-prose','古人名言':'proverbs','蒙学经典':'primers'}[group])+'.json';
 await fs.writeFile(path.join(out,f),JSON.stringify({grade:group,entries}), 'utf8');
 manifest.files.push({grade:group,file:f,passages:entries.length,sourcePages:items.filter(x=>x[0]===group).length});
 total+=entries.length;
}
manifest.poetry={source,license:'MIT; 原文古典语料',passages:total,missing,books:items.length-missing.length,notes:'候选原典，不自动提供译文；人工核对后才能提升为关联学习例句'};
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2),'utf8');
console.log('POETRY SOURCES READY',JSON.stringify({books:manifest.poetry.books,passages:total,missing:missing.length}));
