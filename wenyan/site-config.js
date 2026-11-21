/* 站长专用统计和未来广告配置。统计数据不在学生端展示。 */
window.WENYAN_SITE_CONFIG = Object.freeze({
  analytics: {
    provider: "cloudflare", // 免费、无 Cookie 的 Cloudflare Web Analytics
    cloudflareToken: "8e393a776e8c4a4a966d9d0960047e28",   // 到 Cloudflare Web Analytics 创建站点后填入 32 位 token
    // 仅在完成适用的未成年人隐私合规评估后才可启用其他追踪服务。
    baiduEnabled: false,
    baiduSiteId: "",
  },
  ads: {
    enabled: false,
    provider: "adsense",
    adsenseClient: "",
    slots: { library: "", afterReading: "" },
    customRenderer: null,
  },
});
