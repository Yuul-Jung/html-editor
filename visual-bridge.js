/* Visual HTML editing bridge (runs only in the isolated preview iframe).
 * Content changes are sent to the parent editor; no GitHub token enters this frame.
 */
(() => {
  'use strict';
  let savedRange = null;
  let selectedImage = null;
  let selectedCell = null;
  let ready = false;
  let emitTimer = null;
  const send = (type, payload = {}) => window.parent.postMessage({type, ...payload}, '*');

  function rememberSelection() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !document.body?.contains(sel.anchorNode)) return;
    savedRange = sel.getRangeAt(0).cloneRange();
  }
  function restoreSelection() {
    document.body.focus();
    if (!savedRange) return;
    try {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    } catch (_) { savedRange = null; }
  }
  function sendBody() {
    if (!ready) return;
    const cloned = document.body.cloneNode(true);
    cloned.removeAttribute('contenteditable'); // Never persist the editor's editing mode to the published HTML.
    cloned.querySelectorAll('img.visual-picked').forEach(img => img.classList.remove('visual-picked'));
    send('VISUAL_BODY', {html: cloned.innerHTML});
  }
  function delayedSend() {
    clearTimeout(emitTimer);
    emitTimer = setTimeout(sendBody, 370);
  }
  function notify(text, error = false) {
    send('VISUAL_NOTICE', {text, error});
  }
  function activeCell() {
    if (selectedCell?.isConnected) return selectedCell;
    const node = savedRange?.startContainer;
    const found = (node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement)?.closest?.('td,th');
    return found?.isConnected ? found : null;
  }
  function updateContext(cell) {
    selectedCell = cell || null;
    const table = selectedCell?.closest('table');
    send('VISUAL_SELECTION', {
      table: Boolean(table),
      image: Boolean(selectedImage),
      tableDescription: table ? '표 ' + table.rows.length + '행 · 셀 ' + selectedCell.cellIndex : '표 바깥'
    });
  }
  function pickImage(img) {
    if (selectedImage) selectedImage.classList.remove('visual-picked');
    selectedImage = img?.tagName === 'IMG' ? img : null;
    if (selectedImage) selectedImage.classList.add('visual-picked');
    send('VISUAL_SELECTION', {table: Boolean(activeCell()), image: Boolean(selectedImage)});
  }
  async function optimizeImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', 0.83));
        } catch (err) { reject(err); }
      };
      image.onerror = () => reject(new Error('그림을 처리하지 못했습니다.'));
      image.src = dataUrl;
    });
  }
  async function addImage(dataUrl) {
    if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(dataUrl)) return;
    if (dataUrl.length > 28 * 1024 * 1024) throw new Error('20MB 이하의 그림만 삽입할 수 있습니다.');
    const optimized = await optimizeImage(dataUrl);
    restoreSelection();
    const html = '<img src="' + optimized + '" alt="삽입 이미지" style="max-width:100%;height:auto;">';
    document.execCommand('insertHTML', false, html);
    pickImage(null);
    sendBody();
  }
  function addFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 20 * 1024 * 1024) {
      send('VISUAL_NOTICE', {text:'20MB를 넘는 그림은 삽입할 수 없습니다.', error:true});
      return;
    }
    const reader = new FileReader();
    reader.onload = () => addImage(reader.result).catch(err => send('VISUAL_NOTICE', {text:err.message, error:true}));
    reader.readAsDataURL(file);
  }

  function activeTableCell() {
    const cell = activeCell();
    if (!cell) {notify('표 안의 셀을 먼저 클릭하세요.', true);return null;}
    return cell;
  }
  function hasComplexSpan(table) {
    return Boolean(table.querySelector('[rowspan]:not([rowspan="1"]), [colspan]:not([colspan="1"])'));
  }
  function newCell(referenceCell, isHead = false) {
    const tag = isHead ? 'th' : 'td';
    const cell = document.createElement(tag);
    if (referenceCell) {
      cell.style.cssText = referenceCell.style.cssText;
      for (const attr of ['class','align']) if (referenceCell.hasAttribute(attr)) cell.setAttribute(attr, referenceCell.getAttribute(attr));
    } else cell.style.cssText = 'border:1px solid #cbd5e1;padding:8px 10px;min-width:70px;';
    cell.innerHTML = '<br>';
    return cell;
  }
  function insertTable(spec) {
    const match = String(spec || '3x3').match(/^([1-9]\d?)x([1-9]\d?)$/);
    if (!match) return notify('표 크기는 2x3처럼 입력하세요.', true);
    const rows = Number(match[1]), cols = Number(match[2]);
    if (rows * cols > 200) return notify('표는 최대 200칸까지 지원합니다.', true);
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;margin:16px 0;table-layout:auto;';
    const tbody = document.createElement('tbody');
    for (let i=0;i<rows;i++) {
      const tr = document.createElement('tr');
      for (let j=0;j<cols;j++) {
        const cell = newCell(null, i === 0);
        if (i === 0) {
          cell.style.backgroundColor = '#f1f5f9';
          cell.style.fontWeight = '700';
          cell.textContent = '항목 ' + (j+1);
        }
        tr.appendChild(cell);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    insertNodeHTML(table.outerHTML);
  }
  function insertNodeHTML(html) {
    restoreSelection();
    if (!document.execCommand('insertHTML', false, html)) {
      const range = window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null;
      if (range) {
        const fragment = range.createContextualFragment(html);
        range.deleteContents();
        range.insertNode(fragment);
      } else notify('본문에 커서를 놓고 다시 실행하세요.',true);
    }
    sendBody();
  }
  function insertBox(kind) {
    const range = savedRange && !savedRange.collapsed ? savedRange : null;
    const holder = document.createElement('div');
    if (range) holder.appendChild(range.cloneContents());
    const chosen = holder.innerHTML.trim();
    const common = 'padding:16px;margin:16px 0;border-radius:10px;';
    const html = kind === 'twoCols'
      ? '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px;margin:16px 0;">' +
        '<div style="border:1px solid #cbd5e1;border-radius:8px;padding:16px;">' + (chosen || '<p>왼쪽 내용을 입력하세요.</p>') + '</div>' +
        '<div style="border:1px solid #cbd5e1;border-radius:8px;padding:16px;"><p>오른쪽 내용을 입력하세요.</p></div></div>'
      : kind === 'callout'
      ? '<aside style="' + common + 'background:#f0f5ff;border-left:4px solid #6366f1;">' +
        '<p><strong>💡 핵심 내용</strong></p>' + (chosen || '<p>내용을 입력하세요.</p>') + '</aside>'
      : kind === 'divider'
      ? '<hr style="border:0;border-top:1px solid #cbd5e1;margin:24px 0;">'
      : '<section style="' + common + 'border:1px solid #cbd5e1;background:#fff;">' +
        '<p><strong>제목</strong></p>' + (chosen || '<p>내용을 입력하세요.</p>') + '</section>';
    insertNodeHTML(html);
  }
  function editTable(action, value) {
    const cell = activeTableCell();
    if (!cell) return;
    const row = cell.parentElement;
    const table = cell.closest('table');
    if (action === 'cellColor') {
      if (!/^#[a-f0-9]{6}$/i.test(value)) return;
      cell.style.backgroundColor = value;
    } else if (action === 'tableBorders') {
      table.style.borderCollapse = 'collapse';
      table.style.width = table.style.width || '100%';
      table.querySelectorAll('th,td').forEach(td => {
        td.style.border = '1px solid #cbd5e1';
        td.style.padding = td.style.padding || '8px';
      });
    } else if (action === 'deleteTable') {
      if (!confirm('이 표 전체를 삭제할까요?')) return;
      table.remove();
      selectedCell = null;
    } else if (action === 'addRowBefore' || action === 'addRowAfter' || action === 'deleteRow') {
      if (hasComplexSpan(table)) return notify('병합된 셀이 있는 표는 구조 손상을 막기 위해 행·열 변경을 제한합니다. 기존 셀의 글·그림은 편집할 수 있습니다.', true);
      if (action === 'deleteRow') {
        if (table.rows.length <= 1) return notify('마지막 행입니다. 표 삭제 기능을 사용하세요.',true);
        row.remove();
        selectedCell = null;
      } else {
        const clone = document.createElement('tr');
        [...row.cells].forEach(c => clone.appendChild(newCell(c, c.tagName === 'TH' && action === 'addRowBefore')));
        row.parentNode.insertBefore(clone, action === 'addRowBefore' ? row : row.nextSibling);
        selectedCell = clone.cells[Math.min(cell.cellIndex,clone.cells.length-1)];
      }
    } else if (action === 'addColBefore' || action === 'addColAfter' || action === 'deleteCol') {
      if (hasComplexSpan(table)) return notify('병합된 셀이 있는 표의 열 구조 변경은 제한됩니다.', true);
      const col = cell.cellIndex;
      if (action === 'deleteCol' && [...table.rows].some(r => r.cells.length <= 1)) {
        return notify('마지막 열입니다. 표 삭제 기능을 사용하세요.', true);
      }
      [...table.rows].forEach(r => {
        const ref = r.cells[col] || r.cells[r.cells.length - 1];
        if (action === 'deleteCol') {
          if (r.cells[col]) r.cells[col].remove();
        } else {
          const added = newCell(ref, Boolean(ref && ref.tagName === 'TH'));
          if (action === 'addColBefore') r.insertBefore(added, r.cells[col] || null);
          else r.insertBefore(added, r.cells[col]?.nextSibling || null);
        }
      });
      selectedCell = null;
    } else if (action === 'mergeRight') {
      if (hasComplexSpan(table)) return notify('이미 병합된 셀이 있는 표는 추가 병합을 제한합니다.', true);
      const right = cell.nextElementSibling;
      if (!right || !['TD','TH'].includes(right.tagName)) return notify('오른쪽에 병합할 셀이 없습니다.',true);
      if (right.textContent.trim()) {
        const br = document.createElement('br');
        cell.appendChild(br);
        while (right.firstChild) cell.appendChild(right.firstChild);
      }
      cell.colSpan = 2;
      right.remove();
    } else if (action === 'splitCell') {
      if (cell.rowSpan > 1 || cell.colSpan <= 1) return notify('가로 병합된 셀만 분할할 수 있습니다.',true);
      const count = cell.colSpan;
      cell.colSpan = 1;
      let insert = cell;
      for (let i = 1; i < count; i++) {
        const next = newCell(cell, cell.tagName === 'TH');
        insert.after(next);
        insert = next;
      }
    } else return;
    sendBody();
    updateContext(activeCell());
  }

  function doCommand(name, value) {
    if (!ready) return;
    if (name === 'imageWidth') {
      if (!selectedImage) return send('VISUAL_NOTICE', {text:'본문의 그림을 먼저 클릭하세요.',error:true});
      if (!['50','100'].includes(String(value))) return;
      selectedImage.style.width = value + '%';
      selectedImage.style.maxWidth = '100%';
      selectedImage.style.height = 'auto';
      sendBody();
      return;
    }
    if (name === 'insertTable') return insertTable(value);
    if (name === 'insertBox') return insertBox(value);
    if (name === 'editTable') return editTable(value?.action, value?.value);
    if (name === 'insertImage') {
      rememberSelection();
      addImage(value).catch(err => send('VISUAL_NOTICE', {text:err.message, error:true}));
      return;
    }
    const allowed = ['bold','italic','underline','formatBlock','insertUnorderedList',
      'insertOrderedList','justifyLeft','justifyCenter','justifyRight',
      'foreColor','createLink','undo','redo'];
    if (!allowed.includes(name)) return;
    if (name === 'formatBlock' && !['p','h2'].includes(value)) return;
    if (name === 'foreColor' && !/^#[a-f0-9]{6}$/i.test(value)) return;
    if (name === 'createLink' && !/^https?:\/\//i.test(value)) return;
    restoreSelection();
    document.execCommand(name, false, value || null);
    rememberSelection();
    sendBody();
  }
  function initVisualEditing() {
    if (!document.body || ready) return;
    const style = document.createElement('style');
    style.textContent = 'body[contenteditable="true"]{caret-color:#4338ca;outline:0}' +
      'img.visual-picked{outline:3px solid #6366f1!important;outline-offset:2px;cursor:pointer;}';
    document.head.appendChild(style);
    document.body.contentEditable = 'true';
    document.body.spellcheck = false;
    ready = true;

    document.addEventListener('selectionchange', () => {
      rememberSelection();
      const container = window.getSelection()?.anchorNode;
      const element = container?.nodeType === Node.ELEMENT_NODE ? container : container?.parentElement;
      const cell = element?.closest?.('td,th');
      if (cell) updateContext(cell);
    });
    document.body.addEventListener('input', delayedSend);
    document.body.addEventListener('click', event => {
      const image = event.target.closest?.('img');
      pickImage(image);
      const cell = event.target.closest?.('td,th');
      updateContext(cell);
      if (image) {rememberSelection(); event.preventDefault();}
      if (event.target.closest?.('a')) event.preventDefault();
    }, true);
    document.body.addEventListener('paste', event => {
      const items = Array.from(event.clipboardData?.items || []);
      const image = items.find(item => item.kind === 'file' && item.type.startsWith('image/'));
      if (image) {
        event.preventDefault();
        rememberSelection();
        addFile(image.getAsFile());
      }
      // Word/HTML rich paste is handled by the browser; table markup is retained where supported.
      if (!image) delayedSend();
    });
    document.body.addEventListener('dragover', event => {
      if (event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files')) event.preventDefault();
    });
    document.body.addEventListener('drop', event => {
      const image = Array.from(event.dataTransfer?.files || []).find(f => f.type.startsWith('image/'));
      if (image) {event.preventDefault(); rememberSelection(); addFile(image);}
    });

    send('VISUAL_NOTICE', {text:'워드 편집 준비 완료 — 본문을 클릭하여 글을 입력하거나 그림을 붙여넣으세요.'});
  }

  window.addEventListener('message', event => {
    if (!event.data || event.source !== window.parent) return;
    if (event.data.type === 'VISUAL_COMMAND') doCommand(event.data.command, event.data.value);
    if (event.data.type === 'VISUAL_FLUSH') {
      clearTimeout(emitTimer);
      sendBody();
      send('VISUAL_FLUSHED');
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initVisualEditing, {once:true});
  else initVisualEditing();
})();
