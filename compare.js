const manualFormula=name=>typeof FORMULA_DATA!=='undefined'?FORMULA_DATA[name]:null;
const generatedFormula=name=>typeof SHANGHAN_CATALOG!=='undefined'?SHANGHAN_CATALOG.formulas?.[name]:null;
function formulaMap(name){
  const g=generatedFormula(name),m=manualFormula(name);if(!g&&!m)return null;
  const clauses=[...(g?.clauses||[]),...(m?.clause?[m.clause]:[])];
  return {...(g||{}),...(m||{}),name,source:'《伤寒论》',clauses:[...new Set(clauses)].slice(0,8),ingredients:(m?.ingredients?.length?m.ingredients:g?.ingredients)||[]};
}
const allFormulaNames=()=>[...new Set([...(typeof SHANGHAN_CATALOG!=='undefined'?Object.keys(SHANGHAN_CATALOG.formulas||{}):[]),...(typeof FORMULA_DATA!=='undefined'?Object.keys(FORMULA_DATA):[])])];
const pairKey=(a,b)=>typeof FORMULA_PAIR_NOTES!=='undefined'&&(FORMULA_PAIR_NOTES[`${a}|${b}`]?`${a}|${b}`:FORMULA_PAIR_NOTES[`${b}|${a}`]?`${b}|${a}`:'');
function expertBenchmarkForPair(a,b){
  if(typeof EXPERT_BENCHMARKS==='undefined')return null;
  const direct=EXPERT_BENCHMARKS[`${a}|${b}`];if(direct)return {...direct,key:`${a}|${b}`,reversed:false};
  const reverse=EXPERT_BENCHMARKS[`${b}|${a}`];if(reverse)return {...reverse,key:`${b}|${a}`,reversed:true};
  return null;
}
const medMap=f=>Object.fromEntries((f?.ingredients||[]).map(([n,a])=>[String(n).trim(),String(a||'').trim()]));
function escCmp(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function diffRows(aName,bName){
  const a=formulaMap(aName),b=formulaMap(bName);if(!a||!b)return [];
  const A=medMap(a),B=medMap(b),names=[...new Set([...Object.keys(A),...Object.keys(B)])];
  return names.map(n=>({name:n,a:A[n]||'—',b:B[n]||'—',change:!A[n]?'加入':!B[n]?'去掉':A[n]===B[n]?'不变':'剂量/写法变化'}));
}
const clauseText=f=>(f?.clauses?.length?f.clauses.join(' '):f?.clause||'');
const DIMENSIONS={
  '症状':['恶寒','恶风','发热','汗出','无汗','烦躁','心烦','口渴','渴','咳','喘','呕','干呕','下利','便秘','不大便','腹痛','腹满','胸满','胸胁苦满','心下痞','心下急','项背强','身痛','头痛','手足厥逆','四肢沉重','小便不利','小便难','咽痛','面赤','潮热','手足汗出'],
  '脉象':['脉浮','脉沉','脉微','脉细','脉数','脉迟','脉紧','脉缓','脉弦','脉滑','脉促','脉弱','脉洪','脉大','脉微欲绝','结代'],
  '病程/误治':['发汗后','发汗','汗后','下之后','下后','下之','吐后','误下','火攻','烧针','表未解','已解','不解','过经','少阴病','太阳病','阳明病','少阳病','太阴病','厥阴病'],
};
function signals(text,list){return list.filter(x=>String(text||'').includes(x));}
function negatives(text){const m=String(text||'').match(/(?:不|无|無|反)[^，。；：、\s]{1,10}/g)||[];return [...new Set(m)].slice(0,14);}
function dimensionDiff(a,b){
  const ta=clauseText(a),tb=clauseText(b),out={};
  for(const [k,list] of Object.entries(DIMENSIONS)){
    const A=signals(ta,list),B=signals(tb,list),common=A.filter(x=>B.includes(x));
    out[k]={common,a:A.filter(x=>!B.includes(x)),b:B.filter(x=>!A.includes(x))};
  }
  const A=negatives(ta),B=negatives(tb);out['阴性/反证']={common:A.filter(x=>B.includes(x)),a:A.filter(x=>!B.includes(x)),b:B.filter(x=>!A.includes(x))};
  return out;
}
function ingredientMetrics(a,b){
  const A=medMap(a),B=medMap(b),names=[...new Set([...Object.keys(A),...Object.keys(B)])];
  const shared=names.filter(n=>A[n]&&B[n]),added=names.filter(n=>!A[n]&&B[n]),removed=names.filter(n=>A[n]&&!B[n]),dose=shared.filter(n=>A[n]!==B[n]);
  return {shared,added,removed,dose,changeCount:added.length+removed.length+dose.length};
}
function structureLabel(m){
  if(m.changeCount===1)return 'A级结构实验';
  if(m.added.length+m.removed.length===0&&m.dose.length>0&&m.dose.length<=2)return 'A级剂量实验';
  if(m.changeCount<=3&&m.shared.length>=3)return 'B级结构对照';
  return 'C级结构对照';
}
function relationQuality(aName,bName){
  const a=formulaMap(aName),b=formulaMap(bName);if(!a||!b)return {score:-999,label:'',reason:''};
  const m=ingredientMetrics(a,b),benchmark=expertBenchmarkForPair(aName,bName);let score=0,reason=[];
  if(benchmark){score+=125;reason.push('名家经典鉴别题');}
  if(a.parent===bName||b.parent===aName){score+=80;reason.push('原方→加减方');}
  if(a.parent&&b.parent&&a.parent===b.parent){score+=55;reason.push('同一母方');}
  if(pairKey(aName,bName)){score+=55;reason.push('人工高价值鉴别');}
  score+=Math.min(40,m.shared.length*6)-m.changeCount*5;
  if(m.changeCount===1){score+=70;reason.push('只变1个结构变量');}
  else if(m.added.length+m.removed.length===0&&m.dose.length>0&&m.dose.length<=2){score+=55;reason.push('主要是剂量变化');}
  const dims=dimensionDiff(a,b),changed=Object.values(dims).reduce((n,d)=>n+d.a.length+d.b.length,0);score+=Math.min(25,changed*2);
  const clinicalLabel=benchmark?'名家高价值':score>=115?'高价值':score>=70?'中价值':'一般';
  return {score,label:clinicalLabel,clinicalLabel,structuralLabel:structureLabel(m),reason:reason.join(' · ')||'证候/方药有可比较性',metrics:m,benchmark};
}
function recommendedComparisons(name){
  const f=formulaMap(name);if(!f)return [];
  const manual=(f.related||[]).filter(x=>formulaMap(x));
  const candidates=[...new Set([...manual,...allFormulaNames().filter(x=>x!==name)])];
  return candidates.map(x=>({name:x,...relationQuality(name,x)})).filter(x=>x.score>15).sort((a,b)=>b.score-a.score).slice(0,10);
}
function chipList(items,empty='—'){return items?.length?items.map(x=>`<span class="diff-chip">${escCmp(x)}</span>`).join(''):`<span class="diff-none">${empty}</span>`;}
function renderDimension(name,d,aName,bName){return `<div class="dimension-row"><b>${name}</b><div><small>共同</small>${chipList(d.common)}</div><div><small>${escCmp(aName)} 特有</small>${chipList(d.a)}</div><div><small>${escCmp(bName)} 特有</small>${chipList(d.b)}</div></div>`;}
function formulaTextBlock(f){return escCmp((f?.formulaText||'').slice(0,1400)).replace(/\n/g,'<br>')||'暂无自动抽取的方文；可回到《伤寒论》原文核对。';}
function bestClause(f){return escCmp(f?.clauses?.[0]||f?.clause||'—');}
function benchmarkSides(benchmark,aName,bName){
  if(!benchmark)return null;
  const aMain=benchmark.reversed?benchmark.bMain:benchmark.aMain;
  const bMain=benchmark.reversed?benchmark.aMain:benchmark.bMain;
  return {aMain,bMain};
}
function renderExpertBenchmark(benchmark,aName,bName){
  if(!benchmark)return '';
  const sides=benchmarkSides(benchmark,aName,bName);
  return `<section class="expert-benchmark"><div class="expert-benchmark-head"><div><span class="eyebrow">名家法压力测试</span><h4>${escCmp(benchmark.expert)} · ${escCmp(benchmark.method)}</h4></div><a href="${escCmp(benchmark.sourceUrl)}" target="_blank" rel="noopener noreferrer">来源</a></div>
  <div class="expert-main-grid"><div><small>${escCmp(aName)} · 先抓主证</small>${chipList(sides.aMain)}</div><div><small>${escCmp(bName)} · 先抓主证</small>${chipList(sides.bMain)}</div></div>
  <div class="expert-decisive"><b>真正分界：</b>${chipList(benchmark.decisive)}</div>
  <div class="expert-one-question"><b>最值钱的一问：</b>${escCmp(benchmark.nextQuestion)}</div>
  <details><summary>再做反事实：如果关键证翻转会怎样？</summary><p><b>翻转实验：</b>${escCmp(benchmark.counterfactual)}</p><p><b>常见误判：</b>${escCmp(benchmark.trap)}</p></details>
  <p class="expert-source-note">${escCmp(benchmark.sourceLabel)}</p></section>`;
}
function renderFormulaDiff(aName,bName){
  const a=formulaMap(aName),b=formulaMap(bName),box=document.getElementById('formulaDiff');if(!a||!b||!box)return;
  const manualNote=pairKey(aName,bName)?FORMULA_PAIR_NOTES[pairKey(aName,bName)]:null;
  const quality=relationQuality(aName,bName),rows=diffRows(aName,bName),dims=dimensionDiff(a,b),m=quality.metrics||ingredientMetrics(a,b),benchmark=quality.benchmark;
  const focus=manualNote?.focus||`先找不变量，再看变量：共同药 ${m.shared.length} 味；加入 ${m.added.length} 味；去掉 ${m.removed.length} 味；剂量/写法变化 ${m.dose.length} 味。`;
  const question=benchmark?.nextQuestion||manualNote?.question||(m.changeCount===1?'这里只有一个主要结构变量。原文中随之新增、消失或加重的证是什么？':m.dose.length?'如果药味大体不变而剂量改变，病势的“性质”和“程度”分别发生了什么？':'哪一个原文差异最能真正把这两个方分开？');
  box.innerHTML=`<div class="diff-head"><div><span class="eyebrow">《伤寒论》经方鉴别 · ${escCmp(quality.clinicalLabel)}</span><h3>${escCmp(aName)} ⇄ ${escCmp(bName)}</h3><p class="compare-reason">辨证价值：${escCmp(quality.clinicalLabel)} · 结构可比：${escCmp(quality.structuralLabel)} · ${escCmp(quality.reason)}</p></div><button class="diff-close" type="button">×</button></div>
  ${renderExpertBenchmark(benchmark,aName,bName)}
  <div class="diff-summary"><b>${benchmark?'第二步：再看结构变量':'第一步：先自己找变量'}</b><p>${escCmp(focus)}</p></div>
  <section class="compare-dimensions"><h4>${benchmark?'第三步：用原文机器抽取做复核':'证候与背景差分'}</h4>${Object.entries(dims).map(([k,d])=>renderDimension(k,d,aName,bName)).join('')}</section>
  <section><h4>药味与剂量差分</h4><div class="diff-table-wrap"><table class="diff-table"><thead><tr><th>药</th><th>${escCmp(aName)}</th><th>${escCmp(bName)}</th><th>变化</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr class="chg-${r.change==='不变'?'same':'diff'}"><td>${escCmp(r.name)}</td><td>${escCmp(r.a)}</td><td>${escCmp(r.b)}</td><td>${escCmp(r.change)}</td></tr>`).join(''):`<tr><td colspan="4">该方尚未可靠拆出结构化药味，请看下方原方文。</td></tr>`}</tbody></table></div></section>
  <section class="clause-diff"><div><b>${escCmp(aName)} · 直接原文</b><blockquote>${bestClause(a)}</blockquote></div><div><b>${escCmp(bName)} · 直接原文</b><blockquote>${bestClause(b)}</blockquote></div></section>
  <details class="formula-raw"><summary>看原方文、剂量与煎服法</summary><div class="clause-diff"><div><b>${escCmp(aName)}</b><p>${formulaTextBlock(a)}</p></div><div><b>${escCmp(bName)}</b><p>${formulaTextBlock(b)}</p></div></div></details>
  ${(a.inlineMods?.length||b.inlineMods?.length)?`<section class="inline-mods"><h4>条文内继续加减</h4><div class="clause-diff"><div>${(a.inlineMods||[]).map(x=>`<p>${escCmp(x)}</p>`).join('')||'—'}</div><div>${(b.inlineMods||[]).map(x=>`<p>${escCmp(x)}</p>`).join('')||'—'}</div></div></section>`:''}
  ${(a.variantNote||b.variantNote)?`<div class="variant-note"><b>版本提醒：</b>${escCmp([a.variantNote,b.variantNote].filter(Boolean).join(' '))}</div>`:''}
  <div class="thinking-q"><b>先自己回答，再看解释：</b>${escCmp(question)}</div>
  <div class="compare-actions"><button type="button" data-search-pair="${escCmp(aName+' '+bName)}">去古籍库搜这两个方</button></div>
  <div class="safety-mini">这里比较《伤寒论》原方、原条与加减变化，用于经典学习。名家观点单独标注，不与原文混层；剂量仅按古籍原文展示，不做现代剂量换算或自行处方建议。</div>`;
  document.getElementById('formulaLab').classList.add('open');
  box.querySelector('.diff-close').onclick=()=>document.getElementById('formulaLab').classList.remove('open');
  box.querySelector('[data-search-pair]')?.addEventListener('click',()=>{document.getElementById('formulaLab').classList.remove('open');window.openLocalSearch?.(box.querySelector('[data-search-pair]').dataset.searchPair);});
}
function benchmarkStats(){
  if(typeof EXPERT_BENCHMARKS==='undefined')return {total:0,runnable:0};
  const entries=Object.keys(EXPERT_BENCHMARKS),runnable=entries.filter(k=>{const [a,b]=k.split('|');return formulaMap(a)&&formulaMap(b);}).length;
  return {total:entries.length,runnable};
}
function renderPicker(name){
  const picker=document.getElementById('comparePicker'),recs=recommendedComparisons(name),stats=benchmarkStats();
  picker.innerHTML=`<div class="compare-picker-top"><label>当前方 <select id="compareBase">${allFormulaNames().sort((a,b)=>a.localeCompare(b,'zh-CN')).map(x=>`<option ${x===name?'selected':''}>${escCmp(x)}</option>`).join('')}</select></label><span>《伤寒论》原文方目录 ${typeof SHANGHAN_CATALOG!=='undefined'?SHANGHAN_CATALOG.count||0:0} 个方名 · 名家例题 ${stats.runnable}/${stats.total} 可运行</span></div><div class="compare-picker"><b>${escCmp(name)}</b><span>最值得鉴别：</span>${recs.map(x=>`<button type="button" data-a="${escCmp(name)}" data-b="${escCmp(x.name)}"><strong>${escCmp(x.name)}</strong><small>${escCmp(x.clinicalLabel)} · ${escCmp(x.structuralLabel)}${x.reason?` · ${escCmp(x.reason)}`:''}</small></button>`).join('')||'<span>暂无结构化推荐，可从上方切换其他方。</span>'}</div>`;
  picker.querySelector('#compareBase')?.addEventListener('change',e=>openCompareFor(e.target.value));
  picker.querySelectorAll('[data-a]').forEach(btn=>btn.onclick=()=>renderFormulaDiff(btn.dataset.a,btn.dataset.b));
  return recs;
}
function openCompareFor(name){
  if(!formulaMap(name))return;
  document.getElementById('formulaLab').classList.add('open');
  const recs=renderPicker(name);if(recs[0])renderFormulaDiff(name,recs[0].name);else document.getElementById('formulaDiff').innerHTML='<div class="empty">这个方已进入《伤寒论》目录，但还没有足够结构信息生成可靠差分。</div>';
}
function attachCompareButtons(){
  document.querySelectorAll('#results .result').forEach(card=>{
    if(card.querySelector('.compare-btn'))return;
    const h=card.querySelector('.rhead h3');if(!h)return;
    const name=(h.childNodes[0]?.textContent||'').replace(/^\d+\.\s*/,'').trim();if(!formulaMap(name))return;
    const b=document.createElement('button');b.className='compare-btn';b.type='button';b.textContent='和谁最容易混？';b.onclick=()=>openCompareFor(name);
    const source=card.querySelector('.source');if(source)source.insertAdjacentElement('beforebegin',b);else card.appendChild(b);
  });
}
function addCatalogEntry(){
  const results=document.getElementById('results');if(!results||document.getElementById('openShanghanCatalog'))return;
  const sec=results.closest('.panel');const hint=sec?.querySelector('.hint');if(!hint)return;
  const b=document.createElement('button');b.id='openShanghanCatalog';b.className='compare-btn';b.type='button';b.textContent='打开《伤寒论》方证鉴别库';b.onclick=()=>{const names=allFormulaNames();openCompareFor(names.includes('桂枝汤')?'桂枝汤':names[0]);};hint.insertAdjacentElement('afterend',b);
}
const resultNode=document.getElementById('results');if(resultNode)new MutationObserver(attachCompareButtons).observe(resultNode,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.id==='formulaLab')e.target.classList.remove('open');});
addCatalogEntry();attachCompareButtons();
