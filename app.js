const GROUPS = {
  '寒热与汗': ['恶风','恶寒明显','发热','往来寒热','无汗','自汗','盗汗样汗出','烦躁'],
  '头项与全身': ['头痛','项背强','身痛','骨节疼痛','四肢沉重疼痛','但欲寐','头晕'],
  '胸胁与呼吸': ['胸胁苦满','胸满','咳嗽','喘','心悸','胸闷'],
  '胃肠': ['恶心欲呕','呕吐','默默不欲饮食','心下痞','心下满痛','腹满','腹痛','便秘','下利','下利清谷'],
  '口渴与二便': ['口渴','大渴喜冷饮','口不渴','小便不利','小便频数','口苦咽干'],
  '末梢与其他': ['手足厥冷','手足心热','面赤','咽痛']
};

const F = [
{name:'桂枝汤',stage:'太阳中风',core:['恶风','自汗'],plus:['发热','头痛','项背强'],against:['无汗','恶寒明显'],clue:'发热、汗出、恶风为主要线索，偏表虚、营卫不和。',dist:'若恶寒重、无汗、身痛明显，更偏麻黄汤证。'},
{name:'麻黄汤',stage:'太阳伤寒',core:['恶寒明显','无汗'],plus:['发热','头痛','身痛','骨节疼痛','喘'],against:['自汗'],clue:'恶寒较重、无汗、头身疼痛，可兼喘。',dist:'若自汗恶风为主，不合麻黄汤典型方证。',risk:'含麻黄；心血管疾病、高血压、心律失常等人群尤其不能自行试用。'},
{name:'葛根汤',stage:'太阳',core:['项背强'],plus:['恶寒明显','无汗','发热','下利'],against:['自汗'],clue:'项背强急是辨识度很高的线索，可见无汗恶风。',dist:'若项背强而反汗出恶风，更接近桂枝加葛根汤思路。'},
{name:'桂枝加葛根汤',stage:'太阳中风兼经输不利',core:['项背强','自汗'],plus:['恶风','发热','头痛'],against:['无汗'],clue:'项背强，同时又有汗出恶风。',dist:'与葛根汤关键差别之一在“有汗/无汗”。'},
{name:'大青龙汤',stage:'太阳表实兼郁热',core:['恶寒明显','无汗','烦躁'],plus:['发热','身痛','骨节疼痛'],against:['自汗'],clue:'表实无汗、身痛，同时烦躁明显。',dist:'若脉弱、汗出恶风方向不符。',risk:'发汗力强，且含麻黄；不可凭网页自行服用。'},
{name:'小青龙汤',stage:'太阳表寒里饮',core:['咳嗽','恶寒明显'],plus:['无汗','喘','心悸','小便不利','恶心欲呕'],against:['大渴喜冷饮'],clue:'外寒未解，同时水饮上逆，咳喘、干呕、心悸等可并见。',dist:'若高热大渴喜冷饮突出，方向相反。'},
{name:'麻黄附子细辛汤',stage:'少阴兼表',core:['恶寒明显','但欲寐'],plus:['无汗','身痛'],against:['烦躁','大渴喜冷饮'],clue:'少阴虚寒背景下又见表证，精神困倦、恶寒明显。',dist:'不是普通感冒的“更强麻黄汤”。',risk:'含附子类药，存在明确毒性风险，必须由专业人士辨证与规范炮制使用。'},
{name:'小柴胡汤',stage:'少阳',core:['往来寒热','胸胁苦满'],plus:['默默不欲饮食','恶心欲呕','口苦咽干','咽痛'],against:[],clue:'往来寒热、胸胁苦满、食欲差、心烦喜呕是经典组合。',dist:'若腹部里实、便秘、心下满痛突出，要考虑少阳兼里实。'},
{name:'柴胡桂枝汤',stage:'太阳少阳并见',core:['往来寒热'],plus:['恶风','发热','胸胁苦满','身痛','恶心欲呕'],against:[],clue:'既有太阳表证，又有少阳证候。',dist:'若纯少阳表现更完整而表证不明显，小柴胡汤更典型。'},
{name:'大柴胡汤',stage:'少阳兼阳明里实',core:['胸胁苦满','心下满痛'],plus:['往来寒热','恶心欲呕','腹满','便秘'],against:['下利清谷'],clue:'少阳不解，同时心下/腹部实满、呕吐或便秘。',dist:'比小柴胡汤多了明显里实、腹部实满线索。',risk:'含攻下药，腹痛原因不明、脱水、孕期等情况不可自行使用。'},
{name:'栀子豉汤',stage:'热扰胸膈',core:['烦躁','胸闷'],plus:['发热','咽痛'],against:['手足厥冷','下利清谷'],clue:'汗吐下后虚烦、胸中窒闷、烦躁不安一类线索。',dist:'若腹满便秘、潮热等里实明显，应另辨阳明腑实。'},
{name:'白虎汤',stage:'阳明气分热盛',core:['发热','大渴喜冷饮'],plus:['烦躁','自汗'],against:['恶寒明显','手足厥冷','下利清谷'],clue:'里热炽盛，热、渴、汗、烦方向明显。',dist:'表证未解且恶寒无汗时并非典型白虎汤证。'},
{name:'白虎加人参汤',stage:'阳明热盛津伤',core:['大渴喜冷饮','发热'],plus:['烦躁','自汗'],against:['恶寒明显','下利清谷'],clue:'大烦渴、津伤更突出，常在汗吐下后见。',dist:'普通口渴不足以支持此方证。'},
{name:'调胃承气汤',stage:'阳明燥热',core:['便秘'],plus:['腹满','烦躁','发热'],against:['下利','手足厥冷'],clue:'里热燥结，但相较大承气汤证通常没有那么重的痞满燥实。',dist:'仅仅几天没排便，不能等同于承气汤证。',risk:'攻下方，不可把“便秘”直接等同于适应证。'},
{name:'小承气汤',stage:'阳明腑实',core:['便秘','腹满'],plus:['发热','烦躁'],against:['下利','下利清谷'],clue:'腑气不通、腹满、大便硬，里实较明确。',dist:'需要与调胃承气汤、大承气汤按腹证、病势轻重区分。',risk:'攻下方，急腹症、脱水等必须先排除。'},
{name:'大承气汤',stage:'阳明腑实重证',core:['便秘','腹满'],plus:['烦躁','发热','手足厥冷'],against:['下利清谷'],clue:'重度燥实、痞满、便闭，可出现烦躁甚至热厥。',dist:'属于重证思路，不是一般便秘方。',risk:'峻下方；若出现意识异常、持续腹痛、呕吐等应先急诊评估。'},
{name:'五苓散',stage:'太阳蓄水/水液输布失常',core:['小便不利','口渴'],plus:['头痛','发热','心悸','头晕'],against:[],clue:'口渴想饮与小便不利并见，比单独“水肿”更有辨识意义。',dist:'若大渴高热汗出明显，应与阳明热盛区分。'},
{name:'猪苓汤',stage:'阴伤水热互结',core:['小便不利','口渴'],plus:['烦躁','咽痛'],against:['恶寒明显','下利清谷'],clue:'水热互结兼阴伤，口渴、小便不利，可伴心烦。',dist:'与五苓散相比偏热、偏阴伤。'},
{name:'理中丸/汤',stage:'太阴中焦虚寒',core:['下利','腹痛'],plus:['恶心欲呕','腹满','口不渴'],against:['大渴喜冷饮','烦躁'],clue:'中焦虚寒，吐利腹痛、口不渴或喜温方向。',dist:'若下利同时明显口渴、发热、肛门灼热等，需另辨热利。'},
{name:'四逆汤',stage:'少阴阳衰寒厥',core:['手足厥冷','下利清谷'],plus:['但欲寐','腹痛','口不渴'],against:['大渴喜冷饮','烦躁'],clue:'里寒较重、四肢厥冷、清谷下利、精神衰惫。',dist:'现实中若伴低血压、意识差等，属于急症评估范畴。',risk:'含附子类药，存在明确毒性风险；不得据网页自行服用。'},
{name:'真武汤',stage:'少阴阳虚水泛',core:['小便不利','四肢沉重疼痛'],plus:['腹痛','下利','头晕','心悸'],against:['大渴喜冷饮'],clue:'阳虚水泛，水液代谢失常，眩悸、身重、腹痛下利可并见。',dist:'与五苓散相比更偏阳虚、水泛、身重眩悸。',risk:'经典方含附子，必须专业辨证与规范用药。'},
{name:'黄连阿胶汤',stage:'少阴阴虚火扰',core:['烦躁'],plus:['咽痛','手足心热'],against:['恶寒明显','手足厥冷','下利清谷'],clue:'少阴病中偏阴虚火扰、心烦不得卧的方向。',dist:'与四逆汤同属少阴但寒热方向几乎相反。'},
{name:'乌梅丸',stage:'厥阴寒热错杂',core:['手足厥冷','腹痛'],plus:['下利','口渴','恶心欲呕'],against:[],clue:'寒热错杂、厥逆、久利或上热下寒一类复杂证候。',dist:'厥阴证复杂，不适合由单一症状机械定方。',risk:'方中含多味作用强的药物，需专业辨证。'},
{name:'炙甘草汤',stage:'心动悸·脉结代',core:['心悸'],plus:['胸闷','口渴'],against:[],clue:'经典关键在“心动悸、脉结代”。',dist:'若真实出现心律不齐、胸痛、晕厥，应先做现代医学心电评估。'}
];

const chosen = new Set();
const groupsRoot = document.getElementById('groups');
const countEl = document.getElementById('selectedCount');
const results = document.getElementById('results');

Object.entries(GROUPS).forEach(([name, items])=>{
  const sec=document.createElement('section'); sec.className='group';
  sec.innerHTML=`<h3>${name}</h3><div class="sym-grid"></div>`;
  const grid=sec.querySelector('.sym-grid');
  items.forEach(s=>{const b=document.createElement('button');b.className='sym';b.textContent=s;b.type='button';b.onclick=()=>{chosen.has(s)?chosen.delete(s):chosen.add(s);b.classList.toggle('on');countEl.textContent=`已选 ${chosen.size} 项`;};grid.appendChild(b)});
  groupsRoot.appendChild(sec);
});

function evaluate(f){
  let score=0, hitCore=[], hitPlus=[], hitBad=[];
  f.core.forEach(s=>{if(chosen.has(s)){score+=6;hitCore.push(s)}});
  f.plus.forEach(s=>{if(chosen.has(s)){score+=2;hitPlus.push(s)}});
  f.against.forEach(s=>{if(chosen.has(s)){score-=5;hitBad.push(s)}});
  if(f.core.length && !hitCore.length) score-=5;
  const missing=f.core.filter(s=>!chosen.has(s));
  return {score,hitCore,hitPlus,hitBad,missing};
}
const chips=(arr,cls='')=>arr.length?arr.map(x=>`<span class="chip ${cls}">${x}</span>`).join(''):'<span class="chip miss">无</span>';

function render(){
  if(!chosen.size){results.className='empty';results.textContent='尚未选择症状。';return;}
  let arr=F.map(f=>({f,...evaluate(f)})).filter(x=>x.score>0 && x.hitCore.length).sort((a,b)=>b.score-a.score||b.hitCore.length-a.hitCore.length).slice(0,7);
  if(!arr.length){results.className='empty';results.textContent='当前组合尚未形成清晰的经典方证。可补充更有辨识度的症状，或把结果交给专业医生结合病程、舌脉、体质与检查进一步判断。';return;}
  const max=Math.max(...arr.map(x=>x.score));
  results.className='';
  results.innerHTML=arr.map((x,i)=>{
    const pct=Math.max(8,Math.round(x.score/max*100));
    return `<article class="result ${i===0?'top':''}">
      <div class="rhead"><div><h3>${i+1}. ${x.f.name}<span class="badge">${x.f.stage}</span></h3></div><div class="score">相对匹配 ${x.score}</div></div>
      <div class="meter"><i style="width:${pct}%"></i></div>
      <div class="why"><div><b>支持它的线索</b><p>${chips([...x.hitCore,...x.hitPlus])}</p></div><div><b>仍缺少的核心线索</b><p>${chips(x.missing,'miss')}</p></div></div>
      ${x.hitBad.length?`<div class="why"><div><b>存在反证</b><p>${chips(x.hitBad,'bad')}</p></div></div>`:''}
      <div class="source"><b>经典方证线索：</b>${x.f.clue}<br><b>鉴别：</b>${x.f.dist}</div>
      ${x.f.risk?`<div class="warning"><b>用药安全：</b>${x.f.risk}</div>`:''}
    </article>`
  }).join('') + `<div class="warning"><b>结果阅读规则：</b>“第 1 名”只代表当前所选信息下的相对匹配，不代表确诊、更不代表可以直接服药。若前几名分数接近，反而说明需要补充病程、脉象、舌象、既往病史和现代医学检查。</div>`;
}

document.getElementById('calc').onclick=render;
document.getElementById('clear').onclick=()=>{chosen.clear();document.querySelectorAll('.sym.on').forEach(x=>x.classList.remove('on'));countEl.textContent='已选 0 项';render();};
