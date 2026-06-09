// Dev-only review-comment overlay.
//
// Select text anywhere in the page content and a "💬 코멘트" bubble appears;
// write a note and it's posted to the local sink server (scripts/comment-sink.mjs),
// which appends it to .review/comments.jsonl for the assistant to read.
//
// This module is only included when running `docusaurus start` (dev). The
// production build (`docusaurus build`) excludes it entirely — see the
// clientModules gate in docusaurus.config.ts.

const SINK = 'http://localhost:3999';

type Heading = { text: string; id: string } | null;

function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

function inContent(node: Node | null): boolean {
  if (!node) return false;
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  if (!el) return false;
  if (el.closest('#rc-root')) return false; // ignore our own UI
  return !!el.closest('main');
}

function nearestHeading(range: Range): Heading {
  const headings = Array.from(
    document.querySelectorAll('main h1, main h2, main h3, main h4'),
  ) as HTMLElement[];
  let found: HTMLElement | null = null;
  for (const h of headings) {
    const pos = h.compareDocumentPosition(range.startContainer);
    // heading precedes the selection start
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) found = h;
    else break;
  }
  if (!found) return null;
  const text = (found.textContent || '').replace(/​/g, '').trim();
  return { text, id: found.id || '' };
}

function toast(msg: string, ok = true) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:80px;right:20px;z-index:100000;background:${
    ok ? '#16a34a' : '#dc2626'
  };color:#fff;padding:10px 14px;border-radius:8px;font:13px/1.4 system-ui;box-shadow:0 4px 12px rgba(0,0,0,.25);opacity:0;transition:opacity .15s`;
  document.body.appendChild(t);
  requestAnimationFrame(() => (t.style.opacity = '1'));
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 200);
  }, 1800);
}

// ---- floating "add comment" bubble shown on text selection ----
let bubble: HTMLElement | null = null;
let editor: HTMLElement | null = null;

function clearBubble() {
  bubble?.remove();
  bubble = null;
}
function clearEditor() {
  editor?.remove();
  editor = null;
}

function showBubble() {
  if (editor) return; // editor already open; don't re-spawn a bubble over it
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  const text = sel.toString().trim();
  if (text.length < 2) return;
  if (!inContent(sel.anchorNode)) return;

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const heading = nearestHeading(range);

  clearBubble();
  const b = document.createElement('button');
  b.className = 'rc-ui';
  b.textContent = '💬 코멘트';
  b.style.cssText = `position:absolute;z-index:100000;top:${rect.bottom + window.scrollY + 6}px;left:${
    rect.left + window.scrollX
  }px;background:#7c3aed;color:#fff;border:0;padding:6px 10px;border-radius:6px;font:13px system-ui;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)`;
  b.onmousedown = (e) => {
    e.preventDefault(); // keep the selection alive
    openEditor(text, heading, rect);
  };
  document.body.appendChild(b);
  bubble = b;
}

function openEditor(quote: string, heading: Heading, rect: DOMRect) {
  clearBubble();
  clearEditor();
  const card = document.createElement('div');
  card.className = 'rc-ui';
  card.style.cssText = `position:absolute;z-index:100001;top:${rect.bottom + window.scrollY + 6}px;left:${
    rect.left + window.scrollX
  }px;width:320px;background:var(--ifm-background-surface-color,#fff);color:var(--ifm-font-color-base,#1c1e21);border:1px solid #7c3aed;border-radius:10px;padding:12px;font:13px/1.5 system-ui;box-shadow:0 8px 28px rgba(0,0,0,.3)`;

  const q = document.createElement('div');
  q.textContent = `“${quote.length > 90 ? quote.slice(0, 90) + '…' : quote}”`;
  q.style.cssText =
    'background:rgba(124,58,237,.08);border-left:3px solid #7c3aed;padding:6px 8px;border-radius:4px;margin-bottom:8px;max-height:60px;overflow:auto;color:inherit';

  const ta = document.createElement('textarea');
  ta.placeholder = '코멘트를 입력하고 ⌘/Ctrl+Enter';
  ta.style.cssText =
    'width:100%;min-height:64px;box-sizing:border-box;resize:vertical;border:1px solid #ccc;border-radius:6px;padding:6px 8px;font:13px system-ui;background:transparent;color:inherit';

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:8px';
  const cancel = document.createElement('button');
  cancel.textContent = '취소';
  cancel.style.cssText =
    'background:transparent;border:1px solid #ccc;color:inherit;padding:5px 10px;border-radius:6px;cursor:pointer;font:13px system-ui';
  cancel.onclick = clearEditor;
  const save = document.createElement('button');
  save.textContent = '저장';
  save.style.cssText =
    'background:#7c3aed;color:#fff;border:0;padding:5px 12px;border-radius:6px;cursor:pointer;font:13px system-ui';

  const submit = async () => {
    const comment = ta.value.trim();
    if (!comment) return ta.focus();
    try {
      const r = await fetch(`${SINK}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: location.pathname,
          title: document.title,
          heading,
          quote,
          comment,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      clearEditor();
      window.getSelection()?.removeAllRanges();
      toast('저장됨 ✓');
      refreshPanel();
    } catch {
      toast('sink 서버(3999)에 연결 못 함', false);
    }
  };
  save.onclick = submit;
  ta.onkeydown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
    if (e.key === 'Escape') clearEditor();
  };

  row.append(cancel, save);
  card.append(q, ta, row);
  document.body.appendChild(card);
  editor = card;
  ta.focus();
}

// ---- bottom-right panel: count badge + list for current page ----
let panel: HTMLElement | null = null;
let list: HTMLElement | null = null;
let badge: HTMLElement | null = null;
let open = false;

function ensurePanel() {
  if (panel) return;
  const root = document.createElement('div');
  root.id = 'rc-root';

  const fab = document.createElement('button');
  fab.style.cssText =
    'position:fixed;bottom:20px;right:20px;z-index:99999;width:48px;height:48px;border-radius:50%;background:#7c3aed;color:#fff;border:0;font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)';
  fab.textContent = '💬';
  badge = document.createElement('span');
  badge.style.cssText =
    'position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;border-radius:10px;background:#dc2626;color:#fff;font:11px/20px system-ui;text-align:center;padding:0 4px;display:none';
  fab.appendChild(badge);

  const drawer = document.createElement('div');
  drawer.style.cssText =
    'position:fixed;bottom:78px;right:20px;z-index:99999;width:340px;max-height:60vh;overflow:auto;background:var(--ifm-background-surface-color,#fff);color:var(--ifm-font-color-base,#1c1e21);border:1px solid #7c3aed;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.3);display:none';
  const head = document.createElement('div');
  head.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid rgba(124,58,237,.2);font:600 13px system-ui';
  head.innerHTML = '<span>이 페이지 코멘트</span>';
  const hint = document.createElement('span');
  hint.textContent = '텍스트 선택 → 💬';
  hint.style.cssText = 'font:11px system-ui;opacity:.6';
  head.appendChild(hint);
  list = document.createElement('div');
  list.style.cssText = 'padding:6px';
  drawer.append(head, list);

  fab.onclick = () => {
    open = !open;
    drawer.style.display = open ? 'block' : 'none';
    if (open) refreshPanel();
  };

  root.append(drawer, fab);
  document.body.appendChild(root);
  panel = root;
}

async function refreshPanel() {
  ensurePanel();
  let all: any[] = [];
  try {
    const r = await fetch(`${SINK}/comments`);
    all = await r.json();
  } catch {
    if (badge) badge.style.display = 'none';
    return;
  }
  const mine = all.filter((c) => c.slug === location.pathname);
  if (badge) {
    badge.textContent = String(mine.length);
    badge.style.display = mine.length ? 'block' : 'none';
  }
  if (!list || !open) return;
  list.innerHTML = '';
  if (!mine.length) {
    list.innerHTML =
      '<div style="padding:14px;opacity:.6;font:13px system-ui">아직 코멘트 없음.<br>본문 텍스트를 드래그해보세요.</div>';
    return;
  }
  for (const c of mine) {
    const item = document.createElement('div');
    item.style.cssText =
      'border:1px solid rgba(124,58,237,.2);border-radius:8px;padding:8px;margin:6px 0;font:12px/1.5 system-ui';
    const head = c.heading?.text
      ? `<div style="opacity:.6;margin-bottom:3px">▸ ${escapeHtml(c.heading.text)}</div>`
      : '';
    item.innerHTML =
      head +
      `<div style="color:#7c3aed;margin-bottom:3px">“${escapeHtml(
        (c.quote || '').slice(0, 70),
      )}${(c.quote || '').length > 70 ? '…' : ''}”</div>` +
      `<div style="margin-bottom:6px">${escapeHtml(c.comment)}</div>`;
    const del = document.createElement('button');
    del.textContent = '🗑 삭제';
    del.style.cssText =
      'background:transparent;border:1px solid #ccc;color:inherit;padding:2px 8px;border-radius:5px;cursor:pointer;font:11px system-ui';
    del.onclick = async () => {
      try {
        await fetch(`${SINK}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: c.id }),
        });
        refreshPanel();
      } catch {
        toast('삭제 실패', false);
      }
    };
    item.appendChild(del);
    list.appendChild(item);
  }
}

function escapeHtml(s: string): string {
  return (s || '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]!));
}

function init() {
  if (!isDev() || typeof window === 'undefined') return;
  document.addEventListener('mouseup', () => setTimeout(showBubble, 0));
  document.addEventListener('mousedown', (e) => {
    const el = e.target as Element;
    // Clicks on our own UI (bubble / editor / panel) must not close anything.
    if (el && el.closest && el.closest('.rc-ui, #rc-root')) return;
    clearBubble();
    clearEditor();
  });
  ensurePanel();
  refreshPanel();
}

export function onRouteDidUpdate(): void {
  if (!isDev()) return;
  clearBubble();
  clearEditor();
  setTimeout(refreshPanel, 100);
}

if (typeof window !== 'undefined') init();
