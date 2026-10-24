/* Visual HTML editing bridge (runs only in the isolated preview iframe).
 * Content changes are sent to the parent editor; no GitHub token enters this frame.
 */
(() => {
  'use strict';
  let savedRange = null;
  let selectedImage = null;
  let ready = false;
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
    cloned.querySelectorAll('img.visual-picked').forEach(img => img.classList.remove('visual-picked'));
    send('VISUAL_BODY', {html: cloned.innerHTML});
  }
  function pickImage(img) {
    if (selectedImage) selectedImage.classList.remove('visual-picked');
    selectedImage = img?.tagName === 'IMG' ? img : null;
    if (selectedImage) selectedImage.classList.add('visual-picked');
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

    document.addEventListener('selectionchange', rememberSelection);
    document.body.addEventListener('input', sendBody);
    document.body.addEventListener('click', event => {
      const image = event.target.closest?.('img');
      pickImage(image);
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
      // HTML/text from Word or a webpage uses the browser's native rich-text paste.
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
      sendBody();
      send('VISUAL_FLUSHED');
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initVisualEditing, {once:true});
  else initVisualEditing();
})();
