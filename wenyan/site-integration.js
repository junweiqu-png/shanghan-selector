/* 文言拾句：站长专用匿名访问统计 + 审核通过后才可能启用的广告位 */
(() => {
  "use strict";
  const config = window.WENYAN_SITE_CONFIG || {};
  const AD_CONSENT = "wenyan-ad-consent-v1";
  const yes = key => { try { return localStorage.getItem(key) === "yes"; } catch { return false; } };

  function initAnalytics() {
    const a = config.analytics || {};
    // 无有效站点 token 时不加载任何统计脚本，也不会产生虚假的计数。
    if (a.provider === "cloudflare" && /^[a-f0-9]{32}$/i.test(a.cloudflareToken || "")) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://static.cloudflareinsights.com/beacon.min.js";
      script.setAttribute("data-cf-beacon", JSON.stringify({ token: a.cloudflareToken, spa: false }));
      script.onerror = () => console.warn("Cloudflare 统计脚本加载失败；学习功能不受影响");
      document.head.appendChild(script);
    }
    // 百度统计存在使用 Cookie 的情况，面向未成年人时不得仅凭填写 ID 自动启用。
    if (a.baiduEnabled === true && /^[a-f0-9]{32}$/i.test(a.baiduSiteId || "")) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://hm.baidu.com/hm.js?" + a.baiduSiteId;
      document.head.appendChild(script);
    }
  }

  function mountAds(root) {
    const ads = config.ads || {};
    if (!ads.enabled || !yes(AD_CONSENT)) return;
    root.querySelectorAll("[data-wenyan-ad]").forEach(host => {
      if (host.dataset.adMounted === "1") return;
      const placement = host.dataset.wenyanAd;
      if (!Object.prototype.hasOwnProperty.call(ads.slots || {}, placement)) return;
      const slot = ads.slots[placement];
      if (!slot && ads.provider !== "custom") return;
      const label = document.createElement("small");
      label.className = "wenyan-ad__label";
      label.textContent = "广告 · 与学习内容无关";
      host.appendChild(label);
      if (ads.provider === "custom" && typeof ads.customRenderer === "function") {
        const target = document.createElement("div");
        host.appendChild(target);
        try { ads.customRenderer(target, placement, slot); }
        catch (e) { console.warn("广告位加载失败", e); host.replaceChildren(); return; }
      } else if (ads.provider === "adsense" &&
        /^ca-pub-\d+$/.test(ads.adsenseClient || "") && /^\d+$/.test(slot || "")) {
        const element = document.createElement("ins");
        element.className = "adsbygoogle";
        element.style.display = "block";
        element.dataset.adClient = ads.adsenseClient;
        element.dataset.adSlot = slot;
        element.dataset.adFormat = "auto";
        element.dataset.fullWidthResponsive = "true";
        element.dataset.tagForAgeTreatment = "1";
        (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
        host.appendChild(element);
        if (!document.querySelector('script[data-wenyan-adsense]')) {
          const loader = document.createElement("script");
          loader.async = true;
          loader.dataset.wenyanAdsense = "1";
          loader.crossOrigin = "anonymous";
          loader.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
            encodeURIComponent(ads.adsenseClient);
          document.head.appendChild(loader);
        }
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
        catch (e) { console.warn("广告联盟尚未就绪", e); }
      } else {
        host.replaceChildren();
        return;
      }
      host.hidden = false;
      host.dataset.adMounted = "1";
    });
  }
  window.WENYAN_SITE = { mountAds };
  initAnalytics();
})();
