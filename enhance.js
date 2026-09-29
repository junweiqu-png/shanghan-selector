function attachClassicEvidence(){
  document.querySelectorAll('.result').forEach(card=>{
    if(card.querySelector('.classics')) return;
    const h=card.querySelector('.rhead h3');
    if(!h) return;
    const first=h.childNodes[0];
    const raw=(first?.textContent||h.textContent||'').trim();
    const name=raw.replace(/^\d+\.\s*/,'').trim();
    const html=renderClassicSources(name);
    if(!html) return;
    const anchor=card.querySelector('.source');
    if(anchor) anchor.insertAdjacentHTML('afterend',html);
    else card.insertAdjacentHTML('beforeend',html);
    linkifyClassicTerms(card);
  });
}
const originalCalc=document.getElementById('calc').onclick;
document.getElementById('calc').onclick=()=>{ originalCalc(); attachClassicEvidence(); };
renderGeneralClassics();
linkifyClassicTerms(document.getElementById('generalClassics'));
renderBookShelf();
