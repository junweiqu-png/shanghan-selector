/* 单字学习：一字一义项；例句的词义须结合所在整句核验，不能仅靠同字形。 */
(()=>{
"use strict";
const words={
 "辩":{
  sources:[["两小儿辩日","见两小儿辩斗","争辩、辩论","动词","argue","“辩斗”中的“辩”表示双方围绕日远近日的问题争论。"]],
  examples:[
   ["孟子·滕文公下","《孟子·滕文公下》","公都子曰：“外人皆称夫子好辩，敢问何也？”","公都子问：“外人都说先生喜欢辩论，请问为什么呢？”","争辩、辩论","动词","argue","此处“辩”指与人论辩，与课文中的争辩义相同。","https://zh.wikisource.org/zh-hans/孟子/滕文公下","辩",1],
   ["庄子·齐物论","《庄子·齐物论》","圣人议而不辩。","圣人讨论事理，却不执意与人争辩。","争辩、争论","动词","argue","此处“辩”指争论，和课文的“辩”同义。","https://zh.wikisource.org/zh-hans/莊子/齊物論","辩",2],
   ["庄子·庚桑楚","《庄子·庚桑楚》","辩者，辩其所不能辩也。","善于辩论的人，往往想去辩说本来无法用言辞辩明的道理。","辩说、争论","动词","argue","在论理语境里用言语争辩，同为辩论用法。","https://zh.wikisource.org/zh-hans/莊子/庚桑楚","辩",3]
  ]
 },
 "斗":{
  sources:[["两小儿辩日","见两小儿辩斗","争论、争辩","动词","verbal-contest","“辩斗”中的“斗”指围绕观点争论，不能直接按武力打斗解释。"]],
  examples:[
   ["史记·廉颇蔺相如列传","《史记·廉颇蔺相如列传》","今两虎共斗，其势不俱生。","如果两只老虎争斗起来，照情势看不可能同时存活。","争斗、相争","动词","physical-fight","这是实际搏斗；课文“辩斗”属于言语争论，均有争胜之意但具体行为不同。","https://zh.wikisource.org/zh-hans/史記/卷081","斗",1],
   ["庄子·达生","《庄子·达生》","纪渻子为王养斗鸡。","纪渻子替国君饲养用于争斗的鸡。","搏斗、争斗","动词","physical-fight","此处说斗鸡，指搏击而非辩论。","https://zh.wikisource.org/zh-hans/莊子/達生","斗",2],
   ["格致镜原·卷八十","《格致镜原·卷八十》（引《韩诗外传》）","敌在前敢斗者，勇也。","面对敌手敢于迎战搏斗，这是勇敢。","搏斗、交战","动词","physical-fight","这里是面对敌人敢打斗；与课文中的言语争论不同。","https://zh.wikisource.org/zh-hans/格致鏡原_(四庫全書本)/卷080","斗",3]
  ]
 }
};
for(const [char,entry] of Object.entries(words)){
 if([...char].length!==1||!entry.sources.length)throw Error("invalid character source "+char);
 for(const row of entry.examples){if(!row[2].includes(char)||![row[3],row[4],row[5],row[6],row[7],row[8]].every(Boolean))throw Error("incomplete character example "+char);}
}
window.WENYAN_VERIFIED_CHARACTERS={words};
})();