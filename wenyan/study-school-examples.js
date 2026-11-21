/* 课堂义项优先：依据教材/教学参考的常用释义，逐条核对原典。
 * 句译由本站按完整语境编写；不复制教辅整段译文。
 * 同义项代码沿用正文，不把“连接”“装饰”“紧跟”混作一义。
 */
(()=>{"use strict";
const words={
 "缀":{examples:[
  ["送东阳马生序","宋濂《送东阳马生序》","犹幸预君子之列，而承天子之宠光，缀公卿之后。","我还幸运地列入君子的行列，承受天子的恩宠，跟随在公卿之后。","跟随、追随","实词","lesson-狼-缀","跟随在后，与《狼》的“紧跟”义相同。","https://zh.wikisource.org/zh-hans/送東陽馬生序","缀",1],
  ["后汉书·段颎传","范晔《后汉书·卷六十五》","颎遂与相连缀，且斗且引，及于灵武谷。","段颎于是紧追着对方；对方边战边退，一直到了灵武谷。","紧跟、追随","实词","lesson-狼-缀","上文“共追之”说明这是追击中的紧紧跟随。","https://zh.wikisource.org/zh-hans/後漢書/卷65","缀",2],
  ["小石潭记","柳宗元《小石潭记》","青树翠蔓，蒙络摇缀，参差披拂。","青翠的树木和藤蔓，遮盖缠绕，摇动下垂，长短不齐，随风飘拂。","连缀；这里指下垂","实词","hang-connect","“摇缀”即摇动下垂，与跟随行走不同。","https://zh.wikisource.org/zh-hans/小石潭記","缀",3],
  ["战国策·苏秦始将连横","《战国策·秦策一》","于是，乃废文任武，厚养死士，缀甲厉兵，效胜于战场。","于是放弃文治而任用武力，优厚地供养敢死之士，缝制铠甲、磨快兵器，在战场上争取胜利。","缝合、缝制","实词","sew","“缀甲”指把制作铠甲的甲片连缀起来。","https://zh.wikisource.org/zh-hans/戰國策/秦一","缀",4],
  ["芙蕖","李渔《闲情偶寄·种植部》","自荷钱出水之日，便为点缀绿波。","从圆小如钱的荷叶刚长出水面那天起，它就装点着碧绿的水波。","点缀、装饰","实词","lesson-买椟还珠-缀","“点缀绿波”指装点水面。","https://zh.wikisource.org/zh-hans/閒情偶寄/種植部/草本第三","缀",5],
  ["李娃传","白行简《李娃传》","伺其疲倦，即谕之缀诗赋。","等他疲倦时，就让他写诗作赋。","写作；组织文字成篇","实词","compose","“缀诗赋”是连缀文字，写成诗赋。","https://zh.wikisource.org/zh-hans/李娃傳","缀",6]
 ]}
};
const target=window.WENYAN_LESSON_CHARACTER_GLOSSES;
for(const [char,spec]of Object.entries(words)){
 if(!spec.examples.every(x=>x[2].includes(char)&&x[3]&&x[4]&&x[6]&&x[8].startsWith("https://")))throw Error("课堂例句字段缺失："+char);
 const entry=target.words[char]||(target.words[char]={sources:[],examples:[]});
 entry.examples.push(...spec.examples);
}
window.WENYAN_SCHOOL_EXAMPLES={words,references:[
 {title:"《狼》教学参考",url:"https://www.ate.gov.hk/tchinese/doc/aw_CLE_1819/reference/B_pdf/Qing_Lang.pdf"},
 {title:"《送东阳马生序》课文注释",url:"https://m.gushiwen.cn/shiwenv_6fb0a58e157c.aspx"},
 {title:"古汉语字典·缀",url:"https://www.zdic.net/hans/缀"}
]};
})();
