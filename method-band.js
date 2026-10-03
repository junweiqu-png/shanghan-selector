(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const SOURCE_URL='https://cntcm.com.cn/content/202603/23/c501475.html';
  const GROUPS=[
    {name:'太阳表证常用鉴别组',method:'先抓共同“表证”背景，再依汗、身痛、项背强、烦躁/水气等关键分界逐层缩小。',members:['桂枝汤','麻黄汤','桂枝加葛根汤','葛根汤','大青龙汤','小青龙汤']},
    {name:'柴胡类方组',method:'先确认少阳/柴胡证共同底色，再比较里实、水饮、表证兼夹与方药结构变化。',members:['小柴胡汤','大柴胡汤','柴胡桂枝汤','柴胡桂枝干姜汤']},
    {name:'三承气类方组',method:'不要只背“泻下强弱”，要把烦热、腹满、潮热、手足汗、不大便等原文层级与药物结构一起比较。',members:['调胃承气汤','小承气汤','大承气汤']},
    {name:'四逆类方组',method:'共同是寒化/回阳邻域，重点比较病势严重度、下利、脉象、里寒外热与姜附剂量/制法。',members:['四逆汤','四逆加人参汤','通脉四逆汤','通脉四逆加猪胆汁汤']},
    {name:'白虎类方组',method:'共同里热底色先不动，再追问为什么加人参：新增条件、渴的程度与津气状态如何变化。',members:['白虎汤','白虎加人参汤']}
  ];
  function availableMembers(group){return group.members.filter(n=>typeof formulaMap==='function'&&formulaMap(n));}
  function groupFor(name){return GROUPS.find(g=>g.members.includes(name)&&availableMembers(g).length>=2);}
  function lensHtml(){
    return `<div class="method-lenses"><div><b>名家方法验收</b><a href="${SOURCE_URL}" target="_blank" rel="noopener noreferrer">白长川“三方三证”框架</a></div><div class="method-lens-chips"><span>主方辨证 ✓</span><span>类方辨证 ✓</span><span>类证辨证 ✓</span><span>药证辨证 ✓</span><span>随证辨证 ✓</span><span class="method-lens-limited">合方辨证：仅保留《伤寒论》原文有据者</span></div></div>`;
  }
  function groupHtml(name,group){
    if(!group)return '';
    const members=availableMembers(group);
    return `<div class="expert-group-band"><div class="expert-group-head"><div><b>${esc(group.name)}</b><p>${esc(group.method)}</p></div><span>${members.length} 方同组</span></div><div class="expert-group-buttons">${members.map(n=>n===name?`<span class="current-formula">${esc(n)}</span>`:`<button type="button" data-group-peer="${esc(n)}">${esc(n)}</button>`).join('')}</div><small>训练顺序：先说出这一组“共同母证” → 再说每个方最小分界 → 最后看药味/剂量是否支持你的判断。</small></div>`;
  }
  function inject(){
    const picker=document.getElementById('comparePicker'),sel=document.getElementById('compareBase');if(!picker||!sel)return;
    const name=sel.value,old=picker.querySelector('.method-training-band');
    if(old?.dataset.base===name)return;
    old?.remove();
    const wrap=document.createElement('div');wrap.className='method-training-band';wrap.dataset.base=name;wrap.innerHTML=lensHtml()+groupHtml(name,groupFor(name));
    picker.appendChild(wrap);
    wrap.querySelectorAll('[data-group-peer]').forEach(btn=>btn.onclick=()=>{if(typeof renderFormulaDiff==='function')renderFormulaDiff(name,btn.dataset.groupPeer);});
  }
  const picker=document.getElementById('comparePicker');if(picker)new MutationObserver(()=>queueMicrotask(inject)).observe(picker,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(e.target?.id==='compareBase')setTimeout(inject,0);});
  document.addEventListener('click',e=>{if(e.target?.closest?.('#openShanghanCatalog,.compare-btn'))setTimeout(inject,20);});
})();