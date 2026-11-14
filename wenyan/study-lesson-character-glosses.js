/* 《核舟记》《穿井得一人》正文逐字语境释义（只取可复核的本文句义）。
 * 不拆成“词组解释”，不凭现代同形字推断古义。同一字不同句可以有不同义项。
 * 本文件没有跨篇审定的 examples，不会凭空增加“五篇关联”。
 */
(()=>{
"use strict";
const lesson={
"核舟记":[
 "明=明朝|有=有|奇=奇妙|巧=精巧|人=人|曰=名叫|王=姓氏王|叔=人名字号用字|远=人名字号用字|能=能够|以=用|径=直径|寸=传统长度单位寸|之=的|木=木料|为=雕刻|宫=宫殿|室=房屋|器=器具|皿=容器|物=事物|至=以及|鸟=鸟类|兽=兽类|石=石头|罔=没有|不=不|因=依据、顺着|势=材料本来的形状|象=模拟|形=形状|各=各自|具=具有|情=神情|态=姿态",
 "尝=曾经|贻=赠送|余=我|核=桃核|舟=小船|一=一艘|盖=原来是，表推测|大=对苏轼的尊称用字|苏=苏轼的简称|泛=乘船游览|赤=赤壁地名用字|壁=赤壁地名用字|云=句末语气词",
 "舟=船|首=船头|尾=船尾|长=长度|约=大约|八=八|分=古代长度单位分|有=同又，表示还有|奇=零数、余数|高=高度|可=大约|二=二|黍=黄米粒|许=左右、大约",
 "中=中间|轩=高起|敞=宽敞|者=……的部分|为=是|舱=船舱|箬=箬竹叶|篷=船篷|覆=覆盖|之=它，指船舱|旁=旁边|开=开设|小=小|窗=窗户|左=左边|右=右边|各=各自|四=四|共=总共|八=八|扇=窗户计数单位",
 "启=打开|窗=窗户|而=连接前后动作|观=观看|雕=雕刻花纹|栏=栏杆|相=互相|望=相对|焉=句末语气词|闭=关闭|之=它，指窗户|之@2=它，指刻字的凹处|则=就|右=右边|刻=刻着|山=山|高=高|月=月亮|小=小|水=水|落=落下|石=石头|石@2=石青颜料的石|出=显露出来|左=左边|清=清爽|风=风|徐=缓缓地|来=吹来|波=水波|不=不|兴=兴起|青=青色颜料|糁=涂抹在刻痕中",
 "船=船|头=船头|坐=坐着|三=三|人=人|中=中间|峨=高高的|冠=帽子|而=并且|多=多|髯=胡须|者=……的人|为=是|东=苏东坡字号用字|坡=苏东坡字号用字|佛=佛印人名用字|印=佛印人名用字|居=位于|右=右边|鲁=鲁直字号用字|直=鲁直字号用字|左=左边",
 "苏=苏轼姓名简称|黄=黄庭坚姓名简称|共=一起|阅=观看|一=一幅|手=手卷中的手，便于手持展读|手@2=身体部位手|手@3=身体部位手|手@4=身体部位手|手@5=身体部位手|卷=卷轴书画|东=苏东坡字号用字|坡=苏东坡字号用字|右=右边|执=拿着、握着|端=卷首的一端|左=左边|抚=轻按|鲁=鲁直字号用字|直=鲁直字号用字|背=后背|末=卷尾|指=指着|如=好像|有=有|所=所……的|语=说话"
],
"穿井得一人":[
 "宋=宋国|之=的|丁=姓丁|氏=人家、家族|家=家里|无=没有|井=水井|而=因而|出=出门|溉=浇灌田地|汲=从水井取水|常=经常|一=一个|人=人|居=停留|外=外面",
 "及=等到|其=他的|家=家里|穿=挖掘|井=水井|告=告诉|人=别人|曰=说|吾=我|得=得到|一=一个",
 "有=有|闻=听到|而=然后|传=传播|之=这件事|者=……的人|丁=姓丁|氏=人家|穿=挖井|井=水井|得=得到|一=一个|人=人",
 "国=国都|人=百姓|道=谈论|之=这件事|闻=传到……耳中|于=到、向|宋=宋国|君=国君|令=派遣|问=询问|丁=姓丁|氏=人家",
 "丁=姓丁|氏=人家|对=回答|曰=说|得=节省、得到|一=一个|人=人的劳力|之=的|使=劳力、使用|非=不是|于=从|井=水井|中=里面|也=判断语气词",
 "求=探求|闻=传闻|之=这件事|若=像|此=这样|不=不|如=比得上|无=没有|也=语气词"
]
};
const words=Object.create(null),works=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[]),...(window.WENYAN_DATA_4||[])];
const punctuation=/[，。；：！？“”‘’、（）]/;
const virtual=new Set([..."之而以其者于乃则焉也乎矣哉盖若如为所且或将无不非"]);
function pairs(str){const result=new Map();for(const item of str.split("|")){const split=item.indexOf("=");if(split<1)throw Error("释义格式错误："+item);const k=item.slice(0,split),v=item.slice(split+1);if(!v)throw Error("空义："+item);result.set(k,v);}return result;}
function anchor(sentence,at,char){
 const previous=sentence.lastIndexOf(char,at-1),next=sentence.indexOf(char,at+char.length);
 const loLimit=previous<0?0:previous+char.length,hiLimit=next<0?sentence.length:next;
 let best=null;
 for(let left=at;left>=Math.max(loLimit,at-15);left--){
  for(let right=at+char.length;right<=Math.min(hiLimit,at+16);right++){
   const t=sentence.slice(left,right);
   if(!t.includes(char)||t.length>30||t.length<2||t.split(char).length!==2)continue;
   if(sentence.indexOf(t)!==sentence.lastIndexOf(t))continue;
   if(!best||t.length<best.length)best=t;
  }
 }
 return best||char;
}
let annotated=0;
for(const [title,rows] of Object.entries(lesson)){
 const work=works.find(w=>w.title===title);
 if(!work||work.lines.length!==rows.length)throw Error(title+"的正文句数发生变化，请重新校核");
 rows.forEach((raw,lineIndex)=>{
  const text=String(work.lines[lineIndex][0]),defs=pairs(raw),seen=Object.create(null),hit=new Set();
  for(const [offset,char] of [...text].entries()){
   if(!/\p{Script=Han}/u.test(char))continue;
   const occurrence=seen[char]=(seen[char]||0)+1;
   const meaning=defs.get(char+"@"+occurrence)||defs.get(char);
   if(!meaning)throw Error("存在未独立解释的正文汉字："+title+" 第"+(lineIndex+1)+"句 "+char+" @"+offset);
   hit.add(char);
   const isName=/姓名|字号|地名|姓氏|姓丁/.test(meaning);
   const pos=isName?"专名":virtual.has(char)?"虚词":"实词";
   const code=isName?"proper-name":"lesson-context-"+title+"-"+lineIndex+"-"+char+"-"+occurrence;
   const contextual="本句“"+anchor(text,offset,char)+"”中“"+char+"”："+meaning+"。原句已有现代译文；跨篇是否同义须另核。";
   const row=words[char]||(words[char]={sources:[],examples:[]});
   row.sources.push([title,anchor(text,offset,char),meaning,pos,code,contextual]);
   annotated++;
  }
  for(const k of defs.keys())if(!hit.has(k.split("@")[0]))throw Error("字义映射中包含本文不存在的字："+title+" 第"+(lineIndex+1)+"句 "+k);
 });
}
window.WENYAN_LESSON_CHARACTER_GLOSSES={words,annotated,lessonTitles:Object.keys(lesson)};
})();
