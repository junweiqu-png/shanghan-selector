/* 教材26篇已有逐句译文的二次利用。只对人工确定义项的7个常见字收录，
 * 使用原有整句及本项目原创译文，避免把字形命中冒称完整语义解释。
 */
(()=>{
const D=window.WENYAN_ANNOTATIONS;if(!D)return;
const works=[...(window.WENYAN_DATA_1||[]),...(window.WENYAN_DATA_2||[]),...(window.WENYAN_DATA_3||[])];
const terms={
"不":q=>q.includes("尊君在不")?["通“否”，是否","疑问语气词","question","在古文问句中读fǒu，询问父亲是否在家"]:
 ["不、没有","否定副词","neg","否定后面的动作、判断或状态"],
"然":q=>{
 if(q.includes("信然")||q.includes("非然"))return ["这样、如此","指示代词","thus","指代前面说过的情况"];
 if(q.includes("然之"))return ["认为……正确","意动用法","approve","认为别人的说法正确"];
 if(q.includes("舍然"))return ["疑虑消除","形容词词尾","relieved","舍然是释然，不等于普通的然"];
 return ["……的样子","助词词尾","appearance","附在形容词后描写人的神情或状态"];
},
"遂":q=>q.includes("遂成枯落")?["最终、终于","副词","final","强调时间发展到后果"]:
 ["于是、就","副词","then","连接此前发生的事与随后行动"],
"非":q=>q.includes("非学无以")||q.includes("非淡泊")?["如果不……就不能……","否定副词","condition","与无以配合强调必要条件"]:
 ["不是、不","否定副词","negative","表示否定判断"],
"未":q=>q.includes("未若")?["不如","否定副词","compare","与若结合构成比较用法"]:
 ["还没有、不曾","否定副词","notyet","否定到当前时间已经完成的事"],
"及":q=>q.includes("何及")?["来得及、赶得上","动词","catchup","反问后悔已经太迟"]:
 ["等到、到了","介词性动词","when","引入后面时间点或事件"],
"耳":q=>q.includes("乱耳")?["耳朵","名词","ear","被音乐扰乱的感官"]:
 ["罢了、而已","句末语气助词","only","收束话语并表示限定"]
};
const H={
"未":[["伤仲永","仲永生五年，未尝识书具，忽啼求之。","仲永五岁时，还未见过书写工具，忽然哭着索要。","没有、未曾","否定副词","notyet","表示此前没有的经历"],
["曹刿论战","刿曰：“未可。”齐人三鼓。","曹刿说：“还不行。”齐军已击了三通鼓。","还没有","否定副词","notyet","表示时机还不成熟"]],
"及":[["桃花源记","及郡下，诣太守，说如此。","到了郡城，渔人拜见太守，说明了自己的经历。","到了","动词","when","表示到达某处的时间点"],
["陈涉世家","及陈，陈令皆不在。","等到了陈县，陈县的县令等人都不在。","到、等到","动词","when","表示行程到达某地"]],
"耳":[["论语·为政","吾十有五而志于学，三十而立，四十而不惑，五十而知天命，六十而耳顺。","我十五岁立志求学，三十岁能自立，四十岁不再迷惑，五十岁懂得天命，六十岁听别人说话便能理解顺从其理。","耳朵、听觉","名词","ear","表示听人说话的听觉能力"],
["论语·述而","子曰：“饭疏食饮水，曲肱而枕之，乐亦在其中矣。”","孔子说：“吃粗粮、喝清水，弯曲胳膊当枕头，快乐也就在里面了。”","（本句无耳）","无","none","不录入"]],
"非":[["论语·子罕","知者不惑，仁者不忧，勇者不惧。","聪明人不迷惑，仁德的人不忧虑，勇敢的人不畏惧。","（本句无非）","无","none","不录入"]]
};
for(const [term,choose]of Object.entries(terms)){
 const word=D.words[term]||(D.words[term]={sources:[],examples:[]});
 for(const w of works){
  const lines=(w.lines||[]).filter(row=>String(row[0]).includes(term));
  if(!lines.length)continue;
  const entry=lines.find(row=>!(term==="不"&&row[0].includes("尊君在不")&&!row[0].includes("不至")) )||lines[0];
  let [meaning,pos,code,usage]=choose(entry[0]);
  word.examples.push(...(word.examples.some(e=>e[0]===w.title&&e[2]===entry[0])?[]:[[w.title,w.source||"课内精读",entry[0],entry[1],meaning,pos,code,usage]]));
  const idx=entry[0].indexOf(term);
  if(idx>=0&&!word.sources.some(s=>s[0]===w.title&&s[1]===entry[0].slice(Math.max(0,idx-4),idx+term.length+5))){
   const anchor=entry[0].slice(Math.max(0,idx-4),Math.min(entry[0].length,idx+term.length+5));
   word.sources.push([w.title,anchor,meaning,pos,code,usage]);
  }
 }
 for(const [title,quote,modern,meaning,pos,code,usage]of H[term]||[]){
  if(!quote.includes(term)||code==="none")continue;
  if(!word.examples.some(e=>e[0]===title&&e[2]===quote))word.examples.push([title,"《"+title+"》",quote,modern,meaning,pos,code,usage]);
 }
}
D.meta.families.neg="negation";
D.meta.families.negative="negation";
D.meta.families.notyet="negation";
D.meta.families.condition="conditional";
D.meta.families.appearance="appearance";
D.meta.families.ear="organ";
D.meta.families.only="limitation";
})();
