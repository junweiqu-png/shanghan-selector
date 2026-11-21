/* 小古文站点运营配置。只改此文件即可接入后续统计及合规广告。 */
window.WENYAN_SITE_CONFIG = Object.freeze({
  analytics: {
    counter: true, // 不蒜子：只有监护人同意后才加载
    baiduSiteId: "", // 百度统计 hm.js 的站点 ID；不需要时留空
  },
  ads: {
    enabled: false, // 通过平台审核及隐私合规审查之前必须保持 false
    provider: "adsense", // adsense；国内广告平台可用下面的 customRenderer
    adsenseClient: "", // ca-pub-...
    slots: {
      library: "", // 篇目列表底部的广告位 ID
      afterReading: "", // 整篇阅读末尾的广告位 ID
    },
    // 国内广告联盟如需特殊投放代码，仅在这里实现渲染，无需更改学习页面。
    customRenderer: null,
  },
});
