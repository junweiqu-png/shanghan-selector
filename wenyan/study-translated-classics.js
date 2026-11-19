/* 古籍原句的本站原创今译；sourceId 仅用于定位原典，不把字形命中算作同义。
 * 这里补译“蔓”卡片原有的八条全文库材料，并加入短小易读的植物义例句。
 */
(()=>{
"use strict";
const rows=[
 ["春秋左传·昭公十三年","zuozhuan#10","蔓成然故事蔡公，故薳氏之族及薳居、许围、蔡洧、蔓成然，皆王所不礼也。","蔓成然原先侍奉蔡公，因此薳氏的族人以及薳居、许围、蔡洧、蔓成然，都是楚王不以礼相待的人。","蔓成然姓名中的字，没有藤蔓的意思","专名","proper-name","这里的“故”表示从前；“所不礼”指不以礼相待。","https://ctext.org/chun-qiu-zuo-zhuan/zhao-gong-shi-san-nian/zh"],
 ["梁书·卷五十四·诸夷","liangshu#54","盘况年九十余乃死，立中子盘盘，以国事委其大将范蔓。","盘况活到九十多岁才去世，立他的次子盘盘为王，把国家事务托付给大将范蔓。","范蔓姓名中的字，没有藤蔓的意思","专名","proper-name","“中子”指排行居中的儿子，这里指次子；“委”是托付。","https://zh.wikisource.org/wiki/梁書/卷54"],
 ["春秋左传·襄公二十七年","zuozhuan#9","子大叔赋《野有蔓草》，赵孟曰：“吾子之惠也。”","子大叔吟诵《野有蔓草》，赵孟说：“这是您给我的恩惠啊。”","蔓生、延展生长；这里是所引诗篇的标题用字","实词","trailing","“赋”在这里指吟诵诗篇；“吾子”是对对方的敬称。","https://ctext.org/chun-qiu-zuo-zhuan/xiang-gong-er-shi-qi-nian/zh"],
 ["春秋左传·隐公元年","zuozhuan#1","不如早为之所，无使滋蔓！","不如早些给他作出安排，不要让他的势力滋长蔓延！","蔓延、扩展，这里比喻势力增长","实词","spread","“之”指共叔段；“为之所”是给他安排适当的处置办法。","https://ctext.org/chun-qiu-zuo-zhuan/yin-gong-yuan-nian/zh"],
 ["诗经·唐风·葛生","shijing#124","葛生蒙楚，蔹蔓于野。","葛藤生长，覆盖着荆条；蔹草在野外蔓延。","蔓延生长","实词","grow-vines","“蒙”是覆盖；“楚”指荆木；“蔹”是一种蔓生植物。","https://ctext.org/book-of-poetry/ge-sheng/zh"],
 ["隋书·卷二十一·天文下","suishu#21","凡暴兵气，白如瓜蔓连结，部队相逐，须臾罢而复出，至八九来而不断，急贼卒至，宜防固之。","古代望气术认为，预示突发战事的云气，颜色发白，像瓜藤相连，一群接一群，片刻消散又出现，反复八九次还不断绝，就表示敌兵会突然来袭，应当加强防守。","瓜藤，蔓生植物的细长茎","名词","vine","这段是在转述古代望气占候的说法；“卒”同“猝”，突然。","https://zh.wikisource.org/wiki/隋書/卷21"],
 ["北齐书·卷四·文宣帝纪","beiqishu#4","胡人别种，延蔓山谷，酋渠万族，广袤千里，凭险不恭，恣其桀黠，有乐淳风，相携叩款，粟帛之调，王府充积，此又王之功也。","北方各部族散居山谷，首领与族众很多，分布地域广达千里。他们曾凭借险要地势不肯归服，任意逞强使诈；后来有的向往淳厚风俗，相继前来归附，所缴粮食和布帛使王府储藏充实，这又是大王的功劳。","蔓延、扩展，这里指族群分布延伸","实词","spread","“酋渠”指部族首领；“叩款”是诚心归附；“调”是征收的赋税。","https://zh.wikisource.org/wiki/北齊書/卷4"],
 ["隋书·卷三十五·经籍四","suishu#35","梁简文之在东宫，亦好篇什，清辞巧制，止乎衽席之间，雕琢蔓藻，思极闺闱之内。","梁简文帝居太子之位时，也喜好诗篇，辞句清丽、构思精巧，但内容只局限于男女寝席之事；他雕琢繁复的辞藻，构思也只在闺房生活之内。","繁多、铺陈繁复","形容词","elaborate","“东宫”代指太子之位；“衽席”借指男女私生活；“藻”指文辞。","https://zh.wikisource.org/wiki/隋書/卷35"],
 ["小石潭记","","青树翠蔓，蒙络摇缀，参差披拂。","青翠的树木和藤蔓，遮盖缠绕，摇动下垂，长短不齐，随风飘拂。","藤蔓，蔓生植物的细长茎","名词","vine","这里是名词“藤蔓”；《爱莲说》把这一名词用作动词“横生藤蔓”。","https://zh.wikisource.org/wiki/至小丘西小石潭記"],
 ["诗经·郑风·野有蔓草","","野有蔓草，零露漙兮。","野外蔓草铺展，落在草上的露水又多又浓。","蔓生、延展生长","实词","trailing","“零”是降落；“漙”形容露水多。","https://ctext.org/book-of-poetry/ye-you-man-cao/zh"],
 ["杜甫·新婚别","","兔丝附蓬麻，引蔓故不长。","菟丝依附在低矮的蓬草和麻上，伸出的藤蔓因此长不高。","藤蔓，蔓生植物的细长茎","名词","vine","“兔丝”即菟丝；所依附的草木低矮，藤蔓也难以长高。","https://zh.wikisource.org/wiki/新婚別"],
 ["杜甫·季秋江村","","乔木村墟古，疏篱野蔓悬。","高大树木环绕的村落显得古朴，稀疏的篱笆上悬挂着野生藤蔓。","藤蔓，蔓生植物的细长茎","名词","vine","“村墟”是村庄；“疏”是稀疏；“悬”是悬挂。","https://zh.wikisource.org/wiki/季秋江村"]
];
const spec=window.WENYAN_LESSON_CHARACTER_GLOSSES.words["蔓"]||={sources:[],examples:[]};
const records=rows.map(([title,sourceId,text,translation,meaning,pos,code,usage,url])=>({title,sourceId,text,translation,meaning,pos,code,usage,url,char:"蔓"}));
for(const r of records){
 spec.examples.push([r.title,r.title,r.text,r.translation,r.meaning,r.pos,r.code,r.usage,r.url,"蔓",r.code==="proper-name"?80:10]);
 for(let at=r.text.indexOf("蔓");at>=0;at=r.text.indexOf("蔓",at+1))spec.sources.push([r.title,r.text,r.meaning,r.pos,r.code,r.usage,r.text,at]);
}
window.WENYAN_TRANSLATED_CLASSICS={records,find:(title,text)=>records.find(r=>(r.title===title&&r.text===text)||r.text===text)};
})();
