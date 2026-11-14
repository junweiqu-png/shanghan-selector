/* 文言练习来源：反向翻译只读取本站51篇已校译正文；真题只收录可核查试卷的原题/原小题。
 * 2024中考安徽13、甘肃15为原题摘录；2024高考甲/I/II第11题原题。
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
const ids=reverse.concat(exam).map(q=>q.id);
if(new Set(ids).size!==ids.length||exam.some(x=>!x.sourceMeta.url||!x.sourceMeta.year))throw Error("真题来源或练习ID有误");
window.WENYAN_PRACTICE_BANK={reverse,exam,sources,version:"20261114-1"};
})();
