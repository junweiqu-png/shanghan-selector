(function(root){
'use strict';
function normalizedTitle(s){return String(s||'').normalize('NFKC').toLowerCase().replace(/\.(txt|text)$/i,'').replace(/[\s\p{P}\p{S}]+/gu,'');}
function signature(text){
 const str=String(text||''), hashes=new Set();
 const stride=Math.max(1,Math.floor(str.length/1400));
 for(let i=0;i<str.length;i+=stride){
   const sub=str.slice(i,i+28);if(sub.length<12)continue;
   let hash=2166136261;
   for(const ch of sub){hash^=ch.codePointAt(0);hash=Math.imul(hash,16777619);}
   hashes.add(hash>>>0);
 }
 return [...hashes].sort((a,b)=>a-b).slice(0,64);
}
function similarity(a,b){
 if(!a?.length||!b?.length)return 0;
 const s=new Set(a),t=new Set(b);let count=0;for(const n of s)if(t.has(n))count++;
 return count/Math.max(1,Math.min(s.size,t.size));
}
function segmentTexts(text){
 return String(text||'').replace(/\r\n?/g,'\n').match(/[^。；！？!?\n]+[。；！？!?\n]?/gu)||[];
}
async function addedSentences(newText,oldText,canonical,limit=200){
 const oldParts=segmentTexts(oldText),newParts=segmentTexts(newText);
 const oldKeys=new Set();
 for(const s of oldParts){const key=(await canonical(s)).replace(/\s+/g,'');if(key)oldKeys.add(key);}
 const additions=[],shown=new Set();
 let total=0;
 for(const s of newParts){
   const key=(await canonical(s)).replace(/\s+/g,'');
   if(!key||oldKeys.has(key)||shown.has(key))continue;
   shown.add(key);total++;
   if(additions.length<limit)additions.push(s.trim());
 }
 return {additions,total,hidden:Math.max(0,total-additions.length),method:'逐句段繁简归一比对（新增或改写句）'};
}
function chooseMatch(target,metas){
 let best=null;
 for(const meta of metas){
   if(meta.id===target.id)continue;
   const exact=!!(meta.digest&&target.digest===meta.digest);
   const sameName=normalizedTitle(meta.title)===normalizedTitle(target.title);
   const s=similarity(target.signature,meta.signature),ratio=Math.min(target.chars||1,meta.chars||1)/Math.max(target.chars||1,meta.chars||1);
   // A changed title alone may not identify the work. Prefer substantial shared text.
   const candidate=exact||sameName||s>=.30&&ratio>=.20;
   if(!candidate)continue;
   const score=exact?1000:(sameName?200:0)+s*100;
   if(!best||score>best.score)best={meta,exact,sameName,similarity:s,score};
 }
 return best;
}
root.TCMImportReviewCore={normalizedTitle,signature,similarity,segmentTexts,addedSentences,chooseMatch};
})(typeof globalThis!=='undefined'?globalThis:this);
