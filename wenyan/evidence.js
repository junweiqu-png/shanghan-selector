/*
 * Cross-text classical Chinese evidence reader.
 * Raw citations are corpus matches, not auto-inferred grammatical equivalences.
 * The source corpus is built from public Wikisource originals, with annotation stripped.
 */
(() => {
"use strict";
const byId=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lessons=()=>[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[])];
const KEY='wenyan-recall-v1', FALLBACK=120;
let catalogPromise=null,active=null,cache={};
const hints={
 '疑问句':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['何以战','何所似','尊君在不','君家果','孰为汝多知乎'],rx:/[？?]/},
 '否定句':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['非人哉','不可不学','未若','无他','弗能应'],rx:/不|未|无|非|弗/},
 '感叹句':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['何陋之有','善哉乎','非人哉','谬矣','狼亦黠矣'],rx:/[！!]|哉[。！]|矣[。！]/},
 '比较句':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['弗若','不若','未若','孰若','若此','如故'],rx:/弗若|不若|未若|若[^。！？；]{1,8}|孰若/},
 '转折关系':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['而不','而入','却','但','然而'],rx:/而不|而[^。！？；]{1,12}(无|未|却)|虽[^。！？；]{1,18}而/},
 '目的关系':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['以求生','以攻其后','冀复得兔','以明志'],rx:/以[^。！？；]{1,12}(求|为|成|攻)/},
 '结果关系':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['遂','故','则','因此','获全'],rx:/遂[^。！？；]{1,15}|因而|故[^。！？；]{1,15}/},
 '连动句':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['取之','下车引之','起行','取一葫芦','坐于前'],rx:/[取起行持射作举立登]{1}[^。！？；]{0,18}[而以][^。！？；]{1,14}/},
 '假设关系':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['若','虽','只使','使','果'],rx:/若[^。！？；]{2,20}|虽[^。！？；]{2,18}|只使/},
 '介词结构':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['以我酌油知之','以刀劈狼首','蒙辞以军中多务','以钱覆其口'],rx:/以[^。！？；]{1,14}(为|知|之|入|置|加)/},
 '意动用法':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['笑而然之','异之','美我者','以为','认为'],rx:/然之|异之|美我|以[^。！？；]{0,4}为/},
 '所字结构':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['所从坠','所契者','所宝','所忧','所行'],rx:/所[^。！？；]{1,4}(者|也)|所[^。！？；]{1,4}[，。]/},
 '对偶句':{desc:'从真实古文中检索相关表达；自动匹配仅是候选，具体是否属于本句式须人工辨析。',phrases:['高峰入云','清流见底','日中不至','非淡泊无以明志'],rx:/[^。！？；]{3,15}，[ ^。！？；]{3,15}；/},
 '宾语前置':{desc:'如“何陋之有”“何以战”等，应结合句式分析；相似词语不等于相同句式。',phrases:['何陋之有','何以战','何厌之有','何罪之有','何操','孰与','何见事之晚','惟弈秋之为听'],rx:/何[^。！？；]{0,8}之有|何以[^。！？；]{0,7}|惟[^。！？；]{0,14}之为/},
 '状语后置':{desc:'介词结构位于动词之后，翻译时常前移，如“蒙辞以军中多务”。',phrases:['辞以军中多务','射于家圃','步于中庭','告之于帝','刻唐贤今人诗赋于其上','置于地'],rx:/[之以在射登步游告刻持]{1,2}于[^。！？；]{1,10}/},
 '判断句':{desc:'古文常以“……者……也”“……也”等表达判断；不能仅因出现“也”就归类。',phrases:['花之君子者也','通国之善弈者也','此画斗牛也','此必苦李','斯是陋室','盖竹柏影也'],rx:/者也[。！]|是[^。！？；]{1,14}也[。！]/},
 '被动句':{desc:'如“身为宋国笑”“为……所……”；以下自动检索结果仅作结构辨别练习。',phrases:['身为宋国笑','为所吞','为宋国笑','为人所笑','受其敌'],rx:/为[^。！？；]{1,12}所[^。！？；]{1,10}|身为[^。！？；]{1,15}笑/},
 '固定句式':{desc:'如“非……无以……”“不亦……乎”“奈……何”等。',phrases:['非淡泊无以明志','非宁静无以致远','不亦惑乎','奈地坏何','无以','不亦精乎','孰若'],rx:/非[^。！？；]{1,8}无以|不亦[^。！？；]{1,15}乎|奈[^。！？；]{1,12}何/},
 '双重否定':{desc:'“不可不”“无不”“非……不”等，要分清强调与语气。',phrases:['不可不学','无不陷','非学无以','非志无以'],rx:/不可不|无不|非[^。！？；]{1,9}不/},
 '反问句':{desc:'常见“岂……乎”“不亦……乎”“何……之有”等；只命中疑问词不保证是反问。',phrases:['何陋之有','岂荀巨伯所行邪','不亦惑乎','不亦精乎','安能','奈何','何见事之晚','孰为汝多知乎'],rx:/岂[^。！？；]{1,20}[乎邪哉？]|不亦[^。！？；]{1,20}乎|何[^。！？；]{0,10}之有|安能[^。！？；]{1,20}[？乎]/},
 '词类活用':{desc:'例如“犬坐”“洞其中”“不蔓不枝”“乱耳、劳形”，不能仅靠字形判定活用。',phrases:['犬坐于前','洞其中','不蔓不枝','乱耳','劳形','名词作动词'],rx:/犬坐|洞其|不蔓不枝/},
 '对偶句':{desc:'上下语义、词性、结构相对应，注意对偶并非仅指两句话有逗号。',phrases:['高峰入云，清流见底','青林翠竹，四时俱备','非淡泊无以明志','山不在高，有仙则名'],rx:null},
 '省略句':{desc:'需结合上文还原省略的主语、宾语或介词；这一类不宜仅用正则自动判定。',phrases:['太丘舍去','蒙乃始就学','乃取一葫芦','遂至承天寺','下车引之'],rx:null},
 '定语后置':{desc:'例如“楚人有鬻盾与矛者”，定语放在中心语之后。',phrases:['有鬻盾与矛者','有耕者','有乘轩冕过门者','马之千里者','花之隐逸者也'],rx:/有[^。！？；]{1,14}者/},
 '条件关系':{desc:'常以“则”等表示条件与结果，需结合具体句意判断。',phrases:['不至，则是无信','有仙则名','有龙则灵','其子趋而往视之'],rx:/[^。！？；]{1,14}则[^。！？；]{1,15}/},
 '所字结构':{desc:'“所+动词”构成名词性结构，意义取决于语境。',phrases:['所从坠','所契者','所宝','所忧','所行'],rx:/所[^。！？；]{1,4}者/}
};
async function load(){
 if(!catalogPromise)catalogPromise=fetch('evidence/catalog.json?v=20261110b',{cache:'default'})
  .then(r=>{if(!r.ok)throw Error('证据库 HTTP '+r.status);return r.json();})
  .then(j=>{if(!Array.isArray(j.entries)||j.entries.length<800)throw Error('证据库数据不完整');return j;})
  .catch(e=>{catalogPromise=null;throw e});
 return catalogPromise;
}
function open(title,html){
 byId('modalTitle').textContent=title;
 byId('modalContent').innerHTML=html;
 byId('overlay').hidden=false;
}
function sourceLabel(r){return r.group==='世说新语'?'《世说新语》 · '+r.title.replace(/^《世说新语·/,'').replace('》',' · '):r.title;}
function hi(text,word){
 if(!word)return esc(text);
 const pieces=String(text).split(word);return pieces.map(esc).join('<mark style="background:#fce9a2;color:inherit">'+esc(word)+'</mark>');
}
function inLesson(term){
 const rows=[];for(const w of lessons())for(const x of w.terms||[])if(x[0]===term)rows.push({w,term:x});
 return rows;
}
function getContext(r,k){
 const x=r.sentences||[],idx=Math.max(0,k);
 return {prev:x[idx-1]||'',curr:x[idx]||r.text.slice(0,150),next:x[idx+1]||''};
}
function scanWord(data,term){
 const rows=[];
 for(const r of data.entries){
   const ss=r.sentences||[];
   for(let i=0;i<ss.length;i++){if(ss[i].includes(term))rows.push({r,i,word:term});}
 }
 return rows;
}
function scanGrammar(data,pattern){
 const rows=[],hint=hints[pattern]||{phrases:[],rx:null};
 for(const r of data.entries){
  for(let i=0;i<(r.sentences||[]).length;i++){
   const s=r.sentences[i];
   const phrase=hint.phrases.find(p=>s.includes(p));
   if(phrase)rows.push({r,i,word:phrase,kind:'精确短语命中 · 仍须辨析'});
   else if(hint.rx&&hint.rx.test(s))rows.push({r,i,word:'',kind:'结构候选 · 未人工审定'});
  }
 }
 return rows;
}
function userExamples(term){
 const custom=(()=>{
  try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return Array.isArray(v.custom)?v.custom:[]}catch{return []}
 })();
 let ex=[];
 for(const w of [...lessons(),...custom])for(let i=0;i<w.lines.length;i++){
  const line=w.lines[i];if(line[0].includes(term))ex.push({w,i,line});
 }
 return ex;
}
function localGrammarRender(pattern){
 const matches=[];
 for(const w of lessons())for(const l of w.lines||[])if(l[2]===pattern)matches.push({w,l});
 return '<div class="sectionLabel">已标注背诵卡 · '+matches.length+' 句</div>'+
 (matches.length?matches.map(({w,l})=>'<div class="evidence"><b>'+esc(w.title)+'</b><p>'+esc(l[0])+'</p><div class="meaning">'+esc(l[1])+'</div></div>').join(''):
 '<p class="help">当前背诵卡没有已人工标注的同类句式，请参考下方候选句自行辨别。</p>');
}
function localRender(term){
 const defs=inLesson(term);
 const ex=userExamples(term);
 return '<div class="sectionLabel">教材练习篇目释义 · '+defs.length+' 项</div>'+
 (defs.length?defs.map(({w,term:t})=>'<div class="evidence"><b>'+esc(w.title)+'</b><small>'+esc(t[1])+'</small><div>'+esc(t[2])+'</div></div>').join(''):'<p class="help">目前没有人工校核释义，以下检索只表示字形相同。</p>')+
 '<div class="sectionLabel">背诵篇目直接命中 · '+ex.length+' 句</div>'+
 (ex.length?ex.slice(0,10).map(({w,line})=>'<div class="evidence"><b>'+esc(w.title)+'</b><p>'+hi(line[0],term)+'</p><div class="meaning">'+esc(line[1]||'暂无译文')+'</div></div>').join(''):'<p class="help">当前背诵篇目没有其他例句。</p>');
}
function card(row,term,isPattern){
 const {r,i,word}=row,con=getContext(r,i),url=esc(r.url||'#');
 const count=(r.sentences||[]).length;
 return '<article class="evidence corpus-example"><b>'+esc(sourceLabel(r))+'</b><small>'+esc(r.group)+' · 本则第 '+(i+1)+' / '+count+' 句 · <a href="'+url+'" target="_blank" rel="noopener noreferrer">查原典 ↗</a></small>'+
 (con.prev?'<div class="example-context"><span>上句</span><p>'+esc(con.prev)+'</p></div>':'')+
 '<div class="example-context selected"><span>命中句'+(row.kind?' · '+esc(row.kind):'')+'</span><p>'+hi(con.curr,word||(!isPattern?term:''))+'</p></div>'+
 (con.next?'<div class="example-context"><span>下句</span><p>'+esc(con.next)+'</p></div>':'')+
 '<details><summary>展开本则完整古文（'+r.text.length+'字）</summary><p class="example-full">'+hi(r.text,word||(!isPattern?term:''))+'</p></details>'+
 '<button class="evidence-add" data-add="'+esc(r.id)+'">＋ 加入我的背诵卡</button></article>';
}
function addCard(r){
 if(!r||r.text.length>1800){alert('这篇原文较长。请先从原典选取一个短篇段落，再到“我的 → 新增文章”录入。');return;}
 let s={};try{s=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
 if(!Array.isArray(s.custom))s.custom=[];
 if(s.custom.some(w=>w.source===r.url&&w.title===r.title)){alert('这篇文章已经加入。');return;}
 const segments=r.sentences&&r.sentences.length?r.sentences:[r.text];
 s.custom.push({title:r.title,source:r.url,level:'原典选读',lines:segments.map(x=>[x,'','']),terms:[],ruby:{},hint:'古文原文来自维基文库；译文暂未校核，可手动补录。'});
 const n=lessons().length+s.custom.length-1;
 s.wi=n;s.si=0;s.whole=false;s.show=false;
 localStorage.setItem(KEY,JSON.stringify(s));
 alert('已加入 '+segments.length+' 张逐句背诵卡。原文没有自动翻译，请按可靠版本补入译文。');
 location.reload();
}
function renderResults(rows,filter,offset){
 const all=filter==='世说新语'?rows.filter(x=>x.r.group==='世说新语'):
 filter==='初中文言拓展'?rows.filter(x=>x.r.group==='初中文言拓展'):rows;
 const root=byId('corpusResult');if(!root)return;
 const q=active.q,p=active.pattern;
 root.innerHTML='<div class="sectionLabel">原典命中 '+all.length+' 句 · '+new Set(all.map(x=>x.r.id)).size+' 个独立篇段</div>'+
 '<p class="help">严格显示本段的上句、命中句、下句；本则完整原文可展开。原始字词命中不等于相同词义；句式候选需要逐例辨析，不能当作已校对的语法定论。</p>'+
 (all.slice(0,offset+FALLBACK/4).map(x=>card(x,q,p)).join('')||'<p class="notice">这个分类暂时没有匹配的原典句子，可切换“全部”查看。</p>')+
 (all.length>offset+FALLBACK/4?'<button id="moreEvidence" class="item">继续加载例句（已显示 '+Math.min(offset+FALLBACK/4,all.length)+' / '+all.length+'）</button>':'');
 root.querySelectorAll('[data-add]').forEach(b=>{b.onclick=()=>{const found=active.data.entries.find(x=>x.id===b.dataset.add);addCard(found)}});
 const more=byId('moreEvidence');if(more)more.onclick=()=>renderResults(rows,filter,offset+FALLBACK/4);
}
function filters(rows){
 return '<div class="row evidence-filters">'+
 [['全部','全部'],['世说新语','世说新语'],['初中文言拓展','初中文言']].map(([v,t])=>
 '<button type="button" data-group="'+v+'" '+(active.filter===v?'class="selected-filter"':'')+'>'+t+'（'+(v==='全部'?rows.length:rows.filter(x=>x.r.group===v).length)+'）</button>').join('')+
 '</div><div id="corpusResult"></div>';
}
async function showEvidence(term,pattern=false){
 active={q:term,pattern,filter:'全部',data:null};
 const introduction=pattern?
 '<p class="notice">句式：“'+esc(term)+'”。'+esc(hints[term]?.desc||'同一句式需要对照语法条件，不可仅凭词语判断。')+'</p>':
 '<p class="notice"><b>'+esc(term)+'</b> 的跨文检索。可查看词语出现在完整《世说新语》及其他初中古文中的上下句。不同语境里的意思可能不同，不能把所有字面命中都解释为同一种用法。</p>';
 open((pattern?'句式专题：':'古文关联：')+term,introduction+
 (pattern?'<div id="localLessons">'+localGrammarRender(term)+'</div>':'<div id="localLessons">'+localRender(term)+'</div>')+
 '<div class="sectionLabel">原典拓展语料</div><p id="corpusLoad" class="notice">正在读取《世说新语》与初中文言原文索引……</p><div id="corpusArea"></div>');
 try{
  const data=await load();
  if(!active||active.q!==term||active.pattern!==pattern||byId('overlay').hidden)return;
  active.data=data;
  const rows=pattern?scanGrammar(data,term):scanWord(data,term);
  cache[(pattern?'g:':'w:')+term]=rows;
  const loadEl=byId('corpusLoad');
  if(loadEl)loadEl.innerHTML='已载入《世说新语》 <b>'+data.info.ssCount+'</b> 则（'+data.info.ssSections+'门）及初中原典 <b>'+data.info.juniorCount+'</b> 篇/卷。'+
  ' <a href="https://zh.wikisource.org/wiki/世說新語" target="_blank" rel="noopener noreferrer">语料来源 ↗</a>';
  byId('corpusArea').innerHTML=filters(rows);
  const setFilter=v=>{active.filter=v;byId('corpusArea').innerHTML=filters(rows);bind();renderResults(rows,v,0)};
  function bind(){byId('corpusArea').querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>setFilter(b.dataset.group));}
  bind();renderResults(rows,'全部',0);
 }catch(err){
  if(!active||active.q!==term||byId('overlay').hidden)return;
  const loadEl=byId('corpusLoad');
  if(loadEl)loadEl.textContent='大型原典索引暂时无法读取：'+err.message+'。可以先使用上方20余篇背诵例句，网页下次打开可重试。';
 }
}
document.addEventListener('click',e=>{
 const termEl=e.target.closest?.('[data-term]');
 const patternEl=e.target.closest?.('[data-pattern],[data-p]');
 if(termEl){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showEvidence(termEl.dataset.term,false);}
 else if(patternEl){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showEvidence(patternEl.dataset.pattern||patternEl.dataset.p,true);}
},true);
// Distinguish actual evidence from exact-match word-form search; a shareable source link is always visible.
})();