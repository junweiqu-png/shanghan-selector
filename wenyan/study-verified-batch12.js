/* 第十二批：核舟记“径寸”的径=直径，不可混同狼的径直。
 * 只计原文、上下文、译文和出处核对过的古籍。 */
(()=>{"use strict";
const words={"径":{
 sources:[
  ["核舟记","以径寸之木","直径；“径寸”指直径一寸","名词","diameter","不是“一寸见方”，说的是原木横截面的直径，突出材料极小。"]
 ],
 examples:[
  ["九章算术·句股","《九章算术·卷九·句股》","今有圆材径二尺五寸，欲为方版，令厚七寸。问：广几何？","现有一根圆形木材，直径二尺五寸，要把它加工成厚七寸的方板。问：方板可以有多宽？","圆形木材横截面的直径","名词","diameter","“径二尺五寸”明确说明圆材横截面直径，和径寸的义项相同。","https://zh.wikisource.org/zh-hans/九章算術","径",1],
  ["周髀算经·卷上之二","《周髀算经·卷上之二》","冬至日道径四十七万六千里。","冬至那天太阳运行轨道的直径为四十七万六千里。","圆形轨道的直径","名词","diameter","“日道径”描述圆轨道的直径，而不是直接、径直。","https://zh.wikisource.org/zh-hans/周髀算經_(四庫全書本)/卷上之2","径",2]
 ]
}};
for(const [c,s]of Object.entries(words)){if(!s.sources.every(x=>x[1].includes(c)))throw Error("来源无原字");if(!s.examples.every(x=>x[2].includes(c)&&x[3]&&x[6]&&x[8].startsWith("https://")))throw Error("证据不足");}
window.WENYAN_VERIFIED_BATCH12={words};
})();
