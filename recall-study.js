(()=>{
const DATA=window.SHANGHAN_RECALL||SHANGHAN_RECALL;
const COMMENTS=window.SHANGHAN_COMMENTARIES||SHANGHAN_COMMENTARIES||{sources:[],cards:{}};
let currentCard=null,lastTerm='',dictionaryRequest=0;

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const LEXICON={
  '灑淅':{title:'灑淅（洒淅）',reading:'常见现代读音：sǎ xī；部分历史辞典另收 xiǎn xī',brief:'寒冷、寒栗或寒颤的样子。在伤寒、金匮语境里，多用来形容体表发冷、寒栗的感觉。',note:'这是古汉语形容词，不宜按现代“洒”“淅”的字面义拆开理解。',links:[['汉典·洒淅','https://www.zdic.net/hans/%E6%B4%92%E6%B7%85'],['教育部重编国语辞典','https://dict.revised.moe.edu.tw/dictView.jsp?ID=108163']]},
  '洒淅':{alias:'灑淅'},
  '綿綿':{title:'绵绵',reading:'mián mián',brief:'这里用来形容脉势连绵而柔软。成无己解释为“连绵而软”，与下文“如泻漆之绝”的前大后细比喻应合在一起理解。',links:[['成无己注文（校核文本）','https://www.shidianguji.com/mid-page/7555622943361237001']]},
  '绵绵':{alias:'綿綿'},
  '瀉漆':{title:'泻漆',reading:'xiè qī',brief:'“泻”在这里指倾注、倒出；“漆”指漆汁。古人用漆汁倾泻将尽、前大后细的形状比拟脉象，不是现代“腹泻”的意思。',note:'成无己原注：“如泻漆之绝者，前大而后细也。”',links:[['成无己注文（校核文本）','https://www.shidianguji.com/mid-page/7555622943361237001']]},
  '泻漆':{alias:'瀉漆'},
  '瀉漆之絕':{title:'泻漆之绝',reading:'xiè qī zhī jué',brief:'比喻漆汁倾出将要断绝之时，液流由粗转细。这里形容脉象逐渐衰微；成无己直接解释为“前大而后细”。',links:[['成无己注文（校核文本）','https://www.shidianguji.com/mid-page/7555622943361237001']]},
  '泻漆之绝':{alias:'瀉漆之絕'},
  '如瀉漆之絕者':{alias:'瀉漆之絕'},
  '幾幾':{title:'几几',reading:'jǐ jǐ（古注亦讨论其音义）',brief:'形容项背拘急、俯仰转动不自如的样子。成无己以短羽之鸟伸引其颈来说明这种状态。',links:[['《伤寒明理论·项强》','https://zh.wikisource.org/zh-hans/%E5%82%B7%E5%AF%92%E6%98%8E%E7%90%86%E8%AB%96/%E9%A0%85%E5%BC%B7']]},
  '几几':{alias:'幾幾'},
  '譫語':{title:'谵语',reading:'zhān yǔ',brief:'神识不清时言语错乱、语无伦次。伤寒条文中要结合热势、腹证、汗下经过等继续辨别，不能见“谵语”就只作一种病机。',links:[['《伤寒明理论·谵语》','https://zh.wikisource.org/zh-hant/%E5%82%B7%E5%AF%92%E6%98%8E%E7%90%86%E8%AB%96/%E8%AD%AB%E8%AA%9E']]},
  '谵语':{alias:'譫語'},
  '心下':{title:'心下',brief:'仲景书中的部位词，大致在上腹、胃脘附近；“痞、满、急、悸、硬”等搭配不同，意义也不同。'},
  '下利':{title:'下利',brief:'古医籍常用语，泛指腹泻、便次增多而质稀等表现；具体寒热虚实仍要看整条脉证。'},
  '厥':{title:'厥',brief:'常指四肢逆冷，但《伤寒论》中的“厥”并不等于单纯寒证；可见寒厥、热厥等不同语境。'},
  '結胸':{title:'结胸',brief:'伤寒论中的特定证候名，常见胸胁或心下硬满疼痛等表现，需与“痞”等区分。'},
  '结胸':{alias:'結胸'},
  '噫氣':{title:'噫气',brief:'嗳气、气从胃中上逆而出。古籍中常结合心下痞硬、胃气不和等上下文理解。'},
  '噫气':{alias:'噫氣'},
  '噦':{title:'哕',brief:'古医籍常指呃逆一类症状，也要结合具体条文辨轻重与病机。'},
  '哕':{alias:'噦'},
  '清穀':{title:'清谷',brief:'“下利清谷”指腹泻时所下食物不化，古人常用来提示中焦运化、阳气等方面的问题。'},
  '清谷':{alias:'清穀'}
};
function lexData(term){
  const d=LEXICON[term];if(d)return d.alias?LEXICON[d.alias]:d;
  try{
    if(typeof termData==='function'){
      const td=termData(term);if(td)return {title:td.title||term,brief:td.brief||'',refs:td.refs||[]};
    }
  }catch{}
  return null;
}
function cleanTerm(s){return String(s||'').replace(/^[\s，。；！？?!：:“”‘’（）()《》]+|[\s，。；！？?!：:“”‘’（）()《》]+$/gu,'').replace(/\s+/g,'').slice(0,24);}
function selectionText(){
  const sel=window.getSelection();if(!sel||sel.isCollapsed||!sel.rangeCount)return '';
  const range=sel.getRangeAt(0),node=range.commonAncestorContainer,el=node.nodeType===1?node:node.parentElement;
  if(!el||!el.closest?.('#flashcard'))return '';
  const frag=range.cloneContents(),box=document.createElement('div');box.appendChild(frag);
  box.querySelectorAll('rt').forEach(x=>x.remove());
  return cleanTerm(box.textContent||sel.toString());
}
function occurrences(term){
  if(!term)return [];
  const out=[];
  for(let i=0;i<DATA.cards.length&&out.length<5;i++){
    const c=DATA.cards[i];if(currentCard&&c.id===currentCard.id)continue;
    if(c.text.includes(term))out.push({i,c});
  }
  return out;
}
function evidenceHighlight(excerpt,variants){
  const raw=String(excerpt||''),ranges=[];
  for(const v of variants){
    if(!v)continue;
    let start=0,count=0;
    while(count++<60){
      const i=raw.toLowerCase().indexOf(v.toLowerCase(),start);
      if(i<0)break;
      ranges.push([i,i+v.length]);start=i+Math.max(1,v.length);
    }
  }
  ranges.sort((a,b)=>a[0]-b[0]);
  let last=0,out='';
  for(const [a,b] of ranges){
    if(a<last)continue;
    out+=esc(raw.slice(last,a))+'<mark>'+esc(raw.slice(a,b))+'</mark>';
    last=b;
  }
  return out+esc(raw.slice(last));
}
async function showCorpusEvidence(term,requestId){
 const el=document.getElementById('dictEvidence');
 if(!el)return;
 if(!globalThis.TCMCorpusLookup||!globalThis.TCMSearch){
   el.innerHTML='<p class="dict-empty">古籍全文搜索暂不可用，请到主站搜索。</p>';return;
 }
 try{
   const found=await TCMCorpusLookup.search(term,{maxRepo:18,maxLocal:18,repoHits:2,localHits:2,concurrency:8});
   if(requestId!==dictionaryRequest)return;
   const vars=await TCMSearch.variants(term);
   if(requestId!==dictionaryRequest)return;
   const rows=[
     ...found.repo.map(r=>({b:r.book||r.doc,h:r.hits[0],origin:'公共古籍'})),
     ...found.local.rows.map(r=>({b:r.book,h:r.hits[0],origin:'我的 TXT'}))
   ].filter(r=>r.h);
   const list=rows.map(({b,h,origin})=>{
     const url=TCMCorpusLookup.readerUrl(b.id,h.line,term);
     return '<a class="dict-evidence-item" href="'+esc(url)+'">'+
       '<b>'+esc(b.title||'无题')+'</b><span>'+origin+' · 第 '+h.line+' 行 · 打开原文 ↗</span>'+
       '<p>'+evidenceHighlight(h.excerpt,vars)+'</p></a>';
   }).join('');
   const incomplete=found.repo.totalMatches===null?' · 公共古籍先显示前 '+found.repo.length+' 本':'';
   const problems=found.errors.length?'<p class="dict-corpus-warning">部分来源检索未完成：'+esc(found.errors.slice(0,2).join('；'))+'</p>':'';
   el.innerHTML='<div class="dict-corpus-summary">全库严格检索：公共古籍 '+found.repo.length+' 本 · 本地 TXT '+found.local.rows.length+
      ' 本（本地书库 '+found.local.total+' 本）'+incomplete+'</div>'+
      (list||'<p class="dict-empty">当前搜索范围内未检出原文命中。</p>')+
      problems+
      '<a class="dict-search" href="'+esc(TCMCorpusLookup.searchUrl(term))+'">到主站搜索“'+esc(term)+'”，继续查看完整检索结果 →</a>';
 }catch(e){
   if(requestId===dictionaryRequest)el.innerHTML='<p class="dict-corpus-warning">古籍全文检索遇到问题：'+esc(e.message)+'</p>'+
       '<a class="dict-search" href="'+esc(TCMCorpusLookup.searchUrl(term))+'">转到主站继续搜索 →</a>';
 }
}
function renderDictionary(term){
 const requestId=++dictionaryRequest;
 lastTerm=term;
 const title=document.getElementById('dictTerm'),body=document.getElementById('dictBody');
 if(!title||!body)return;
 if(!term){
   title.textContent='拖动选中上方的字或词';
   body.innerHTML='<p class="dict-empty">例如选中“灑淅”“瀉漆”“心下”，将自动查询各医书的原文用例，包括你批量导入的 TXT。</p>';
   return;
 }
 title.textContent='“'+term+'”';
 const d=lexData(term),occs=occurrences(term);
 let html='';
 if(d){
   html+='<div class="dict-definition"><h4>'+esc(d.title||term)+'</h4>';
   if(d.reading)html+='<p class="dict-reading">'+esc(d.reading)+'</p>';
   html+='<p>'+esc(d.brief||'')+'</p>';
   if(d.note)html+='<p class="dict-note">'+esc(d.note)+'</p>';
   if(d.refs?.length)html+='<div class="dict-refs">'+d.refs.slice(0,3).map(r=>'<div><b>'+esc(r.book||'古籍')+'</b>：'+esc(r.quote||'')+'</div>').join('')+'</div>';
   if(d.links?.length)html+='<div class="dict-links">'+d.links.map(([n,u])=>'<a href="'+u+'" target="_blank" rel="noopener">'+esc(n)+' ↗</a>').join('')+'</div>';
   html+='</div>';
 }else{
   html+='<div class="dict-definition"><h4>'+esc(term)+'</h4><p>暂无人工校对的固定词义。下面自动列出医书中的真实用例，方便从上下文判断，避免凭空造释义。</p></div>';
 }
 html+='<div class="dict-context"><b>本条语境</b><p>'+esc(currentCard?.text||'')+'</p></div>';
 if(occs.length)html+='<details class="dict-occ"><summary>《伤寒论》另有 '+occs.length+' 条同词例句</summary>'+occs.map(x=>'<button type="button" data-jump-card="'+x.i+'">'+esc(x.c.text.slice(0,90))+(x.c.text.length>90?'…':'')+'</button>').join('')+'</details>';
 html+='<section class="dict-corpus"><h4>各医书全文用例</h4><div id="dictEvidence"><p class="dict-empty">正在使用主站同一搜索规则，检索公共古籍及本地 TXT…</p></div></section>';
 body.innerHTML=html;
 body.querySelectorAll('[data-jump-card]').forEach(b=>b.onclick=()=>window.recallJumpTo?.(Number(b.dataset.jumpCard)));
 showCorpusEvidence(term,requestId);
}

function activeEntries(card){
 const combined=new Map(),refs=card.sourceMap||[];
 const ids=[...new Set(refs.map(m=>m.id))];
 for(const id of ids){
  for(const entry of COMMENTS.cards?.[id]||[]){
   let e=combined.get(entry.sourceId);
   if(!e){e={...entry,pairs:[],context:null};combined.set(entry.sourceId,e);}
   for(const pair of entry.pairs||[]){
    const local=[];
    for(let j=0;j<refs.length;j++)if(refs[j].id===id&&(pair.segmentIndexes||[]).includes(refs[j].index))local.push(j);
    if(!local.length)continue;
    const full=local.length===(pair.segmentIndexes||[]).length;
    e.pairs.push({...pair,segmentIndexes:local,anchorText:full?pair.anchorText:local.map(j=>card.segments[j]).join(''),partial:!full});
   }
   if(entry.context&&!e.context)e.context=entry.context;
  }
 }
 // A checked lexical example: do not confuse the explanation of 绵绵 with that of 泻漆.
 const text=card.text||'';
 if(/綿綿|绵绵/.test(text)&&/瀉漆|泻漆/.test(text)){
  const src=(COMMENTS.sources||[]).find(x=>x.id==='cheng');
  if(src){
   const e=combined.get('cheng')||{sourceId:'cheng',name:src.name,book:src.book,url:src.url,pairs:[],context:null};
   e.pairs=e.pairs.filter(p=>!/綿綿|绵绵|瀉漆|泻漆/.test(p.anchorText||''));
   const segIndexes=card.segments.map((t,i)=>/綿綿|绵绵|瀉漆|泻漆/.test(t)?i:-1).filter(i=>i>=0);
   e.pairs.unshift(
    {precision:'verified-phrase',segmentIndexes:segIndexes,anchorText:'綿綿',explanation:'綿綿者，連綿而軟也。',verified:true,
     sourceUrl:'https://www.shidianguji.com/mid-page/7555622943361237001'},
    {precision:'verified-phrase',segmentIndexes:segIndexes,anchorText:'如瀉漆之絕者',explanation:'如瀉漆之絕者，前大而後細也。',verified:true,
     sourceUrl:'https://www.shidianguji.com/mid-page/7555622943361237001'}
   );
   combined.set('cheng',e);
  }
 }
 return combined;
}
function renderCommentaries(card){
 const rail=document.getElementById('commentatorButtons'),body=document.getElementById('commentaryBody');
 if(!rail||!body)return;
 window.recallClearCommentaryFocus?.();
 const by=activeEntries(card), sources=COMMENTS.sources||[];
 rail.innerHTML=sources.map(src=>{
  const e=by.get(src.id),pairs=e?.pairs||[],context=e?.context||null;
  const precise=pairs.filter(p=>String(p.explanation||'').trim().length>0);
  const status=precise.length?(precise.length+'处解析'):(context?'仅上下文':'本条无解读');
  const stateClass=precise.length?'has-commentary':(context?'has-context':'no-commentary');
  const pairHtml=pairs.map((p,pi)=>{
   const verified=!!p.verified,label=verified?'逐词校核':'原文位置锚定 · 注释范围待复核';
   const contextHtml=verified
    ?'<p class="commentary-note">此处分别解释“绵绵”和“泻漆之绝”，已据古注转录文本核对。<a href="'+p.sourceUrl+'" target="_blank" rel="noopener">查看校核文本 ↗</a></p>'
    :'<details class="pair-context"><summary>查看上下文</summary><div class="context-flow">'+
      (p.contextBefore?'<span>'+esc(p.contextBefore)+'</span>':'')+
      '<mark class="context-anchor">'+esc(p.anchorText||'')+'</mark>'+
      '<mark class="context-explanation">'+esc(p.explanation||'')+'</mark>'+
      (p.contextAfter?'<span>'+esc(p.contextAfter)+'</span>':'')+
      '</div></details>';
   return '<article class="commentary-pair source-'+esc(src.id)+'" data-pair="'+pi+'">'+
    '<button type="button" class="pair-anchor" data-segments="'+(p.segmentIndexes||[]).join(',')+'">'+
    '<span>对应原文</span><mark>'+esc(p.anchorText||'')+'</mark><small>'+label+' · 点击高亮左侧</small></button>'+
    '<div class="pair-explanation"><span>'+ (verified?'成无己原注（已核对）':'注本所附文字（需结合原书核对归属）')+
    '</span><p>'+esc(p.explanation||'')+'</p></div>'+contextHtml+'</article>';
  }).join('');
  const ctx=context?'<details class="context-only"><summary>仅原文出现的上下文</summary><p>'+esc(context.anchorText||'')+'</p><blockquote>'+esc(context.context||'')+'</blockquote></details>':'';
  const content=pairHtml+ctx||'<p class="commentary-empty">当前段暂无可定位的原文注释。</p>';
  return '<details class="scholar-book source-'+esc(src.id)+' '+stateClass+'"><summary><div class="scholar-summary"><b><i class="scholar-state-dot" aria-hidden="true"></i>'+esc(src.name)+'</b><small>'+esc(src.book)+'</small></div><span class="scholar-status">'+status+'</span></summary>'+
   '<div class="scholar-content"><a class="open-source" href="'+src.url+'" target="_blank" rel="noopener">打开原书 ↗</a>'+content+'</div></details>';
 }).join('');
 body.innerHTML='<p class="commentary-legend"><span class="legend-available">● 有解析</span><span class="legend-context">● 仅上下文</span><span class="legend-empty">● 无解读</span></p><p class="commentary-note precise-note">绿色标识有可展开的解析文字，但原文位置锚定不等于注释范围全部核准。已核实的逐词解释会单独标明。</p>';
 rail.querySelectorAll('.pair-anchor').forEach(btn=>btn.addEventListener('click',()=>{
  rail.querySelectorAll('.commentary-pair.active').forEach(x=>x.classList.remove('active'));
  btn.closest('.commentary-pair')?.classList.add('active');
  window.recallFocusSegments?.((btn.dataset.segments||'').split(',').filter(Boolean).map(Number));
 }));
}
function detectSelection(){
  const term=selectionText();
  if(term&&term!==lastTerm)renderDictionary(term);
}
document.addEventListener('mouseup',()=>setTimeout(detectSelection,0));
document.addEventListener('touchend',()=>setTimeout(detectSelection,120));
window.recallStudyCardChanged=card=>{currentCard=card;renderCommentaries(card);renderDictionary('');};
window.recallDictionaryLookup=renderDictionary;
})();