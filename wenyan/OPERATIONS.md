# 文言拾句：站长访问统计（面向大陆初中生）

## 重要定义
- 网站目前没有账号登录功能，所以不能叫“账号登录人数/登录次数”。
- PV（Page Views）是浏览量；Visits 是访问次数（依统计平台定义）；UV 是估算的访客数（不保证等于真实人数）。
- 这些指标必须通过有权限的统计平台后台核验，不把网页公开计数器当广告商认可的证明，也不能人为刷量。

## 本次更改
- 删除「我的」中统计数字、监护人同意/拒绝统计按钮和不蒜子代码。
- 统计改为站长专用 Cloudflare Web Analytics（无 Cookie，不采集个人信息，官方说明：https://developers.cloudflare.com/web-analytics/about/）。
- 仅在三个小古文入口页面植入统计接入口：/wenyan/、/wenyan/practice.html、/wenyan/coverage.html；隐私说明页不接入统计脚本。
- 广告位保留原布局但默认关闭，确保不打断学习。
- 不在未配置站点 token 时向任何第三方统计服务提交访问数据。

## 开通统计（唯一缺少站长平台站点 token）
1. 登录 https://dash.cloudflare.com/ ，Web Analytics -> Add a site。
2. 新增网站（GitHub Pages 当前使用的主机名：junweiqu-png.github.io）。Cloudflare 会提供一段包含 32 位 token 的网页统计代码。
3. 将 token 写入 `wenyan/site-config.js` 的 `analytics.cloudflareToken`。公开的 Web Analytics **站点 token** 可用于网页脚本，切勿填写 Cloudflare **API Token** 或密钥。
4. 推送代码后浏览 /wenyan/ 和 /wenyan/practice.html。用浏览器 Network 确认 beacon.min.js 已加载，并在 Cloudflare Web Analytics 仪表板按 Path 筛选 `/shanghan-selector/wenyan/`。不要和同一个 github.io 主机下其他项目汇总。
5. 后台只允许账号所有者访问；共享广告商时使用正规平台报表/授权查看方式，不发布可任意修改的公开数字。
6. 大陆网络对 Cloudflare 的可达性未做实测；统计漏报、广告拦截、脚本未运行等都可能使数字低于真实浏览。

Cloudflare 当前统计的 Visits 不等价于每隔30分钟重算一次的“会话”。网站内部切换51篇古文不会产生新的真实网页访问，不应伪造 PV。未来如需“每篇热度”，另行新增不含个人身份数据的聚合事件后端。

## 百度统计
百度统计站长版虽适合中国大陆，但其 UV 使用 Cookie 规则，面向可能未满14周岁的学生时，直接对所有人静默追踪可能涉及个人信息处理与监护人同意要求。当前配置 `baiduEnabled:false`，不要因为追求统计全面就自行启用。该服务应在完成隐私、未成年人及跨境等合规评估后才可考虑使用。

## 广告
`site-config.js` 仍保留 `ads.enabled: false` 与两个广告位置（library、afterReading），未来需要经过平台审核、未成年人广告合规与托管条款评估。广告授权与站长匿名统计是不同概念。
