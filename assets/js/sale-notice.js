/* セール案内(この道具ええやん.com)
 * 各社が公式に発表した日程だけを書く。表示期間(show〜hide)を過ぎると自動で消えるので、
 * 更新し忘れても古い案内は残らない。価格・ポイント倍率・割引率は書かない。
 * 日時は日本時間(+09:00)。アフィリエイトリンクは一字も変えない。
 * 出典と規約の注意: プロジェクト直下の「セールイベント調査_2026-11.md」
 */
(function () {
  'use strict';
  var EVENTS = [
    {
      shop: '楽天市場', cls: 'rakuten',
      show: '2026-11-12T10:00:00+09:00', start: '2026-11-19T20:00:00+09:00', hide: '2026-11-25T02:00:00+09:00',
      name: '楽天ブラックフライデー',
      period: '11/19(木)20:00〜11/25(水)1:59',
      note: 'ショップ買いまわりはエントリーが必要です。',
      url: 'https://hb.afl.rakuten.co.jp/hgc/08ce9fe8.bb9d5ab8.08ce9fe9.9e9e244c/?pc=https%3A%2F%2Fevent.rakuten.co.jp%2Fcampaign%2Fpoint-up%2Fblackfriday%2F&link_type=text&ut=eyJwYWdlIjoidXJsIiwidHlwZSI6InRleHQiLCJjb2wiOjF9',
      label: 'エントリー・会場へ'
    },
    {
      shop: 'Yahoo!ショッピング', cls: 'yahoo',
      show: '2026-11-12T00:00:00+09:00', start: '2026-11-22T00:00:00+09:00', hide: '2026-11-30T00:00:00+09:00',
      name: 'Yahoo!ショッピング ブラックフライデー',
      period: '11/22(日)〜11/29(日)',
      note: 'PayPayポイントの条件は会場ページで確かめてください。',
      url: 'https://yahoo.jp/VBfoMy',
      label: '会場へ'
    },
    {
      shop: 'Amazon', cls: 'amazon',
      show: '2026-11-12T00:00:00+09:00', start: '2026-11-19T12:00:00+09:00', hide: '2026-11-19T12:00:00+09:00', /* 期間が発表されたら start/hide/period を書き換える */
      name: 'Amazon ブラックフライデー',
      period: '11月開催。期間は11/19(木)午前に発表予定',
      note: '',
      url: 'https://www.amazon.co.jp/blackfriday?&linkCode=ll2&tag=tike0a-22&linkId=46bd4c8464a32c8a4574e6459c25f17d&ref_=as_li_ss_tl',
      label: '特設ページへ',
      prime: true
    }
  ];
  var PRIME_URL = 'https://www.amazon.co.jp/amazonprime?&linkCode=ll2&tag=tike0a-22&linkId=48ad104ac6992efb7d86a9c886cd1cf1&ref_=as_li_ss_tl';

  var now = Date.now();
  var list = EVENTS.filter(function (e) {
    return now >= Date.parse(e.show) && now < Date.parse(e.hide);
  });
  if (!list.length) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  var REL = 'target="_blank" rel="nofollow sponsored noopener"';
  var showPrime = false;
  var rows = list.map(function (e) {
    var live = now >= Date.parse(e.start);
    if (e.prime) showPrime = true;
    return '<li class="sn-row sn-' + e.cls + '">' +
      '<span class="sn-main"><span class="sn-shop">' + esc(e.shop) + '</span><span class="sn-state' + (live ? ' sn-live' : '') + '">' + (live ? '開催中' : '予告') + '</span>' +
      '<strong>' + esc(e.name) + '</strong> <span class="sn-period">' + esc(e.period) + '</span>' +
      (e.note ? '<span class="sn-note">' + esc(e.note) + '</span>' : '') + '</span>' +
      '<a class="sn-btn" href="' + esc(e.url) + '" ' + REL + ' data-sn="' + e.cls + '">' + esc(e.label) + '</a></li>';
  }).join('');

  var prime = showPrime
    ? '<p class="sn-prime">Amazonの会員限定セールや配送特典を使うなら <a href="' + esc(PRIME_URL) + '" ' + REL + ' data-sn="prime">Amazonプライム</a>(無料体験の対象かどうかはリンク先で確認できます)。</p>'
    : '';

  var css = '.sale-notice{box-sizing:border-box;max-width:100%;min-width:0;margin:16px 0 20px;padding:12px 14px;border:1px solid #e3d6a8;border-left:5px solid #d9a521;border-radius:12px;background:#fffbea;font-size:14px;line-height:1.6;color:#2b2b2b}' +
    '.sale-notice *{box-sizing:border-box}' +
    '.sale-notice .sn-title{margin:0 0 6px;font-size:14px;font-weight:700}' +
    '.sale-notice ul{list-style:none;margin:0;padding:0}' +
    '.sale-notice .sn-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:8px 0;border-top:1px dashed #e6dbb4;min-width:0}' +
    '.sale-notice .sn-row:first-child{border-top:0}' +
    '.sale-notice .sn-shop{display:inline-block;margin-right:6px;font-size:12px;font-weight:700;padding:1px 8px;border-radius:999px;color:#fff;background:#666}' +
    '.sale-notice .sn-rakuten .sn-shop{background:#bf0000}.sale-notice .sn-yahoo .sn-shop{background:#ff0033}.sale-notice .sn-amazon .sn-shop{background:#232f3e}' +
    '.sale-notice .sn-main{flex:1 1 240px;min-width:0;overflow-wrap:anywhere}' +
    '.sale-notice .sn-main strong{display:inline}' +
    '.sale-notice .sn-state{display:inline-block;margin-right:6px;font-size:11px;font-weight:700;padding:0 6px;border-radius:4px;border:1px solid #b9a24f;color:#7a6418}' +
    '.sale-notice .sn-live{background:#2f7d32;border-color:#2f7d32;color:#fff}' +
    '.sale-notice .sn-period{white-space:normal}' +
    '.sale-notice .sn-note{display:block;font-size:12px;color:#666}' +
    '.sale-notice .sn-btn{flex:0 0 auto;display:inline-block;padding:4px 12px;border-radius:999px;background:#fff;border:1px solid #c9b25c;color:#5a4a0f;font-weight:700;font-size:13px;text-decoration:none}' +
    '.sale-notice .sn-btn:hover{background:#fff3c4}' +
    '.sale-notice .sn-prime{margin:6px 0 0;font-size:12px;color:#555}' +
    '.sale-notice .sn-foot{margin:6px 0 0;font-size:11px;color:#777}';

  var box = document.createElement('aside');
  box.className = 'sale-notice';
  box.setAttribute('aria-label', 'セール情報');
  box.innerHTML = '<style>' + css + '</style>' +
    '<p class="sn-title">いま開催中・予告中のセール</p><ul>' + rows + '</ul>' + prime +
    '<p class="sn-foot">日程は各社の公式発表によるものです。この案内は終了後に自動で消えます。商品ごとのセール価格やポイント条件は、各社のページで確かめてください。</p>';

  box.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('a[data-sn]') : null;
    if (a && typeof window.gtag === 'function') {
      window.gtag('event', 'sale_notice_click', { shop: a.getAttribute('data-sn') });
    }
  });

  function place() {
    var slot = document.getElementById('sale-notice-slot');
    if (slot) { slot.appendChild(box); return; }
    var main = document.querySelector('main');
    var disc = main && main.querySelector('.disclosure');
    if (disc && disc.parentNode) { disc.parentNode.insertBefore(box, disc.nextSibling); return; }
    if (main) { main.insertBefore(box, main.firstChild); return; }
    document.body.insertBefore(box, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', place); else place();
})();
