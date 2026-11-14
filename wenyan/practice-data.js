/* 文言练习来源：反向翻译只读取本站51篇已校译正文；试卷来源均可逐项核查。
 * 保留2024安徽、甘肃中考和2024高考三卷的原题/小题；另外单字拆解题从2024各地中考、2025高考的真实考点改编，绝不冒充原卷题目。
 * 无法据此估算全国“高频排序”，仅按考试考法分组；不把自编题标为真题。
 */
(()=>{
"use strict";
const reverseSelections=[
 ["陈太丘与友期行",0,"省略句"],["陈太丘与友期行",1,"省略句"],
 ["陋室铭",1,"判断句"],["陋室铭",5,"使动用法"],["陋室铭",7,"宾语前置"],
 ["卖油翁",1,"状语后置"],["卖油翁",4,"固定句式"],["卖油翁",5,"反问句"],
 ["狼",5,"词类活用"],["狼",7,"词类活用"],["狼",10,"反问句"],
 ["孙权劝学",1,"状语后置"],["孙权劝学",2,"反问句"],
 ["桃花源记",1,"意动用法"],["桃花源记",6,"省略句"],
 ["王戎不取道旁李",2,"判断句"],
 ["穿井得一人",4,"判断句"],["穿井得一人",3,"状语后置"],
 ["曹刿论战",1,"宾语前置"],["曹刿论战",5,"状语后置"],["曹刿论战",7,"判断句"],
 ["邹忌讽齐王纳谏",7,"排比句"],["刻舟求剑",2,"反问句"],["爱莲说",3,"判断句"]
];
const works=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[]),...(window.WENYAN_DATA_4||[])];
const reverse=reverseSelections.map(([title,lineIndex,topic],i)=>{
 const work=works.find(w=>w.title===title),line=work?.lines?.[lineIndex];
 if(!work||!line||!line[0]?.trim()||!line[1]?.trim()||![...line[0]].some(c=>/\p{Script=Han}/u.test(c)))throw Error("反译练习缺少逐句校译原文："+title+"/"+lineIndex);
 if(!String(line[2]||"").includes(topic)&&!topic.includes(String(line[2]||"∅")))
  throw Error("题目句式与正文标注不符："+title+" "+topic+" vs "+line[2]);
 return {id:"reverse-"+String(i+1).padStart(2,"0"),kind:"reverse",work:title,source:work.source||"",lineIndex,topic,modern:line[1],answer:line[0]};
});
const sources={
 anhui:{label:"2024 安徽省中考语文·第13题",level:"中考",region:"安徽",year:2024,url:"https://jx.panqjy.cn/doc-15953902.html"},
 gansu:{label:"2024 甘肃省武威等地中考语文·第15题",level:"中考",region:"甘肃",year:2024,url:"https://jx.panqjy.cn/doc-15876416.html"},
 beijing24:{label:"2024 北京市中考语文·第13题",level:"中考",region:"北京",year:2024,url:"https://cdn.xschu.com/17319109484512024%E5%8C%97%E4%BA%AC%E4%B8%AD%E8%80%83%E7%9C%9F%E9%A2%98%E8%AF%AD%E6%96%87.pdf"},
 chengdu24:{label:"2024 四川省成都市中考语文",level:"中考",region:"成都",year:2024,url:"https://zy.21cnjy.com/20604783"},
 suzhou24:{label:"2024 江苏省苏州市中考语文·第6题",level:"中考",region:"苏州",year:2024,url:"https://www.xbjy.com/xhtml/202412/4763.html"},
 changsha24:{label:"2024 湖南省长沙市中考语文·第7题",level:"中考",region:"长沙",year:2024,url:"https://zy.21cnjy.com/20825454"},
 baotou24:{label:"2024 内蒙古包头市中考语文·第22题",level:"中考",region:"包头",year:2024,url:"https://zy.21cnjy.com/20825454"},
 gaokaoI25:{label:"2025 高考语文·新课标Ⅰ卷第11题",level:"高考",region:"新课标Ⅰ卷",year:2025,url:"https://www.jxew.net/zyxz/gkzt/4937.html"},
 gaokaoII25:{label:"2025 高考语文·新课标Ⅱ卷第11题",level:"高考",region:"新课标Ⅱ卷",year:2025,url:"https://www.woaigaokao.com/yuwen/860.html"},
 gaokaoA:{label:"2024 高考语文·全国甲卷第11题",level:"高考",region:"全国甲卷",year:2024,url:"https://kaosj.com/papers/2024/06/2024-national-volume-a-gaokao-chinese-paper/"},
 gaokaoI:{label:"2024 高考语文·新课标Ⅰ卷第11题",level:"高考",region:"新课标Ⅰ卷",year:2024,url:"https://gaokaohub.com/paper/2024-xinkebiao-i-chinese.html"},
 gaokaoII:{label:"2024 高考语文·新课标Ⅱ卷第11题",level:"高考",region:"新课标Ⅱ卷",year:2024,url:"https://gaokao.eol.cn/shiti/yw/202406/t20240613_2616371_1.shtml"}
};
const exam=[
 {id:"gz-15-1",source:"gansu",q:"岂不诚大丈夫哉",focus:"诚",answer:"真正；确实",accept:["真正","确实"],tip:"不是现代汉语的“诚实”。",part:"第15题（1）"},
 {id:"gz-15-2",source:"gansu",q:"往之女家",focus:"女",answer:"同“汝”，你",accept:["你","汝","同汝"],tip:"注意通假字，不能解释为女子、女儿。",part:"第15题（2）"},
 {id:"gz-15-3",source:"gansu",q:"御备皆竭",focus:"竭",answer:"完；尽；穷尽",accept:["完","尽","穷尽"],tip:"“竭”不是渴水的“渴”，这里是防御物资耗尽。",part:"第15题（3）"},
 {id:"gz-15-4",source:"gansu",q:"比至气绝",focus:"比",answer:"等到",accept:["等到"],tip:"不等于现代汉语的比较；此句作时间连接。",part:"第15题（4）"},
 {id:"ah-13-2",source:"anhui",q:"三顾臣于草庐之中",focus:"顾",answer:"拜访",accept:["拜访","看望"],tip:"不是回头看的常见义，必须结合“三顾茅庐”的语境。",part:"第13题（2）"},
 {id:"ah-13-3",source:"anhui",q:"终不为妻子计",focus:"计",answer:"考虑",accept:["考虑","打算"],tip:"不是单指计算数字，结合“为……计”理解。",part:"第13题（3）"},
 {id:"ah-13-4",source:"anhui",q:"公既自度众寡不敌而援绝",focus:"度",answer:"估计",accept:["估计","估量","推测"],tip:"这句读duó，为揣度；不表示长度或法度。",part:"第13题（4）"},
 {id:"gk-a-11",source:"gaokaoA",q:"下列对文中加点的词语及相关内容的解说，不正确的一项是",focus:"藉／即／固／但",part:"第11题",options:[
  "藉，凭借、借助，与《陈涉世家》“藉第令毋斩”的“藉”意思相同。",
  "即，即使，与《桃花源记》“太守即遣人随其往”的“即”意思不同。",
  "固，固然，与《赤壁赋》“固一世之雄也，而今安在哉”的“固”意思相同。",
  "但，只是，与《记承天寺夜游》“但少闲人如吾两人者耳”的“但”意思相同。"
 ],answerIndex:0,tip:"A项混淆了一词多义：前一个“藉”是凭借，课文“藉第令”表示即使。B项“即”是立即，C、D的比对成立。"},
 {id:"gk-i-11",source:"gaokaoI",q:"下列对材料中加点的词语及相关内容的解说，不正确的一项是",focus:"壮／亲／之／迨",part:"第11题",options:[
  "壮，认为……豪壮，意动用法，与《老子》“不贵难得之货”的“贵”用法相同。",
  "亲，父母，可偏指父或母，与《孔雀东南飞》“我有亲父兄”的“亲”意思不相同。",
  "“彼之不死”与《爱莲说》“予独爱莲之出淤泥而不染”的“之”用法不相同。",
  "迨，等到，与《项脊轩志》“迨诸父异爨”的“迨”字意思相同。"
 ],answerIndex:2,tip:"C项所比较的两处“之”都是主谓之间取消句子独立性，实际上用法相同。"},
 {id:"gk-ii-11",source:"gaokaoII",q:"下列对材料中加点的词语及相关内容的解说，不正确的一项是",focus:"燕／怪／式",part:"第11题",options:[
  "燕，同“宴”，指宴饮，成语有“新婚燕尔”，其中的“燕”字意思与此相同。",
  "怪，以……为怪，意动用法，与《师说》中“不耻相师”的“耻”用法相同。",
  "为寿，向尊长敬酒并祝长寿，《鸿门宴》“沛公奉卮酒为寿”的礼仪与此相同。",
  "式，同“轼”，指扶轼，与《周亚夫军细柳》“改容式车”的“式”意思相同。"
 ],answerIndex:0,tip:"A项“新婚燕尔”的“燕”说的是欢乐，不是宴饮；B项都是意动，C、D成立。"}
].map(item=>({...item,kind:"exam",sourceMeta:sources[item.source],level:sources[item.source].level}));

// 拆解题不伪称“原小题”：只提取经过核对的考点，以一个汉字为练习单位。
const examBreakdowns=[
 {id:"bj24-13-cong",source:"beijing24",part:"第13题·考点拆解",q:"隶而从者",focus:"从",answer:"跟随",accept:["跟随","跟着","随从"],tip:"原题要求比较“从”的不同含义；这里是跟随，不是“从前”或“从头”。"},
 {id:"cd24-5-yu",source:"chengdu24",part:"第5题·考点拆解",q:"选贤与能",focus:"与",answer:"同“举”，推举",accept:["推举","举荐","推荐","同举"],tip:"这是通假字，不是给予；不要按现代常用义直接理解。"},
 {id:"cd24-5-qin",source:"chengdu24",part:"第5题·考点拆解",q:"故人不独亲其亲（第一个“亲”）",focus:"亲",answer:"以……为亲；亲爱",accept:["以为亲","亲爱","亲近","把当作亲人"],tip:"前一个“亲”是意动用法，后一个“亲”指亲人，不要混为一谈。"},
 {id:"cd24-6-er",source:"chengdu24",part:"第6题·考点拆解",q:"杂然而前陈者／面山而居",focus:"而",answer:"连接修饰语和动词",accept:["表修饰","连接修饰语和动词","修饰"],tip:"原题考查两句“而”的意义和用法；都表示修饰关系。"},
 {id:"cd24-16-dai",source:"chengdu24",part:"第16题·考点拆解",q:"迨晚",focus:"迨",answer:"等到；到",accept:["等到","到","及至"],tip:"原题把“迨”解释为“趁着”是不恰当的；这里是等到晚上。"},
 {id:"cd24-16-bei",source:"chengdu24",part:"第16题·考点拆解",q:"天下之奇观备矣",focus:"备",answer:"齐全；完备",accept:["齐全","完备","全部具备"],tip:"这里是齐全，不是防备。"},
 {id:"sz24-6-dang",source:"suzhou24",part:"第6题·考点拆解",q:"墓不当其下",focus:"当",answer:"应当；应该",accept:["应当","应该"],tip:"要结合语境判断，不是“担当”或“阻挡”。"},
 {id:"sz24-6-yi",source:"suzhou24",part:"第6题·考点拆解",q:"龂腭益奇",focus:"益",answer:"更加",accept:["更加","越发","愈加"],tip:"和“精益求精”中的“益”相近，不能理解成益处。"},
 {id:"sz24-6-sheng",source:"suzhou24",part:"第6题·考点拆解",q:"要以秋月为胜",focus:"胜",answer:"美好；美景",accept:["美好","美景","美好的景色","胜景"],tip:"原题提供“胜”的多项词典义项，这里指美好的景色。"},
 {id:"cs24-7-jian",source:"changsha24",part:"第7题·考点拆解",q:"文谦荐守敬习水利",focus:"荐",answer:"推荐；举荐",accept:["推荐","举荐","推举"],tip:"原题“进献”的解释有误，这里是推荐人才。"},
 {id:"cs24-7-you",source:"changsha24",part:"第7题·考点拆解",q:"水利十有一事",focus:"有",answer:"同“又”",accept:["又","同又","通又"],tip:"“十有一”即十一，表示整数与零数之间的连接。"},
 {id:"cs24-7-zhi",source:"changsha24",part:"第7题·考点拆解",q:"于是复置都水监",focus:"置",answer:"设置；设立",accept:["设置","设立","建立"],tip:"“置都水监”是设立机构，而《卖油翁》“置于地”是放置物件。"},
 {id:"bt24-22-xian",source:"baotou24",part:"第22题·考点拆解",q:"蛰虫咸动",focus:"咸",answer:"全；都",accept:["全","都","全部","全都"],tip:"“咸”在这里不是咸味，而是范围副词。"},
 {id:"bt24-22-sheng",source:"baotou24",part:"第22题·考点拆解",q:"祀不用牺牲（其中的“牲”）",focus:"牲",answer:"供祭祀的牲畜",accept:["牲畜","供祭祀的牲畜","祭祀用的牲畜"],tip:"原题考查“牺牲”整体的古义，这里只拆出“牲”的含义。"},
 {id:"gk25-i-11-ru",source:"gaokaoI25",part:"第11题·考点拆解",q:"使使如秦受地",focus:"如",answer:"往；到……去",accept:["往","去","到","前往"],tip:"“如”此处是前往，不是“像”。"},
 {id:"gk25-i-11-yu",source:"gaokaoI25",part:"第11题·考点拆解",q:"与（读 yù）",focus:"与",answer:"参与",accept:["参与","参加"],tip:"注意此处读 yù，与《离骚》“不吾与”的读音、义项不同。"},
 {id:"gk25-i-11-he",source:"gaokaoI25",part:"第11题·考点拆解",q:"曷为",focus:"曷",answer:"什么；为何",accept:["何","什么","为何","为什么"],tip:"原卷考查宾语前置，“曷为”是“为什么”，不能按现代语序直译。"},
 {id:"gk25-i-11-ruo",source:"gaokaoI25",part:"第11题·考点拆解",q:"若舍郑以为东道主",focus:"若",answer:"如果",accept:["如果","假如","倘若"],tip:"“若”也可作“你”“像”，这里连接假设条件。"},
 {id:"gk25-ii-11-dai",source:"gaokaoII25",part:"第11题·考点拆解",q:"殆（原卷人物评价语境）",focus:"殆",answer:"几乎；差不多",accept:["几乎","差不多"],tip:"原卷把“殆”的“几乎”与《论语》“思而不学则殆”的“疑惑”作对比。"},
 {id:"gk25-ii-11-an",source:"gaokaoII25",part:"第11题·考点拆解",q:"暗（原卷人物评价语境）",focus:"暗",answer:"糊涂；不明事理",accept:["糊涂","不明事理","愚昧"],tip:"和《琵琶行》“暗问”的“轻声、悄悄”不是一个义项。"},
 {id:"gk25-ii-11-jiang",source:"gaokaoII25",part:"第11题·考点拆解",q:"当奖率三军",focus:"奖",answer:"勉励；鼓励",accept:["勉励","鼓励","激励"],tip:"《出师表》“奖率”指激励并率领，不宜只用现代“奖励奖品”理解。"},
 {id:"gk25-ii-11-zhi",source:"gaokaoII25",part:"第11题·考点拆解",q:"卜者知其指意",focus:"指",answer:"同“旨”，意图",accept:["旨","同旨","意图","意旨"],tip:"这是“指”的通假用法，与普通手指之义不同。"}
].map(item=>({...item,kind:"exam",isAdapted:true,sourceMeta:sources[item.source],level:sources[item.source].level}));
const fullExam=exam.concat(examBreakdowns);

const ids=reverse.concat(fullExam).map(q=>q.id);
if(new Set(ids).size!==ids.length||fullExam.some(x=>!x.sourceMeta.url||!x.sourceMeta.year))throw Error("真题来源或练习ID有误");
window.WENYAN_PRACTICE_BANK={reverse,exam:fullExam,sources,version:"20261114-random2"};
})();
