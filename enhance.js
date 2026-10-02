const CORPUS_FORMULA_ALIASES={
  '理中丸/汤':['理中丸','理中汤'],
  '麻黄附子细辛汤':['麻黄附子细辛汤','麻黄细辛附子汤']
};
function corpusEsc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function evidenceTerms(name){
  const f=typeof F!=='undefined'?F.find(x=>x.name===name):null;
  if(!f||typeof evaluate!=='function')return [];
  const x=evaluate(f),out=[];
  [...x.hitCore,...x.hitPlus].forEach(t=>{if(!out.includes(t))out.push(t);});
  [...x.hitPulseCore,...x.hitPulsePlus].forEach(t=>{const p='脉'+t;if(!out.includes(p))out.push(p);});
  return out.slice(0,5);
}
function corpusPanel(name){
  const terms=evidenceTerms(name);
  const sec=document.createElement('section');
  sec.className='corpus-evidence';
  sec.dataset.formula=name;
  sec.dataset.terms=terms.join('|');
  sec.innerHTML=`<div class="corpus-evidence-head"><div><b>古籍全文扩展查证</b><span>全文索引旁证 · 不参与方证排名</span></div></div>
    <p class="corpus-evidence-context">${terms.length?`当前这张卡实际命中：${terms.map(corpusEsc).join(' · ')}`:'当前没有额外命中线索，可先按方名查原文。'}</p>
    <div class="corpus-evidence-actions"><button type="button" data-corpus-action="current">查方名 + 当前脉证</button><button type="button" data-corpus-action="formula">只查方名</button><button type="button" class="ghost" data-corpus-action="full">转到全文搜索</button></div>
    <div class="corpus-evidence-results" aria-live="polite"></div>`;
  return sec;
}
function attachClassicEvidence(){
  document.querySelectorAll('.result').forEach(card=>{
    const h=card.querySelector('.rhead h3');
    if(!h)return;
    const first=h.childNodes[0];
    const raw=(first?.textContent||h.textContent||'').trim();
    const name=raw.replace(/^\d+\.\s*/,'').trim();
    if(!card.querySelector('.classics')){
      const html=renderClassicSources(name);
      if(html){const anchor=card.querySelector('.source');if(anchor)anchor.insertAdjacentHTML('afterend',html);else card.insertAdjacentHTML('beforeend',html);}
    }
    if(!card.querySelector('.corpus-evidence')){
      const panel=corpusPanel(name),anchor=card.querySelector('.classics')||card.querySelector('.source');
      if(anchor)anchor.insertAdjacentElement('afterend',panel);else card.appendChild(panel);
    }
    linkifyClassicTerms(card);
  });
}
function formulaAliases(name){return CORPUS_FORMULA_ALIASES[name]||[name];}
async function searchCorpusEvidence(panel,mode){
  const output=panel.querySelector('.corpus-evidence-results'),name=panel.dataset.formula,terms=(panel.dataset.terms||'').split('|').filter(Boolean),aliases=formulaAliases(name);
  if(typeof window.corpusSearch!=='function'){
    output.innerHTML='<div class="corpus-evidence-empty">全文索引尚未就绪，可点“转到全文搜索”继续查。</div>';return;
  }
  output.innerHTML='<div class="corpus-evidence-empty">正在从古籍全文索引中查原文…</div>';
  const specs=[];
  for(const alias of aliases){
    if(mode==='current'&&terms.length){
      if(terms.length>1)specs.push({q:`${alias} ${terms[0]} ${terms[1]}`,weight:6,label:`${terms[0]} + ${terms[1]}`});
      terms.slice(0,4).forEach((t,i)=>specs.push({q:`${alias} ${t}`,weight:4-i*.35,label:t}));
    }
    specs.push({q:alias,weight:1,label:'方名'});
  }
  const unique=[...new Map(specs.map(x=>[x.q,x])).values()];
  const merged=new Map();
  try{
    for(const spec of unique){
      const rows=await window.corpusSearch(spec.q);
      rows.slice(0,35).forEach((row,idx)=>{
        const old=merged.get(row.bookId);
        const score=(old?.score||0)+spec.weight+Math.max(0,1-idx/100);
        if(!old||spec.weight>(old.bestWeight||0))merged.set(row.bookId,{...row,score,bestWeight:spec.weight,query:spec.q,matchLabel:spec.label});
        else old.score=score;
      });
    }
    const rows=[...merged.values()].sort((a,b)=>b.score-a.score).slice(0,7);
    if(!rows.length){output.innerHTML=`<div class="corpus-evidence-empty">没有找到同时满足这些检索词的原文。<button type="button" data-corpus-action="formula">退回只查“${corpusEsc(name)}”</button></div>`;return;}
    output.innerHTML=`<div class="corpus-evidence-summary">命中 ${merged.size} 部/篇，先显示关联度较高的 ${rows.length} 条。</div>`+rows.map(row=>`<article class="corpus-evidence-hit"><div><b>${corpusEsc(row.title)}</b><span>${corpusEsc(row.category||'古籍')} · 命中：${corpusEsc(row.matchLabel||'方名')}</span></div><p>${row.excerpt||''}</p><button type="button" data-corpus-open="${corpusEsc(row.bookId)}" data-corpus-q="${corpusEsc(row.query||name)}">打开原文位置</button></article>`).join('');
  }catch(e){console.warn('Corpus evidence search failed',e);output.innerHTML='<div class="corpus-evidence-empty">全文索引暂时不可用，可转到“搜索”页继续查询。</div>';}
}
const originalCalc=document.getElementById('calc').onclick;
document.getElementById('calc').onclick=()=>{originalCalc();attachClassicEvidence();};
renderGeneralClassics();
linkifyClassicTerms(document.getElementById('generalClassics'));
renderBookShelf();
document.addEventListener('click',e=>{
  const term=e.target.closest&&e.target.closest('.term-link');
  if(term&&!term.dataset.bound){e.preventDefault();openTerm(term.dataset.term);return;}
  const action=e.target.closest&&e.target.closest('[data-corpus-action]');
  if(action){
    e.preventDefault();const panel=action.closest('.corpus-evidence');if(!panel)return;
    const mode=action.dataset.corpusAction,name=panel.dataset.formula,terms=(panel.dataset.terms||'').split('|').filter(Boolean);
    if(mode==='full'){const q=[name,...terms.slice(0,3)].join(' ');if(typeof window.openLocalSearch==='function')window.openLocalSearch(q);return;}
    searchCorpusEvidence(panel,mode);return;
  }
  const open=e.target.closest&&e.target.closest('[data-corpus-open]');
  if(open){e.preventDefault();if(typeof window.openCorpusBook==='function')window.openCorpusBook(open.dataset.corpusOpen,0,open.dataset.corpusQ||'');}
});
