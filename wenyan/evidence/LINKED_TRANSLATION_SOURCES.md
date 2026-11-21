# 关联例句的译注来源

正文仍为 51 篇、320 段、6446 个汉字位置。扩展例句不进入正文覆盖率分母。

学生先读原文，点击小三角查看句译、字义与异同比较。刷新、换句、新开字卡时答案默认收起。教材例句优先，扩展材料按字分片加载。

## 取材与校译顺序

1. 已整理的课文及初高中常用释义。保留原文语境，不把某篇的指代对象套给别篇。
2. [NiuTrans/Classical-Modern](https://github.com/NiuTrans/Classical-Modern) 的古今对照语料，MIT 许可，扫描 972467 组原文、译文。只选短而可读、有完整对应译文的片段；词典义必须命中该字附近的对应译法，不能只在整段译文中找到同一个词就强行套义。此层在卡片上标为“参考字义”，不冒称逐条人工审定。
3. [mapull/chinese-dictionary](https://github.com/mapull/chinese-dictionary) 的 MIT 字典，提供旁查释义，并补充例句内所有生字的字典查询。
4. 原典仍不足时，直接核对原文并编写句译、字义。本批另补 165 条，包括唐宋诗、古文、字书及明确标识的明代白话小说。诗句原文来自 [chinese-poetry/chinese-poetry](https://github.com/chinese-poetry/chinese-poetry)，MIT 许可；补译为本站编写，未复制教辅整段译文。

教学参考包括[《狼》教学材料](https://www.ate.gov.hk/tchinese/doc/aw_CLE_1819/reference/B_pdf/Qing_Lang.pdf)、[《送东阳马生序》课文注释](https://m.gushiwen.cn/shiwenv_6fb0a58e157c.aspx)和古汉语工具书。常用课堂释义优先；不将古籍对照语料说成教材出版社审定版本。

## 数据与验收

- `linked-reviewed.json` 保存逐条核对、补译的原文、译文、字义及出处；`linked-lexicon.json` 保存检索时用的义项和现代译法，不是生成原文的模板。
- `linked-examples/00.json` 至 `63.json` 为已准备好字义、句译、出处的例句；`manifest.json` 记录数量及来源等级。阅读时无需下载原始全文库。
- 以原文内容去重，排除当前文章及改标题后重复出现的原句。姓名用字独立处理，不以人物姓名命中充当普通字义的同义例句。
- “㘎”的两篇本字材料之外，另保留原文作通用字“阚”的例句，明确显示原字形，不篡改引用。通用字形白名单只允许有依据的字形关系。
- 报告中的旧字段 `reviewedExamples` 为兼容已有页面保留，现在表示有句译与字义的关联篇数，包含明确标识的参考译注；不是人工审校证明。五篇关联与两篇同义分别统计，不把“有五篇”说成所有义项均已达到两篇同义要求。
- `test-related-learning.mjs` 实际执行卡片渲染和按字加载，检查答案全部收起、缓存、来源和译注不空；覆盖报告与学生卡片共用同一查义、去重、比较逻辑。

原始语料不随站点下载。重新生成时，将 MIT 原始字典与 Classical-Modern 语料传给 `scripts/build-linked-examples.py`；脚本自动合并 `linked-reviewed.json` 和已校正的译注。使用 `extend-linked-dictionary.py` 扩充旁查字典，运行测试后发布。
