/* 文言拾句：站长专用匿名访问统计 + 审核通过后才可能启用的广告位 */
(() => {
  "use strict";
  const config = window.WENYAN_SITE_CONFIG || {};
  const AD_CONSENT = "wenyan-ad-consent-v1";
  const yes = key => { try { return localStorage.getItem(key) === "yes"; } catch { return false; } };

  /*
   * Cloudflare Web Analytics 忽略 URL 查询参数。
   * 两个用户指定的分享链接使用不同的浏览器路径记录，避免混在一起；
   * 保留原查询参数和学习模式，刷新备用入口时仍能访问原始内容。
   */
  function mapAnalyticsEntryPath() {
    if (typeof window === "undefined" || !window.location || !window.history?.replaceState) return "unknown";
    const loc = window.location;
    if (!loc.pathname.endsWith("/wenyan/")) return "other";
    const params = new URLSearchParams(loc.search);
    const keys = [...params.keys()];
    let name = "";
    if (keys.length === 1 && params.get("view") === "library") {
      name = "entry-library.html";
    } else if (keys.length === 2 && params.get("v") === "20261111-char1"
        && params.get("utm_source") === "chatgpt.com") {
      name = "entry-char1-chatgpt.html";
    }
    if (!name) return "other";
    const alias = loc.pathname + name + loc.search + loc.hash;
    try {
      window.history.replaceState(window.history.state, "", alias);
      return name;
    } catch (error) {
      console.warn("入口统计路径转换失败，将按普通页面统计", error);
      return "other";
    }
  }

  function initAnalytics() {
    // 自动化课程校验在 Node.js VM 中运行；仅在真实浏览器注入统计脚本。
    if (typeof document === "undefined" || !document.head) return;
    // 在加载 Cloudflare beacon 前设置可区分的统计路径。
    mapAnalyticsEntryPath();
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
  // 仅在未来广告正式启用时展示广告许可；站长流量统计无前台许可按钮。
  function adsSettingsHTML() {
    if (!config.ads?.enabled) return "";
    return '<div class="sectionLabel">广告许可</div><p class="help">此选择仅涉及商业广告，不影响匿名网站访问统计。</p>' +
      '<div class="row"><button type="button" id="wenyan-ad-accept">监护人同意广告</button>' +
      '<button type="button" id="wenyan-ad-decline">拒绝／关闭广告</button></div>';
  }
  function bindAdSettings(root) {
    root.querySelector("#wenyan-ad-accept")?.addEventListener("click", () => {
      try { localStorage.setItem(AD_CONSENT, "yes"); } catch {}
      location.reload();
    });
    root.querySelector("#wenyan-ad-decline")?.addEventListener("click", () => {
      try { localStorage.setItem(AD_CONSENT, "no"); } catch {}
      location.reload();
    });
  }
  window.WENYAN_SITE = { mountAds, adsSettingsHTML, bindAdSettings };
  initAnalytics();
})();
