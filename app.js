/* ============================================================
   GEN Portal — Interactions
   ============================================================ */
(function () {
  'use strict';

  function RES(id){ return (window.__resources && window.__resources[id]) || ''; }

  var STORE_LANG = 'gen.lang';
  var STORE_THEME = 'gen.theme';

  /* ---------- Language ---------- */
  var lang = 'en';
  try { lang = localStorage.getItem(STORE_LANG) || 'en'; } catch (e) {}

  function applyLang(l) {
    lang = l;
    document.documentElement.setAttribute('data-lang-active', l);
    document.documentElement.lang = (l === 'zh') ? 'zh-CN' : 'en';
    var nodes = document.querySelectorAll('[data-en],[data-zh]');
    nodes.forEach(function (n) {
      var val = n.getAttribute(l === 'zh' ? 'data-zh' : 'data-en');
      if (val == null) return;
      // preserve child <span class="accent"> markers using {{ }} syntax
      if (val.indexOf('{{') !== -1) {
        n.innerHTML = val.replace(/\{\{(.+?)\}\}/g, '<span class="accent">$1</span>');
      } else {
        n.textContent = val;
      }
    });
    document.querySelectorAll('[data-ph-en],[data-ph-zh]').forEach(function (n) {
      var pv = n.getAttribute(l === 'zh' ? 'data-ph-zh' : 'data-ph-en');
      if (pv != null) n.setAttribute('placeholder', pv);
    });
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang-btn') === l);
    });
    try { localStorage.setItem(STORE_LANG, l); } catch (e) {}
  }

  /* ---------- Theme ---------- */
  var theme = 'blue'; // Global Trust — fixed

  function applyTheme(t) {
    theme = t;
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('[data-theme-card]').forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-theme-card') === t);
    });
    try { localStorage.setItem(STORE_THEME, t); } catch (e) {}
  }

  /* ---------- Boot (run early to avoid flash) ---------- */
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-lang-active', lang);

  document.addEventListener('DOMContentLoaded', __genInit);
  if (document.readyState !== 'loading') __genInit();
  function __genInit() {
    if (__genInit.done) return; __genInit.done = true;
    applyLang(lang);
    applyTheme(theme);

    /* lang buttons */
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang-btn')); });
    });

    /* theme popover */
    var themeBtn = document.getElementById('themeBtn');
    var themePop = document.getElementById('themePop');
    if (themeBtn && themePop) {
      themeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        themePop.classList.toggle('open');
      });
      document.addEventListener('click', function (e) {
        if (!themePop.contains(e.target) && e.target !== themeBtn) themePop.classList.remove('open');
      });
    }
    document.querySelectorAll('[data-theme-card]').forEach(function (c) {
      c.addEventListener('click', function () {
        applyTheme(c.getAttribute('data-theme-card'));
      });
    });

    /* nav scroll */
    var nav = document.getElementById('nav');
    function onScroll() {
      if (window.scrollY > 30) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* mobile menu */
    var burger = document.getElementById('burger');
    var mm = document.getElementById('mobileMenu');
    var mmClose = document.getElementById('mmClose');
    if (burger && mm) {
      burger.addEventListener('click', function () { mm.classList.add('open'); });
      if (mmClose) mmClose.addEventListener('click', function () { mm.classList.remove('open'); });
      mm.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { mm.classList.remove('open'); });
      });
    }

    /* tabs */
    var tabBtns = document.querySelectorAll('[data-tab]');
    var tabPanels = document.querySelectorAll('[data-panel]');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-tab');
        tabBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
        tabPanels.forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== id; });
      });
    });

    /* accordion */
    document.querySelectorAll('[data-acc]').forEach(function (item) {
      var head = item.querySelector('.acc-head');
      var body = item.querySelector('.acc-body');
      head.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('[data-acc]').forEach(function (other) {
          other.classList.remove('open');
          var ob = other.querySelector('.acc-body');
          if (ob) ob.style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('open');
          body.style.maxHeight = body.scrollHeight + 'px';
        }
      });
    });

    /* reveal on scroll */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    /* counter animation */
    var counted = false;
    function animateCounters() {
      if (counted) return; counted = true;
      document.querySelectorAll('[data-count]').forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var dur = 1400, start = performance.now();
        function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = Math.round(target * eased);
          el.textContent = val + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target + suffix;
        }
        requestAnimationFrame(tick);
      });
    }
    var numSection = document.getElementById('numbers');
    if (numSection) {
      var nio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { animateCounters(); nio.disconnect(); } });
      }, { threshold: 0.3 });
      nio.observe(numSection);
    }

    /* marquee — auto scroll right→left, pause on hover, arrow nudge */
    function initMarquee(trackId, marqueeId, prevId, nextId){
      var track = document.getElementById(trackId);
      var marquee = document.getElementById(marqueeId);
      if (!track || !marquee) return;
      var x = 0, paused = false, speed = 0.45;
      var half = track.scrollWidth / 2;
      function cardStep(){
        var c = track.querySelector('.adv-card');
        return c ? c.getBoundingClientRect().width + 16 : 316;
      }
      function norm(){ while (x <= -half) x += half; while (x > 0) x -= half; }
      // hold at the start until the row is actually on screen, so the first card
      // (Linda Painan, who founded GEN) is what you see on arrival — and so we
      // aren't animating off-screen
      var inView = true;
      if (window.IntersectionObserver) {
        inView = false;
        new IntersectionObserver(function (es) { inView = es[0].isIntersecting; },
                                 { threshold: 0.15 }).observe(marquee);
      }
      function frame(){
        if (!paused && inView) { x -= speed; norm(); track.style.transform = 'translateX(' + x + 'px)'; }
        requestAnimationFrame(frame);
      }
      // recompute half after fonts/layout settle
      window.addEventListener('load', function(){ half = track.scrollWidth / 2; });
      marquee.addEventListener('pointerenter', function(){ paused = true; });
      marquee.addEventListener('pointerleave', function(){ paused = false; });
      var prev = document.getElementById(prevId), next = document.getElementById(nextId);
      function nudge(dir){
        x += dir * cardStep(); norm(); track.style.transform = 'translateX(' + x + 'px)';
      }
      if (prev) prev.addEventListener('click', function(){ nudge(1); });
      if (next) next.addEventListener('click', function(){ nudge(-1); });
      requestAnimationFrame(frame);
    }
    initMarquee('advTrack','advMarquee','advPrev','advNext');
    initMarquee('tbTrack','tbMarquee','tbPrev','tbNext');

    /* open first accordion by default */
    var first = document.querySelector('[data-acc]');
    if (first) {
      first.classList.add('open');
      var fb = first.querySelector('.acc-body');
      if (fb) fb.style.maxHeight = fb.scrollHeight + 'px';
    }

    /* ---------- Lead-capture & contact modals ---------- */
    function genQR(){
      var N = 21, m = 7, sz = N * m, s = '';
      s += '<svg width="156" height="156" viewBox="0 0 ' + sz + ' ' + sz + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code">';
      s += '<rect width="' + sz + '" height="' + sz + '" fill="#fff"/>';
      var seed = 7; function rnd(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
      for (var y = 0; y < N; y++) { for (var x = 0; x < N; x++) {
        if ((x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)) continue;
        if (rnd() > 0.52) s += '<rect x="' + (x * m) + '" y="' + (y * m) + '" width="' + m + '" height="' + m + '" fill="#0B2A4A"/>';
      } }
      function fnd(fx, fy){
        s += '<rect x="' + (fx * m) + '" y="' + (fy * m) + '" width="' + (7 * m) + '" height="' + (7 * m) + '" fill="#0B2A4A"/>';
        s += '<rect x="' + ((fx + 1) * m) + '" y="' + ((fy + 1) * m) + '" width="' + (5 * m) + '" height="' + (5 * m) + '" fill="#fff"/>';
        s += '<rect x="' + ((fx + 2) * m) + '" y="' + ((fy + 2) * m) + '" width="' + (3 * m) + '" height="' + (3 * m) + '" fill="#0B2A4A"/>';
      }
      fnd(0, 0); fnd(N - 7, 0); fnd(0, N - 7);
      return s + '</svg>';
    }
    function SUCCESS(et, em, zt, zm){
      return '<div class="msuccess">'+
        '<div class="msuccess-ic"><svg class="ico" viewBox="0 0 24 24" style="width:30px;height:30px"><path d="M20 6 9 17l-5-5"/></svg></div>'+
        '<h3 data-en="' + et + '" data-zh="' + zt + '">' + et + '</h3>'+
        '<p data-en="' + em + '" data-zh="' + zm + '">' + em + '</p>'+
        '<button type="button" class="btn btn-primary" data-mclose style="width:auto;margin-top:20px" data-en="Done" data-zh="完成">Done</button>'+
      '</div>';
    }
    var LEAD_HTML =
      '<div class="modal-ov" id="leadModal" role="dialog" aria-modal="true">'+
        '<div class="modal-card">'+
          '<button class="modal-x" data-mclose aria-label="Close">\u00d7</button>'+
          '<div data-mbody>'+
            '<h3 data-en="Save analysis results &amp; view the full report" data-zh="保存分析结果，查看完整报告">Save analysis results &amp; view the full report</h3>'+
            '<p class="modal-sub" data-en="Register now to instantly view a detailed compliance path and a tailored service plan." data-zh="立即注册，即时查看详细合规路径与专属服务方案。">Register now to instantly view a detailed compliance path and a tailored service plan.</p>'+
            '<form data-mform novalidate>'+
              '<div class="mfield"><label><span class="req">*</span><span data-en="Name" data-zh="姓名">Name</span></label>'+
                '<input class="minput" name="name" data-ph-en="Please enter your name" data-ph-zh="请输入您的姓名"></div>'+
              '<div class="mfield"><label><span class="req">*</span><span data-en="Organization name" data-zh="单位名称">Organization name</span></label>'+
                '<input class="minput" name="org" data-ph-en="Please enter your company or organization name" data-ph-zh="请输入您的公司或组织名称"></div>'+
              '<div class="mfield"><label><span class="req">*</span><span data-en="Login method" data-zh="登录方式">Login method</span></label>'+
                '<div class="mseg" data-mseg>'+
                  '<button type="button" data-method="mobile"><svg class="ico" viewBox="0 0 24 24" style="width:15px;height:15px"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg><span data-en="Mobile number" data-zh="手机号">Mobile number</span></button>'+
                  '<button type="button" class="active" data-method="email"><svg class="ico" viewBox="0 0 24 24" style="width:15px;height:15px"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><span data-en="Email" data-zh="邮箱">Email</span></button>'+
                '</div></div>'+
              '<div class="mfield"><label><span class="req">*</span><span data-mcontact-label data-en="Email" data-zh="邮箱">Email</span></label>'+
                '<input class="minput" type="email" name="contact" data-mcontact data-ph-en="Please enter your email" data-ph-zh="请输入您的邮箱"></div>'+
              '<button type="submit" class="btn btn-primary" data-en="View the full report" data-zh="查看完整报告">View the full report</button>'+
            '</form>'+
          '</div>'+
          '<div data-msuccess hidden>' + SUCCESS("We've received your details", 'A GEN advisor will reach out within 5 minutes with your compliance path and tailored plan.', '我们已收到您的信息', 'GEN 顾问将在 5 分钟内与您联系，提供合规路径与专属方案。') + '</div>'+
        '</div>'+
      '</div>';
    var CONTACT_HTML =
      '<div class="modal-ov" id="contactModal" role="dialog" aria-modal="true">'+
        '<div class="modal-card" style="max-width:640px">'+
          '<button class="modal-x" data-mclose aria-label="Close">\u00d7</button>'+
          '<div data-mbody>'+
            '<h3 data-en="Talk to GEN" data-zh="联系 GEN">Talk to GEN</h3>'+
            '<p class="modal-sub" data-en="Scan to add your dedicated advisor on WeChat — or leave a message and we will reply within 5 minutes." data-zh="扫码添加专属顾问微信，或留言，我们将在 5 分钟内回复。">Scan to add your dedicated advisor on WeChat — or leave a message and we will reply within 5 minutes.</p>'+
            '<div class="contact-grid">'+
              '<div class="qr-box"><div class="qr-frame" data-qr></div>'+
                '<div class="qr-cap" data-en="Scan on WeChat to add your GEN advisor" data-zh="微信扫一扫，添加 GEN 顾问">Scan on WeChat to add your GEN advisor</div></div>'+
              '<form data-mform novalidate>'+
                '<div class="mfield"><label><span class="req">*</span><span data-en="Name" data-zh="姓名">Name</span></label><input class="minput" name="name" data-ph-en="Please enter your name" data-ph-zh="请输入您的姓名"></div>'+
                '<div class="mfield"><label><span class="req">*</span><span data-en="Email or phone" data-zh="邮箱或电话">Email or phone</span></label><input class="minput" name="contact" data-ph-en="How can we reach you?" data-ph-zh="请留下您的联系方式"></div>'+
                '<div class="mfield"><label><span data-en="Message" data-zh="留言">Message</span></label><textarea class="minput" name="msg" data-ph-en="Tell us what you need" data-ph-zh="请描述您的需求"></textarea></div>'+
                '<button type="submit" class="btn btn-primary" data-en="Send message" data-zh="发送留言">Send message</button>'+
              '</form>'+
            '</div>'+
          '</div>'+
          '<div data-msuccess hidden>' + SUCCESS('Message sent', 'Thanks for reaching out — a GEN advisor will reply within 5 minutes.', '留言已发送', '感谢您的留言，GEN 顾问将在 5 分钟内回复。') + '</div>'+
        '</div>'+
      '</div>';
    var TOOL_HTML =
      '<div class="modal-ov" id="toolModal" role="dialog" aria-modal="true">'+
        '<div class="modal-card">'+
          '<button class="modal-x" data-mclose aria-label="Close">\u00d7</button>'+
          '<div data-mbody>'+
            '<span class="tool-eyebrow" data-en="Free tool" data-zh="免费工具">Free tool</span>'+
            '<h3 data-tool-title data-en="" data-zh=""></h3>'+
            '<p class="modal-sub" data-tool-desc data-en="" data-zh=""></p>'+
            '<div class="tool-qr"><div class="qr-frame"><img data-tool-qr alt="QR code" width="200" height="200"></div>'+
              '<div class="qr-cap" data-en="Scan with your phone to try it free" data-zh="手机扫码，免费体验">Scan with your phone to try it free</div></div>'+
            '<a class="btn btn-primary" data-tool-link target="_blank" rel="noopener noreferrer" data-en="Open in browser" data-zh="在浏览器中打开">Open in browser</a>'+
          '</div>'+
        '</div>'+
      '</div>';
    var modalsRoot = document.createElement('div');
    modalsRoot.innerHTML = LEAD_HTML + CONTACT_HTML + TOOL_HTML;
    document.body.appendChild(modalsRoot);
    var qf = modalsRoot.querySelector('[data-qr]'); if (qf) qf.innerHTML = '<img src="' + (RES('qr') || 'assets/contact-qr.webp') + '" alt="WeChat QR code" style="width:100%;height:100%;object-fit:contain;display:block">';

    var openOv = null;
    function openModal(id){
      var ov = document.getElementById(id); if (!ov) return;
      var body = ov.querySelector('[data-mbody]'), succ = ov.querySelector('[data-msuccess]'), form = ov.querySelector('[data-mform]');
      if (body) body.hidden = false; if (succ) succ.hidden = true; if (form) form.reset();
      ov.classList.add('open'); openOv = ov; document.body.style.overflow = 'hidden';
    }
    function closeModal(){ if (openOv) { openOv.classList.remove('open'); openOv = null; document.body.style.overflow = ''; } }
    modalsRoot.querySelectorAll('[data-mclose]').forEach(function (b){ b.addEventListener('click', closeModal); });
    modalsRoot.querySelectorAll('.modal-ov').forEach(function (ov){ ov.addEventListener('click', function (e){ if (e.target === ov) closeModal(); }); });
    document.addEventListener('keydown', function (e){ if (e.key === 'Escape') closeModal(); });

    modalsRoot.querySelectorAll('[data-mseg]').forEach(function (seg){
      var card = seg.closest('.modal-card');
      seg.querySelectorAll('button').forEach(function (b){
        b.addEventListener('click', function (){
          seg.querySelectorAll('button').forEach(function (x){ x.classList.toggle('active', x === b); });
          var mth = b.getAttribute('data-method');
          var lbl = card.querySelector('[data-mcontact-label]'), inp = card.querySelector('[data-mcontact]');
          if (mth === 'mobile') { lbl.setAttribute('data-en', 'Mobile number'); lbl.setAttribute('data-zh', '手机号'); inp.setAttribute('data-ph-en', 'Please enter your mobile number'); inp.setAttribute('data-ph-zh', '请输入您的手机号'); inp.type = 'tel'; }
          else { lbl.setAttribute('data-en', 'Email'); lbl.setAttribute('data-zh', '邮箱'); inp.setAttribute('data-ph-en', 'Please enter your email'); inp.setAttribute('data-ph-zh', '请输入您的邮箱'); inp.type = 'email'; }
          applyLang(lang);
        });
      });
    });

    modalsRoot.querySelectorAll('[data-mform]').forEach(function (form){
      form.addEventListener('submit', function (e){
        e.preventDefault();
        var ov = form.closest('.modal-ov');
        var body = ov.querySelector('[data-mbody]'), succ = ov.querySelector('[data-msuccess]');
        if (body) body.hidden = true; if (succ) succ.hidden = false;
        applyLang(lang);
      });
    });

    document.querySelectorAll('a[data-en="Get a quote"]').forEach(function (a){
      a.addEventListener('click', function (e){ e.preventDefault(); openModal('contactModal'); });
    });
    document.querySelectorAll('a[data-en="Contact Us"], a[data-en="Contact us"]').forEach(function (a){
      a.addEventListener('click', function (e){ e.preventDefault(); openModal('contactModal'); });
    });
    function openTool(t){
      var m = document.getElementById('toolModal');
      var url = t.getAttribute('data-tool-url') || '#';
      function setBi(sel, en, zh){ var el = m.querySelector(sel); el.setAttribute('data-en', en || ''); el.setAttribute('data-zh', zh || ''); }
      setBi('[data-tool-title]', t.getAttribute('data-tool-en'), t.getAttribute('data-tool-zh'));
      setBi('[data-tool-desc]', t.getAttribute('data-tool-desc-en'), t.getAttribute('data-tool-desc-zh'));
      m.querySelector('[data-tool-qr]').src = 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=' + encodeURIComponent(url);
      m.querySelector('[data-tool-link]').setAttribute('href', url);
      applyLang(lang);
      openModal('toolModal');
    }
    document.querySelectorAll('[data-tool-url]').forEach(function (a){
      a.addEventListener('click', function (e){ e.preventDefault(); openTool(a); });
    });

    /* ---------- Service explainer carousel ---------- */
    var SERVICE_INFO = {
      ghg: {
        eyebrow:  { en: 'Service 02 · Organizational GHG Inventory', zh: '服务 02 · 组织温室气体盘查' },
        headline: { en: 'A carbon check-up for your whole company', zh: '为企业做一次“碳体检”' },
        pages: [
          {
            img: 'assets/svc-ghg-1.webp',
            title: { en: 'Not sure how much carbon your company emits in a year?', zh: '不知道公司一年到底排了多少碳？' },
            body:  { en: "Listing, ESG reporting, group or customer data requests, carbon-neutral planning — they all start with one number: your company's annual emissions and where they come from. But emission sources are scattered, methods inconsistent, and most teams don't know where to begin.", zh: '上市、发 ESG 报告、应对集团或大客户的数据要求、规划碳中和——第一步都得先算清“整个公司一年排多少碳、主要排在哪”。但排放源分散、口径不一、缺标准方法，企业常常无从下手。' },
            points: [
              { en: 'Electricity, fuel, vehicles, refrigerants… sources are scattered and hard to total', zh: '用电、油气、车辆、制冷剂…排放源散落，难以全面统计' },
              { en: 'No calculation method aligned to international standards (ISO 14064)', zh: '缺少对标国际标准（ISO 14064）的核算方法' },
              { en: 'ESG / CBAM / green power each recalculated separately — wasted effort', zh: 'ESG / CBAM / 绿电 各算各的，数据反复重做、浪费成本' }
            ]
          },
          {
            img: 'assets/svc-ghg-2.webp',
            title: { en: 'Map your full carbon footprint in one pass', zh: 'GEN 智能合规平台，帮你一次摸清碳家底' },
            body:  { en: 'Enter electricity, fuel and industry basics online for a second-by-second estimate of annual emissions and breakdown. For a formal report, our experts calculate Scope 1, Scope 2 (and supply-chain Scope 3) and issue an ISO 14064-aligned inventory report.', zh: '在线填入用电、油气、行业等基础信息，平台秒级估算全年排放与占比；需要正式报告时，由专家团队人工核算范围一、范围二（及供应链范围三），对标 ISO 14064 出具正式碳盘查报告。' },
            pointsLabel: { en: 'Deliverables', zh: '交付物' },
            points: [
              { en: 'Full-year GHG inventory (Scope 1 / 2 / 3)', zh: '全年温室气体排放清单（范围一 / 二 / 三）' },
              { en: 'Hot-spot identification + reduction advice', zh: '主要排放点识别 + 减排建议' },
              { en: 'Formal ISO 14064-aligned report, ready for third-party verification', zh: '对标 ISO 14064 的正式盘查报告，可对接第三方核查' },
              { en: 'Data reusable for ESG reports, CBAM and green-power procurement', zh: '数据可直接复用于 ESG 报告、CBAM、绿电采购' }
            ]
          },
          {
            img: 'assets/svc-ghg-3.webp',
            title: { en: 'One dataset, many uses', zh: '一份数据，多处通用' },
            bodyLabel: { en: "Who it's for", zh: '适用对象' },
            body:  { en: 'Companies (pre-)listing and reporting ESG · those asked by group or customers to report emissions · those planning carbon neutrality or green-factory certification', zh: '准备 / 已上市需发 ESG 报告 · 被集团或大客户要求上报碳排放 · 计划碳中和或申报绿色工厂' },
            pointsLabel: { en: 'Value', zh: '价值' },
            points: [
              { en: 'ISO 14064-aligned, full Scope 1 / 2 / 3 coverage', zh: '对标国际标准 ISO 14064，范围一 / 二 / 三全覆盖' },
              { en: 'Interoperable data — no duplicate calculation, lower total cost', zh: '数据互通，避免重复核算、降低整体成本' },
              { en: 'Proven across real estate, chemicals, manufacturing, logistics (incl. CDP-rating support for a HK-listed group)', zh: '已服务地产、化工、制造、物流等多行业（含港股上市公司 CDP 评级数据支撑）' }
            ]
          }
        ],
        leadIntro: { en: 'Tell us your needs — a GEN specialist will tailor an inventory plan.', zh: '留下需求，GEN 专家为你定制盘查方案。' }
      },
      esg: {
        eyebrow:  { en: 'Service 04 · ESG Reporting', zh: '服务 04 · ESG 报告撰写' },
        headline: { en: 'A compliant, polished ESG report in days', zh: '一本合规又好看的 ESG 报告，几天内成型' },
        pages: [
          {
            img: 'assets/svc-esg-1.webp',
            title: { en: 'A single ESG report can take weeks the traditional way', zh: '一本 ESG 报告，传统做法要耗上数周' },
            body:  { en: 'It spans Environmental, Social and Governance across a dozen-plus topics; data is gathered piece by piece from many departments while you dodge contradictions and disclosure gaps. Listings, tenders, customers and investors are all waiting — and the team is stuck in a long manual process.', zh: '覆盖环境、社会、治理三大领域、十余项议题，数据要从多个部门一点点收集，还要避免逻辑矛盾与披露盲点。上市、投标、客户与投资人都在催，团队却被冗长流程拖住。' },
            points: [
              { en: 'Multi-source data is scattered and slow to gather', zh: '多源数据分散，收集整理耗时' },
              { en: 'Disclosure standards (GRI / ISSB / exchange guidance) are complex — easy to miss requirements', zh: '披露标准（GRI / ISSB / 交易所指引）复杂，易踩合规盲点' },
              { en: 'Long manual drafting; hard to systematically avoid inconsistencies', zh: '人工撰写周期长，难以系统规避矛盾' }
            ]
          },
          {
            img: 'assets/svc-esg-2.webp',
            title: { en: 'AI rebuilds the workflow — a draft in minutes', zh: 'AI 重构编制流程，初稿分钟级生成' },
            body:  { en: 'Start with an ESG self-assessment (questionnaire → score + E/S/G radar + gap flags). For the full report, the GEN Intelligent Compliance Platform auto-integrates multi-source data, matches the disclosure framework and generates a draft in minutes; its AI then reviews data consistency, depth and wording item by item. Revise per the suggestions and export a compliant version in one click.', zh: '先做 ESG 披露自测打分（答问卷 → 评分 + E/S/G 雷达图 + 缺口提示）；正式编制时，GEN 智能合规平台自动整合多源数据、智能匹配披露框架、分钟级生成初稿，再由 AI 逐项审核数据口径、披露深度与表述规范，团队按建议修订即可一键输出合规版本。' },
            pointsLabel: { en: 'Deliverables', zh: '交付物' },
            points: [
              { en: 'ESG self-assessment score + E/S/G radar + gap flags', zh: 'ESG 披露自测评分 + E/S/G 雷达图 + 缺口提示' },
              { en: 'ESG report built to a mainstream standard (GRI / ISSB / exchange guidance)', zh: '按主流标准（GRI / ISSB / 交易所指引）编制的 ESG 报告' },
              { en: 'AI review + professional design', zh: 'AI 审核 + 专业排版美化' },
              { en: 'Optional: support for MSCI, CDP and other rating questionnaires', zh: '可选：协助应对 MSCI、CDP 等评级问卷' }
            ]
          },
          {
            img: 'assets/svc-esg-3.webp',
            title: { en: 'From weeks to about one week', zh: '数周 → 约一周' },
            bodyLabel: { en: 'Process', zh: '流程' },
            body:  { en: 'Self-assessment → data integration → AI-generated draft → AI review & revision → compliant delivery', zh: '自测打分 → 数据整合 → 智能生成初稿 → AI 审核修订 → 合规交付' },
            pointsLabel: { en: 'Value', zh: '价值' },
            points: [
              { en: 'Covers 17+ E / S / G topics', zh: '覆盖 17+ 项 E / S / G 议题' },
              { en: 'Cycle compressed from weeks to about one week; draft in minutes', zh: '编制周期由数周压缩至约 1 周，初稿分钟级' },
              { en: 'Backed by real carbon data — no empty claims', zh: '报告背后有真实碳数据支撑，不说空话' },
              { en: 'Meets compliance and lifts ratings & public image', zh: '既能合规交差，又能拿评级、提升对外形象' }
            ]
          }
        ],
        leadIntro: { en: 'Tell us your needs — a GEN specialist will tailor a reporting plan.', zh: '留下需求，GEN 专家为你定制报告方案。' }
      },
      green: {
        eyebrow:  { en: 'Service 05 · Green Power & RECs', zh: '服务 05 · 绿电绿证采购' },
        headline: { en: 'How much, how to buy, whether it offsets — sorted', zh: '该买多少、怎么买、能不能抵扣，一次说清' },
        pages: [
          {
            img: RES('green1') || 'assets/svc-green-1.webp',
            title: { en: "Want green power but don't know where to start?", zh: '想用绿电，却不知从何买起？' },
            body:  { en: "Customers require green power, you're aiming for RE100, exports demand renewables, or you've done CBAM and want to offset costs — but branches are scattered, usage is small, markets differ by region, and many sites don't even have a separate meter to trade green power directly.", zh: '客户要求用绿电、要做 RE100、出口被要求可再生电力、或做了 CBAM 想抵扣成本——但分支机构分散、用电规模小、各地市场不一，很多场所连独立电表都没有，无法直接参与绿电交易。' },
            points: [
              { en: 'Unclear how much to buy, or how to buy most cost-effectively', zh: '不清楚该买多少绿电 / 绿证、怎么买最划算' },
              { en: 'Scattered small sites struggle to join market trading', zh: '分散的小站点难以参与市场化交易' },
              { en: 'Fear of “fake” certificates or double-counted attributes hurting compliance', zh: '担心买到“假证”或绿色权益被重复计算，影响合规' }
            ]
          },
          {
            img: RES('green2') || 'assets/svc-green-2.webp',
            title: { en: 'Traceable green energy, delivered end-to-end', zh: '可溯源的绿色用能，一站式交付' },
            body:  { en: 'GEN sizes your demand and offers multiple paths — international RECs (I-REC), domestic GEC, and VPPA. Every green attribute has a clear, unique, third-party-verifiable origin with online traceability, so nothing is double-counted.', zh: 'GEN 帮你测算需求，提供国际绿证 I-REC、国内绿证 GEC、VPPA 虚拟电力采购等多种路径；每一份绿色权益来源清晰、唯一、可第三方鉴证，并支持在线溯源，确保不被重复计算。' },
            pointsLabel: { en: 'Deliverables', zh: '交付物' },
            points: [
              { en: 'Demand sizing + an optimal procurement plan', zh: '绿电 / 绿证需求测算 + 最优采购方案' },
              { en: 'Multi-path procurement & settlement (I-REC / GEC / VPPA)', zh: 'I-REC / GEC / VPPA 多路径采购与交割' },
              { en: 'Traceable, unique, third-party-verifiable green certificates', zh: '可溯源、权益唯一、第三方可鉴证的绿色凭证' },
              { en: 'Paired with your inventory / CBAM for the most cost-effective offset plan', zh: '结合碳盘查 / CBAM，给出“怎么买最划算”的抵扣方案' }
            ]
          },
          {
            img: RES('green3') || 'assets/svc-green-3.webp',
            title: { en: 'From renewable source to your compliance proof — fully traceable', zh: '从可再生电站到你的合规凭证，全程可查' },
            bodyLabel: { en: "Who it's for", zh: '适用对象' },
            body:  { en: 'Meeting customer green-power / RE100 requirements · exports requiring renewables · offsetting CBAM costs · green-factory / LEED certification', zh: '需满足客户绿电要求 / RE100 · 出口被要求使用可再生电力 · 做了 CBAM 想抵扣碳成本 · 申报绿色工厂 / LEED 认证' },
            pointsLabel: { en: 'Value', zh: '价值' },
            points: [
              { en: 'Covers three mainstream paths: I-REC, GEC, VPPA', zh: '覆盖 I-REC、GEC、VPPA 三种主流路径' },
              { en: 'Online traceability — unique attributes, no double-counting', zh: '在线溯源，权益唯一、不可重复计算' },
              { en: 'Capacity to deliver nearly 2 million certificates in a single order', zh: '单笔最大可交付近 200 万张绿证规模' }
            ]
          }
        ],
        leadIntro: { en: 'Tell us your needs — a GEN specialist will size and tailor a green-power plan.', zh: '留下需求，GEN 专家为你测算并定制绿电方案。' }
      }
    };

    function setBi(el, d){ if (!el) return; el.setAttribute('data-en', d.en); el.setAttribute('data-zh', d.zh); }
    function biNode(tag, cls, d){ var e = document.createElement(tag); if (cls) e.className = cls; if (d) setBi(e, d); return e; }

    var SVC_LEAD_FIELDS =
      '<div class="mfield"><label><span class="req">*</span><span data-en="Name" data-zh="姓名">Name</span></label>'+
        '<input class="minput" name="name" data-ph-en="Your name" data-ph-zh="您的姓名"></div>'+
      '<div class="mfield"><label><span class="req">*</span><span data-en="Company" data-zh="公司">Company</span></label>'+
        '<input class="minput" name="company" data-ph-en="Company name" data-ph-zh="公司名称"></div>'+
      '<div class="mfield"><label><span class="req">*</span><span data-en="Phone / Email" data-zh="联系方式">Phone / Email</span></label>'+
        '<input class="minput" name="contact" data-ph-en="Phone or email" data-ph-zh="手机 / 邮箱"></div>'+
      '<div class="mfield"><label><span data-en="Your needs" data-zh="需求简述">Your needs</span></label>'+
        '<textarea class="minput" name="needs" data-ph-en="Briefly describe your needs (industry, export region, goals)" data-ph-zh="您的需求（行业、出口地区、目标等）"></textarea></div>'+
      '<div class="svc-privacy"><svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'+
        '<span data-en="Used only to contact you about this enquiry; never shared with third parties." data-zh="我们仅用于本次咨询联系，不会向第三方泄露。"></span></div>';

    var SVC_HTML =
      '<div class="modal-ov smodal" id="svcModal" role="dialog" aria-modal="true">'+
        '<div class="modal-card smodal-card">'+
          '<button class="modal-x" data-mclose aria-label="Close">\u00d7</button>'+
          '<div class="smodal-top">'+
            '<span class="smodal-eyebrow" data-svc-eyebrow></span>'+
            '<div class="smodal-headline" data-svc-headline></div>'+
          '</div>'+
          '<div class="smodal-viewport"><div class="smodal-track" data-svc-track></div></div>'+
          '<div class="smodal-foot" data-svc-foot>'+
            '<div class="smodal-dots" data-svc-dots></div>'+
            '<div class="smodal-nav">'+
              '<button type="button" class="btn btn-ghost smodal-back" data-svc-back data-en="Back" data-zh="上一步">Back</button>'+
              '<button type="button" class="btn btn-primary smodal-next" data-svc-next data-en="Next" data-zh="下一步">Next</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';
    var svcRoot = document.createElement('div');
    svcRoot.innerHTML = SVC_HTML;
    document.body.appendChild(svcRoot);

    var svc = document.getElementById('svcModal');
    var svcVp    = svc.querySelector('.smodal-viewport');
    var svcTrack = svc.querySelector('[data-svc-track]');
    var svcDots  = svc.querySelector('[data-svc-dots]');
    var svcFoot  = svc.querySelector('[data-svc-foot]');
    var svcBack  = svc.querySelector('[data-svc-back]');
    var svcNext  = svc.querySelector('[data-svc-next]');
    var svcIdx = 0, svcTotal = 0;

    function fitSvcHeight(){
      var page = svcTrack.children[svcIdx];
      if (!page) return;
      var cardMax = window.innerHeight * 0.9;
      var topH = svc.querySelector('.smodal-top').offsetHeight;
      var footH = (svcFoot.style.display === 'none') ? 0 : svcFoot.offsetHeight;
      var avail = cardMax - topH - footH;
      var natural = page.scrollHeight;
      svcVp.style.height = Math.min(natural, Math.max(avail, 120)) + 'px';
    }

    function buildContentPage(p){
      var page = document.createElement('div'); page.className = 'svc-page svc-page-content';
      var fig = document.createElement('div'); fig.className = 'svc-fig';
      var img = document.createElement('img'); img.src = p.img; img.alt = ''; img.loading = 'lazy';
      img.addEventListener('load', function(){ fitSvcHeight(); });
      fig.appendChild(img);
      var copy = document.createElement('div'); copy.className = 'svc-copy';
      copy.appendChild(biNode('h3', null, p.title));
      if (p.bodyLabel) copy.appendChild(biNode('span', 'svc-eyebrow-sm', p.bodyLabel));
      copy.appendChild(biNode('p', 'svc-body', p.body));
      if (p.pointsLabel) copy.appendChild(biNode('span', 'svc-eyebrow-sm', p.pointsLabel));
      if (p.points && p.points.length){
        var ul = document.createElement('ul'); ul.className = 'svc-points';
        p.points.forEach(function(pt){ var li = document.createElement('li'); li.appendChild(biNode('span', null, pt)); ul.appendChild(li); });
        copy.appendChild(ul);
      }
      page.appendChild(fig); page.appendChild(copy);
      return page;
    }
    function buildLeadPage(info){
      var page = document.createElement('div'); page.className = 'svc-page svc-page-lead';
      var wrap = document.createElement('div'); wrap.setAttribute('data-svc-formwrap', '');
      wrap.appendChild(biNode('p', 'svc-lead-intro', info.leadIntro));
      var form = document.createElement('form'); form.setAttribute('data-svc-form', ''); form.setAttribute('novalidate', '');
      form.innerHTML = SVC_LEAD_FIELDS;
      form.addEventListener('submit', function(e){ e.preventDefault(); });
      form.querySelectorAll('.minput').forEach(function(inp){ inp.addEventListener('input', function(){ inp.classList.remove('invalid'); }); });
      wrap.appendChild(form);
      page.appendChild(wrap);
      var succ = document.createElement('div'); succ.className = 'svc-success'; succ.setAttribute('data-svc-success', ''); succ.hidden = true;
      succ.innerHTML = SUCCESS('Received', 'A GEN specialist will contact you within 2 hours.', '已收到', 'GEN 专家将在 2 小时内与您联系。');
      page.appendChild(succ);
      return page;
    }
    function svcGoTo(i){
      svcIdx = Math.max(0, Math.min(svcTotal - 1, i));
      svcTrack.style.transform = 'translateX(-' + (svcIdx * 100) + '%)';
      Array.prototype.forEach.call(svcDots.children, function(d, j){ d.classList.toggle('on', j === svcIdx); });
      svcBack.hidden = svcIdx === 0;
      var last = svcIdx === svcTotal - 1;
      setBi(svcNext, { en: last ? 'Submit' : 'Next', zh: last ? '提交需求' : '下一步' });
      applyLang(lang);
      fitSvcHeight();
    }
    function renderSvc(info){
      svcTrack.innerHTML = '';
      info.pages.forEach(function(p){ svcTrack.appendChild(buildContentPage(p)); });
      svcTrack.appendChild(buildLeadPage(info));
      svcTotal = info.pages.length + 1;
      svcDots.innerHTML = '';
      for (var i = 0; i < svcTotal; i++) svcDots.appendChild(document.createElement('i'));
      setBi(svc.querySelector('[data-svc-eyebrow]'), info.eyebrow);
      setBi(svc.querySelector('[data-svc-headline]'), info.headline);
      svcFoot.style.display = '';
      svcNext.style.display = '';
      svcGoTo(0);
    }
    function svcSubmit(){
      var page = svcTrack.children[svcTotal - 1];
      var form = page.querySelector('[data-svc-form]');
      var ok = true;
      ['name', 'company', 'contact'].forEach(function(n){
        var inp = form.querySelector('[name="' + n + '"]');
        if (!inp.value.trim()){ inp.classList.add('invalid'); ok = false; }
      });
      if (!ok){ var bad = form.querySelector('.invalid'); if (bad) bad.focus(); return; }
      page.querySelector('[data-svc-formwrap]').hidden = true;
      page.querySelector('[data-svc-success]').hidden = false;
      svcFoot.style.display = 'none';
      applyLang(lang);
      fitSvcHeight();
    }
    svcBack.addEventListener('click', function(){ svcGoTo(svcIdx - 1); });
    svcNext.addEventListener('click', function(){ if (svcIdx < svcTotal - 1) svcGoTo(svcIdx + 1); else svcSubmit(); });
    svc.addEventListener('click', function(e){
      if (e.target === svc){ closeModal(); return; }
      if (e.target.closest('[data-mclose]')) closeModal();
    });
    document.querySelectorAll('[data-service-modal]').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        var info = SERVICE_INFO[a.getAttribute('data-service-modal')];
        if (!info) return;
        renderSvc(info);
        openModal('svcModal');
        requestAnimationFrame(fitSvcHeight);
      });
    });
    window.addEventListener('resize', function(){ if (svc.classList.contains('open')) fitSvcHeight(); });

    initBackToTop();

    applyLang(lang);
  }

  /* ---------- Back to top ---------- */
  function initBackToTop(){
    if (document.querySelector('.to-top')) return;
    var btn = document.createElement('button');
    btn.className = 'to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', lang === 'zh' ? '回到顶部' : 'Back to top');
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(btn);
    btn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    var ticking = false;
    function update(){ ticking = false; btn.classList.toggle('show', (window.pageYOffset || document.documentElement.scrollTop) > 480); }
    window.addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
})();
