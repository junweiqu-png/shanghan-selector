/* 《观潮》全文节选正文逆序逐字语境字义：7句203字位，译文与原文保持同步。
 * 仅使用本篇真实已发布正文和对应句译，不臆造跨书同义例句。
 * 来源数据在 data-junior-batch2c.js，按完整原句与精确字位追溯。
 */
(()=>{
"use strict";
const book=(window.WENYAN_DATA_4||[]).find(x=>x.title==="观潮");
const store=window.WENYAN_LESSON_CHARACTER_GLOSSES;
if(!book||!store||!window.WENYAN_REFERENCE_DICTIONARY)throw Error("观潮逐字校译所需数据未加载");
const dictionary=window.WENYAN_REFERENCE_DICTIONARY.words;
const pairs=text=>{const out=new Map();for(const v of String(text||"").split("|")){if(!v)continue;const p=v.indexOf("=");if(p<1||!v.slice(p+1))throw Error("空字义："+v);out.set(v.slice(0,p),v.slice(p+1));}return out;};
const common=pairs("浙=浙江地名用字|江=江水、钱塘江|之=结构助词“的”|潮=大潮、潮水|天=天空、天下|下=天下的下|伟=壮伟、壮观|观=景象|也=判断句末语气|自=从|既=已经、之后|望=农历每月十五日|以=从……到……|至=到|十=十|八=八|日=日期、太阳|为=是、成为|盛=最盛大|方=正当……时候|其=它、它的|远=远处、从远处|出=出现、涌出|海=大海|门=门、海门地名用字|仅=仅仅、只|如=像、好像|银=银色|线=细线|而=表承接的连词|渐=渐渐|近=靠近|则=就|玉=玉色、洁白|城=城墙|雪=白雪|岭=山岭|际=接连、连接|来=到来|大=宏大|声=声音|雷=雷声|霆=霹雳|震=震撼|撼=震动|激=激荡|射=喷射|吞=吞没|沃=冲荡、浸没|势=气势|极=极其|雄=雄壮|豪=豪迈|杨=杨姓|诚=诚斋号的组成字|斋=诚斋号的组成字|诗=诗句|云=说|涌=涌出|郭=城郭、城墙|横=横亘|系=系住、围绕|腰=腰部|者=……的景象|是=这、正是|每=每年|岁=年|京=京城|尹=地方长官|亭=亭台、浙江亭|教=训练|阅=检阅|水=水上、江水|军=军队|艨=战船，在艨艟中|艟=大型战船，在艨艟中|数=几、若干|百=百|分=分开|列=排列|两=两|岸=江岸|尽=尽情展示|奔=奔腾|腾=翻腾|合=合拢|五=五|阵=阵势|并=并且|有=有|乘=骑乘|骑=骑马|弄=舞弄|旗=旗帜|标=投掷用的|枪=枪、标枪|舞=挥舞|刀=刀|于=在|面=水面|履=踏、踩|平=平坦|地=地面|倏=忽然|尔=语气助词|黄=黄色|烟=烟雾|四=四方、四处|起=升起|人=人|物=物、事物|略=完全、丝毫|不=不、没有|相=相互|睹=看见|爆=爆炸|轰=轰鸣|崩=崩塌|山=山|消=消散|波=波涛|静=平静|一=一|舸=船|无=没有|迹=踪迹|敌=敌方|船=船|火=火|所=被动句式用字|焚=烧毁|随=随着|逝=漂走、离去|吴=吴地|儿=健儿、年轻男子|善=擅长|泅=游泳|皆=全、都|披=披散|发=头发|文=在身体上刺花纹|身=身体|手=用手|持=拿着|幅=旗帜的量词|彩=彩色|争=争先|先=领先|鼓=鼓起|勇=勇气|溯=逆流而上|迎=迎着|上=向上游|没=隐没|鲸=像鲸一样巨大的，比喻巨浪|万=万、极多|仞=古代长度单位，形容巨浪极高|中=在……之中"),specials={"0":"浙=浙江之潮中的浙江即钱塘江|江=钱塘江|天=天下|下=天下|观=壮观的景象|自=从|既=望日之后，既望即农历十六|望=农历十五日为望日|以=连接起止，表示到|日=日期|盛=最盛大","1":"方=当……之时|其=潮水|远=在远处|出=涌现|海=海门地名用字|门=海门地名用字|仅=只|如=好像|既=不久以后|而=承接连词|玉=玉色般的白|城=城墙|雪=白雪|岭=山岭|际=连接天际|天=天空|天@2=天空|沃=冲荡、浸没|日=太阳","2":"杨=杨万里姓氏|诚=杨万里的号“诚斋”用字|斋=杨万里的号“诚斋”用字|为=成为|郭=城郭、外城|系=系在、围在江腰|者=……的描述|是=正是这样的景象","3":"每=每年|岁=年|京=京城|尹=京尹，主管京畿的地方官|出=来到|浙=浙江亭地名用字|江=浙江亭地名用字|亭=浙江亭|教=训练|阅=检阅|数=几、数百|尽=尽情展示|奔=奔腾|腾=翻腾|分=分开|合=合起|势=阵式、态势|并=并且|骑=骑马、骑乘|标=投掷用的（标枪）|者=……的人","4":"倏=忽然|尔=倏尔的词尾助词|四=四处|人=人|物=物，人物指人和物|略=全然、完全（略不）|相=互相|睹=看见|水=水面上|爆=水爆，即水上爆炸的声响","5":"则=就|一=一艘|仅=只、仅仅|有=有，只剩|为=被，和“所”构成被动|所=与“为”构成被动句式|焚=烧毁|波=水波|逝=顺水漂远","6":"吴=吴地|儿=健儿，年轻男子|者=……的人|数=几、数百|百=百|皆=全部|文=在身上刺花纹（文身）|身=身体|手=用手，名词作状语|十=十|幅=彩旗的量词|争=争着|先=争先|鼓=鼓起|勇=勇气|溯=逆流而上|迎=迎击潮水|而=表承接|上=逆流而上|出=露出、出现|没=没入、隐没|于=在|鲸=巨大鲸鱼，借喻巨浪|波=巨浪|万=极高极大|仞=古代长度单位仞，比喻浪峰之高|中=巨浪之中"};
if(book.lines.length!==7)throw Error("观潮课文句数发生变化，必须重审");
const grammatical=new Set([..."之而以其者于乃则焉也乎矣哉盖若如为所且或将无不非"]);
function anchor(sentence,at,char){
 const before=at===0?-1:sentence.lastIndexOf(char,at-1),after=sentence.indexOf(char,at+1);
 const lo=before<0?0:before+1,hi=after<0?sentence.length:after;
 for(let size=2;size<=30;size++)for(let start=Math.max(lo,at-size+1);start<=at;start++){
  const part=sentence.slice(start,start+size);
  if(part.length!==size||start+size>hi||part.indexOf(char)!==at-start||part.lastIndexOf(char)!==part.indexOf(char))continue;
  if(sentence.indexOf(part)===sentence.lastIndexOf(part))return part;
 }
 return sentence.slice(Math.max(0,at-1),Math.min(sentence.length,at+2));
}
let total=0;
for(let lineIndex=book.lines.length-1;lineIndex>=0;lineIndex--){
 const [original,modern]=book.lines[lineIndex],defs=pairs(specials[lineIndex]),seen=Object.create(null),positions=[];
 if(!original?.trim()||!modern?.trim())throw Error("观潮第"+(lineIndex+1)+"句原文或译文空白");
 for(const [offset,ch] of [...original].entries()){
  if(!/\p{Script=Han}/u.test(ch))continue;
  const n=seen[ch]=(seen[ch]||0)+1,key=ch+"@"+n,meaning=defs.get(key)||defs.get(ch)||common.get(ch);
  if(!meaning)throw Error("观潮缺少第"+(lineIndex+1)+"句字义："+ch+" @"+offset);
  positions.push({offset,ch,n,meaning});
 }
 for(let i=positions.length-1;i>=0;i--){
  const {offset,ch,n,meaning}=positions[i];
  const proper=/人名|姓氏|地名|号“/.test(meaning),pos=proper?"专名":grammatical.has(ch)?"虚词":"实词";
  const code=proper?"proper-name":"guanchao-context-"+lineIndex+"-"+offset,fragment=anchor(original,offset,ch);
  const usage="《观潮》原句“"+fragment+"”中“"+ch+"”："+meaning+"。该句译为："+modern+"（本句解释，跨篇是否同义须另行核校）。";
  const record=store.words[ch]||(store.words[ch]={sources:[],examples:[]});
  record.sources.push([book.title,fragment,meaning,pos,code,usage,original,offset]);
  if(n===1)record.examples.push([book.title,book.source,original,modern,meaning,pos,code,usage,book.sourceUrl,ch]);
  if(!dictionary[ch])dictionary[ch]={p:"",s:[meaning],sourceType:"本站《观潮》逐字语境补注，不是参考字典原条目"};
  total++;
 }
 for(const k of defs.keys())if(!positions.some(p=>p.ch===k.split("@")[0]&&(k.indexOf("@")<0||k===p.ch+"@"+p.n)))throw Error("未使用的观潮释义："+(lineIndex+1)+"/"+k);
}
if(!store.lessonTitles.includes("观潮"))store.lessonTitles.push("观潮");
store.annotated+=total;
window.WENYAN_GUANCHAO_REVERSE_AUDIT={title:book.title,lines:7,annotated:total,unique:common.size};
})();