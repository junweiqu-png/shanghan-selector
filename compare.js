const formulaMap = name => FORMULA_DATA[name];
const pairKey = (a,b) => FORMULA_PAIR_NOTES[`${a}|${b}`] ? `${a}|${b}` : `${b}|${a}`;
const medMap = f => Object.fromEntries((f.ingredients||[]).map(([n,a])=>[n,a]));
function diffRows(aName,bName){
  const a=formulaMap(aName),b=formulaMap(bName); if(!a||!b)return [];
  const A=medMap(a),B=medMap(b),names=[...new Set([...Object.keys(A),...Object.keys(B)])];
  return names.map(n=>({name:n,a:A[n]||'—',b:B[n]||'—',change:!A[n]?'加入':!B[n]?'去掉':A[n]===B[n]?'不变':'剂量/写法变化'}));
}
function renderFormulaDiff(aName,bName){
  const a=formulaMap(aName),b=formulaMap(bName),box=document.getElementById('formulaDiff'); if(!a||!b||!box)return;
  const note=FORMULA_PAIR_NOTES[pairKey(aName,bName)]||{focus:'先找共同骨架，再看新增、去除和剂量变化，然后回到原文核对证候变化。',question:'哪一个变化最值得你追问？'};
  const rows=diffRows(aName,bName);
  box.innerHTML=`<div class="diff-head"><div><span class="eyebrow">经方差分</span><h3>${aName} ⇄ ${bName}</h3></div><button class="diff-close" type="button">×</button></div>
  <div class="diff-summary"><b>先看变化，不急着看解释：</b><p>${note.focus}</p></div>
  <div class="diff-table-wrap"><table class="diff-table"><thead><tr><th>药</th><th>${aName}</th><th>${bName}</th><th>变化</th></tr></thead><tbody>${rows.map(r=>`<tr class="chg-${r.change==='不变'?'same':'diff'}"><td>${r.name}</td><td>${r.a}</td><td>${r.b}</td><td>${r.change}</td></tr>`).join('')}</tbody></table></div>
  <div class="clause-diff"><div><b>${aName} · 原文线索</b><blockquote>${a.clause||'—'}</blockquote></div><div><b>${bName} · 原文线索</b><blockquote>${b.clause||'—'}</blockquote></div></div>
  ${(a.variantNote||b.variantNote)?`<div class="variant-note"><b>版本提醒：</b>${[a.variantNote,b.variantNote].filter(Boolean).join(' ')}</div>`:''}
  <div class="thinking-q"><b>先自己想：</b>${note.question}</div>
  <div class="safety-mini">这里比较的是古方结构与经典条文，用于学习方证差异，不是剂量换算或自行处方建议。</div>`;
  document.getElementById('formulaLab').classList.add('open');
  box.querySelector('.diff-close').onclick=()=>document.getElementById('formulaLab').classList.remove('open');
}
function openCompareFor(name){
  const f=formulaMap(name); if(!f)return;
  const lab=document.getElementById('formulaLab'),picker=document.getElementById('comparePicker');
  const opts=(f.related||[]).filter(x=>FORMULA_DATA[x]);
  picker.innerHTML=`<div class="compare-picker"><b>${name}</b><span>最值得比较：</span>${opts.map(x=>`<button type="button" data-a="${name}" data-b="${x}">${x}</button>`).join('')}</div>`;
  lab.classList.add('open');
  picker.querySelectorAll('button').forEach(btn=>btn.onclick=()=>renderFormulaDiff(btn.dataset.a,btn.dataset.b));
  if(opts[0])renderFormulaDiff(name,opts[0]);
}
function attachCompareButtons(){
  document.querySelectorAll('#results .result').forEach(card=>{
    if(card.querySelector('.compare-btn'))return;
    const h=card.querySelector('.rhead h3'); if(!h)return;
    const name=(h.childNodes[0]?.textContent||'').replace(/^\d+\.\s*/,'').trim();
    if(!FORMULA_DATA[name])return;
    const b=document.createElement('button');b.className='compare-btn';b.type='button';b.textContent='比较相近方';b.onclick=()=>openCompareFor(name);
    const source=card.querySelector('.source'); if(source)source.insertAdjacentElement('beforebegin',b); else card.appendChild(b);
  });
}
const resultNode=document.getElementById('results');
if(resultNode)new MutationObserver(attachCompareButtons).observe(resultNode,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.id==='formulaLab')e.target.classList.remove('open');});
