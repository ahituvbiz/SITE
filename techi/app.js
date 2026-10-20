/* תח"י: כלי להכנת תכנית חינוכית יחידנית מטופס רמזור. הכול רץ בדפדפן; אין שרת. */
(function () {
  'use strict';
  var D = window.TECHI_DATA;
  if (!D) { document.getElementById('step1').textContent = 'שגיאה: קובץ הנתונים לא נטען.'; return; }
  var PARAMS = D.params;
  var PMAP = new Map(PARAMS.map(function (p) { return [String(p.id), p]; }));
  var LIT = D.literacy.items;
  var LMAP = new Map(LIT.map(function (i) { return [i.id, i]; }));
  var LEVELS = D.levels;
  var LVMAP = new Map(LEVELS.map(function (l) { return [l.id, l]; }));
  var DOMS = D.domains;
  var DMAP = new Map(DOMS.map(function (d) { return [d.id, d]; }));
  var TPL = D.templates;
  var GT = TPL.goalTypes;
  var GTMAP = new Map(GT.map(function (g) { return [g.id, g]; }));
  var BANK = D.bank;
  var BMAP = new Map(BANK.map(function (b) { return [b.id, b]; }));
  var STORAGE_KEY = 'techi.v1';
  var STRENGTH_CAP = 7;
  var MAX_GOALS = 5;

  /* ---------- כלים ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style') el.style.cssText = v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'open') el[k] = !!v;
        else if (k === 'value') el.value = v;
        else el.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) appendKids(el, arguments[i]);
    return el;
  }
  function appendKids(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { appendKids(el, x); }); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDate(iso) { if (!iso) return ''; var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); return m ? (parseInt(m[3], 10) + '/' + parseInt(m[2], 10) + '/' + m[1]) : iso; }
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function status(msg) { $('#saveStatus').textContent = msg; }
  function isParamTrig(t) { return /^\d+$/.test(String(t)); }
  function ageAt(birth, at) {
    if (!birth) return null;
    var b = new Date(birth), a = at ? new Date(at) : new Date();
    if (isNaN(b.getTime()) || isNaN(a.getTime())) return null;
    var y = a.getFullYear() - b.getFullYear(), m = a.getMonth() - b.getMonth();
    if (a.getDate() < b.getDate()) m--;
    if (m < 0) { y--; m += 12; }
    if (y < 0) return null;
    return { y: y, m: m, dec: y + m / 12 };
  }
  var MONTH_WORDS = ['', 'חודש', 'חודשיים', 'שלושה חודשים', 'ארבעה חודשים', 'חמישה חודשים', 'חצי', 'שבעה חודשים', 'שמונה חודשים', 'תשעה חודשים', 'עשרה חודשים', 'אחד עשר חודשים'];
  function ageText(age, g) {
    if (!age) return '';
    var bt = g === 'f' ? 'בת' : 'בן';
    if (age.m === 0) return bt + ' ' + age.y;
    return bt + ' ' + age.y + ' ו' + MONTH_WORDS[age.m];
  }
  function ageLabel(age) { if (!age) return ''; return age.y + (age.m ? '.' + age.m : ''); }

  /* ---------- אחסון ---------- */
  var store = loadStore();
  var cur = null;
  function loadStore() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) { s = null; }
    if (!s || !s.children) s = { children: {}, order: [], current: null, prefs: {} };
    if (!s.prefs) s.prefs = {};
    if (!s.order) s.order = Object.keys(s.children);
    return s;
  }
  var saveTimer = null;
  function save(skipDrive) {
    if (cur && !skipDrive) { cur.driveDirty = true; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        if (cur) { cur.updated = Date.now(); Object.assign(store.prefs, { gan: cur.info.gan, manager: cur.info.manager, teacher: cur.info.teacher, matya: cur.info.matya, partners: cur.info.partners }); }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        var d = new Date();
        status('נשמר בדפדפן ' + pad(d.getHours()) + ':' + pad(d.getMinutes()));
      } catch (e) { status('שגיאת שמירה (אין מקום בדפדפן?)'); }
      if (!skipDrive) scheduleDriveSave(cur);
      renderDriveBar();
    }, 250);
  }
  function newChild() {
    var p = store.prefs || {};
    return {
      id: uid(), created: Date.now(), updated: Date.now(), step: 1,
      info: { name: '', gender: 'f', birth: '', year: '1', kupa: '', gan: p.gan || '', manager: p.manager || '', teacher: p.teacher || 'רחל אחיטוב', date: todayISO(), partners: p.partners || 'מנהלת גן, גננת שילוב, והורים', treatments: '', matya: p.matya || 'מתי"א שלהבת' },
      ratings: {}, literacy: {},
      narrative: { picks: {}, free: '', text: '', manual: false },
      profile: null, plan: null
    };
  }
  function addChild(c) { store.children[c.id] = c; store.order.push(c.id); store.current = c.id; cur = c; save(); }
  function childLabel(c) { return (c.info.name || 'ללא שם') + (c.info.gan ? ' · ' + c.info.gan : '') + ' · ' + new Date(c.updated || c.created).toLocaleDateString('he-IL'); }

  /* ---------- מגדר ושם ---------- */
  function gender() { return (cur && cur.info.gender) || 'f'; }
  function childName() { var n = (cur.info.name || '').trim(); return n || (gender() === 'f' ? 'הילדה' : 'הילד'); }
  function G(text) {
    var g = gender(), name = childName();
    return String(text).replace(/\{([^{}|]*)\|([^{}|]*)\}/g, function (m, f, mm) { return g === 'f' ? f : mm; }).replace(/\{שם\}/g, name);
  }
  function bankText(b) { return gender() === 'f' ? b.f : b.m; }

  /* ---------- משקלים ---------- */
  var WEAK_W = { low: 2, lowmid: 1.5, mid: 0.5, midnorm: 0, norm: 0 };
  function midDecision(pid) { return (cur.profile && cur.profile.mid && cur.profile.mid[String(pid)]) || ''; }
  function weakWeight(trig) {
    trig = String(trig);
    if (isParamTrig(trig)) {
      var r = cur.ratings[trig]; if (!r || !r.level) return 0;
      if (r.level === 'mid') { var d = midDecision(trig); return d === 'w' ? 1 : (d === 's' ? 0 : 0.5); }
      return WEAK_W[r.level] || 0;
    }
    var l = cur.literacy[trig]; if (!l || !l.status) return 0;
    return l.status === 'no' ? 2 : (l.status === 'part' ? 1 : 0);
  }
  function isWeak(trig) { return weakWeight(trig) >= 1; }
  function isStrong(trig) {
    trig = String(trig);
    if (isParamTrig(trig)) {
      var r = cur.ratings[trig]; if (!r || !r.level) return false;
      if (r.level === 'norm' || r.level === 'midnorm') return true;
      if (r.level === 'mid') return midDecision(trig) === 's';
      return false;
    }
    var l = cur.literacy[trig]; return !!(l && l.status === 'yes');
  }
  function ratedCount() { return Object.keys(cur.ratings).filter(function (k) { return cur.ratings[k] && cur.ratings[k].level; }).length; }

  /* ---------- טקסט של פריטי פרופיל ---------- */
  function litText(it, pol) {
    var l = cur.literacy[it.id] || {};
    var v = (l.value || '').trim();
    if (pol === 's') return v && it.s.indexOf('{v}') >= 0 ? it.s.replace('{v}', v) : it.sNoV;
    if (v && it.w.indexOf('{v}') >= 0) return it.w.replace('{v}', v);
    if (it.w.indexOf('{t}') >= 0) {
      var t = parseInt(it.target, 10), vn = parseInt(v, 10);
      if (!isNaN(vn) && !isNaN(t) && vn >= t) t = t + 10;
      return it.w.replace('{t}', String(t));
    }
    return it.wNoV;
  }
  function itemText(item, pol) {
    if (item.k === 'p') { var p = PMAP.get(String(item.id)); return p ? (pol === 'w' ? p.w : p.s) : ''; }
    if (item.k === 'l') { var it = LMAP.get(item.id); return it ? litText(it, pol) : ''; }
    if (item.k === 'b') { var b = BMAP.get(item.id); return b ? bankText(b) : ''; }
    return item.text || '';
  }
  function sameItem(a, b) { return a.k === b.k && String(a.id) === String(b.id) && (a.k !== 'c' || a.text === b.text); }
  function hasItem(list, item) { return list.some(function (x) { return sameItem(x, item); }); }

  /* ---------- יצירת פרופיל ברירת מחדל ---------- */
  function genProfile(keepMid) {
    var mid = (keepMid && cur.profile && cur.profile.mid) ? cur.profile.mid : {};
    var cells = {}; DOMS.forEach(function (d) { cells[d.id] = { s: [], w: [] }; });
    var cands = {}; DOMS.forEach(function (d) { cands[d.id] = []; });
    PARAMS.forEach(function (p) {
      var pid = String(p.id), r = cur.ratings[pid]; if (!r || !r.level) return;
      var dW = p.domW || p.dom;
      if (r.level === 'low' || r.level === 'lowmid') cells[dW].w.push({ k: 'p', id: pid });
      else if (r.level === 'norm' || r.level === 'midnorm') cands[p.dom].push(p);
      else if (r.level === 'mid') {
        var d = mid[pid];
        if (d === 'w') cells[dW].w.push({ k: 'p', id: pid });
        else if (d === 's') cells[p.dom].s.push({ k: 'p', id: pid });
      }
    });
    DOMS.forEach(function (d) {
      /* מוקדי כוח: קודם הפרמטרים שהיא נוהגת לציין (דרגת עדיפות 1), ואז השאר, עד התקרה */
      var c = cands[d.id];
      var pri = c.filter(function (p) { return p.pri === 1; }), rest = c.filter(function (p) { return p.pri !== 1; });
      var pick = pri.concat(rest).slice(0, STRENGTH_CAP);
      pick.sort(function (a, b) { return a.id - b.id; });
      pick.forEach(function (p) { cells[d.id].s.push({ k: 'p', id: String(p.id) }); });
    });
    LIT.forEach(function (it) {
      var l = cur.literacy[it.id]; if (!l || !l.status) return;
      if (l.status === 'yes') cells.cog.s.push({ k: 'l', id: it.id });
      else cells.cog.w.push({ k: 'l', id: it.id });
    });
    /* היגד בנק ראשי אחד לכל פרמטר/פריט חלש */
    var trigs = PARAMS.map(function (p) { return String(p.id); }).concat(LIT.map(function (i) { return i.id; }));
    trigs.forEach(function (t) {
      if (!isWeak(t)) return;
      for (var i = 0; i < BANK.length; i++) {
        var b = BANK[i];
        if (b.pol !== 'w' || !b.primary || b.low) continue;
        if (b.params.indexOf(t) < 0) continue;
        var item = { k: 'b', id: b.id };
        if (!hasItem(cells[b.dom].w, item)) { cells[b.dom].w.push(item); }
        break;
      }
    });
    cur.profile = { mid: mid, cells: cells, genAt: Date.now() };
    derivedDirty = false;
  }
  function midParams() {
    return PARAMS.filter(function (p) { var r = cur.ratings[String(p.id)]; return r && r.level === 'mid'; });
  }
  function setMid(pid, dec) {
    pid = String(pid);
    var p = PMAP.get(pid);
    var prev = midDecision(pid);
    if (!cur.profile) genProfile(false);
    cur.profile.mid[pid] = dec;
    var itemS = { k: 'p', id: pid };
    var dW = p.domW || p.dom;
    var cs = cur.profile.cells;
    /* הסרה מהמקום הקודם */
    cs[p.dom].s = cs[p.dom].s.filter(function (i) { return !sameItem(i, itemS); });
    cs[dW].w = cs[dW].w.filter(function (i) { return !sameItem(i, itemS); });
    if (dec === 's') cs[p.dom].s.push(itemS);
    if (dec === 'w') cs[dW].w.push(itemS);
    if (prev && prev !== dec) { /* אין מה לעשות נוסף */ }
    save();
  }

  /* ---------- תיאור תפקוד ---------- */
  function genNarrative() {
    var g = gender(), parts = [];
    var age = ageAt(cur.info.birth, cur.info.date);
    var yearTxt = { '1': 'שנה ראשונה בגן', '2': 'שנה שנייה בגן', '3': 'שנה שלישית בגן', 'extra': '{נשארה|נשאר} שנה נוספת במסגרת' }[cur.info.year] || '';
    var nm = (cur.info.name || '').trim();
    var intro = (nm ? nm + ', ' : '') + '{ילדה|ילד}' + (age ? ' ' + ageText(age, g) : '') + (yearTxt ? ', ' + yearTxt : '') + '.';
    parts.push(G(intro));
    TPL.narrative.topics.forEach(function (tp) {
      if (tp.auto) {
        if (tp.id === 'name') {
          var l1 = (cur.literacy.l1 || {}).status, l2 = (cur.literacy.l2 || {}).status;
          var s = '';
          if (l1 === 'yes' && l2 === 'yes') s = '{היא מזהה וכותבת את שמה|הוא מזהה וכותב את שמו}.';
          else if (l1 === 'yes' && (l2 === 'no' || l2 === 'part')) s = '{היא מזהה את שמה אך אינה כותבת אותו|הוא מזהה את שמו אך אינו כותב אותו}' + (l2 === 'part' ? ' באופן עצמאי.' : '.');
          else if (l1 === 'part') s = '{היא מזהה את שמה באופן חלקי בלבד ואינה כותבת אותו|הוא מזהה את שמו באופן חלקי בלבד ואינו כותב אותו}.';
          else if (l1 === 'no') s = '{היא אינה מזהה את שמה ואינה כותבת אותו|הוא אינו מזהה את שמו ואינו כותב אותו}.';
          if (s) parts.push(G(s));
        }
        return;
      }
      var pick = cur.narrative.picks[tp.id];
      if (pick === undefined || pick === null) return;
      if (tp.multi) {
        var idxs = Array.isArray(pick) ? pick : [pick];
        var texts = idxs.map(function (i) { return tp.options[i]; }).filter(Boolean);
        if (!texts.length) return;
        if (tp.lead) {
          var withB = texts.map(function (t) { return 'ב' + t; });
          var joined = withB.length === 1 ? withB[0] : withB.slice(0, -1).join(', ') + ' ו' + withB[withB.length - 1];
          parts.push(G(tp.lead) + ' ' + joined + '.');
        } else {
          texts.forEach(function (t) { parts.push(G(t)); });
        }
      } else {
        var t = tp.options[pick]; if (t) parts.push(G(t));
      }
    });
    if (cur.narrative.free && cur.narrative.free.trim()) parts.push(cur.narrative.free.trim());
    return parts.join(' ');
  }
  function narrativeText() {
    if (cur.narrative.manual && cur.narrative.text) return cur.narrative.text;
    return genNarrative();
  }

  /* ---------- תכנית עבודה ---------- */
  function objScore(obj) { return obj.triggers.reduce(function (s, t) { return s + weakWeight(t); }, 0); }
  function childAge() { return ageAt(cur.info.birth, cur.info.date); }
  function pickTitle(gt, selectedIds) {
    var age = childAge();
    var tags = {};
    if (age && age.dec >= 4.75) tags.age5 = true;
    if (selectedIds.indexOf('regulation') >= 0) tags.regulation = true;
    var att = selectedIds.indexOf('attention_circle') >= 0 || selectedIds.indexOf('participate_circle') >= 0;
    var conf = selectedIds.indexOf('strengths_aware') >= 0 || selectedIds.indexOf('approach_staff') >= 0 || selectedIds.indexOf('emotions') >= 0;
    if (att && !conf) tags.attention = true;
    if (selectedIds.indexOf('group_talk') >= 0) tags.talk = true;
    if (selectedIds.indexOf('social_situations') >= 0) tags.situations = true;
    var best = null;
    gt.titles.forEach(function (t) {
      var w = t.when || [];
      var hit = w.some(function (x) { return tags[x]; });
      if (hit && (!best || best.score < 2)) best = { t: t, score: 2 };
      else if (w.indexOf('default') >= 0 && !best) best = { t: t, score: 1 };
    });
    return best ? best.t.text : gt.titles[0].text;
  }
  function makeTplObjective(gt, obj) { return { src: 'tpl', ref: gt.id + ':' + obj.id, text: G(obj.text), means: G(obj.means), edited: false }; }
  function genPlan() {
    var goals = [];
    GT.forEach(function (gt) {
      var scored = gt.objectives.map(function (o) { return { o: o, s: objScore(o) }; }).filter(function (x) { return x.s >= 1; });
      scored.sort(function (a, b) { return b.s - a.s; });
      var covered = {}, chosen = [];
      scored.forEach(function (x) {
        if (chosen.length >= 3) return;
        var newTrig = x.o.triggers.filter(function (t) { return isWeak(t) && !covered[t]; });
        if (!newTrig.length) return;
        chosen.push(x.o);
        x.o.triggers.forEach(function (t) { covered[t] = true; });
      });
      if (!chosen.length) return;
      goals.push({ id: uid(), type: gt.id, title: pickTitle(gt, chosen.map(function (o) { return o.id; })), objectives: chosen.map(function (o) { return makeTplObjective(gt, o); }), timeframe: TPL.timeframeDefault, score: scored.reduce(function (s, x) { return s + x.s; }, 0) });
    });
    goals = goals.slice(0, 4);
    cur.plan = { goals: goals, genAt: Date.now() };
  }
  function objText(ob) {
    if (ob.edited) return ob.text;
    if (ob.src === 'tpl') { var r = ob.ref.split(':'); var gt = GTMAP.get(r[0]); var o = gt && gt.objectives.filter(function (x) { return x.id === r[1]; })[0]; if (o) return G(o.text); }
    if (ob.src === 'formal') { var f = findFormal(ob.ref); if (f) return G(gender() === 'f' ? f.objF : f.objM); }
    return ob.text;
  }
  function objMeans(ob) {
    if (ob.edited) return ob.means;
    if (ob.src === 'tpl') { var r = ob.ref.split(':'); var gt = GTMAP.get(r[0]); var o = gt && gt.objectives.filter(function (x) { return x.id === r[1]; })[0]; if (o) return G(o.means); }
    return ob.means || '';
  }
  var FORMAL = [];
  D.formal.environments.forEach(function (env) {
    env.domains.forEach(function (dom) {
      dom.goals.forEach(function (g) {
        var gtId = g.goalType || dom.goalType;
        g.objectives.forEach(function (o, i) {
          FORMAL.push({ ref: g.id + '#' + i, env: env.title, domTitle: dom.title, goalId: g.id, goalTitle: g.title, goalText: g.text, goalTextF: g.textF, goalType: gtId, age: g.age, triggers: g.triggers || [], objM: o, objF: g.objectivesF[i], idx: i });
        });
      });
    });
  });
  var FMAP = new Map(FORMAL.map(function (f) { return [f.ref, f]; }));
  function findFormal(ref) { return FMAP.get(ref); }

  /* ---------- ממשק: שלבים ---------- */
  var currentStep = 1;
  function showStep(n) {
    currentStep = n; cur.step = n;
    [1, 2, 3, 4].forEach(function (i) { $('#step' + i).classList.toggle('hidden', i !== n); });
    document.querySelectorAll('#steps button').forEach(function (b) {
      var s = parseInt(b.dataset.step, 10);
      b.classList.toggle('active', s === n);
      b.classList.toggle('done', s < n);
    });
    if (n === 2 && !cur.profile) genProfile(false);
    if (n === 3 && !cur.plan) genPlan();
    renderStep(n);
    save();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function renderStep(n) {
    if (n === 1) renderStep1();
    if (n === 2) renderStep2();
    if (n === 3) renderStep3();
    if (n === 4) renderStep4();
  }
  function navRow(prev, next, extra) {
    return h('div', { class: 'navrow' },
      prev ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { showStep(prev); } }, '→ הקודם') : h('span'),
      extra || null,
      next ? h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { showStep(next); } }, 'הבא ←') : h('span'));
  }

  /* ---------- שלב 1 ---------- */
  function field(label, input, cls) { return h('div', { class: cls || '' }, h('label', null, label), input); }
  function textInput(key, opts) {
    opts = opts || {};
    var inp = h('input', { type: opts.type || 'text', value: cur.info[key] || '', placeholder: opts.placeholder || '' });
    inp.addEventListener('input', function () { cur.info[key] = inp.value; if (key === 'name' || key === 'gender') refreshTitleBits(); save(); });
    inp.addEventListener('change', function () { if (opts.onchange) opts.onchange(); });
    return inp;
  }
  function refreshTitleBits() { renderChildSelect(); }
  function renderStep1() {
    var root = $('#step1'); root.innerHTML = '';
    var info = cur.info;
    var genderRow = h('div', { class: 'radio-row' },
      ['f', 'm'].map(function (g) {
        var lab = h('label', { class: info.gender === g ? 'on' : '' },
          h('input', { type: 'radio', name: 'gender', value: g, checked: info.gender === g, onchange: function () { info.gender = g; save(); renderStep1(); } }),
          g === 'f' ? 'ילדה' : 'ילד');
        return lab;
      }));
    var yearSel = h('select', { onchange: function () { info.year = yearSel.value; save(); } },
      [['1', 'שנה ראשונה בגן'], ['2', 'שנה שנייה בגן'], ['3', 'שנה שלישית בגן'], ['extra', 'נשאר/ה שנה נוספת']].map(function (o) { return h('option', { value: o[0], selected: info.year === o[0] }, o[1]); }));
    var ageSpan = h('span', { class: 'muted' });
    function updAge() { var a = ageAt(info.birth, info.date); ageSpan.textContent = a ? ('גיל במועד התכנית: ' + ageText(a, info.gender)) : ''; }
    var birth = textInput('birth', { type: 'date', onchange: updAge });
    var date = textInput('date', { type: 'date', onchange: updAge });
    updAge();
    var details = h('div', { class: 'card' },
      h('h2', null, 'פרטי הילד/ה והתכנית'),
      h('div', { class: 'grid' },
        field('שם הילד/ה (כפי שיופיע במסמך; אפשר ראשי תיבות)', textInput('name', { placeholder: 'למשל: אס' })),
        field('מין', genderRow),
        field('תאריך לידה', birth),
        field('שנה בגן', yearSel),
        field('תאריך התכנית', date),
        field('קופת חולים (לא חובה)', textInput('kupa')),
        field('שם הגן', textInput('gan')),
        field('מנהלת הגן', textInput('manager')),
        field('גננת שילוב', textInput('teacher')),
        field('מתי"א', textInput('matya')),
        field('שותפים בבניית התכנית', textInput('partners'), 'wide'),
        field('רשימת טיפולים (פרטי, גן, קופ"ח)', textInput('treatments', { placeholder: 'למשל: ממתינה לטיפול בריפוי בעיסוק דרך הקופה' }), 'wide')
      ),
      h('div', { style: 'margin-top:8px' }, ageSpan)
    );
    root.appendChild(details);

    /* רמזור */
    var rz = h('div', { class: 'card' });
    var progAll = h('span', { class: 'hint' });
    rz.appendChild(h('h2', null, 'טופס רמזור', progAll));
    rz.appendChild(h('div', { class: 'note' }, 'לכל פרמטר: אחת מחמש הדרגות, ואפשר להוסיף הערה קצרה. פרמטר שלא נבדק משאירים ריק. ', h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () { if (confirm('לסמן את כל הפרמטרים שלא דורגו כ"נורמלי"?')) { PARAMS.forEach(function (p) { var k = String(p.id); if (!cur.ratings[k] || !cur.ratings[k].level) cur.ratings[k] = { level: 'norm', note: (cur.ratings[k] || {}).note || '' }; }); save(); renderStep1(); } } }, 'סמן את הלא-מדורגים כנורמלי')));
    function updProg() {
      var n = ratedCount(); progAll.textContent = 'דורגו ' + n + ' מתוך ' + PARAMS.length;
      D.sections.forEach(function (s) { var ps = PARAMS.filter(function (p) { return p.sec === s.id; }); var r = ps.filter(function (p) { return cur.ratings[String(p.id)] && cur.ratings[String(p.id)].level; }).length; var el = $('#secprog' + s.id); if (el) el.textContent = r + '/' + ps.length; });
    }
    D.sections.forEach(function (sec, si) {
      var ps = PARAMS.filter(function (p) { return p.sec === sec.id; });
      var table = h('table', { class: 'ptable' });
      ps.forEach(function (p) {
        var pid = String(p.id);
        var r = cur.ratings[pid] || (cur.ratings[pid] = { level: '', note: '' });
        var tr = h('tr', { class: r.level ? 'rated' : '' });
        var chips = h('div', { class: 'chips' });
        LEVELS.forEach(function (lv) {
          var b = h('button', { type: 'button', class: 'lv' + (r.level === lv.id ? ' on' : ''), style: '--lvc:' + lv.color + ';--lvbg:' + lv.bg, onclick: function () {
            r.level = (r.level === lv.id) ? '' : lv.id;
            chips.querySelectorAll('.lv').forEach(function (x) { x.classList.toggle('on', x.dataset.lv === r.level); });
            tr.classList.toggle('rated', !!r.level);
            invalidateDerived();
            save(); updProg();
          } }, lv.label);
          b.dataset.lv = lv.id;
          chips.appendChild(b);
        });
        var note = h('input', { type: 'text', value: r.note || '', placeholder: 'הערה / דוגמה', oninput: function () { r.note = note.value; save(); } });
        tr.appendChild(h('td', { class: 'pname' }, p.name));
        tr.appendChild(h('td', null, chips));
        tr.appendChild(h('td', { class: 'pnote' }, note));
        table.appendChild(tr);
      });
      var det = h('details', { class: 'sec', open: si === 0 }, h('summary', null, sec.id + '. ' + sec.title, h('span', { class: 'prog', id: 'secprog' + sec.id })), h('div', { style: 'padding:0 8px 8px' }, table));
      rz.appendChild(det);
    });
    root.appendChild(rz);

    /* אוריינות וחשבון */
    var lit = h('div', { class: 'card' });
    lit.appendChild(h('h2', null, 'ממצאי המבדק: חשיבה חשבונית, אוריינות ומושגי יסוד', h('span', { class: 'hint' }, 'מזין את הפרופיל הלימודי ואת המטרה הלימודית')));
    lit.appendChild(h('div', { class: 'note' }, '✓ שולט/ת · ◐ חלקי · ✗ לא. בשדה שלצד הפריט אפשר לציין עד כמה (למשל "סופר עד 14").'));
    D.literacy.groups.forEach(function (gr) {
      var items = LIT.filter(function (i) { return i.group === gr.id; });
      lit.appendChild(h('h3', null, gr.title));
      var grid = h('div', { class: 'lit-grid' });
      items.forEach(function (it) {
        var l = cur.literacy[it.id] || (cur.literacy[it.id] = { status: '', value: '' });
        var ctl = h('div', { class: 'ctl' });
        var btns = {};
        D.literacy.statuses.forEach(function (st) {
          var b = h('button', { type: 'button', class: 'st' + (l.status === st.id ? ' on-' + st.id : ''), title: st.label, onclick: function () {
            l.status = (l.status === st.id) ? '' : st.id;
            Object.keys(btns).forEach(function (k) { btns[k].className = 'st' + (l.status === k ? ' on-' + k : ''); });
            invalidateDerived(); save();
          } }, st.short);
          btns[st.id] = b; ctl.appendChild(b);
        });
        if (it.value) {
          var vi = h('input', { type: 'text', value: l.value || '', placeholder: it.value + (it.placeholder ? ' (' + it.placeholder + ')' : ''), oninput: function () { l.value = vi.value; save(); } });
          ctl.appendChild(vi);
        }
        grid.appendChild(h('div', { class: 'lit-item' }, h('div', { class: 'lbl' }, it.label), ctl));
      });
      lit.appendChild(grid);
    });
    root.appendChild(lit);
    root.appendChild(navRow(null, 2));
    updProg();
  }
  var derivedDirty = false;
  function invalidateDerived() { if (cur && (cur.profile || cur.plan)) derivedDirty = true; }

  /* ---------- שלב 2 ---------- */
  function renderStep2() {
    var root = $('#step2'); root.innerHTML = '';
    if (!cur.profile) genProfile(false);
    if (derivedDirty) {
      root.appendChild(h('div', { class: 'note warn' }, 'הרמזור עודכן אחרי שהפרופיל נבנה. ',
        h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () { genProfile(true); derivedDirty = false; save(); renderStep2(); toast('הפרופיל חושב מחדש'); } }, 'חשב מחדש את ברירות המחדל'),
        ' (הבחירות הידניות יאבדו) או המשיכו עם הפרופיל הקיים.'));
    }
    /* תיאור תפקוד */
    var nar = h('div', { class: 'card' });
    nar.appendChild(h('h2', null, 'תיאור תפקוד הילד/ה בגן', h('span', { class: 'hint' }, 'בחרו משפטים; הפסקה נבנית למטה וניתנת לעריכה חופשית')));
    var ta = h('textarea', { style: 'min-height:140px', value: narrativeText() });
    TPL.narrative.topics.forEach(function (tp) {
      if (tp.auto) return;
      var box = h('div', { class: 'topic' }, h('div', { class: 't' }, tp.title));
      var wrap = h('div');
      tp.options.forEach(function (opt, i) {
        var pick = cur.narrative.picks[tp.id];
        var on = tp.multi ? (Array.isArray(pick) && pick.indexOf(i) >= 0) : pick === i;
        var el = h('span', { class: 'opt' + (on ? ' on' : ''), role: 'button', tabindex: '0', onclick: function () {
          if (tp.multi) {
            var arr = Array.isArray(cur.narrative.picks[tp.id]) ? cur.narrative.picks[tp.id].slice() : [];
            var at = arr.indexOf(i); if (at >= 0) arr.splice(at, 1); else arr.push(i); arr.sort(function (a, b) { return a - b; });
            cur.narrative.picks[tp.id] = arr;
          } else {
            cur.narrative.picks[tp.id] = (cur.narrative.picks[tp.id] === i) ? null : i;
          }
          cur.narrative.manual = false; ta.value = genNarrative(); cur.narrative.text = ta.value; save();
          wrap.querySelectorAll('.opt').forEach(function (x, j) { var p2 = cur.narrative.picks[tp.id]; x.classList.toggle('on', tp.multi ? (Array.isArray(p2) && p2.indexOf(j) >= 0) : p2 === j); });
        }, onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } } }, G(tp.lead ? opt : opt));
        wrap.appendChild(el);
      });
      box.appendChild(wrap);
      nar.appendChild(box);
    });
    var free = h('textarea', { placeholder: 'משפטים נוספים (יתווספו לסוף הפסקה)', value: cur.narrative.free || '', oninput: function () { cur.narrative.free = free.value; if (!cur.narrative.manual) { ta.value = genNarrative(); cur.narrative.text = ta.value; } save(); } });
    nar.appendChild(h('div', { class: 'topic' }, h('div', { class: 't' }, 'תוספת חופשית'), free));
    nar.appendChild(h('div', { class: 'topic' }, h('div', { class: 't' }, 'הפסקה שתיכנס למסמך (ניתן לערוך ישירות)'), ta,
      h('div', { style: 'margin-top:6px;display:flex;gap:8px;align-items:center' },
        h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () { cur.narrative.manual = false; ta.value = genNarrative(); cur.narrative.text = ta.value; save(); toast('הפסקה נבנתה מחדש מהבחירות'); } }, 'בנה מחדש מהבחירות'),
        h('span', { class: 'muted' }, 'עריכה ידנית נשמרת; "בנה מחדש" דורס אותה.'))));
    ta.addEventListener('input', function () { cur.narrative.manual = true; cur.narrative.text = ta.value; save(); });
    root.appendChild(nar);

    /* בינוני */
    var mids = midParams();
    if (mids.length) {
      var mp = h('div', { class: 'card mid-panel' });
      mp.appendChild(h('h2', null, 'פרמטרים שדורגו "בינוני": לאן לשייך?', h('span', { class: 'hint' }, 'לא משובצים אוטומטית. כוח / חיזוק / להשאיר בחוץ')));
      var rowsWrap = h('div', { class: 'rows' });
      mp.appendChild(rowsWrap);
      mids.forEach(function (p) {
        var pid = String(p.id), dec = midDecision(pid);
        var row = h('div', { class: 'row' });
        row.appendChild(h('span', { class: 'nm' }, p.name, ' ', h('span', { class: 'muted' }, '(' + DMAP.get(p.dom).title + ')')));
        [['s', 'מוקד כוח'], ['w', 'מוקד חיזוק'], ['x', 'בחוץ']].forEach(function (o) {
          row.appendChild(h('button', { type: 'button', class: 'btn btn-small ' + (dec === o[0] ? 'btn-secondary' : 'btn-ghost'), onclick: function () { setMid(pid, o[0]); renderStep2(); } }, o[1]));
        });
        rowsWrap.appendChild(row);
      });
      root.appendChild(mp);
    }

    /* תחומים */
    var prof = h('div', { class: 'card' });
    prof.appendChild(h('h2', null, 'פרופיל: מוקדי כוח ומוקדי חיזוק', h('span', { class: 'hint' }, 'לחיצה על × מסירה; לחיצה על הצעה מוסיפה')));
    prof.appendChild(h('div', { class: 'note' }, 'כחול = פרמטר מהרמזור · צהבהב = ממצא אוריינות/חשבון · אפור = היגד מהבנק · ירקרק = טקסט חופשי. היגדים המסומנים בקו רציף נגזרים ישירות מהדירוג.'));
    DOMS.forEach(function (d) { prof.appendChild(renderDomain(d)); });
    root.appendChild(prof);
    root.appendChild(navRow(1, 3, h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { if (confirm('לבנות מחדש את הפרופיל מהרמזור? הבחירות הידניות בפרופיל יימחקו.')) { genProfile(true); derivedDirty = false; save(); renderStep2(); } } }, 'חשב מחדש מהרמזור')));
  }
  function renderDomain(d) {
    var card = h('div', { class: 'dom-card' });
    card.appendChild(h('h3', null, 'תחום ' + d.title));
    if (d.sub) card.appendChild(h('div', { class: 'sub' }, d.sub));
    var cols = h('div', { class: 'cols2' });
    cols.appendChild(renderCol(d, 's'));
    cols.appendChild(renderCol(d, 'w'));
    card.appendChild(cols);
    return card;
  }
  function renderCol(d, pol) {
    var list = cur.profile.cells[d.id][pol];
    var col = h('div', { class: 'col ' + pol });
    col.appendChild(h('h4', null, pol === 's' ? 'מוקדי כוח' : 'מוקדי חיזוק'));
    var sel = h('div', { class: 'sel' });
    function redraw() { var card = col.closest('.dom-card'); var fresh = renderDomain(d); card.replaceWith(fresh); }
    list.forEach(function (it, idx) {
      var chip = h('span', { class: 'item k-' + it.k, title: it.k === 'b' ? 'היגד מהבנק' : (it.k === 'p' ? 'פרמטר מהרמזור' : (it.k === 'l' ? 'ממצא מבדק' : 'טקסט חופשי')) }, itemText(it, pol),
        h('button', { type: 'button', class: 'x', 'aria-label': 'הסר', onclick: function () { list.splice(idx, 1); save(); redraw(); } }, '×'));
      sel.appendChild(chip);
    });
    if (!list.length) sel.appendChild(h('span', { class: 'muted' }, 'ריק'));
    col.appendChild(sel);
    /* הצעות */
    var sugs = suggestions(d.id, pol);
    if (sugs.length) {
      var sg = h('div', { class: 'sug' });
      sugs.slice(0, 14).forEach(function (s) {
        sg.appendChild(h('span', { class: 'item k-' + s.item.k + (s.strong ? ' strong' : ''), role: 'button', tabindex: '0', title: 'הוסף', onclick: function () { list.push(s.item); save(); redraw(); } }, '+ ' + s.text));
      });
      col.appendChild(h('div', { class: 'muted', style: 'margin-top:6px' }, 'הצעות:'));
      col.appendChild(sg);
    }
    /* חופשי */
    var fi = h('input', { type: 'text', placeholder: 'היגד חופשי...' });
    var add = function () { var t = fi.value.trim(); if (!t) return; list.push({ k: 'c', id: uid(), text: t }); fi.value = ''; save(); redraw(); };
    fi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    col.appendChild(h('div', { class: 'addfree' }, fi, h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: add }, 'הוסף')));
    /* עוד אפשרויות */
    var more = h('details', { class: 'more' });
    more.appendChild(h('summary', null, 'עוד אפשרויות (' + moreCount(d.id, pol) + ')'));
    var box = h('div', { class: 'box' });
    var q = h('input', { type: 'text', placeholder: 'חיפוש בהיגדים...' });
    var lists = h('div');
    function drawMore() {
      lists.innerHTML = '';
      var qq = q.value.trim();
      var groups = moreOptions(d.id, pol, qq);
      groups.forEach(function (gr) {
        if (!gr.items.length) return;
        var det = h('details', { open: !!qq || gr.open }, h('summary', { class: 'muted', style: 'cursor:pointer;font-weight:600' }, gr.title + ' (' + gr.items.length + ')'));
        var wrap = h('div', { class: 'sug' });
        gr.items.forEach(function (s) {
          wrap.appendChild(h('span', { class: 'item k-' + s.item.k, role: 'button', tabindex: '0', onclick: function () { list.push(s.item); save(); redraw(); } }, '+ ' + s.text));
        });
        det.appendChild(wrap);
        lists.appendChild(det);
      });
      if (!lists.children.length) lists.appendChild(h('div', { class: 'muted' }, 'לא נמצאו היגדים.'));
    }
    q.addEventListener('input', drawMore);
    more.addEventListener('toggle', function () { if (more.open) drawMore(); });
    box.appendChild(q); box.appendChild(lists);
    more.appendChild(box);
    col.appendChild(more);
    return col;
  }
  function selectedHas(domId, pol, item) { return hasItem(cur.profile.cells[domId][pol], item); }
  function suggestions(domId, pol) {
    var out = [];
    PARAMS.forEach(function (p) {
      var pid = String(p.id);
      var dom = pol === 'w' ? (p.domW || p.dom) : p.dom;
      if (dom !== domId) return;
      var ok = pol === 'w' ? isWeak(pid) : isStrong(pid);
      if (!ok) return;
      var item = { k: 'p', id: pid };
      if (selectedHas(domId, pol, item)) return;
      out.push({ item: item, text: pol === 'w' ? p.w : p.s, strong: true });
    });
    if (domId === 'cog') {
      LIT.forEach(function (it) {
        var ok = pol === 'w' ? isWeak(it.id) : isStrong(it.id);
        if (!ok) return;
        var item = { k: 'l', id: it.id };
        if (selectedHas(domId, pol, item)) return;
        out.push({ item: item, text: litText(it, pol), strong: true });
      });
    }
    BANK.forEach(function (b) {
      if (b.dom !== domId || b.pol !== pol || !b.generic || b.low) return;
      var ok = b.params.some(function (t) { return pol === 'w' ? isWeak(t) : isStrong(t); });
      if (!ok) return;
      var item = { k: 'b', id: b.id };
      if (selectedHas(domId, pol, item)) return;
      out.push({ item: item, text: bankText(b), strong: false });
    });
    return out;
  }
  function moreOptions(domId, pol, q) {
    var ql = (q || '').toLowerCase();
    function match(t) { return !ql || t.toLowerCase().indexOf(ql) >= 0; }
    var params = [];
    PARAMS.forEach(function (p) {
      var pid = String(p.id); var dom = pol === 'w' ? (p.domW || p.dom) : p.dom;
      if (dom !== domId) return;
      var item = { k: 'p', id: pid }; if (selectedHas(domId, pol, item)) return;
      var t = pol === 'w' ? p.w : p.s; if (!match(t + ' ' + p.name)) return;
      params.push({ item: item, text: t });
    });
    var lits = [];
    if (domId === 'cog') LIT.forEach(function (it) { var item = { k: 'l', id: it.id }; if (selectedHas(domId, pol, item)) return; var t = litText(it, pol); if (!match(t + ' ' + it.label)) return; lits.push({ item: item, text: t }); });
    var gen = [], spec = [], low = [];
    BANK.forEach(function (b) {
      if (b.dom !== domId || b.pol !== pol) return;
      var item = { k: 'b', id: b.id }; if (selectedHas(domId, pol, item)) return;
      var t = bankText(b); if (!match(t)) return;
      var e = { item: item, text: t };
      if (b.low) low.push(e); else if (b.generic) gen.push(e); else spec.push(e);
    });
    return [
      { title: 'פרמטרים מהרמזור', items: params, open: true },
      { title: 'ממצאי מבדק', items: lits, open: false },
      { title: 'היגדים כלליים מהבנק', items: gen, open: false },
      { title: 'היגדים ספציפיים מהבנק', items: spec, open: false },
      { title: 'היגדים לתפקוד נמוך', items: low, open: false }
    ];
  }
  function moreCount(domId, pol) { return moreOptions(domId, pol, '').reduce(function (s, g) { return s + g.items.length; }, 0); }

  /* ---------- שלב 3 ---------- */
  function renderStep3() {
    var root = $('#step3'); root.innerHTML = '';
    if (!cur.plan) genPlan();
    var card = h('div', { class: 'card' });
    var age = childAge();
    card.appendChild(h('h2', null, 'תכנית עבודה', h('span', { class: 'hint' }, 'ברירת המחדל: עד 4 מטרות לפי חומרת הדירוג, 2-3 יעדים לכל מטרה' + (age ? ' · גיל ' + ageLabel(age) : ''))));
    card.appendChild(h('div', { class: 'note' }, 'אפשר לערוך כל טקסט ישירות, להסיר יעדים, להוסיף יעדים מהתבניות, מהבנק הפורמלי (מסונן לפי גיל) או בכתיבה חופשית, ולהוסיף מטרות (עד ' + MAX_GOALS + ').'));
    var goalsWrap = h('div');
    cur.plan.goals.forEach(function (g, gi) { goalsWrap.appendChild(renderGoal(g, gi)); });
    card.appendChild(goalsWrap);
    /* הוספת מטרה */
    var addSel = h('select', { style: 'width:auto' }, GT.map(function (gt) { return h('option', { value: gt.id }, gt.label); }));
    card.appendChild(h('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap' },
      addSel,
      h('button', { class: 'btn btn-ghost', type: 'button', disabled: cur.plan.goals.length >= MAX_GOALS, onclick: function () {
        if (cur.plan.goals.length >= MAX_GOALS) return;
        var gt = GTMAP.get(addSel.value);
        cur.plan.goals.push({ id: uid(), type: gt.id, title: pickTitle(gt, []), objectives: [], timeframe: TPL.timeframeDefault, pickerOpen: true });
        save(); renderStep3();
      } }, '+ הוסף מטרה'),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { if (confirm('לבנות מחדש את התכנית מהרמזור ומהפרופיל? העריכות בתכנית יימחקו.')) { genPlan(); save(); renderStep3(); } } }, 'חשב מחדש מהרמזור')));
    root.appendChild(card);
    root.appendChild(navRow(2, 4));
  }
  function renderGoal(g, gi) {
    var gt = GTMAP.get(g.type) || GT[0];
    var box = h('div', { class: 'goal' });
    var typeSel = h('select', { onchange: function () { g.type = typeSel.value; save(); renderStep3(); } }, GT.map(function (x) { return h('option', { value: x.id, selected: x.id === g.type }, x.label); }));
    var titleList = 'titles-' + g.id;
    var titleIn = h('input', { type: 'text', value: g.title || '', list: titleList, placeholder: 'כותרת המטרה', oninput: function () { g.title = titleIn.value; save(); } });
    var dl = h('datalist', { id: titleList }, gt.titles.map(function (t) { return h('option', { value: t.text }); }));
    var btns = h('div', { class: 'gbtns' },
      h('button', { type: 'button', class: 'iconbtn', title: 'הזז למעלה', disabled: gi === 0, onclick: function () { var a = cur.plan.goals; a.splice(gi - 1, 0, a.splice(gi, 1)[0]); save(); renderStep3(); } }, '↑'),
      h('button', { type: 'button', class: 'iconbtn', title: 'הזז למטה', disabled: gi === cur.plan.goals.length - 1, onclick: function () { var a = cur.plan.goals; a.splice(gi + 1, 0, a.splice(gi, 1)[0]); save(); renderStep3(); } }, '↓'),
      h('button', { type: 'button', class: 'iconbtn del', title: 'מחק מטרה', onclick: function () { if (confirm('למחוק את המטרה על כל יעדיה?')) { cur.plan.goals.splice(gi, 1); save(); renderStep3(); } } }, '✕'));
    box.appendChild(h('div', { class: 'ghead' }, h('span', { class: 'badge' }, 'מטרה ' + (gi + 1)), typeSel, h('div', { class: 'title' }, titleIn, dl), btns));
    /* יעדים */
    var objWrap = h('div');
    if (!g.objectives.length) objWrap.appendChild(h('div', { class: 'muted', style: 'padding:6px 0' }, 'אין יעדים עדיין. הוסיפו יעד למטה.'));
    g.objectives.forEach(function (ob, oi) {
      var tIn = h('textarea', { value: objText(ob), 'aria-label': 'יעד' });
      var mIn = h('textarea', { value: objMeans(ob), 'aria-label': 'אופן הביצוע / אחריות', style: 'min-height:90px' });
      function markEdited() { ob.text = tIn.value; ob.means = mIn.value; ob.edited = true; save(); }
      tIn.addEventListener('input', markEdited); mIn.addEventListener('input', markEdited);
      var row = h('div', { class: 'obj' },
        h('div', null, h('div', { class: 'muted' }, h('span', { class: 'num' }, (oi + 1) + '. '), 'יעד'), tIn),
        h('div', null, h('div', { class: 'muted' }, 'אופן הביצוע / אחריות'), mIn),
        h('div', { class: 'obtns' },
          h('button', { type: 'button', class: 'iconbtn', title: 'למעלה', disabled: oi === 0, onclick: function () { g.objectives.splice(oi - 1, 0, g.objectives.splice(oi, 1)[0]); save(); renderStep3(); } }, '↑'),
          h('button', { type: 'button', class: 'iconbtn', title: 'למטה', disabled: oi === g.objectives.length - 1, onclick: function () { g.objectives.splice(oi + 1, 0, g.objectives.splice(oi, 1)[0]); save(); renderStep3(); } }, '↓'),
          h('button', { type: 'button', class: 'iconbtn del', title: 'הסר יעד', onclick: function () { g.objectives.splice(oi, 1); save(); renderStep3(); } }, '✕')));
      objWrap.appendChild(row);
    });
    box.appendChild(objWrap);
    /* זמן */
    var tf = h('input', { type: 'text', value: g.timeframe || '', style: 'width:220px', oninput: function () { g.timeframe = tf.value; save(); } });
    box.appendChild(h('div', { style: 'display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap' }, h('label', { style: 'margin:0' }, 'פרק הזמן להשגה:'), tf,
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () { g.pickerOpen = !g.pickerOpen; renderStep3(); } }, g.pickerOpen ? 'סגור הוספת יעדים' : '+ הוסף יעד')));
    if (g.pickerOpen) box.appendChild(renderPicker(g, gt));
    return box;
  }
  function renderPicker(g, gt) {
    var pk = h('div', { class: 'picker' });
    var tab = g.pickerTab || 'tpl';
    var tabs = h('div', { class: 'tabs' }, [['tpl', 'מהתבניות'], ['formal', 'מהבנק הפורמלי'], ['free', 'כתיבה חופשית']].map(function (t) {
      return h('button', { type: 'button', class: t[0] === tab ? 'on' : '', onclick: function () { g.pickerTab = t[0]; renderStep3(); } }, t[1]);
    }));
    pk.appendChild(tabs);
    var list = h('div', { class: 'list' });
    function already(src, ref) { return g.objectives.some(function (o) { return o.src === src && o.ref === ref; }); }
    if (tab === 'tpl') {
      var typeSel = h('select', { style: 'width:auto;margin-bottom:8px' }, GT.map(function (x) { return h('option', { value: x.id, selected: x.id === (g.pickerType || gt.id) }, x.label); }));
      typeSel.addEventListener('change', function () { g.pickerType = typeSel.value; renderStep3(); });
      list.appendChild(h('div', null, h('label', null, 'תבניות של:'), typeSel));
      var src = GTMAP.get(g.pickerType || gt.id);
      var rows = src.objectives.map(function (o) { return { o: o, s: objScore(o) }; });
      rows.sort(function (a, b) { return b.s - a.s; });
      rows.forEach(function (x) {
        var used = already('tpl', src.id + ':' + x.o.id);
        list.appendChild(h('div', { class: 'pk' + (x.s >= 1 ? ' sug' : '') + (used ? ' dim' : '') },
          h('div', { class: 'pt' }, G(x.o.text), x.s >= 1 ? h('span', { class: 'badge', style: 'margin-inline-start:6px' }, 'מתאים לרמזור') : null, h('div', { class: 'muted' }, G(x.o.means).slice(0, 140) + (x.o.means.length > 140 ? '...' : ''))),
          h('button', { class: 'btn btn-ghost btn-small', type: 'button', disabled: used, onclick: function () { g.objectives.push(makeTplObjective(src, x.o)); save(); renderStep3(); } }, used ? 'נוסף' : 'הוסף')));
      });
    } else if (tab === 'formal') {
      var age = childAge();
      var ageOnly = h('input', { type: 'checkbox', checked: g.ageOnly !== false, style: 'width:auto' });
      ageOnly.addEventListener('change', function () { g.ageOnly = ageOnly.checked; renderStep3(); });
      var allTypes = h('input', { type: 'checkbox', checked: !!g.allTypes, style: 'width:auto' });
      allTypes.addEventListener('change', function () { g.allTypes = allTypes.checked; renderStep3(); });
      list.appendChild(h('div', { style: 'display:flex;gap:14px;flex-wrap:wrap;margin-bottom:6px' },
        h('label', { style: 'display:flex;gap:6px;align-items:center' }, ageOnly, age ? 'רק יעדים לגיל ' + ageLabel(age) : 'סינון לפי גיל (אין תאריך לידה)'),
        h('label', { style: 'display:flex;gap:6px;align-items:center' }, allTypes, 'הצג גם תחומים של סוגי מטרה אחרים')));
      var byGoal = {};
      var order = [];
      FORMAL.forEach(function (f) {
        if (!g.allTypes && f.goalType !== gt.id) return;
        if (g.ageOnly !== false && age && f.age && (age.dec < f.age[0] - 0.5 || age.dec >= f.age[1] + 1)) return;
        if (!byGoal[f.goalId]) { byGoal[f.goalId] = { f: f, items: [] }; order.push(f.goalId); }
        byGoal[f.goalId].items.push(f);
      });
      order.sort(function (a, b) { var sa = byGoal[a].f.triggers.reduce(function (s, t) { return s + weakWeight(t); }, 0), sb = byGoal[b].f.triggers.reduce(function (s, t) { return s + weakWeight(t); }, 0); return sb - sa; });
      if (!order.length) list.appendChild(h('div', { class: 'muted' }, 'אין יעדים מתאימים לסינון הזה.'));
      order.forEach(function (gid) {
        var grp = byGoal[gid], f0 = grp.f;
        var rel = f0.triggers.reduce(function (s, t) { return s + weakWeight(t); }, 0) >= 1;
        var det = h('details', { open: rel }, h('summary', { class: 'pk gt', style: 'cursor:pointer;display:block' }, (rel ? '★ ' : '') + f0.domTitle + ': ' + f0.goalTitle + ' ', h('span', { class: 'age' }, f0.age ? 'גיל ' + f0.age[0] + '-' + f0.age[1] : ''), h('div', { class: 'muted', style: 'font-weight:400' }, G(gender() === 'f' ? f0.goalTextF : f0.goalText))));
        grp.items.forEach(function (f) {
          var used = already('formal', f.ref);
          det.appendChild(h('div', { class: 'pk' + (used ? ' dim' : '') },
            h('div', { class: 'pt', style: 'font-weight:400' }, G(gender() === 'f' ? f.objF : f.objM)),
            h('button', { class: 'btn btn-ghost btn-small', type: 'button', disabled: used, onclick: function () {
              g.objectives.push({ src: 'formal', ref: f.ref, text: G(gender() === 'f' ? f.objF : f.objM), means: '', edited: false });
              save(); renderStep3();
            } }, used ? 'נוסף' : 'הוסף')));
        });
        det.appendChild(h('div', { style: 'padding:4px' }, h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () {
          g.objectives.push({ src: 'custom', ref: '', text: G(gender() === 'f' ? f0.goalTextF : f0.goalText), means: '', edited: true }); save(); renderStep3();
        } }, 'הוסף את נוסח המטרה כיעד')));
        list.appendChild(det);
      });
    } else {
      var t = h('textarea', { placeholder: 'נוסח היעד' }), m = h('textarea', { placeholder: 'אופן הביצוע / אחריות' });
      list.appendChild(h('div', null, h('label', null, 'יעד'), t, h('label', { style: 'margin-top:6px' }, 'אופן הביצוע / אחריות'), m,
        h('div', { style: 'margin-top:6px' }, h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: function () { if (!t.value.trim()) return; g.objectives.push({ src: 'custom', ref: '', text: t.value.trim(), means: m.value.trim(), edited: true }); save(); renderStep3(); } }, 'הוסף יעד'))));
    }
    pk.appendChild(list);
    return pk;
  }

  /* ---------- שלב 4 ---------- */
  function checklist() {
    var out = [];
    out.push({ ok: !!(cur.info.name || '').trim(), t: 'שם הילד/ה' });
    out.push({ ok: !!cur.info.birth, t: 'תאריך לידה' });
    out.push({ ok: !!cur.info.gan, t: 'שם הגן' });
    out.push({ ok: ratedCount() >= 20, t: 'רמזור מולא (' + ratedCount() + ' פרמטרים)' });
    out.push({ ok: !!cur.profile && DOMS.some(function (d) { return cur.profile.cells[d.id].s.length || cur.profile.cells[d.id].w.length; }), t: 'פרופיל' });
    out.push({ ok: !!(narrativeText() || '').trim(), t: 'תיאור תפקוד' });
    out.push({ ok: !!cur.plan && cur.plan.goals.length > 0 && cur.plan.goals.every(function (g) { return g.objectives.length > 0; }), t: 'תכנית עבודה (לכל מטרה לפחות יעד אחד)' });
    return out;
  }
  function profileLines(domId, pol) {
    /* שורות לתא בטבלת הפרופיל: פרמטרים בשורה אחת, ממצאי מבדק לפי קבוצות, היגדים בשורות נפרדות */
    var items = cur.profile ? cur.profile.cells[domId][pol] : [];
    var params = [], lit = { num: [], lit: [], con: [] }, rest = [];
    items.forEach(function (it) {
      var t = itemText(it, pol); if (!t) return;
      if (it.k === 'p') params.push(t);
      else if (it.k === 'l') { var li = LMAP.get(it.id); lit[li ? li.group : 'con'].push(t); }
      else rest.push(t);
    });
    var lines = [];
    if (params.length) lines.push({ text: params.join(', ') + '.' });
    if (lit.con.length) lines.push({ text: lit.con.join(', ') + '.' });
    if (lit.num.length) lines.push({ label: 'חשיבה חשבונית: ', text: lit.num.join(', ') + '.' });
    if (lit.lit.length) lines.push({ label: 'אוריינות: ', text: lit.lit.join(', ') + '.' });
    rest.forEach(function (t) { lines.push({ text: t + (/[.!?]$/.test(t) ? '' : '.') }); });
    return lines;
  }
  function renderStep4() {
    var root = $('#step4'); root.innerHTML = '';
    var card = h('div', { class: 'card' });
    card.appendChild(h('h2', null, 'סיכום והורדה'));
    var ul = h('ul', { class: 'checks', style: 'padding-inline-start:18px' });
    checklist().forEach(function (c) { ul.appendChild(h('li', { class: c.ok ? 'ok' : 'bad' }, (c.ok ? '✓ ' : '✗ ') + c.t)); });
    card.appendChild(ul);
    var connected = driveConnected();
    card.appendChild(h('h3', null, 'שמירה בגוגל דרייב', connected ? null : h('span', { class: 'muted', style: 'font-weight:400;margin-inline-start:8px' }, '(יש להתחבר לגוגל דרייב בסרגל שלמעלה)')));
    card.appendChild(h('div', { class: 'dl' },
      h('button', { class: 'btn btn-primary', type: 'button', disabled: !connected, onclick: function () { saveProductToDrive('doc'); } }, 'שמור את התח"י כגוגל דוקס'),
      h('button', { class: 'btn btn-secondary', type: 'button', disabled: !connected, onclick: function () { saveProductToDrive('sheet'); } }, 'שמור את הרמזור כגוגל שיטס'),
      h('button', { class: 'btn btn-ghost', type: 'button', disabled: !connected, onclick: function () { clearTimeout(driveTimers[cur.id]); saveChildToDrive(cur, false).then(function () { toast('נתוני העבודה נשמרו בדרייב'); }).catch(function (e) { if (e && e.code !== 'conflict') toast(e.message); }); } }, 'שמור את נתוני העבודה בדרייב')));
    if (cur.docs && cur.docs.length) {
      var ul2 = h('ul', { class: 'doclinks', style: 'padding-inline-start:18px' });
      cur.docs.slice(0, 8).forEach(function (d) {
        ul2.appendChild(h('li', null, h('a', { href: d.link || '#', target: '_blank', rel: 'noopener' }, d.name || (d.kind === 'doc' ? 'גוגל דוקס' : 'גוגל שיטס')), ' ', h('span', { class: 'muted' }, fmtTime(d.at))));
      });
      card.appendChild(h('div', null, h('div', { class: 'muted' }, 'מסמכים שנשמרו בדרייב לילד/ה הזה:'), ul2));
    }
    card.appendChild(h('h3', null, 'הורדה למחשב'));
    card.appendChild(h('div', { class: 'dl' },
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { downloadDocx().catch(function (e) { console.error(e); toast('שגיאה ביצירת הקובץ: ' + e.message); }); } }, 'הורדת תח"י כקובץ וורד'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { try { downloadXlsx(); } catch (e) { console.error(e); toast('שגיאה ביצירת האקסל: ' + e.message); } } }, 'הורדת הרמזור כאקסל'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: exportChild }, 'ייצוא נתוני הילד/ה (קובץ גיבוי)')));
    root.appendChild(card);
    var pv = h('div', { class: 'card' }, h('h2', null, 'תצוגה מקדימה'), renderPreview());
    root.appendChild(pv);
    root.appendChild(navRow(3, null));
  }
  function renderPreview() {
    var info = cur.info;
    var wrap = h('div', { class: 'preview' });
    wrap.appendChild(h('div', { style: 'font-weight:700;font-style:italic' }, info.matya || ''));
    wrap.appendChild(h('div', { class: 'pt-title' }, 'תח"י- תכנית חינוכית יחידנית'));
    wrap.appendChild(h('p', null, h('b', null, 'שם הילד/ה: '), info.name || '', '   ', h('b', null, 'ת. לידה: '), fmtDate(info.birth), info.kupa ? ['   ', h('b', null, 'קופת חולים: '), info.kupa] : null));
    wrap.appendChild(h('p', null, h('b', null, 'שם הגן: '), info.gan || '', '   ', h('b', null, 'גננת שילוב: '), info.teacher || '', '   ', h('b', null, 'מנהלת גן: '), info.manager || '', '   ', h('b', null, 'תאריך: '), fmtDate(info.date)));
    wrap.appendChild(h('p', null, h('b', null, 'שותפים בבניית התכנית: '), info.partners || ''));
    wrap.appendChild(h('p', null, h('b', null, 'רשימת טיפולים (פרטי, גן, קופ"ח): '), info.treatments || ''));
    wrap.appendChild(h('p', null, h('b', { style: 'text-decoration:underline' }, 'תאור תפקוד התלמיד/ה בגן:'), ' ', narrativeText()));
    var tbl = h('table');
    tbl.appendChild(h('tr', null, h('th', null, 'תחום'), h('th', null, 'מוקדי כוח:'), h('th', null, 'מוקדים לחיזוק:')));
    DOMS.forEach(function (d) {
      tbl.appendChild(h('tr', null,
        h('td', null, h('b', null, 'תחום ' + d.title), d.sub ? h('div', { class: 'small' }, '(' + d.sub + ')') : null),
        h('td', null, profileLines(d.id, 's').map(function (l) { return h('p', null, l.label ? h('b', null, l.label) : null, l.text); })),
        h('td', null, profileLines(d.id, 'w').map(function (l) { return h('p', null, l.label ? h('b', null, l.label) : null, l.text); }))));
    });
    wrap.appendChild(tbl);
    (cur.plan ? cur.plan.goals : []).forEach(function (g) {
      var gt = GTMAP.get(g.type) || GT[0];
      var t = h('table');
      t.appendChild(h('tr', null, h('th', { colspan: 2 }, h('div', null, gt.label + ':'), h('div', null, g.title || ''))));
      t.appendChild(h('tr', null, h('td', null, h('b', null, 'יעדים')), h('td', null, h('b', null, 'אופן הביצוע / אחריות'))));
      g.objectives.forEach(function (ob, i) {
        t.appendChild(h('tr', null, h('td', null, (i + 1) + '. ' + objText(ob)), h('td', null, objMeans(ob).split(/\n+/).map(function (p) { return h('p', null, p); }))));
      });
      t.appendChild(h('tr', null, h('td', { colspan: 2 }, 'פרק זמן להשגה: ' + (g.timeframe || ''))));
      wrap.appendChild(t);
    });
    wrap.appendChild(h('p', null, 'בהצלחה !!!   חתימת מנהלת גן: ________   חתימת גננת השילוב: ________   חתימת הורים: ________   תאריך: ______'));
    return wrap;
  }

  /* ---------- ייצוא וורד ---------- */
  function docName() { return 'תחי ' + (cur.info.name || 'ללא שם'); }
  function downloadDocx() {
    return buildDocxBlob().then(function (blob) { saveBlob(blob, docName() + '.docx'); toast('קובץ הוורד נוצר'); });
  }
  function buildDocxBlob() {
    var dx = window.docx;
    if (!dx) return Promise.reject(new Error('ספריית הוורד לא נטענה'));
    var Document = dx.Document, Packer = dx.Packer, Paragraph = dx.Paragraph, TextRun = dx.TextRun, Table = dx.Table, TableRow = dx.TableRow, TableCell = dx.TableCell, WidthType = dx.WidthType, AlignmentType = dx.AlignmentType, PageOrientation = dx.PageOrientation, Footer = dx.Footer, PageNumber = dx.PageNumber, ImageRun = dx.ImageRun, BorderStyle = dx.BorderStyle, VerticalAlign = dx.VerticalAlign;
    var FONT = 'David';
    function run(text, o) { o = o || {}; return new TextRun({ text: text, bold: !!o.bold, italics: !!o.italics, underline: o.underline ? {} : undefined, size: o.size || 26, font: FONT, rightToLeft: true }); }
    function para(children, o) {
      o = o || {};
      if (!Array.isArray(children)) children = [children];
      return new Paragraph({ children: children, bidirectional: true, alignment: o.align || AlignmentType.START, spacing: { after: o.after === undefined ? 80 : o.after, line: 276 }, keepNext: !!o.keepNext });
    }
    function p(text, o) { return para([run(text, o)], o); }
    function labeled(parts, o) {
      /* parts: [[label, value], ...] joined with spaces */
      var runs = [];
      parts.forEach(function (pr, i) {
        if (i) runs.push(run('    '));
        runs.push(run(pr[0], { bold: true }));
        runs.push(run(pr[1] || ''));
      });
      return para(runs, o);
    }
    function cell(children, o) {
      o = o || {};
      return new TableCell({ children: children, width: o.width ? { size: o.width, type: WidthType.DXA } : undefined, columnSpan: o.span, verticalAlign: VerticalAlign.TOP, shading: o.shade ? { fill: o.shade, type: dx.ShadingType.CLEAR, color: 'auto' } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 } });
    }
    function table(rows, widths) {
      return new Table({ rows: rows, visuallyRightToLeft: true, width: { size: widths.reduce(function (a, b) { return a + b; }, 0), type: WidthType.DXA }, columnWidths: widths });
    }
    var info = cur.info;
    var TOTAL = 15840 - 2880; /* רוחב שימושי בטוויפים */
    var children = [];
    children.push(p(info.matya || '', { bold: true, italics: true, size: 24, after: 0 }));
    children.push(p('תח"י- תכנית חינוכית יחידנית', { bold: true, underline: true, size: 32, after: 120 }));
    var l1 = [['שם הילד/ה: ', info.name || ''], ['ת. לידה: ', fmtDate(info.birth)]];
    if (info.kupa) l1.push(['קופת חולים: ', info.kupa]);
    children.push(labeled(l1));
    children.push(labeled([['שם הגן: ', info.gan || ''], ['גננת שילוב: ', info.teacher || ''], ['מנהלת גן: ', info.manager || ''], ['תאריך: ', fmtDate(info.date)]]));
    children.push(para([run('שותפים בבניית התכנית: ', { bold: true, underline: true }), run(info.partners || '')]));
    children.push(para([run('רשימת טיפולים (פרטי, גן, קופ"ח): ', { bold: true, underline: true }), run(info.treatments || '')]));
    children.push(para([run('תאור תפקוד התלמיד/ה בגן: ', { bold: true, underline: true })], { after: 40, keepNext: true }));
    narrativeText().split(/\n+/).forEach(function (line) { if (line.trim()) children.push(p(line.trim(), { align: AlignmentType.BOTH })); });
    /* טבלת פרופיל */
    var w1 = 2900, w2 = Math.floor((TOTAL - w1) / 2), w3 = TOTAL - w1 - w2;
    var rows = [new TableRow({ tableHeader: true, children: [cell([p('', {})], { width: w1, shade: 'F2F2F2' }), cell([p('מוקדי כוח:', { bold: true, underline: true })], { width: w2, shade: 'F2F2F2' }), cell([p('מוקדים לחיזוק:', { bold: true, underline: true })], { width: w3, shade: 'F2F2F2' })] })];
    DOMS.forEach(function (d) {
      function linesToParas(lines) {
        if (!lines.length) return [p('')];
        return lines.map(function (l) { var rs = []; if (l.label) rs.push(run(l.label, { bold: true, underline: true, size: 24 })); rs.push(run(l.text, { size: 24 })); return para(rs, { after: 60 }); });
      }
      rows.push(new TableRow({ children: [
        cell([para([run('תחום ' + d.title, { bold: true, underline: true, size: 24 })], { after: 20 }), d.sub ? p('(' + d.sub + ')', { size: 20 }) : p('', { size: 8 })], { width: w1 }),
        cell(linesToParas(profileLines(d.id, 's')), { width: w2 }),
        cell(linesToParas(profileLines(d.id, 'w')), { width: w3 })
      ] }));
    });
    children.push(table(rows, [w1, w2, w3]));
    children.push(p('', { after: 120 }));
    /* מטרות */
    var icons = D.icons || {};
    function iconRun(kind) {
      var b64 = kind === 'book' ? icons.book : icons.bubbles; if (!b64) return null;
      try { var bin = atob(b64), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new ImageRun({ type: 'png', data: arr, transformation: { width: 26, height: 26 } }); } catch (e) { return null; }
    }
    (cur.plan ? cur.plan.goals : []).forEach(function (g) {
      var gt = GTMAP.get(g.type) || GT[0];
      var gw1 = Math.floor(TOTAL * 0.38), gw2 = TOTAL - gw1;
      var headRuns = [];
      var ic = (gt.id === 'academic' || gt.id === 'language') ? iconRun('book') : (gt.id === 'social' ? iconRun('bubbles') : null);
      if (ic) { headRuns.push(ic); headRuns.push(run(' ')); }
      headRuns.push(run(gt.label + ':', { bold: true }));
      var grows = [
        new TableRow({ tableHeader: true, children: [cell([para(headRuns, { after: 0 }), p(g.title || '', { bold: true })], { span: 2, shade: 'F2F2F2' })] }),
        new TableRow({ children: [cell([p('יעדים', { bold: true, size: 24 })], { width: gw1 }), cell([p('אופן הביצוע / אחריות', { bold: true, size: 24 })], { width: gw2 })] })
      ];
      g.objectives.forEach(function (ob, i) {
        var means = objMeans(ob).split(/\n+/).filter(function (x) { return x.trim(); });
        grows.push(new TableRow({ children: [
          cell([p((i + 1) + '. ' + objText(ob), { size: 24 })], { width: gw1 }),
          cell(means.length ? means.map(function (m) { return p(m.trim(), { size: 24, after: 60 }); }) : [p('', { size: 24 })], { width: gw2 })
        ] }));
      });
      grows.push(new TableRow({ children: [cell([p('פרק זמן להשגה: ' + (g.timeframe || ''), { size: 24 })], { span: 2 })] }));
      children.push(table(grows, [gw1, gw2]));
      children.push(p('', { after: 160 }));
    });
    children.push(p('בהצלחה !!!   חתימת מנהלת גן: __________   חתימת גננת השילוב: __________   חתימת הורים: __________   תאריך: ______', { size: 24 }));
    var doc = new Document({
      creator: info.teacher || 'גננת שילוב',
      title: 'תח"י ' + (info.name || ''),
      styles: { default: { document: { run: { font: FONT, size: 26, rightToLeft: true }, paragraph: { bidirectional: true } } } },
      sections: [{
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE, width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] }) },
        children: children
      }]
    });
    return Packer.toBlob(doc);
  }
  function saveBlob(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ---------- ייצוא אקסל ---------- */
  function xlsxName() { return 'רמזור ' + (cur.info.name || 'ללא שם'); }
  function downloadXlsx() {
    var X = window.XLSX; if (!X) throw new Error('ספריית האקסל לא נטענה');
    X.writeFile(buildWorkbook(), xlsxName() + '.xlsx');
    toast('קובץ האקסל נוצר');
  }
  function buildXlsxBlob() {
    var X = window.XLSX; if (!X) throw new Error('ספריית האקסל לא נטענה');
    var arr = X.write(buildWorkbook(), { bookType: 'xlsx', type: 'array' });
    return new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function buildWorkbook() {
    var X = window.XLSX;
    var rows = [['תחום', 'פרמטר (מיומנות)', 'ציון (נורמלי/בינוני/נמוך)', 'הערות/דוגמה ספציפית']];
    var lastSec = null;
    D.sections.forEach(function (sec) {
      PARAMS.filter(function (p) { return p.sec === sec.id; }).forEach(function (p) {
        var r = cur.ratings[String(p.id)] || {};
        var lv = r.level ? LVMAP.get(r.level).label : '';
        rows.push([lastSec !== sec.id ? (['I', 'II', 'III', 'IV', 'V', 'VI'][sec.id - 1] + '. ' + sec.title) : '', p.name, lv, r.note || '']);
        lastSec = sec.id;
      });
      rows.push(['', '', '', '']);
    });
    rows.push(['ממצאי מבדק', '', '', '']);
    LIT.forEach(function (it) {
      var l = cur.literacy[it.id] || {};
      var st = l.status ? { yes: 'שולט/ת', part: 'חלקי', no: 'לא' }[l.status] : '';
      rows.push([D.literacy.groups.filter(function (g) { return g.id === it.group; })[0].title, it.label, st, l.value || '']);
    });
    var ws = X.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 26 }, { wch: 44 }, { wch: 22 }, { wch: 40 }];
    var wb = X.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    X.utils.book_append_sheet(wb, ws, 'רמזור');
    return wb;
  }

  /* ---------- ייצוא/ייבוא נתונים ---------- */
  function exportChild() {
    var blob = new Blob([JSON.stringify({ techi: 1, child: cur }, null, 1)], { type: 'application/json' });
    saveBlob(blob, 'נתוני תחי ' + (cur.info.name || 'ללא שם') + '.json');
  }
  function importFile(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var j = JSON.parse(fr.result);
        var list = j.children ? Object.keys(j.children).map(function (k) { return j.children[k]; }) : (j.child ? [j.child] : []);
        if (!list.length) throw new Error('אין נתונים בקובץ');
        list.forEach(function (c) { if (!c.id || store.children[c.id]) c.id = uid(); store.children[c.id] = c; store.order.push(c.id); store.current = c.id; });
        cur = store.children[store.current]; save(); boot(); toast('יובאו ' + list.length + ' רשומות');
      } catch (e) { alert('הייבוא נכשל: ' + e.message); }
    };
    fr.readAsText(file);
  }

  /* ---------- גוגל דרייב ---------- */
  var GOOGLE_CLIENT_ID = '896508295853-hcu3bhobsog8dut3hu3r8gn1d063uufv.apps.googleusercontent.com';
  var SCOPE_DRIVE = 'https://www.googleapis.com/auth/drive.file';
  var SCOPES = SCOPE_DRIVE + ' openid email';
  var SCOPE_MSG = 'ההרשאה לגוגל דרייב לא סומנה בחלון של גוגל. יש ללחוץ שוב על ההתחברות, ובמסך האישור לסמן את התיבה "לראות, לערוך, ליצור ולמחוק רק את קובצי Google Drive הספציפיים שבהם משתמשים באפליקציה הזו" לפני "המשך".';
  var FOLDER_NAME = 'תחי';
  var MIME_FOLDER = 'application/vnd.google-apps.folder';
  var MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  var MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  var drive = { token: null, expiresAt: 0, email: '', folderId: null, tokenClient: null, tokenClientId: '', lastErr: '', conflict: null, saving: false, needScope: false };
  var driveTimers = {};
  function clientId() { return GOOGLE_CLIENT_ID || (store.prefs && store.prefs.clientId) || ''; }
  function driveConnected() { return !!(drive.token && Date.now() < drive.expiresAt - 30000); }
  function loadSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem('techi.gtoken') || 'null');
      if (s && s.token && Date.now() < s.expiresAt - 30000) { drive.token = s.token; drive.expiresAt = s.expiresAt; drive.email = s.email || ''; }
    } catch (e) { /* אין סשן */ }
    drive.folderId = store.prefs.folderId || null;
  }
  function saveSession() { try { sessionStorage.setItem('techi.gtoken', JSON.stringify({ token: drive.token, expiresAt: drive.expiresAt, email: drive.email })); } catch (e) { /* התעלם */ } }
  function gisReady() { return !!(window.google && window.google.accounts && window.google.accounts.oauth2); }
  function connectDrive(interactive) {
    return new Promise(function (resolve, reject) {
      if (!clientId()) { reject(new Error('לא הוגדר מזהה לקוח של גוגל')); return; }
      if (!gisReady()) { reject(new Error('ספריית ההתחברות של גוגל לא נטענה (אין חיבור לאינטרנט?)')); return; }
      if (!drive.tokenClient || drive.tokenClientId !== clientId()) {
        drive.tokenClient = window.google.accounts.oauth2.initTokenClient({ client_id: clientId(), scope: SCOPES, callback: function () {}, error_callback: function () {} });
        drive.tokenClientId = clientId();
      }
      drive.tokenClient.callback = function (resp) {
        if (!resp || resp.error) { reject(new Error((resp && (resp.error_description || resp.error)) || 'ההתחברות נכשלה')); return; }
        /* גוגל מציג את ההרשאה לדרייב כתיבת סימון נפרדת; בלי סימון מתקבל אסימון בלי גישה לדרייב */
        if (typeof resp.scope === 'string' && resp.scope && resp.scope.split(/\s+/).indexOf(SCOPE_DRIVE) < 0) {
          drive.needScope = true;
          reject(new Error(SCOPE_MSG));
          return;
        }
        drive.needScope = false;
        drive.token = resp.access_token;
        drive.expiresAt = Date.now() + (parseInt(resp.expires_in, 10) || 3600) * 1000;
        drive.lastErr = '';
        saveSession();
        fetchEmail().then(function () { saveSession(); renderDriveBar(); resolve(); }, function () { renderDriveBar(); resolve(); });
      };
      drive.tokenClient.error_callback = function (err) {
        var t = err && err.type;
        reject(new Error(t === 'popup_closed' ? 'ההתחברות בוטלה' : (t === 'popup_failed_to_open' ? 'הדפדפן חסם את חלון ההתחברות; יש לאפשר חלונות קופצים לאתר' : 'ההתחברות לגוגל נכשלה')));
      };
      drive.tokenClient.requestAccessToken({ prompt: drive.needScope ? 'consent' : (interactive ? 'select_account' : '') });
    });
  }
  function disconnectDrive() {
    var t = drive.token;
    drive.token = null; drive.expiresAt = 0; drive.email = ''; drive.conflict = null;
    try { sessionStorage.removeItem('techi.gtoken'); } catch (e) { /* התעלם */ }
    if (t && gisReady()) { try { window.google.accounts.oauth2.revoke(t, function () {}); } catch (e) { /* התעלם */ } }
    renderDriveBar();
  }
  function fetchEmail() {
    return gapi('https://www.googleapis.com/oauth2/v3/userinfo').then(function (u) { drive.email = (u && u.email) || ''; });
  }
  function gapi(url, opts) {
    opts = opts || {};
    var headers = Object.assign({ Authorization: 'Bearer ' + drive.token }, opts.headers || {});
    return fetch(url, { method: opts.method || 'GET', headers: headers, body: opts.body }).then(function (r) {
      if (r.status === 401) { drive.token = null; saveSession(); renderDriveBar(); throw new Error('פג תוקף החיבור לגוגל, יש להתחבר מחדש'); }
      if (!r.ok) {
        return r.text().then(function (t) {
          var msg = t; try { msg = JSON.parse(t).error.message; } catch (e) { /* טקסט גולמי */ }
          if (r.status === 403 && /insufficient/i.test(msg)) {
            /* אסימון בלי הרשאת דרייב (התיבה לא סומנה): מנתקים ומסבירים */
            drive.needScope = true; drive.token = null; drive.lastErr = SCOPE_MSG; saveSession(); renderDriveBar();
            var se = new Error(SCOPE_MSG); se.status = 403; throw se;
          }
          var err = new Error('גוגל דרייב: ' + msg); err.status = r.status; throw err;
        });
      }
      if (opts.raw) return r;
      var ct = r.headers.get('content-type') || '';
      return ct.indexOf('json') >= 0 ? r.json() : r.text();
    });
  }
  function ensureToken() { return driveConnected() ? Promise.resolve() : connectDrive(false); }
  function ensureFolder() {
    if (drive.folderId) return Promise.resolve(drive.folderId);
    var q = "name='" + FOLDER_NAME + "' and mimeType='" + MIME_FOLDER + "' and trashed=false";
    return gapi('https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) + '&fields=files(id,name)&pageSize=10').then(function (res) {
      if (res.files && res.files.length) { setFolder(res.files[0].id); return drive.folderId; }
      return gapi('https://www.googleapis.com/drive/v3/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: FOLDER_NAME, mimeType: MIME_FOLDER }) })
        .then(function (f) { setFolder(f.id); return drive.folderId; });
    });
  }
  function setFolder(id) { drive.folderId = id; store.prefs.folderId = id; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch (e) { /* התעלם */ } }
  function multipart(meta, content, contentType) {
    var boundary = 'techi' + Math.random().toString(36).slice(2);
    var head = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) + '\r\n--' + boundary + '\r\nContent-Type: ' + contentType + '\r\n\r\n';
    var tail = '\r\n--' + boundary + '--';
    return { body: new Blob([head, content, tail]), type: 'multipart/related; boundary=' + boundary };
  }
  function isNotFound(e) { return e && (e.status === 404 || e.code === 'gone'); }
  function childFileName(c) { return 'תחי - ' + ((c.info.name || '').trim() || 'ללא שם') + '.json'; }
  function childPayload(c) {
    var copy = JSON.parse(JSON.stringify(c));
    delete copy.drive; delete copy.driveDirty;
    if (copy.plan && copy.plan.goals) copy.plan.goals.forEach(function (g) { delete g.pickerOpen; delete g.pickerTab; });
    return JSON.stringify({ techi: 1, savedAt: new Date().toISOString(), child: copy });
  }
  function saveChildToDrive(c, force) {
    drive.saving = true; renderDriveBar();
    return ensureToken().then(ensureFolder).then(function (folderId) {
      var payload = childPayload(c);
      var meta = { name: childFileName(c), appProperties: { techi: 'child', childId: c.id } };
      if (c.drive && c.drive.fileId) {
        var pre = force ? Promise.resolve() : gapi('https://www.googleapis.com/drive/v3/files/' + c.drive.fileId + '?fields=id,modifiedTime,trashed').then(function (m) {
          if (m.trashed) { var g = new Error('gone'); g.code = 'gone'; throw g; }
          if (c.drive.modifiedTime && m.modifiedTime !== c.drive.modifiedTime) { var e = new Error('conflict'); e.code = 'conflict'; e.remote = m; throw e; }
        });
        return pre.then(function () {
          var mp = multipart(meta, payload, 'application/json');
          return gapi('https://www.googleapis.com/upload/drive/v3/files/' + c.drive.fileId + '?uploadType=multipart&fields=id,modifiedTime', { method: 'PATCH', headers: { 'Content-Type': mp.type }, body: mp.body });
        }).catch(function (e) {
          if (isNotFound(e)) { c.drive = null; return createChildFile(c, meta, payload, folderId); }
          throw e;
        });
      }
      return createChildFile(c, meta, payload, folderId);
    }).then(function (f) {
      c.drive = { fileId: f.id, modifiedTime: f.modifiedTime, savedAt: Date.now() };
      c.driveDirty = false; drive.lastErr = ''; drive.saving = false;
      if (drive.conflict && drive.conflict.childId === c.id) drive.conflict = null;
      save(true);
      renderDriveBar();
      return f;
    }, function (e) {
      drive.saving = false;
      if (e && e.code === 'conflict') { drive.conflict = { childId: c.id, remote: e.remote }; }
      else { drive.lastErr = e.message || String(e); }
      renderDriveBar();
      throw e;
    });
  }
  function createChildFile(c, meta, payload, folderId) {
    var m2 = Object.assign({}, meta, { parents: [folderId] });
    var mp = multipart(m2, payload, 'application/json');
    return gapi('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime', { method: 'POST', headers: { 'Content-Type': mp.type }, body: mp.body })
      .catch(function (e) {
        if (isNotFound(e) && drive.folderId) { setFolder(null); return ensureFolder().then(function (fid) { return createChildFile(c, meta, payload, fid); }); }
        throw e;
      });
  }
  function listDriveChildren() {
    return ensureToken().then(ensureFolder).then(function (folderId) {
      var q = "'" + folderId + "' in parents and trashed=false and appProperties has { key='techi' and value='child' }";
      return gapi('https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) + '&fields=files(id,name,modifiedTime,appProperties)&orderBy=modifiedTime%20desc&pageSize=200');
    }).then(function (r) { return r.files || []; });
  }
  function loadChildFromDrive(fileId) {
    return ensureToken().then(function () { return gapi('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media'); }).then(function (j) {
      if (typeof j === 'string') j = JSON.parse(j);
      var c = j && (j.child || j);
      if (!c || !c.info) throw new Error('הקובץ בדרייב אינו קובץ תח"י תקין');
      return gapi('https://www.googleapis.com/drive/v3/files/' + fileId + '?fields=id,modifiedTime').then(function (m) {
        c.drive = { fileId: fileId, modifiedTime: m.modifiedTime, savedAt: Date.now() };
        c.driveDirty = false;
        return c;
      });
    });
  }
  function trashDriveFile(fileId) {
    return ensureToken().then(function () { return gapi('https://www.googleapis.com/drive/v3/files/' + fileId + '?fields=id', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) }); });
  }
  function uploadConverted(blob, name, srcMime, targetMime) {
    return ensureToken().then(ensureFolder).then(function (folderId) {
      var mp = multipart({ name: name, mimeType: targetMime, parents: [folderId] }, blob, srcMime);
      return gapi('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', { method: 'POST', headers: { 'Content-Type': mp.type }, body: mp.body });
    });
  }
  function scheduleDriveSave(c) {
    if (!c || !driveConnected() || !clientId()) return;
    if (!(c.info.name || '').trim() && !c.drive) return; /* לא יוצרים קובץ לרשומה בלי שם */
    clearTimeout(driveTimers[c.id]);
    driveTimers[c.id] = setTimeout(function () { delete driveTimers[c.id]; if (c.driveDirty) saveChildToDrive(c, false).catch(function () { /* מוצג בסרגל */ }); }, 6000);
  }
  function flushDriveSave(c) {
    if (!c || !driveTimers[c.id]) return Promise.resolve();
    clearTimeout(driveTimers[c.id]); delete driveTimers[c.id];
    return c.driveDirty && driveConnected() ? saveChildToDrive(c, false).catch(function () { /* מוצג בסרגל */ }) : Promise.resolve();
  }
  function adoptChild(c) {
    /* מכניס רשומה מהדרייב לאחסון המקומי (מחליף רשומה עם אותו מזהה) */
    if (!c.id) c.id = uid();
    if (!store.children[c.id]) store.order.push(c.id);
    store.children[c.id] = c;
    store.current = c.id; cur = c;
    save(true);
  }
  function fmtTime(iso) { if (!iso) return ''; var d = new Date(iso); if (isNaN(d.getTime())) return ''; return d.toLocaleDateString('he-IL') + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  /* ---------- סרגל הדרייב ---------- */
  var GICON = '<svg class="gicon" viewBox="0 0 87.3 78" aria-hidden="true"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/><path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>';
  function renderDriveBar() {
    var bar = $('#drivebar'); if (!bar) return;
    if (!clientId() && bar.querySelector('.setup')) return; /* לא לדרוס תיבת הגדרה שמקלידים בה */
    bar.innerHTML = '';
    bar.classList.toggle('off', !driveConnected());
    if (!clientId()) {
      var inp = h('input', { type: 'text', placeholder: 'xxxxxxxx.apps.googleusercontent.com', value: store.prefs.clientId || '' });
      bar.appendChild(h('div', { class: 'setup', style: 'flex:1' },
        h('div', null, h('b', null, 'שמירה בגוגל דרייב עדיין לא הופעלה.'), ' נדרש מזהה לקוח OAuth של גוגל (מוגדר פעם אחת בקוד הדף). לבדיקה זמנית אפשר להדביק אותו כאן:'),
        inp,
        h('div', { style: 'margin-top:6px' }, h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () { store.prefs.clientId = inp.value.trim(); save(true); renderDriveBar(); } }, 'שמור מזהה'))));
      return;
    }
    bar.insertAdjacentHTML('beforeend', GICON);
    if (!driveConnected()) {
      bar.appendChild(h('span', { class: 'dstatus' }, 'לא מחובר לגוגל דרייב. העבודה נשמרת בינתיים רק בדפדפן הזה.'));
      bar.appendChild(h('span', { class: 'spacer' }));
      bar.appendChild(h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: function () {
        connectDrive(true).then(function () { toast('מחובר לגוגל דרייב'); return afterConnect(); }).catch(function (e) { drive.lastErr = e.message; renderDriveBar(); });
      } }, 'התחברות לגוגל דרייב'));
      if (drive.lastErr) bar.appendChild(h('div', { class: 'dsync err', style: 'width:100%' }, drive.lastErr));
      else bar.appendChild(h('div', { class: 'dsync', style: 'width:100%' }, 'בחלון של גוגל: לבחור חשבון, לסמן את תיבת ההרשאה לגוגל דרייב וללחוץ "המשך".'));
      return;
    }
    bar.appendChild(h('span', { class: 'dstatus' }, 'מחובר: ', h('b', null, drive.email || 'חשבון גוגל'), ' · תיקייה "' + FOLDER_NAME + '"'));
    var syncEl = h('span', { class: 'dsync' });
    if (cur) {
      if (drive.saving) { syncEl.textContent = 'שומר בדרייב...'; }
      else if (drive.conflict && drive.conflict.childId === cur.id) { syncEl.textContent = 'התנגשות: הקובץ בדרייב עודכן ממחשב אחר'; syncEl.classList.add('err'); }
      else if (cur.driveDirty || !cur.drive) { syncEl.textContent = cur.drive ? 'שינויים טרם נשמרו בדרייב' : ((cur.info.name || '').trim() ? 'עדיין לא נשמר בדרייב' : 'ייווצר קובץ בדרייב כשיוזן שם'); syncEl.classList.add('dirty'); }
      else { syncEl.textContent = 'נשמר בדרייב ' + fmtTime(new Date(cur.drive.savedAt).toISOString()); }
    }
    bar.appendChild(syncEl);
    bar.appendChild(h('span', { class: 'spacer' }));
    if (drive.conflict && cur && drive.conflict.childId === cur.id) {
      bar.appendChild(h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () {
        loadChildFromDrive(cur.drive.fileId).then(function (c) { adoptChild(c); drive.conflict = null; boot(); toast('נטענה הגרסה מהדרייב'); }).catch(function (e) { drive.lastErr = e.message; renderDriveBar(); });
      } }, 'טען את הגרסה מהדרייב'));
      bar.appendChild(h('button', { class: 'btn btn-primary btn-small', type: 'button', onclick: function () { saveChildToDrive(cur, true).then(function () { toast('נשמר בדרייב'); }).catch(function () {}); } }, 'דרוס עם הגרסה שלי'));
    } else {
      bar.appendChild(h('button', { class: 'btn btn-secondary btn-small', type: 'button', disabled: !cur || drive.saving, onclick: function () {
        clearTimeout(driveTimers[cur.id]);
        saveChildToDrive(cur, false).then(function () { toast('נשמר בדרייב'); }).catch(function (e) { if (e && e.code !== 'conflict') toast(e.message); });
      } }, 'שמור עכשיו'));
    }
    bar.appendChild(h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: openDriveDialog }, 'ילדים בדרייב'));
    bar.appendChild(h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () { if (confirm('להתנתק מגוגל דרייב בדפדפן הזה? העבודה תמשיך להישמר בדפדפן בלבד.')) disconnectDrive(); } }, 'התנתק'));
    if (drive.lastErr) bar.appendChild(h('div', { class: 'dsync err', style: 'width:100%' }, drive.lastErr));
  }
  function afterConnect() {
    /* אחרי התחברות: אם יש בדרייב רשומות ובמחשב הזה רק רשומה ריקה, פותחים את הרשימה */
    return listDriveChildren().then(function (files) {
      var localEmpty = store.order.every(function (id) { var c = store.children[id]; return c && !(c.info.name || '').trim() && !Object.keys(c.ratings || {}).some(function (k) { return c.ratings[k] && c.ratings[k].level; }); });
      if (files.length && (localEmpty || !store.order.some(function (id) { return store.children[id] && store.children[id].drive; }))) openDriveDialog();
      else scheduleDriveSave(cur);
    }).catch(function (e) { drive.lastErr = e.message; renderDriveBar(); });
  }
  function closeModal() { var m = $('#modal'); if (m) m.remove(); }
  function openDriveDialog() {
    closeModal();
    var body = h('div', null, h('div', { class: 'muted' }, 'טוען רשימה מהדרייב...'));
    var modal = h('div', { class: 'modal-bg', id: 'modal', onclick: function (e) { if (e.target === this) closeModal(); } },
      h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' },
        h('h2', null, 'ילדים בתיקייה "' + FOLDER_NAME + '" בדרייב', h('span', { class: 'spacer' }), h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'סגור', onclick: closeModal }, '✕')),
        body));
    document.body.appendChild(modal);
    listDriveChildren().then(function (files) {
      body.innerHTML = '';
      var byChildId = {}; files.forEach(function (f) { var cid = f.appProperties && f.appProperties.childId; if (cid) byChildId[cid] = f; });
      var localByFile = {}; store.order.forEach(function (id) { var c = store.children[id]; if (c && c.drive && c.drive.fileId) localByFile[c.drive.fileId] = c; });
      if (!files.length) body.appendChild(h('div', { class: 'note' }, 'אין עדיין קבצים של ילדים בדרייב. רשומות עם שם נשמרות אוטומטית כשמחוברים.'));
      var list = h('div', { class: 'flist' });
      files.forEach(function (f) {
        var local = localByFile[f.id] || (f.appProperties && store.children[f.appProperties.childId]) || null;
        var tag;
        if (!local) tag = h('span', { class: 'tag new' }, 'לא במחשב זה');
        else if (local.driveDirty) tag = h('span', { class: 'tag newer' }, 'שינויים מקומיים טרם נשמרו');
        else if (local.drive && local.drive.modifiedTime && local.drive.modifiedTime !== f.modifiedTime) tag = h('span', { class: 'tag newer' }, 'גרסה חדשה יותר בדרייב');
        else tag = h('span', { class: 'tag same' }, 'מסונכרן');
        var btns = h('div', { style: 'display:flex;gap:4px' },
          h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: function () {
            if (local && local.driveDirty && !confirm('לרשומה הזו יש שינויים במחשב שטרם נשמרו בדרייב. לטעון בכל זאת ולדרוס אותם?')) return;
            loadChildFromDrive(f.id).then(function (c) { adoptChild(c); closeModal(); boot(); toast('נטען מהדרייב: ' + (c.info.name || '')); }).catch(function (e) { alert(e.message); });
          } }, local ? 'טען מחדש' : 'טען'),
          h('button', { class: 'iconbtn del', type: 'button', title: 'העבר לאשפה בדרייב', onclick: function () {
            if (!confirm('להעביר את "' + f.name + '" לאשפה בדרייב? הרשומה במחשב הזה (אם קיימת) לא תימחק.')) return;
            trashDriveFile(f.id).then(function () { if (local) { local.drive = null; save(true); } openDriveDialog(); }).catch(function (e) { alert(e.message); });
          } }, '✕'));
        list.appendChild(h('div', { class: 'frow' }, h('div', null, h('div', { class: 'fn' }, f.name.replace(/\.json$/, '')), h('div', { class: 'fm' }, 'עודכן בדרייב: ' + fmtTime(f.modifiedTime))), tag, btns));
      });
      if (files.length) body.appendChild(list);
      /* רשומות מקומיות שאינן בדרייב */
      var onlyLocal = store.order.map(function (id) { return store.children[id]; }).filter(function (c) { return c && (!c.drive || !c.drive.fileId) && (c.info.name || '').trim(); });
      if (onlyLocal.length) {
        body.appendChild(h('h3', { style: 'margin-top:14px' }, 'רשומות במחשב זה שעדיין לא בדרייב'));
        var l2 = h('div', { class: 'flist' });
        onlyLocal.forEach(function (c) {
          l2.appendChild(h('div', { class: 'frow' }, h('div', null, h('div', { class: 'fn' }, c.info.name), h('div', { class: 'fm' }, 'עודכן במחשב: ' + fmtTime(new Date(c.updated || c.created).toISOString()))), h('span', { class: 'tag' }, 'מקומי בלבד'),
            h('button', { class: 'btn btn-ghost btn-small', type: 'button', onclick: function () { saveChildToDrive(c, false).then(function () { openDriveDialog(); toast('נשמר בדרייב'); }).catch(function (e) { alert(e.message); }); } }, 'שמור בדרייב')));
        });
        body.appendChild(l2);
        body.appendChild(h('div', { style: 'margin-top:8px' }, h('button', { class: 'btn btn-secondary btn-small', type: 'button', onclick: function () {
          var p = Promise.resolve(); onlyLocal.forEach(function (c) { p = p.then(function () { return saveChildToDrive(c, false); }); });
          p.then(function () { openDriveDialog(); toast('כל הרשומות נשמרו בדרייב'); }).catch(function (e) { alert(e.message); });
        } }, 'שמור את כולן בדרייב')));
      }
      body.appendChild(h('div', { class: 'muted', style: 'margin-top:10px' }, 'הקבצים נשמרים בתיקייה "' + FOLDER_NAME + '" בדרייב של ' + (drive.email || 'החשבון המחובר') + '. הכלי רואה רק קבצים שהוא עצמו יצר.'));
    }).catch(function (e) { body.innerHTML = ''; body.appendChild(h('div', { class: 'note warn' }, 'טעינת הרשימה נכשלה: ' + e.message)); });
  }
  function saveProductToDrive(kind) {
    if (!driveConnected()) { toast('יש להתחבר לגוגל דרייב תחילה'); return Promise.resolve(); }
    var dateTag = fmtDate(cur.info.date || todayISO()).replace(/\//g, '.');
    var p = kind === 'doc'
      ? buildDocxBlob().then(function (b) { return uploadConverted(b, docName() + ' ' + dateTag, MIME_DOCX, 'application/vnd.google-apps.document'); })
      : Promise.resolve().then(function () { return uploadConverted(buildXlsxBlob(), xlsxName() + ' ' + dateTag, MIME_XLSX, 'application/vnd.google-apps.spreadsheet'); });
    return p.then(function (f) {
      cur.docs = cur.docs || [];
      cur.docs.unshift({ kind: kind, id: f.id, name: f.name, link: f.webViewLink, at: new Date().toISOString() });
      save();
      toast(kind === 'doc' ? 'התח"י נשמר כגוגל דוקס' : 'הרמזור נשמר כגוגל שיטס');
      if (f.webViewLink) window.open(f.webViewLink, '_blank', 'noopener');
      renderStep4();
    }).catch(function (e) { drive.lastErr = e.message; renderDriveBar(); alert('השמירה בדרייב נכשלה: ' + e.message); });
  }

  /* ---------- אתחול ---------- */
  function renderChildSelect() {
    var sel = $('#childSel'); sel.innerHTML = '';
    store.order.filter(function (id) { return store.children[id]; }).forEach(function (id) {
      sel.appendChild(h('option', { value: id, selected: id === store.current }, childLabel(store.children[id])));
    });
  }
  function boot() {
    if (!store.order.length) { addChild(newChild()); }
    if (!store.current || !store.children[store.current]) store.current = store.order[0];
    cur = store.children[store.current];
    derivedDirty = false;
    renderChildSelect();
    renderDriveBar();
    showStep(cur.step || 1);
  }
  function switchChild(id) {
    var prev = cur;
    if (prev && prev.id !== id) flushDriveSave(prev);
    store.current = id; cur = store.children[id];
    save(true); boot();
  }
  $('#childSel').addEventListener('change', function () { switchChild(this.value); });
  $('#btnNew').addEventListener('click', function () { if (cur) flushDriveSave(cur); addChild(newChild()); boot(); toast('נפתחה רשומה חדשה'); });
  $('#btnDup').addEventListener('click', function () { var c = JSON.parse(JSON.stringify(cur)); c.id = uid(); c.created = Date.now(); c.info.name = (c.info.name || '') + ' (עותק)'; c.drive = null; c.docs = []; c.driveDirty = true; addChild(c); boot(); });
  $('#btnDel').addEventListener('click', function () {
    var hasDrive = cur.drive && cur.drive.fileId;
    var msg = 'למחוק את הרשומה של "' + (cur.info.name || 'ללא שם') + '" מהדפדפן?' + (hasDrive ? ' (הקובץ בדרייב יישאר; אפשר למחוק אותו מרשימת "ילדים בדרייב")' : ' אי אפשר לשחזר (אלא מקובץ ייצוא).');
    if (!confirm(msg)) return;
    clearTimeout(driveTimers[cur.id]);
    delete store.children[cur.id]; store.order = store.order.filter(function (id) { return id !== cur.id; }); store.current = store.order[0] || null; save(true); boot();
  });
  window.addEventListener('beforeunload', function (e) {
    if (!driveConnected()) return;
    var pending = store.order.some(function (id) { var c = store.children[id]; return c && c.driveDirty && c.drive; });
    if (pending) { e.preventDefault(); e.returnValue = ''; }
  });
  loadSession();
  $('#btnExport').addEventListener('click', exportChild);
  $('#btnImport').addEventListener('click', function () { $('#fileImport').click(); });
  $('#fileImport').addEventListener('change', function () { if (this.files[0]) importFile(this.files[0]); this.value = ''; });
  document.querySelectorAll('#steps button').forEach(function (b) { b.addEventListener('click', function () { showStep(parseInt(b.dataset.step, 10)); }); });
  boot();
})();
