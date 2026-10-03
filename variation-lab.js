(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const catalogFormula=name=>typeof SHANGHAN_CATALOG!=='undefined'?SHANGHAN_CATALOG.formulas?.[name]:null;
  const medEntries=f=>(f?.ingredients||[]).map(([n,a])=>({name:String(n),dose:String(a||'')}));
  function likelyRemoved(baseName,removedText){return (removedText||[]).some(x=>String(x).includes(baseName)||baseName.includes(String(x).replace(/\s/g,'')));}
  function quality(v){return v.comparability==='A'?['A级自然实验','主要只改1个操作变量']:v.comparability==='B'?['B级自然实验','改动2–3项，仍很适合对照']:['C级对照','改动较多，应谨慎归因'];}
  function renderVariation(baseName,index){
    const f=catalogFormula(baseName),v=f?.variations?.[Number(index)],box=document.getElementById('formulaDiff');if(!f||!v||!box)return;
    const [label,why]=quality(v),baseMeds=medEntries(f),unchanged=baseMeds.filter(x=>!likelyRemoved(x.name,v.removed));
    const clause=(f.clauses?.[0]||'—').slice(0,900);
    box.innerHTML=`<div class="diff-head"><div><span class="eyebrow">《伤寒论》方内加减实验 · ${label}</span><h3>${esc(baseName)} ⇄ ${esc(v.trigger)}</h3><p class="compare-reason">${esc(why)} · 不是把“某药=某症状”硬对应，而是先看这一次原文自然实验。</p></div><button class="diff-close" type="button">×</button></div>
      <div class="diff-summary"><b>先问自己：</b><p>原方大体不动时，为什么出现“${esc(v.trigger)}”就要这样加减？先猜，再看下面原文。</p></div>
      <section class="variation-grid"><div><small>触发条件 / 证候变化</small><strong>${esc(v.trigger)}</strong></div><div><small>去</small>${v.removed?.length?v.removed.map(x=>`<span class="diff-chip">− ${esc(x)}</span>`).join(''):'<span class="diff-none">未识别到去药</span>'}</div><div><small>加</small>${v.added?.length?v.added.map(x=>`<span class="diff-chip">＋ ${esc(x)}</span>`).join(''):'<span class="diff-none">未识别到加药</span>'}</div></section>
      <section><h4>什么没有变？——先看共同骨架</h4><div>${unchanged.length?unchanged.map(x=>`<span class="diff-chip">${esc(x.name)} ${esc(x.dose)}</span>`).join(''):'<span class="diff-none">该方药味尚未可靠结构化，请看原方文。</span>'}</div></section>
      <section class="clause-diff"><div><b>变化前 · ${esc(baseName)}</b><blockquote>${esc(clause)}</blockquote></div><div><b>变化后 · 原文加减条件</b><blockquote>${esc(v.raw)}</blockquote></div></section>
      <details class="formula-raw"><summary>展开原方文、剂量与煎服法</summary><p>${esc((f.formulaText||'').slice(0,1800)).replace(/\n/g,'<br>')}</p></details>
      <div class="thinking-q"><b>高价值思考：</b>如果把“${esc(v.trigger)}”这个条件拿掉，你还会保留这次加减吗？如果不会，这个变量对你理解这味药在仲景体系中的作用意味着什么？</div>
      <div class="compare-actions"><button type="button" data-var-search>去《伤寒论》上下文核对</button></div>
      <div class="safety-mini">方内加减按当前《伤寒论》文本自动抽取。自动拆词可能有误，判断药物作用时必须回到完整原文，并用多个类似方证重复验证，不能由一条加减直接下因果结论。</div>`;
    box.querySelector('.diff-close').onclick=()=>document.getElementById('formulaLab')?.classList.remove('open');
    box.querySelector('[data-var-search]')?.addEventListener('click',()=>{document.getElementById('formulaLab')?.classList.remove('open');window.openLocalSearch?.(`${baseName} ${v.trigger}`);});
  }
  function injectVariationBand(){
    const picker=document.getElementById('comparePicker'),sel=document.getElementById('compareBase');if(!picker||!sel)return;
    const name=sel.value,f=catalogFormula(name),vars=f?.variations||[];let band=picker.querySelector('.variation-band');
    if(!vars.length){band?.remove();return;}
    if(band?.dataset.base===name)return;
    if(!band){band=document.createElement('div');band.className='variation-band';picker.appendChild(band);}
    band.dataset.base=name;
    band.innerHTML=`<div class="variation-band-head"><b>方内加减自然实验</b><span>${vars.length} 个 · A级最值得先学</span></div><div class="variation-buttons">${vars.map((v,i)=>{const [label]=quality(v);return `<button type="button" data-var-index="${i}"><strong>${esc(v.trigger)}</strong><small>${esc(label)} · ${esc(v.raw.slice(0,90))}</small></button>`;}).join('')}</div>`;
    band.querySelectorAll('[data-var-index]').forEach(b=>b.onclick=()=>renderVariation(name,b.dataset.varIndex));
  }
  const picker=document.getElementById('comparePicker');if(picker)new MutationObserver(()=>queueMicrotask(injectVariationBand)).observe(picker,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(e.target?.id==='compareBase')setTimeout(injectVariationBand,0);});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#openShanghanCatalog,.compare-btn'))setTimeout(injectVariationBand,20);});
})();
