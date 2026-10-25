import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const original=await fs.readFile('recall.js','utf8');
const html=await fs.readFile('recall.html','utf8');
assert(!html.includes('id="splitCard"'),'no create-new-card action');
assert(!html.includes('id="mergePrev"'),'no previous card merge');
assert(!html.includes('id="mergeNext"'),'no next card merge');
assert(html.includes('同一卡片内换行')||html.includes('同一卡片'),'same-card editing instructions');

function sample(id,segments,defaults) {
 return {id,chapter:'辨太阳病',line:1,segments,defaults,
  text:segments.join(''),segmentRuby:segments.map(()=>[]),
  segmentGloss:segments.map(s=>'释：'+s)};
}
const cards=[
 sample('sh-a',['问一，','问二，','答一。','问三，','答二，','答三。'],['p','p','c','p','c','c']),
 sample('sh-b',['问四，','答四。'],['p','c'])
];
const storage=new Map([['shanghan-recall-v2',JSON.stringify({
 cardKey:'sh-a:0',
 boundaries:{'sh-a:0':true,'sh-a:5':false},
 edits:{'sh-b':['p','c']},
 glossEdits:{},
 sideGlossEdits:{'sh-a':{p:'用户问题白话'},'cut:sh-a:1|sh-a:5':{c:'以前拆卡的答案白话'}},
 orderMode:'sequential'
})]]);
const nodes=new Map();
function node(selector){
 if(!nodes.has(selector)){
  const listeners={};
  nodes.set(selector,{
   innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,
   classList:{toggle(){},add(){},remove(){}},
   addEventListener(event,fn){listeners[event]=fn;},
   get listeners(){return listeners;},
   setAttribute(){},scrollIntoView(){},querySelectorAll(){return []}
  });
 }
 return nodes.get(selector);
}
const doc={
 querySelector:node,
 querySelectorAll(){return []},
 addEventListener(){},
 createElement(){return {value:'',style:{},select(){},remove(){}}},
 body:{appendChild(){}},
 execCommand(){return true}
};
const selection={isCollapsed:true,removeAllRanges(){}};
const win={SHANGHAN_RECALL:{cards},getSelection(){return selection},
 matchMedia(){return {matches:false}}};
const ctx={window:win,document:doc,
 localStorage:{getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)}},
 console,setTimeout(){}};
vm.runInNewContext(original,ctx,{filename:'recall.js'});
assert.match(node('#progress').textContent,/1 \/ 2/,'one original article per card');
assert.equal((node('#front').innerHTML.match(/question-group-number/g)||[]).length,3,
 'old split migrated to a newline inside the original card');
assert.match(node('#front').innerHTML,/用户问题白话/,'original edited translation remains');
assert.match(node('#back').innerHTML,/以前拆卡的答案白话/,'split-card translation remains accessible');
assert.equal(node('#original').textContent,cards[0].text,'article text is not altered');
assert.match(node('#segments').innerHTML,/data-break="1"/,'inline newline control exists');
const clickBreak=node('#segments').listeners.click;
assert.equal(typeof clickBreak,'function');
clickBreak({target:{closest(sel){
 if(sel==='[data-break]')return {dataset:{break:'1'}};
 return null;
}}});
assert.equal((node('#front').innerHTML.match(/question-group-number/g)||[]).length,2,
 'toggling break recombines visual rows, without combining cards');
assert.equal(JSON.parse(storage.get('shanghan-recall-v2')).lineBreaks['sh-a'].length,0,
 'inline newline changes auto-save');
assert.match(node('#progress').textContent,/1 \/ 2/,'line break does not add a card');
node('#next').onclick();
assert.match(node('#progress').textContent,/2 \/ 2/);
assert.equal(node('#original').textContent,cards[1].text);
node('#prev').onclick();
node('#resetOne').onclick();
assert.deepEqual(JSON.parse(storage.get('shanghan-recall-v2')).lineBreaks['sh-a'],[],
 'reset must not re-import old boundaries after refresh');
console.log('Recall smoke tests: one article per card, multi-question rows, legacy split migration, editing, saved glosses, navigation PASS');
