(()=>{
const DATA=window.SHANGHAN_RECALL||SHANGHAN_RECALL;
const COMMENTS=window.SHANGHAN_COMMENTARIES||SHANGHAN_COMMENTARIES||{sources:[],cards:{}};
let currentCard=null,lastTerm='';

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const LEXICON={
  '灑淅':{title:'灑淅（洒淅）',reading:'常见现代读音：sǎ xī；部分历史辞典另收 xiǎn xī',brief:'寒冷、寒栗或寒颤的样子。在伤寒、金匮语境里，多用来形容体表发冷、寒栗的感觉。',note:'这是古汉语形容词，不宜按现代“洒”“淅”的字面义拆开理解。',links:[['汉典·洒淅','https://www.zdic.net/hans/%E6%B4%92%E6%B7%85'],['教育部重编国语辞典','https://dict.revised.moe.edu.tw/dictView.jsp?ID=108163']]},
  '洒淅':{alias:'灑淅'},
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
function renderDictionary(term){
  lastTerm=term;
  const title=document.getElementById('dictTerm'),body=document.getElementById('dictBody');
  if(!title||!body)return;
  if(!term){title.textContent='拖动选中上方的字或词';body.innerHTML='<p class="dict-empty">例如选中“灑淅”“心下”“厥”，这里会立即显示词义和《伤寒论》同词语境。</p>';return;}
  title.textContent='“'+term+'”';
  const d=lexData(term),occs=occurrences(term);
  let html='';
  if(d){
    html+='<div class="dict-definition"><h4>'+esc(d.title||term)+'</h4>';
    if(d.reading)html+='<p class="dict-reading">'+esc(d.reading)+'</p>';
    html+='<p>'+esc(d.brief||'')+'</p>';
    if(d.note)html+='<p class="dict-note">'+esc(d.note)+'</p>';
    const refs=d.refs||[];
    if(refs.length)html+='<div class="dict-refs">'+refs.slice(0,3).map(r=>'<div><b>'+esc(r.book||'古籍')+'</b>：'+esc(r.quote||'')+(r.note?' <span>'+esc(r.note)+'</span>':'')+'</div>').join('')+'</div>';
    if(d.links?.length)html+='<div class="dict-links">'+d.links.map(([n,u])=>'<a href="'+u+'" target="_blank" rel="noopener">'+esc(n)+' ↗</a>').join('')+'</div>';
    html+='</div>';
  }else{
    html+='<div class="dict-definition"><h4>'+esc(term)+'</h4><p>本站字典还没有这一个固定词条。先给你当前条文和《伤寒论》里的同词出现位置，避免机器凭空解释。</p></div>';
  }
  html+='<div class="dict-context"><b>本条语境</b><p>'+esc(currentCard?.text||'')+'</p></div>';
  if(occs.length)html+='<div class="dict-occ"><b>《伤寒论》同词例句</b>'+occs.map(x=>'<button type="button" data-jump-card="'+x.i+'">'+esc(x.c.text.slice(0,90))+(x.c.text.length>90?'…':'')+'</button>').join('')+'</div>';
  html+='<a class="dict-search" href="https://zh.wikisource.org/w/index.php?search='+encodeURIComponent(term)+'" target="_blank" rel="noopener">继续在维基文库查“'+esc(term)+'” ↗</a>';
  body.innerHTML=html;
  body.querySelectorAll('[data-jump-card]').forEach(b=>b.onclick=()=>window.recallJumpTo?.(Number(b.dataset.jumpCard)));
}
function renderCommentaries(card){
  const rail=document.getElementById('commentatorButtons'),body=document.getElementById('commentaryBody');
  if(!rail||!body)return;
  window.recallClearCommentaryFocus?.();
  const entries=COMMENTS.cards?.[card.id]||[],by=new Map(entries.map(e=>[e.sourceId,e]));
  const sources=COMMENTS.sources||[];
  rail.innerHTML=sources.map((src,si)=>{
    const e=by.get(src.id),pairs=e?.pairs||[],context=e?.context||null;
    const status=pairs.length?(pairs.length+'处精确解析'):(context?'仅上下文':'本条未定位');
    const pairHtml=pairs.map((p,pi)=>`
      <article class="commentary-pair source-${esc(src.id)}" data-source="${esc(src.id)}" data-pair="${pi}">
        <button type="button" class="pair-anchor" data-segments="${(p.segmentIndexes||[]).join(',')}">
          <span>对应原文</span><mark>${esc(p.anchorText||'')}</mark>
          <small>${p.precision==='clause'?'整条锚定':'句段锚定'} · 点击同步高亮左侧</small>
        </button>
        <div class="pair-explanation"><span>名家解析</span><p>${esc(p.explanation||'')}</p></div>
        <details class="pair-context"><summary>查看解析前后上下文</summary>
          <div class="context-flow">${p.contextBefore?'<span>'+esc(p.contextBefore)+'</span>':''}<mark class="context-anchor">${esc(p.anchorText||'')}</mark><mark class="context-explanation">${esc(p.explanation||'')}</mark>${p.contextAfter?'<span>'+esc(p.contextAfter)+'</span>':''}</div>
        </details>
      </article>`).join('');
    const contextHtml=context?`
      <details class="context-only">
        <summary>仅定位到相同原句：查看上下文</summary>
        <div class="context-only-anchor">定位原文：<mark>${esc(context.anchorText||'')}</mark></div>
        <blockquote>${esc(context.context||'')}</blockquote>
        <p>这里只能确认原句在该书中出现，不能可靠断定哪一段是在直接解释它，所以不标成“解析”。</p>
      </details>`:'';
    const content=(pairHtml||contextHtml)?(pairHtml+contextHtml):'<p class="commentary-empty">当前条文在这本书里没有找到足够可靠的句段锚点。</p>';
    return `<details class="scholar-book source-${esc(src.id)}">
      <summary><div class="scholar-summary"><b>${esc(src.name)}</b><small>${esc(src.book)}</small></div><span>${status}</span></summary>
      <div class="scholar-content"><a class="open-source" href="${src.url}" target="_blank" rel="noopener">打开原书 ↗</a>${content}</div>
    </details>`;
  }).join('');
  body.innerHTML='<p class="commentary-note precise-note">彩色“名家解析”只用于句段级精确锚定；灰色上下文仅供前后阅读，不当作直接解释。</p>';

  rail.querySelectorAll('.pair-anchor').forEach(btn=>btn.addEventListener('click',()=>{
    rail.querySelectorAll('.commentary-pair.active').forEach(x=>x.classList.remove('active'));
    const art=btn.closest('.commentary-pair');art?.classList.add('active');
    const indexes=(btn.dataset.segments||'').split(',').filter(Boolean).map(Number);
    window.recallFocusSegments?.(indexes);
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