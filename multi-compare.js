(()=>{
  const MAX=6,KEY='shanghan-multi-compare-v1';
  const state={selected:[],base:'',onlyDiff:true};
  const names=()=>allFormulaNames().filter(n=>formulaMap(n)).sort((a,b)=>a.localeCompare(b,'zh-CN'));
  const safe=s=>escCmp(String(s??''));
  function restore(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');state.selected=(x.selected||[]).filter(n=>formulaMap(n)).slice(0,MAX);state.base=state.selected.includes(x.base)?x.base:(state.selected[0]||'');state.onlyDiff=x.onlyDiff!==false;}catch{}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
  function ordered(){return state.base?[state.base,...state.selected.filter(x=>x!==state.base)]:[...state.selected];}
  function add(name){if(!formulaMap(name)||state.selected.includes(name))return;if(state.selected.length>=MAX){renderTray(`最多同时比较 ${MAX} 个方，避免手机表格失去可读性。`);return;}state.selected.push(name);if(!state.base)state.base=name;save();renderTray();}
  function remove(name){state.selected=state.selected.filter(x=>x!==name);if(state.base===name)state.base=state.selected[0]||'';save();renderTray();if(document.getElementById('multiCompareView'))renderMulti();}
  function setBase(name){if(!state.selected.includes(name))return;state.base=name;save();renderTray();renderMulti();}
  function ensureTray(){let tray=document.getElementById('formulaCompareTray');if(tray)return tray;tray=document.createElement('div');tray.id='formulaCompareTray';tray.className='formula-compare-tray';document.body.appendChild(tray);return tray;}
  function addOptions(){return names().filter(n=>!state.selected.includes(n)).map(n=>`<option value="${safe(n)}">${safe(n)}</option>`).join('');}
  function renderTray(note=''){
    const tray=ensureTray();if(!state.selected.length){tray.classList.remove('show');tray.innerHTML='';return;}
    tray.classList.add('show');
    tray.innerHTML=`<div class="compare-tray-inner"><div class="compare-tray-head"><b>方剂对比栏</b><span>${state.selected.length}/${MAX}${note?` · ${safe(note)}`:''}</span></div><div class="compare-tray-list">${ordered().map(n=>`<div class="compare-tray-chip ${n===state.base?'base':''}"><button type="button" data-set-base="${safe(n)}" title="设为基础方">${n===state.base?'<em>基础</em>':''}${safe(n)}</button><button type="button" class="chip-x" data-remove="${safe(n)}">×</button></div>`).join('')}</div><div class="compare-tray-actions"><select data-add-select>${addOptions()||'<option>已到上限或无可选方</option>'}</select><button type="button" data-add-btn ${state.selected.length>=MAX?'disabled':''}>＋ 添加</button><button type="button" class="primary" data-open-multi ${state.selected.length<2?'disabled':''}>开始参数对比</button><button type="button" data-clear>清空</button></div></div>`;
    tray.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>remove(b.dataset.remove));
    tray.querySelectorAll('[data-set-base]').forEach(b=>b.onclick=()=>setBase(b.dataset.setBase));
    tray.querySelector('[data-add-btn]')?.addEventListener('click',()=>{const s=tray.querySelector('[data-add-select]');if(s?.value)add(s.value);});
    tray.querySelector('[data-open-multi]')?.addEventListener('click',renderMulti);
    tray.querySelector('[data-clear]')?.addEventListener('click',()=>{state.selected=[];state.base='';save();renderTray();});
  }
  const textSignals=(f,key)=>key==='阴性/反证'?negatives(clauseText(f)):signals(clauseText(f),DIMENSIONS[key]||[]);
  function valueRows(fs){
    const row=(label,values,type='text')=>({label,values,type});
    return [
      row('方类 / 母方',fs.map(f=>f.family||f.parent||'—')),
      row('直接原文',fs.map(f=>f.clauses?.[0]||f.clause||'—'),'long'),
      row('症状 / 证候',fs.map(f=>textSignals(f,'症状')),'chips'),
      row('脉象',fs.map(f=>textSignals(f,'脉象')),'chips'),
      row('病程 / 误治',fs.map(f=>textSignals(f,'病程/误治')),'chips'),
      row('阴性 / 反证',fs.map(f=>textSignals(f,'阴性/反证')),'chips'),
      row('方内加减事件',fs.map(f=>String((f.variations?.length||0)+(f.inlineMods?.length||0)))) ,
      row('药味数',fs.map(f=>String((f.ingredients||[]).length)))
    ];
  }
  const norm=v=>Array.isArray(v)?v.join('|'):String(v??'');
  const allSame=vals=>vals.every(v=>norm(v)===norm(vals[0]));
  function renderCell(v,type,base){const diff=norm(v)!==norm(base);const cls=diff?'param-diff':'param-same';if(type==='chips')return `<td class="${cls}">${Array.isArray(v)&&v.length?v.map(x=>`<span class="diff-chip">${safe(x)}</span>`).join(''):'—'}</td>`;if(type==='long')return `<td class="${cls} multi-long">${safe(v)}</td>`;return `<td class="${cls}">${safe(v||'—')}</td>`;}
  function ingredientRows(fs){
    const maps=fs.map(medMap),herbs=[...new Set(maps.flatMap(m=>Object.keys(m)))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
    const base=maps[0];
    return herbs.map(h=>{const vals=maps.map(m=>m[h]||'—');if(state.onlyDiff&&allSame(vals))return '';return `<tr><th>${safe(h)}</th>${vals.map((v,i)=>{let cls='param-same';if(i>0){if(v==='—'&&base[h])cls='param-missing';else if(v!=='—'&&!base[h])cls='param-added';else if(v!==base[h])cls='param-diff';}return `<td class="${cls}">${safe(v)}</td>`;}).join('')}</tr>`;}).join('');
  }
  function renderMulti(){
    if(state.selected.length<2)return;const orderedNames=ordered(),fs=orderedNames.map(formulaMap),picker=document.getElementById('comparePicker'),box=document.getElementById('formulaDiff');if(!picker||!box)return;
    document.getElementById('formulaLab')?.classList.add('open');
    picker.innerHTML=`<div class="multi-picker"><div><b>手动多方参数对比</b><span>像汽车/手机参数表一样横向比较；基础方固定在最左。</span></div><div class="multi-picker-actions"><label>基础方 <select data-base-select>${orderedNames.map(n=>`<option ${n===state.base?'selected':''}>${safe(n)}</option>`).join('')}</select></label><select data-multi-add>${addOptions()||'<option>无可添加方</option>'}</select><button type="button" data-multi-add-btn ${state.selected.length>=MAX?'disabled':''}>＋加入</button><label class="diff-toggle"><input type="checkbox" data-only-diff ${state.onlyDiff?'checked':''}>只看差异</label></div></div>`;
    const rows=valueRows(fs).filter(r=>!state.onlyDiff||!allSame(r.values));
    box.innerHTML=`<div id="multiCompareView"><div class="diff-head"><div><span class="eyebrow">《伤寒论》多方参数对比</span><h3>${orderedNames.map(safe).join(' × ')}</h3><p class="compare-reason">基础方只作为参照，不代表优先推荐。黄色=与基础方不同；绿色=新增药；淡红=相对基础方缺失。</p></div><button class="diff-close" type="button">×</button></div><div class="multi-table-wrap"><table class="multi-param-table"><thead><tr><th>对比参数</th>${orderedNames.map((n,i)=>`<th class="${i===0?'base-col':''}"><div>${i===0?'<span class="base-badge">基础方</span>':''}<strong>${safe(n)}</strong>${i?`<button type="button" data-make-base="${safe(n)}">设为基础</button>`:''}<button type="button" data-col-remove="${safe(n)}">移除</button></div></th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th>${safe(r.label)}</th>${r.values.map((v,i)=>renderCell(v,r.type,r.values[0])).join('')}</tr>`).join('')}<tr class="section-row"><th colspan="${orderedNames.length+1}">药味与原文剂量</th></tr>${ingredientRows(fs)}</tbody></table></div><div class="safety-mini">这是经典学习对比表：展示《伤寒论》条文、药味和古籍剂量差异，不把“与基础方不同”自动解释成疗效因果，也不用于自行处方。</div></div>`;
    picker.querySelector('[data-base-select]')?.addEventListener('change',e=>setBase(e.target.value));
    picker.querySelector('[data-multi-add-btn]')?.addEventListener('click',()=>{const s=picker.querySelector('[data-multi-add]');if(s?.value){add(s.value);renderMulti();}});
    picker.querySelector('[data-only-diff]')?.addEventListener('change',e=>{state.onlyDiff=e.target.checked;save();renderMulti();});
    box.querySelector('.diff-close').onclick=()=>document.getElementById('formulaLab')?.classList.remove('open');
    box.querySelectorAll('[data-make-base]').forEach(b=>b.onclick=()=>setBase(b.dataset.makeBase));
    box.querySelectorAll('[data-col-remove]').forEach(b=>b.onclick=()=>remove(b.dataset.colRemove));
  }
  function currentFormulaName(card){const h=card.querySelector('.rhead h3');return (h?.childNodes?.[0]?.textContent||'').replace(/^\d+\.\s*/,'').trim();}
  function attachCardButtons(){document.querySelectorAll('#results .result').forEach(card=>{if(card.querySelector('.multi-compare-btn'))return;const n=currentFormulaName(card);if(!formulaMap(n))return;const b=document.createElement('button');b.className='compare-btn multi-compare-btn';b.type='button';b.textContent='＋ 加入对比';b.onclick=()=>add(n);const anchor=card.querySelector('.compare-btn');anchor?.insertAdjacentElement('afterend',b)||card.appendChild(b);});}
  function injectManualEntry(){const picker=document.getElementById('comparePicker'),base=document.getElementById('compareBase');if(!picker||!base||picker.querySelector('[data-manual-multi]'))return;const b=document.createElement('button');b.type='button';b.dataset.manualMulti='1';b.className='compare-btn';b.textContent='自选多个方参数对比';b.onclick=()=>{add(base.value);renderTray('再加入至少一个方即可开始');};picker.querySelector('.compare-picker-top')?.appendChild(b);}
  const results=document.getElementById('results');if(results)new MutationObserver(attachCardButtons).observe(results,{childList:true,subtree:true});
  const picker=document.getElementById('comparePicker');if(picker)new MutationObserver(()=>queueMicrotask(injectManualEntry)).observe(picker,{childList:true,subtree:true});
  restore();renderTray();attachCardButtons();injectManualEntry();
  window.openMultiFormulaCompare=(base,others=[])=>{[base,...others].filter(Boolean).forEach(add);if(state.selected.length>=2)renderMulti();};
})();
