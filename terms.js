const MEDICAL_BOOKS=[
  ['《黄帝内经》','先秦至汉','https://zh.wikisource.org/zh-hans/黃帝內經'],
  ['《难经》','汉以前','https://zh.wikisource.org/zh-hans/難經'],
  ['《脉经》','西晋·王叔和','https://zh.wikisource.org/zh-hans/脈經'],
  ['《伤寒论》','汉·张仲景','https://zh.wikisource.org/zh-hans/傷寒論'],
  ['《金匮要略》','汉·张仲景','https://zh.wikisource.org/zh-hans/金匱要略'],
  ['《诸病源候论》','隋·巢元方等','https://zh.wikisource.org/zh-hans/諸病源候論'],
  ['《备急千金要方》','唐·孙思邈','https://zh.wikisource.org/zh-hans/千金要方'],
  ['《伤寒明理论》','金·成无己','https://zh.wikisource.org/zh-hans/傷寒明理論'],
  ['《伤寒论纲目》','明清医家汇编','https://zh.wikisource.org/zh-hans/傷寒論綱目'],
  ['《伤寒贯珠集》','清·尤在泾','https://zh.wikisource.org/zh-hans/傷寒貫珠集'],
  ['《医宗金鉴》','清·吴谦等','https://zh.wikisource.org/zh-hans/醫宗金鑑'],
  ['《伤寒论类方》','清·徐灵胎','https://zh.wikisource.org/zh-hans/傷寒論類方'],
  ['《伤寒寻源》','清·吕震名','https://zh.wikisource.org/zh-hans/傷寒尋源'],
  ['《药征》','江户·吉益东洞','https://zh.wikisource.org/wiki/藥徵'],
  ['《本经疏证》','清·邹澍','https://zh.wikisource.org/zh-hans/本經疏證'],
  ['《医方考》','明·吴昆','https://zh.wikisource.org/zh-hans/醫方考'],
  ['《伤寒论翼》','清·柯琴','https://zh.wikisource.org/wiki/傷寒論翼']
];
const T=(book,quote,note,url)=>({book,quote,note,url});
const W='https://zh.wikisource.org/w/index.php?search=';
const TERM_INDEX={
'浮':{title:'浮脉',brief:'轻取较易得。古籍常与“表”联系，但必须合参有汗无汗、寒热与脉力。',refs:[T('《脉经》','在上为表，在下为里；浮为在表，沉为在里。','脉位的总纲。','https://zh.wikisource.org/zh-hans/脈經/0113'),T('《伤寒论》','太阳之为病，脉浮，头项强痛而恶寒。','太阳提纲把脉浮与头项强痛、恶寒合看。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'沉':{title:'沉脉',brief:'重按始得。经典可见里证、少阴、水饮等多种语境，不能等同于“寒”。',refs:[T('《脉经》','浮为在表，沉为在里。','脉位总纲。','https://zh.wikisource.org/zh-hans/脈經/0113'),T('《伤寒论》','少阴病，始得之，反发热，脉沉者，麻黄细辛附子汤主之。','少阴兼表时“反发热而脉沉”是重要组合。','https://zh.wikisource.org/zh-hans/傷寒論'),T('《金匮要略》','脉沉者，有留饮。','沉脉也可出现在留饮语境。','https://zh.wikisource.org/zh-hans/金匱要略')]},
'紧':{title:'紧脉',brief:'古籍常与寒、表实等联系，但仍需结合浮沉、汗出与疼痛。',refs:[T('《伤寒论》','太阳中风，脉浮紧，发热恶寒，身疼痛，不汗出而烦躁者，大青龙汤主之。','浮紧与无汗、身痛、烦躁合参。','https://zh.wikisource.org/zh-hans/傷寒論'),T('《脉经》','沉细滑疾者热，迟紧为寒。','古代脉法对迟紧的一种归纳。','https://zh.wikisource.org/zh-hans/脈經/0113')]},
'弦':{title:'弦脉',brief:'少阳、饮证、肝病等不同古籍语境都可出现，必须看同现症状。',refs:[T('《脉经》','脉长而弦，病在肝。','脉经中的脏腑脉法语境。','https://zh.wikisource.org/zh-hans/脈經/0113'),T('《金匮要略》','脉偏弦者饮也。','痰饮篇把偏弦与饮联系。','https://zh.wikisource.org/zh-hans/金匱要略'),T('《伤寒论》','伤寒，脉弦细，头痛发热者，属少阳。','少阳辨证中的脉证合参。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'滑':{title:'滑脉',brief:'可见热、痰饮、里实等语境，单凭“滑”不能定性。',refs:[T('《脉经》','脉滑者多血少气。','脉经的一种脉义解释。','https://zh.wikisource.org/zh-hans/脈經/0113'),T('《伤寒论》','伤寒脉滑而厥者，里有热也，白虎汤主之。','滑脉与厥并见时，仲景据此辨里热。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'数':{title:'数脉',brief:'脉来较快。经典常与热、烦等相关，但也要结合病位与脉力。',refs:[T('《黄帝内经·素问·脉要精微论》','数则烦心。','《内经》对数脉的早期概括。','https://zh.wikisource.org/zh-hans/黃帝內經/素問第五卷'),T('《脉经》','沉细滑疾者热，迟紧为寒。','疾数方向可与热象并见。','https://zh.wikisource.org/zh-hans/脈經/0113')]},
'迟':{title:'迟脉',brief:'脉来较慢。古籍常与寒、脏证联系，但虚实仍需另辨。',refs:[T('《脉经》','沉细滑疾者热，迟紧为寒。','迟紧在此条被归入寒。','https://zh.wikisource.org/zh-hans/脈經/0113'),T('《伤寒论翼》','数为在腑，迟为在脏。','柯琴整理的对看脉法。','https://zh.wikisource.org/wiki/傷寒論翼')]},
'细':{title:'细脉',brief:'脉体细。经典可从气血不足、少阴等不同角度理解。',refs:[T('《黄帝内经·素问·脉要精微论》','细则气少。','《内经》对细脉的简明解释。','https://zh.wikisource.org/zh-hans/黃帝內經/素問第五卷'),T('《脉经》','脉来细而微者，血气俱虚。','王叔和对细微脉的一种解释。','https://zh.wikisource.org/zh-hans/脈經/0113')]},
'微':{title:'微脉',brief:'脉势微弱，多见于虚损语境，但需结合浮沉迟数。',refs:[T('《脉经》','脉来细而微者，血气俱虚。','细微合见时的一种古典解释。','https://zh.wikisource.org/zh-hans/脈經/0113'),T('《伤寒论》','若脉微弱，汗出恶风者，不可服之。','大青龙汤条以微弱、汗出恶风作为反证。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'代':{title:'代脉 / 结代',brief:'脉律出现较明显的间歇。真实心律不齐仍应优先用现代医学评估。',refs:[T('《黄帝内经·素问·脉要精微论》','代则气衰。','《内经》对代脉的概括。','https://zh.wikisource.org/zh-hans/黃帝內經/素問第五卷'),T('《伤寒论》','伤寒，脉结代，心动悸，炙甘草汤主之。','脉与症直接连到方证的著名条文。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'结代':{alias:'代'},
'恶寒':{title:'恶寒',brief:'不待风而自觉寒冷。古籍强调它与恶风不同，也要辨表里阴阳。',refs:[T('《伤寒明理论·恶寒》','恶寒者，则不待风而寒，虽身大热而不欲去衣者是也。','成无己对恶寒与恶风的鉴别。','https://zh.wikisource.org/zh-hans/傷寒明理論/惡寒'),T('《诸病源候论》','气在孔窍皮肤之间，故病者头痛恶寒，腰背强重，此邪气在表。','隋代病源学对表证恶寒的描述。','https://zh.wikisource.org/zh-hans/諸病源候論'),T('《伤寒论》','太阳之为病，脉浮，头项强痛而恶寒。','太阳病提纲。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'恶风':{title:'恶风',brief:'遇风则不适，避风后相对缓解。古籍多从卫气、腠理开合解释。',refs:[T('《伤寒明理论·恶风》','恶风者，谓常居密室之中……一或当风，淅淅然而恶者。','成无己对恶风的定义性描述。','https://zh.wikisource.org/zh-hans/傷寒明理論/惡風'),T('《伤寒论》','太阳病，头痛，发热，汗出，恶风，桂枝汤主之。','桂枝汤方证中的直接用法。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'无汗':{title:'无汗',brief:'无汗并不只等于“表实”；成无己明确列出表寒、邪入里、水饮、阳虚等多种原因。',refs:[T('《伤寒明理论·无汗》','伤寒在表，及邪行于里，或水饮内蓄，与亡阳久虚，皆令无汗。','说明无汗的病机并非单一。','https://zh.wikisource.org/zh-hans/傷寒明理論/無汗'),T('《伤寒论》','太阳病，项背强几几，无汗恶风，葛根汤主之。','表实无汗的一种典型方证。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'自汗':{title:'自汗',brief:'非因主动发汗而汗自出。古籍常从卫外不固、营卫不和等解释。',refs:[T('《伤寒明理论·自汗》','自汗者，谓不因发散而自然汗出者是也。','定义性原文。','https://zh.wikisource.org/wiki/傷寒明理論/自汗'),T('《伤寒论》','太阳中风，阳浮而阴弱……阴弱者，汗自出。','桂枝汤体系的经典营卫语境。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'烦躁':{title:'烦 / 烦躁',brief:'“烦”“躁”“虚烦”“心烦”在古籍中并非完全同义，应看上下文。',refs:[T('《黄帝内经·素问·脉要精微论》','数则烦心。','把数脉与烦心联系。','https://zh.wikisource.org/zh-hans/黃帝內經/素問第五卷'),T('《伤寒论》','不汗出而烦躁者，大青龙汤主之。','表实兼郁热语境。','https://zh.wikisource.org/zh-hans/傷寒論'),T('《伤寒论》','发汗吐下后，虚烦不得眠……栀子豉汤主之。','“虚烦”是另一类语境。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'烦':{alias:'烦躁'},
'渴':{title:'渴 / 消渴',brief:'渴在《伤寒论》中可见热盛、津伤、水液输布不利等多种机制，不能单靠“口渴”定方。',refs:[T('《伤寒论》','若脉浮，小便不利，微热消渴者，五苓散主之。','水液输布不利方向。','https://zh.wikisource.org/zh-hans/傷寒論'),T('《伤寒论》','大汗出后，大烦渴不解，脉洪大者，白虎加人参汤主之。','阳明热盛津伤方向。','https://zh.wikisource.org/zh-hans/傷寒論'),T('《金匮要略》','胸中有留饮，其人短气而渴。','留饮也可见渴。','https://zh.wikisource.org/zh-hans/金匱要略')]},
'消渴':{alias:'渴'},
'厥':{title:'厥',brief:'手足厥冷并不自动等于寒证。《伤寒论》有热厥、寒厥及厥阴复杂证候。',refs:[T('《伤寒论》','伤寒脉滑而厥者，里有热也，白虎汤主之。','明确展示“厥而属热”。','https://zh.wikisource.org/zh-hans/傷寒論'),T('《伤寒论》','凡厥者，阴阳气不相顺接，便为厥。','从阴阳气不相顺接解释厥。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'营卫':{title:'营卫',brief:'外感病的重要古典框架，涉及肌表、汗出、恶风恶寒和腠理开合。',refs:[T('《诸病源候论》','夫伤寒病者，起自风寒，入于腠理，与精气交争，荣卫痞隔，周行不通。','隋代对伤寒起始病机的概括。','https://zh.wikisource.org/zh-hans/諸病源候論'),T('《伤寒明理论·恶风》','卫气者，所以温分肉，充皮肤，肥腠理，司开阖者也。','以卫气解释恶风。','https://zh.wikisource.org/zh-hans/傷寒明理論/惡風')]},
'荣卫':{alias:'营卫'},
'腠理':{title:'腠理',brief:'古代描述肌表纹理与津液出入的重要概念，经常和汗、卫气、风寒联系。',refs:[T('《伤寒明理论·无汗》','腠理者，津液凑泄之所为腠，文理缝会之中为理。','成无己的概念解释。','https://zh.wikisource.org/zh-hans/傷寒明理論/無汗'),T('《诸病源候论》','伤寒病者，起自风寒，入于腠理。','病邪由表入里的古代描述。','https://zh.wikisource.org/zh-hans/諸病源候論')]},
'表':{title:'表',brief:'病位概念。古代脉法常以浮与表联系，但外证仍需合参。',refs:[T('《脉经》','在上为表，在下为里；浮为在表，沉为在里。','表里与浮沉的基本对应。','https://zh.wikisource.org/zh-hans/脈經/0113'),T('《诸病源候论》','头痛恶寒，腰背强重，此邪气在表。','从症状组合说明表证。','https://zh.wikisource.org/zh-hans/諸病源候論')]},
'里':{title:'里',brief:'与表相对的病位概念；“里”内部仍有寒热虚实、水饮、燥实等不同类型。',refs:[T('《脉经》','浮为在表，沉为在里。','浮沉辨表里的总纲之一。','https://zh.wikisource.org/zh-hans/脈經/0113'),T('《伤寒论》','伤寒脉滑而厥者，里有热也。','说明里证也要继续辨寒热。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'心下':{title:'心下',brief:'仲景书中极高频的部位词，大致指上腹胃脘附近，但不同条文中的满、痞、急、悸、坚等意义不同。',refs:[T('《金匮要略》','凡食少饮多，水停心下。甚者则悸，微者短气。','水饮停于心下的典型语境。','https://zh.wikisource.org/zh-hans/金匱要略'),T('《伤寒论》','呕不止，心下急，郁郁微烦者……与大柴胡汤。','“心下急”属于大柴胡汤证据之一。','https://zh.wikisource.org/zh-hans/傷寒論')]},
'胸胁苦满':{title:'胸胁苦满',brief:'少阳柴胡证的重要关键词，后世方证学也高度重视。',refs:[T('《伤寒论》','往来寒热，胸胁苦满，默默不欲饮食，心烦喜呕……小柴胡汤主之。','小柴胡汤核心条文。','https://zh.wikisource.org/zh-hans/傷寒論'),T('《药征》','柴胡主治胸胁苦满也，旁治寒热往来。','吉益东洞对柴胡主治的归纳。','https://zh.wikisource.org/wiki/藥徵')]},
'水饮':{title:'水饮 / 痰饮',brief:'《金匮要略》把饮分为痰饮、悬饮、溢饮、支饮，并依部位和表现细分。',refs:[T('《金匮要略》','夫饮有四……有痰饮，有悬饮，有溢饮，有支饮。','仲景对“饮”的分类总纲。','https://zh.wikisource.org/zh-hans/金匱要略'),T('《金匮要略》','水在心，心下坚筑，短气，恶水不欲饮。','水饮病位和症状的一例。','https://zh.wikisource.org/zh-hans/金匱要略'),T('《金匮要略》','脉偏弦者饮也。','以脉象辅助辨饮。','https://zh.wikisource.org/zh-hans/金匱要略')]},
'痰饮':{alias:'水饮'}
};
function canonicalTerm(k){const d=TERM_INDEX[k];return d&&d.alias?d.alias:k;}
function termData(k){return TERM_INDEX[canonicalTerm(k)];}
function escRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
const TERM_KEYS=Object.keys(TERM_INDEX).sort((a,b)=>b.length-a.length);
function linkifyTerms(text){
  if(!text) return '';
  let out=String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const re=new RegExp(TERM_KEYS.map(escRe).join('|'),'g');
  return out.replace(re,m=>`<button class="term-link" type="button" data-term="${canonicalTerm(m)}">${m}</button>`);
}
function searchUrl(term){return W+encodeURIComponent(term+' 中医 古籍');}
function openTerm(term){
  const key=canonicalTerm(term), d=termData(key); if(!d)return;
  const modal=document.getElementById('termModal'), body=document.getElementById('termBody');
  body.innerHTML=`<div class="term-title"><div><span class="eyebrow">古籍关键词</span><h2>${d.title}</h2></div><button class="term-close" type="button" aria-label="关闭">×</button></div>
  <p class="term-brief">${d.brief}</p>
  <div class="term-refs">${d.refs.map(r=>`<article class="term-ref"><div class="classic-head"><span>${r.book}</span><a href="${r.url}" target="_blank" rel="noopener">打开原书 ↗</a></div><blockquote>${linkifyTerms(r.quote)}</blockquote><p>${r.note}</p></article>`).join('')}</div>
  <div class="term-more"><a href="${searchUrl(key)}" target="_blank" rel="noopener">继续检索“${key}”的更多古籍原文 ↗</a></div>`;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
}
function closeTerm(){const m=document.getElementById('termModal');m.classList.remove('open');m.setAttribute('aria-hidden','true');}
function bindTermLinks(root=document){root.querySelectorAll('.term-link').forEach(b=>{if(!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openTerm(b.dataset.term);});}});}
function linkifyClassicTerms(root=document){root.querySelectorAll('.classic-item blockquote').forEach(q=>{if(q.dataset.linkified)return;q.dataset.linkified='1';q.innerHTML=linkifyTerms(q.textContent);});bindTermLinks(root);}
function renderBookShelf(){const el=document.getElementById('bookShelf');if(!el)return;el.innerHTML=MEDICAL_BOOKS.map(([n,a,u])=>`<a class="book-chip" href="${u}" target="_blank" rel="noopener"><b>${n}</b><small>${a}</small></a>`).join('');}
document.addEventListener('click',e=>{if(e.target.matches('.term-close')||e.target.id==='termModal')closeTerm();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTerm();});
