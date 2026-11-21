/* Short paired excerpts are loaded per glyph, so reading does not wait for the corpus. */
(()=>{"use strict";
const words=Object.create(null),requests=new Map();
const variants={"㘎":["㘚","阚","闞"]};
const version="20261121-linked1",base="evidence/linked-examples/";
function install(shard){
 for(const [char,records]of Object.entries(shard)){
  if([...char].length!==1||!Array.isArray(records))continue;
  words[char]={examples:records.filter(r=>r.text?.includes(r.match||char)&&(!r.match||r.match===char||variants[char]?.includes(r.match))&&r.translation&&r.meaning&&r.pos&&r.code&&r.url).map(r=>[
   r.title,r.source||r.title,r.text,r.translation,r.meaning,r.pos,r.code,"本句“"+(r.match||char)+"”："+r.meaning+"。",r.url,r.match||char,r.rank??500,r.codes?.length?r.codes:[r.code],r.provenance||null
  ])};
 }
}
async function load(char){
 if(words[char])return words[char];
 const shard=char.codePointAt(0)%64,key=String(shard).padStart(2,"0");
 if(!requests.has(key))requests.set(key,(async()=>{
  const response=await fetch(base+key+".json?v="+version,{cache:"force-cache"});
  if(!response.ok)throw Error("读取关联例句失败："+response.status);
  install(await response.json());
 })().catch(error=>{requests.delete(key);throw error;}));
 await requests.get(key);return words[char]||{examples:[]};
}
window.WENYAN_LINKED_TRANSLATIONS={words,variants,install,load};
})();
