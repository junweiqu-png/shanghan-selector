/* 26篇课内古文已核对逐句译文的跨篇学习例句；按义项匹配，不从原文字形推断词义。 */
(()=>{
"use strict";
const dict={
 "不":{base:["否定：不、没有","否定副词","not","否定后面的动作、状态或判断"],exception:[
  ["尊君在不","通“否”，表示是否（读fǒu）","疑问语气词","fou","用于询问是否在家"]]},
 "而":{skip:["俄而"],base:["连接前后动作","连词","sequence","连接相继发生的动作或情况"],exception:[
  ["俄而","不久","时间词语后部","short-time","“俄而”表示不久，整词理解"],
  ["而身为宋国笑","却、反而","连词","contrast","表示出人意料的相反结果"],
  ["而不","却、但是","连词","contrast","前后语义构成转折"],
  ["而多","却、但是","连词","contrast","路边有很多果子与常理相反"],
  ["而剑","却、但是","连词","contrast","对照移动的船和不动的剑"],
  ["而两狼","却、但是","连词","contrast","说明两只狼仍继续追逐"],
  ["而前狼","但、然而","连词","contrast","对照前后两只狼的不同动作"],
  ["而不可","却不能","连词","contrast","前后观赏要求存在限制"],
  ["而敢","竟然、却","连词","contrast","强调出乎意料的行为"],
  ["而志在","正当……时","连词","temporal","连接弹琴动作与当时心意"]]},
 "者":{base:["……的人","结构助词","person","放在动词、形容词后，组成指人的名词性短语"],exception:[
  ["远者","……的事物","结构助词","thing","指距离远的太阳等事物"],
  ["近者","……的事物","结构助词","thing","指距离近的事物"],
  ["今者","现在、如今","时间助词","current","与“今”连用表示现在的时间"],
  ["可爱者","……的事物","结构助词","thing","指值得喜爱的花"],
  ["其奇者","……的人","结构助词","person","指能欣赏奇景的人"]]},
 "其":{base:["他的、它的","代词","possession","表示所属或指代前文的人、事物"],exception:[
  ["其一人","其中一个","代词","one-of","从若干人中指定一个"],
  ["其一","其中一个","代词","one-of","从若干对象中指一个"],
  ["其人","那个人","指示代词","that-person","指前面提到的人"],
  ["其故","其中的原因","代词","possession","指争论的原因"],
  ["其奇","那奇丽景色","指示代词","that","指前文描述的美景"]]},
 "以":{base:["凭借、用","介词","tool","引出行为所用的工具、凭借或手段"],exception:[
  ["我以","认为","动词","think","表达个人的认识或判断"],
  ["以为","认为","动词","think","表示主观判断"],
  ["以求","用来、以便","连词","purpose","引出动作的目的"],
  ["以修身","来、用来","连词","purpose","说明修养身心的目的"],
  ["以养德","来、用来","连词","purpose","说明培养品德的目的"],
  ["以明志","来、用来","连词","purpose","说明明确志向的目的"],
  ["以致远","来、用来","连词","purpose","说明达到远大目标的目的"],
  ["以军中多务","用、以……为由","介词","reason","引出推辞的理由"],
  ["以此","凭借这一点","介词","reason","交代自我夸耀的原因"],
  ["以百数","按……计算","介词","measurement","说明数量以百计"],
  ["以来","从……以来","助词性结构","since","表示从过去某时至今"]]},
 "然":{base:["……的样子","形容词词尾","state-suffix","表示动作或状态的样子"],exception:[
  ["信然","果然如此","指示代词","so","表示事实与判断相符"],
  ["非然","这样、如此","指示代词","so","指前文提出的判断"],
  ["然之","认为对、赞同","动词","agree","认可别人的说法"]]},
 "非":{base:["不是、不","否定词","not","否定所说的判断或属性"],exception:[
  ["非淡泊","如果不能……","否定条件","conditional","强调淡泊是明确志向的条件"],
  ["非宁静","如果不能……","否定条件","conditional","强调宁静是达到远大目标的条件"]]},
 "未":{base:["没有、尚未","否定副词","not-yet","否定到当前时刻已发生的动作"],exception:[
  ["未若","不如","比较表达","less-than","表示比较而非单纯没有发生"]]},
 "及":{base:["等到、到了","动词或介词","when","引出某个时刻或事情发生时"],exception:[
  ["何及","怎么来得及","动词","in-time","表示追悔时已为时太晚"]]},
 "耳":{base:["罢了、而已","句末语气助词","only","表示限止或语气缓和"],exception:[
  ["乱耳","耳朵","名词","ear","指听觉器官"]]},
 "遂":{base:["于是、就","副词","then","承接前一事件而发生的动作或结果"],exception:[
  ["遂成","最终变成","副词","result","突出发展至最终的结果"],
  ["遂不得","于是未能","副词","result","前面行动导致的结果"]]},
 "乃":{base:["于是、就","副词","then","承接前一事件出现后续动作"],exception:[
  ["去后乃至","才","副词","late","表示迟后才发生"],
  ["乃曰","才","副词","late","直到此时才说"],
  ["今乃","竟然、却","副词","surprise","指出与预期相反的情况"]]},
 "矣":{base:["了、已经","句末语气助词","completion","表示情况已经发生或发生变化"],exception:[
  ["谬矣","啊、了","句末语气助词","exclaim","带感叹语气的评断"],
  ["今日病矣","啊、了","句末语气助词","exclaim","突出疲劳的感叹"]]},
 "乎":{base:["呢、吗","句末语气助词","rhetoric","表示疑问或反问语气"],exception:[
  ["巍巍乎","……的样子","形容词词尾","appearance","形容高山巍峨的情状"],
  ["善哉乎","啊","语气助词","exclaim","表达赞叹"]]},
 "复":{base:["再、又","副词","again","表示动作或状态再次发生"],exception:[
  ["非复","不再","副词","not-again","表示原来状态已经改变"],
  ["不复","不再","副词","not-again","与否定词连用，表示不再次发生"]]},
 "是":{base:["是、就是","判断动词","copula","连接判断对象和结果"],exception:[
  ["是吾剑","这、这里","指示代词","demonstrative","指刻记号的位置"],
  ["是其智","这","指示代词","demonstrative","指前面提出的情况"]]},
 "则":{base:["就、那么","连词","consequence","表示满足条件后的结论"],exception:[]},
 "于":{base:["在","介词","location","引出动作发生的位置"],exception:[
  ["于秦","到、往","介词","destination","表示前往的地点"],
  ["于水","到、向","介词","destination","表示落到水里"],
  ["于物","对于","介词","object-relation","引出被比较或作用的对象"],
  ["于井中","从","介词","source","表示所说人出现的来源"]]},
 "为":{base:["做、成为","动词","become","表示做某事或成为某种身份"],exception:[
  ["为宋国笑","被","介词","passive","被宋国人嘲笑，表示被动"],
  ["为之足","给……画脚","动词","do-for","为某物补画脚"],
  ["为是","因为","介词","reason","询问原因"],
  ["以为","认为","动词","think","作出主观判断"],
  ["为鼓琴者","替、为","介词","beneficiary","说明弹琴是为了谁"],
  ["为人之子","作为","动词","identity","表示人的身份"],
  ["为博士","成为","动词","become","表示获得某种身份"],
  ["为乐者","一起做","动词","do","表示从事游乐之事"]]},
 "若":{base:["像、如同","动词","similarity","把一种事物与另一种作比"],exception:[
  ["未若","不如","比较结构","compare","两种比喻中后者更合适"],
  ["弗若","比不上","比较动词","compare","比较二人的学习结果"],
  ["孰若","哪里比得上","比较结构","compare","比较两者能力"],
  ["若屈伸","你","第二人称代词","you","指被劝慰的人"],
  ["求剑若此","像这样","指示词","this-way","指前面寻找宝剑的方式"],
  ["不若无闻","不如","比较结构","compare","比较两种获取信息的方式"]]},
 "去":{base:["离开","动词","leave","从原地离开"],exception:[
  ["去人近","距离","动词","distance","表示与人的远近"],
  ["去人远","距离","动词","distance","表示与人的远近"]]},
 "夫":{skip:["夫子"],base:["句首发语词，不单独翻译","语气助词","intro","放在句首引起议论，不按代词“那、这”解释"],exception:[
  ["夫子","先生、您","敬称","sir","尊称对方"],
  ["夫不可陷","句首发语词","语气助词","intro","引出议论"],
  ["夫君子","句首发语词","语气助词","intro","放在句首引起议论"],["夫学须静","句首发语词","语气助词","intro","引出对于学习的议论"]]},
 "惟":{base:["只、仅仅","副词","only","表示限定，仅此一种"],exception:[]},
 "信":{base:["确实、果然","副词","truly","表示符合事实"],exception:[
  ["无信","诚信","名词","trust","指是否守信用"],
  ["宁信","相信","动词","believe","相信所量的尺寸"],["自信","相信","动词","believe","此处是相信自己而非“确实”"]]},
 "俱":{base:["一起、全都","副词","together","表示一同或全部"],exception:[]},
 "宁":{skip:["管宁","宁静"],base:["宁愿","副词","rather","在两种情况间作出取舍"],exception:[]},
 "之":{strict:true,base:["的","结构助词","attribute","修饰后面的名词"],exception:[
 ["取之","它","代词","object","代指前面的事物"],["引之","他","代词","object","指元方"],["问之","他、这件事","代词","object","询问的对象"],
 ["誉之","它","代词","object","指盾"],["吾盾之坚","取消句子独立性","结构助词","subject-predicate","主谓间不译"],
 ["吾矛之利","取消句子独立性","结构助词","subject-predicate","主谓间不译"],
 ["子之矛","你的","结构助词","attribute","表示所属"],["子之盾","你的","结构助词","attribute","表示所属"],
 ["不可陷之盾","的","结构助词","attribute","修饰盾"],["不陷之矛","的","结构助词","attribute","修饰矛"],
 ["置之","它","代词","object","指量好的尺码"],["至之市","到、往","动词","go","表示去集市"],
 ["操之","它","代词","object","指量好的尺码"],["试之","它","代词","object","指鞋"],
 ["求之","它","代词","object","指落水的剑"],["饮之","它","代词","object","指酒"],["为之足","它","代词","object","指画的蛇"],
 ["一人之蛇","的","结构助词","attribute","表示所属"],["宋之丁氏","的","结构助词","attribute","修饰丁氏"],
 ["传之","它","代词","object","指传闻"],["道之","它","代词","object","指消息"],["闻之","它","代词","object","指传闻"],
 ["人之使","的","结构助词","attribute","表示劳力"],["义之人","的","结构助词","attribute","修饰人"],
 ["义之国","的","结构助词","attribute","修饰国家"],["委之","他","代词","object","指病中的朋友"],
 ["国之善弈者","的","结构助词","attribute","修饰善下棋的人"],
 ["弈秋之为听","宾语前置标志","结构助词","inversion","把弈秋这个宾语提前"],
 ["听之","它","代词","object","代指说话或琴声"],["射之","它","代词","object","指天鹅"],
 ["若之","他","代词","object","指另一个学习者"],["与之俱学","他","代词","object","指同学的人"],
 ["苗之不长","取消句子独立性","结构助词","subject-predicate","主谓之间不译"],["揠之","它","代词","object","指禾苗"],
 ["视之","它","代词","object","指禾苗"],["少选之间","的","结构助词","attribute","表示时间范围"],
 ["见之","它","代词","object","指画"],["然之","它","代词","object","指牧童的观点"],
 ["君子之行","的","结构助词","attribute","修饰品行"],
 ["见事之晚","取消句子独立性","结构助词","subject-predicate","构成表述认识迟晚的结构"],
 ["丝竹之乱耳","取消句子独立性","结构助词","subject-predicate","主谓之间不译"],
 ["案牍之劳形","取消句子独立性","结构助词","subject-predicate","主谓之间不译"],
 ["何陋之有","宾语前置标志","结构助词","inversion","标示何陋提前"],
 ["山川之美","的","结构助词","attribute","修饰山川之美"],
 ["欲界之仙都","的","结构助词","attribute","修饰仙都"],
 ["草木之花","的","结构助词","attribute","修饰花"],
 ["莲之出淤泥","取消句子独立性","结构助词","subject-predicate","主谓间不译"],
 ["花之","的","结构助词","attribute","连接花与所比人物"],
 ["菊之爱","对……的","结构助词","attribute","表示爱菊"],
 ["莲之爱","对……的","结构助词","attribute","表示爱莲"],
 ["牡丹之爱","对……的","结构助词","attribute","表示爱牡丹"],
 ["睨之","他","代词","object","指陈康肃公"],["颔之","它","代词","object","指射箭这件事"],
 ["知之","它","代词","object","指其中道理"],["沥之","它","代词","object","指油"],
 ["遣之","他","代词","object","指卖油翁"],
 ["晓之","他","代词","object","指忧天的人"],
 ["投之","它","代词","object","指骨头"],
 ["狼之并驱","取消句子独立性","结构助词","subject-predicate","主谓间不译"],
 ["久之","音节助词，不译","助词","syllabic","凑足音节"],
 ["毙之","它","代词","object","指狼"],
 ["禽兽之变诈","的","结构助词","attribute","修饰欺骗手段"]]},
 "见":{base:["看见","动词","see","用眼睛看到某事"],exception:[
  ["见往事","了解、知道","动词","understand","通过读书来了解历史"]]},
 "故":{base:["缘故、原因","名词","cause","指事情发生的原因"],exception:[
  ["如故","从前、原来","名词","former","像原来的情形一样"],
  ["故不错意","所以","连词","therefore","承接前面原因得出结果"]]},
 "也":{base:["表肯定、判断的语气","句末语气助词","assertive","用于句尾，加强判断或肯定"],exception:[]},
 "但":{base:["只、只是","副词","only","表示限定"],exception:[]}
};
const core=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[])];
const examples={},sources={},coverage={};
for(const [term,profile] of Object.entries(dict)){
 let all=[];
 for(const work of core){
  for(const [line,translation] of work.lines||[]){
   if(!line.includes(term)||!translation)continue;
   const positions=[];let at=line.indexOf(term);while(at>=0){positions.push(at);at=line.indexOf(term,at+term.length);}
   const unique=new Map();
   for(const index of positions){
    if((profile.skip||[]).some(phrase=>{const start=line.indexOf(phrase);return start>=0&&index>=start&&index<start+phrase.length;}))continue;
    let picked=null;
    for(const row of profile.exception){
     const [phrase,...fields]=row;let start=line.indexOf(phrase);
     while(start>=0){if(start<=index&&index+term.length<=start+phrase.length){
      if(!picked||phrase.length>picked.phrase.length)picked={phrase,fields};break;}
      start=line.indexOf(phrase,start+1);}
    }
    if(profile.strict&&!picked)continue;
    const fields=picked?picked.fields:profile.base;
    const [meaning,pos,code,usage]=fields;
    const anchor=picked?.phrase||line.slice(Math.max(0,index-4),Math.min(line.length,index+term.length+4));
    const key=code+'|'+line;
    if(!unique.has(key))unique.set(key,{anchor,meaning,pos,code,usage,index});
   }
   for(const v of unique.values()){
    const ex=[work.title,work.source,line,translation,v.meaning,v.pos,v.code,v.usage,work.sourceUrl||''];
    all.push(ex);
    (sources[term]||=[]).push([work.title,v.anchor,v.meaning,v.pos,v.code,v.usage]);
   }
  }
 }
 examples[term]=all;
 coverage[term]={works:new Set(all.map(x=>x[0])).size,examples:all.length,senses:[...new Set(all.map(x=>x[6]))]};
}
const words={};for(const term of Object.keys(dict))words[term]={sources:sources[term]||[],examples:examples[term]||[]};
window.WENYAN_CROSSLESSON={words,coverage};
})();
