import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const window={},requested=[];
const manifest={files:[],large:{available:true,indexEncoding:'json',termIndexShards:0,indexShards:64}};
const shard=('筑'.codePointAt(0)%64).toString().padStart(2,'0');
const payload={筑:[{source:'《扩展古籍测试》',chapter:'卷一',text:'某篇古文记载筑墙之事。',id:'fixture-001',group:'经史名言'}]};
const bytes=Buffer.from(JSON.stringify(payload),'utf8');
const fetch=async url=>{
 requested.push(String(url));
 if(String(url).includes('expanded-manifest.json'))return {ok:true,json:async()=>manifest};
 if(String(url).endsWith('/catalog.json'))return {ok:true,json:async()=>({entries:[]})};
 if(String(url).includes('large-index/'+shard+'.json?v=20261112fullcorpus1'))return {
  ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)
 };
 return {ok:false,status:404};
};
const document={getElementById:()=>null,addEventListener:()=>{},querySelectorAll:()=>[]};
const context=vm.createContext({window,document,localStorage:{getItem:()=>null,setItem:()=>{}},fetch,TextDecoder,Uint8Array,Promise,JSON,Array,Map,Object,Set,String,Number,Math,Blob,Response,DecompressionStream});
vm.runInContext(fs.readFileSync('wenyan/study-editor.js','utf8'),context,{filename:'study-editor.js'});
const rows=await window.WENYAN_STUDY_EDITOR.searchClassics('筑');
assert.equal(rows.length,1);
assert.equal(rows[0].title,'《扩展古籍测试》·卷一');
assert.equal(rows[0].text,'某篇古文记载筑墙之事。');
assert.equal(rows[0].group,'经史名言');
assert(!Object.hasOwn(rows[0],'translation'),'raw full-text hits must not invent translations');
assert(requested.some(url=>url.includes('large-index/'+shard+'.json?v=20261112fullcorpus1')),'single-character fallback index must be fetched');
console.log(JSON.stringify({ok:true,term:'筑',candidateCount:rows.length,translationInvented:false,source:rows[0].title}));
