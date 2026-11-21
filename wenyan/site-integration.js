/* 文言拾句：访问统计（按监护人同意）与后续广告位适配层。 */
(() => {
  "use strict";
  const config = window.WENYAN_SITE_CONFIG || {};
  const CONSENT = "wenyan-analytics-consent-v1";
  const AD_CONSENT = "wenyan-ad-consent-v1";
  const $ = id => document.getElementById(id);
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* private mode */ } },
  };
  const yes = key => storage.get(key) === "yes";
  function loadScript(src, callback) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    if (callback) script.onload = callback;
    script.onerror = () => { const status = $("wenyan-stat-status"); if (status) status.textContent = "统计服务暂不可用，不影响学习"; };
    document.head.appendChild(script);
  }
  function updateCounter() {
    const pv = $("busuanzi_page_pv"), uv = $("busuanzi_page_uv");
    const pvOut = $("wenyan-page-pv-value"), uvOut = $("wenyan-page-uv-value");
    if (pvOut && pv) pvOut.textContent = pv.textContent || "—";
    if (uvOut && uv) uvOut.textContent = uv.textContent || "—";
    const status = $("wenyan-stat-status");
    if (status && pv && pv.textContent && pv.textContent !== "读取中…") status.textContent = "访客计数已开启（仅统计同意使用计数的浏览器）";
  }
  function startStats() {
    if (!yes(CONSENT)) return;
    if (config.analytics?.counter) {
      const pv = $("busuanzi_page_pv"), uv = $("busuanzi_page_uv");
      const observer = new MutationObserver(updateCounter);
      if (pv) observer.observe(pv, { childList: true, characterData: true, subtree: true });
      if (uv) observer.observe(uv, { childList: true, characterData: true, subtree: true });
      loadScript("https://cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js", updateCounter);
    }
    const id = config.analytics?.baiduSiteId || "";
    if (/^[0-9a-f]{32}$/i.test(id)) {
      window._hmt = window._hmt || [];
      loadScript("https://hm.baidu.com/hm.js?" + id);
    }
  }
  function settingsHTML() {
    const consent = yes(CONSENT);
    const adsOn = Boolean(config.ads?.enabled);
    return '<div class="sectionLabel">网站访问统计</div>' +
      '<div class="wenyan-site-stats"><p>小古文当前网页浏览次数：<strong id="wenyan-page-pv-value">' +
      (consent ? "读取中…" : "未开启") + '</strong></p>' +
      '<p>当前网页访客计数：<strong id="wenyan-page-uv-value">' +
      (consent ? "读取中…" : "未开启") + '</strong></p>' +
      '<p class="wenyan-site-note" id="wenyan-stat-status">' +
      (consent ? "访客统计已同意；服务不可用时会保留学习功能" : "默认不启用第三方计数；需监护人同意后开始统计") +
      '</p><div class="row wenyan-consent"><button type="button" id="wenyan-stat-accept">监护人同意统计</button>' +
      '<button type="button" id="wenyan-stat-decline">拒绝／撤回同意</button></div>' +
      '<p class="wenyan-site-note">本统计仅针对当前网页，不把其他 GitHub 项目的访问量算进来；不同意也能完整学习。</p>' +
      '<p class="wenyan-site-note"><a href="privacy.html" target="_blank" rel="noopener noreferrer">隐私与未成年人保护说明 ↗</a></p></div>' +
      (adsOn ? '<div class="sectionLabel">广告许可（与访问统计分别选择）</div><div class="row">' +
      '<button type="button" id="wenyan-ad-accept">监护人同意非个性化广告</button>' +
      '<button type="button" id="wenyan-ad-decline">拒绝／关闭广告</button></div>' : '');
  }
  function bindSettings(root) {
    root.querySelector("#wenyan-stat-accept")?.addEventListener("click", () => {
      storage.set(CONSENT, "yes"); location.reload();
    });
    root.querySelector("#wenyan-stat-decline")?.addEventListener("click", () => {
      storage.set(CONSENT, "no"); location.reload();
    });
    root.querySelector("#wenyan-ad-accept")?.addEventListener("click", () => {
      storage.set(AD_CONSENT, "yes"); location.reload();
    });
    root.querySelector("#wenyan-ad-decline")?.addEventListener("click", () => {
      storage.set(AD_CONSENT, "no"); location.reload();
    });
    updateCounter();
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
        try { ads.customRenderer(target, placement, slot); } catch (e) { console.warn("广告位加载失败", e); host.replaceChildren(); return; }
      } else if (ads.provider === "adsense" &&
        /^ca-pub-\d+$/.test(ads.adsenseClient || "") && /^\d+$/.test(slot || "")) {
        const element = document.createElement("ins");
        element.className = "adsbygoogle";
        element.style.display = "block";
        element.dataset.adClient = ads.adsenseClient;
        element.dataset.adSlot = slot;
        element.dataset.adFormat = "auto";
        element.dataset.fullWidthResponsive = "true";
        element.dataset.tagForAgeTreatment = "1"; // 更保守的儿童保护标签（TFAT 2026）
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
  window.WENYAN_SITE = { settingsHTML, bindSettings, mountAds };
  startStats();
})();
