// ===============================
// Drag & Drop Manager
// ===============================
// Handles all drag and drop operations for the editor

class DragDropManager {
  constructor(editor) {
    this.editor = editor;
    this.canvas = editor.canvas;
    this.currentDropTarget = null;
    this.dragPayload = null;
    
    this._initEvents();
  }
  
  _initEvents() {
    // Canvas events
    this.canvas.addEventListener('dragover', (e) => this.onCanvasDragOver(e));
    this.canvas.addEventListener('drop', (e) => this.onCanvasDrop(e));
    
    // Window events
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => {
      if (!e.dataTransfer.types.includes('application/x-editor-item')) {
        e.preventDefault();
      }
      this.dragPayload = null;
    });
    window.addEventListener('dragend', () => {
      this.dragPayload = null;
    });
    
    // Palette items
    document.querySelectorAll('.palette .item').forEach(item => {
      item.addEventListener('dragstart', (e) => this.onPaletteDragStart(e));
    });
  }
  
  onPaletteDragStart(e) {
    const t = e.target.closest('.item');
    if (!t) return;
    
    const payload = {
      kind: t.dataset.kind,
      variant: t.dataset.variant
    };
    
    e.dataTransfer.setData('application/x-editor-item', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
    this.dragPayload = payload;
  }
  
  onCanvasDragOver(e) {
    e.preventDefault();
    
    if (!e.dataTransfer.types.includes('application/x-editor-item')) {
      return;
    }
    
    e.dataTransfer.dropEffect = 'copy';
    const elUnder = document.elementFromPoint(e.clientX, e.clientY);
    let container = elUnder && elUnder.closest('.node');
    const payload = this.dragPayload;
    
    // Check if we need to allow root canvas drop
    if (!(container && container.classList.contains('container-node'))) {
      const allowRootDrop = this._canDropOnRoot(payload);
      
      if (allowRootDrop) {
        container = this.canvas;
      } else {
        this._clearDropIndicator();
        e.dataTransfer.dropEffect = 'none';
        return;
      }
    }
    
    let targetEl = container === this.canvas ? this.canvas : container;
    let dropRectTarget = container;
    if (container !== this.canvas && container.dataset?.variant === 'splitter') {
      const panel = elUnder && elUnder.closest('.splitter-panel')
        ? elUnder.closest('.splitter-panel')
        : container.querySelector('.splitter-panel');
      if (panel) {
        const panelChildren = panel.querySelector(':scope > .children') || panel;
        targetEl = panelChildren;
        dropRectTarget = panel;
      }
    }
    
    // Validate drop
    if (!this._validateDrop(payload, container, targetEl)) {
      this._clearDropIndicator();
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    
    // Show drop indicator
    const rect = this.editor.rectTo(dropRectTarget || container);
    this.editor.placeOverlay(this.editor.dropRect, rect);
    this.editor.showOverlay(this.editor.dropRect, true);
    this.currentDropTarget = container === this.canvas ? 
      this.canvas : 
      container.querySelector(
        container.dataset?.variant === 'header' ? ':scope > .buttons' : ':scope > .children'
      );
    if (container.dataset?.variant === 'splitter' && targetEl !== this.canvas) {
      this.currentDropTarget = targetEl;
    }
  }
  
  onCanvasDrop(e) {
    e.preventDefault();
    
    const raw = e.dataTransfer.getData('application/x-editor-item');
    if (!raw) return;
    
    const { kind, variant } = JSON.parse(raw);
    
    // Validate drop on root canvas
    if (this.currentDropTarget === this.canvas) {
      if (!this._canDropOnRoot({ kind, variant })) {
        this._clearDropIndicator();
        return;
      }
    }
    
    // Header constraints
    if (variant === 'header') {
      if (this.canvas.querySelector('[data-variant="header"]')) {
        this._clearDropIndicator();
        return;
      }
    }
    
    const targetEl = this.currentDropTarget || this.canvas;
    
    // Validate header drop
    if (targetEl && targetEl.closest) {
      const headerHost = this._isDroppingIntoHeader(targetEl);
      if (headerHost && !(kind === 'component' && variant === 'button')) {
        this._clearDropIndicator();
        return;
      }
    }
    
    // Validate form components
    const insideForm = this._isInsideForm(targetEl);
    if (kind === 'component' && ['input', 'button', 'radiogroup'].includes(variant)) {
      const headerHost = this._isDroppingIntoHeader(targetEl);
      const allowButtonInHeader = headerHost && variant === 'button';
      
      if (!insideForm && !allowButtonInHeader) {
        this._clearDropIndicator();
        return;
      }
    }
    
    // Create node
    let nodeComp = window.componentFactory.create(kind, variant);
    if (!nodeComp) return;
    
    // Apply default styles for Header buttons
    if (variant === 'header') {
      this._styleHeaderButtons(nodeComp);
    }
    
    if (!this.currentDropTarget) {
      this._clearDropIndicator();
      return;
    }
    
    // Insert node
    if (variant === 'header') {
      this._insertHeaderNode(nodeComp);
    } else {
      this.currentDropTarget.appendChild(nodeComp.el);
    }
    
    // Cleanup and update
    this.canvas.querySelector('.empty-hint')?.remove();
    this._clearDropIndicator();
    this.editor.selectNode(nodeComp.el);
    this.editor.tree.update();
    this.dragPayload = null;
  }
  
  // Validation methods
  
  _canDropOnRoot(payload) {
    if (!payload) return false;
    
    return (
      (payload.kind === 'container' && (payload.variant === 'section' || payload.variant === 'form' || payload.variant === 'splitter')) ||
      (payload.kind === 'component' && (payload.variant === 'datagrid' || payload.variant === 'tabs' || payload.variant === 'header'))
    );
  }
  
  _validateDrop(payload, container, targetEl) {
    if (!payload) return true;
    
    // Header: only allowed at root and only one instance
    if (payload.kind === 'component' && payload.variant === 'header') {
      const exists = !!this.canvas.querySelector('[data-variant="header"]');
      const atRoot = (targetEl === this.canvas);
      if (exists || !atRoot) {
        return false;
      }
    }
    
    // Splitter: only allowed at root and only one instance
    if (payload.kind === 'container' && payload.variant === 'splitter') {
      const exists = !!this.canvas.querySelector('[data-variant="splitter"]');
      const atRoot = (targetEl === this.canvas);
      if (exists || !atRoot) {
        return false;
      }
    }
    
    // If target is a Header, only allow Button components
    if (container && container.dataset && container.dataset.variant === 'header') {
      const isButton = (payload.kind === 'component' && payload.variant === 'button');
      return isButton;
    }
    
    const insideForm = this._isInsideForm(targetEl);
    const inHeader = !!(container && container.dataset && container.dataset.variant === 'header');
    
    // Enforce: form components only inside a Form subtree
    // EXCEPTION: allow Button dropped into Header
    if (payload.kind === 'component' && ['input', 'button', 'radiogroup'].includes(payload.variant)) {
      const allowButtonInHeader = (payload.variant === 'button' && inHeader);
      if (!insideForm && !allowButtonInHeader) {
        return false;
      }
    }
    
    // If target is inside a Form subtree, only allow specific components
    if (insideForm && payload) {
      const isAllowedInForm =
        (payload.kind === 'container' && payload.variant === 'section') ||
        (payload.kind === 'component' && ['text', 'input', 'button', 'radiogroup'].includes(payload.variant));
      return isAllowedInForm;
    }
    
    return true;
  }
  
  _isInsideForm(el) {
    let node = el;
    while (node && node !== this.canvas) {
      if (node.dataset && node.dataset.variant === 'form') {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }
  
  _isDroppingIntoHeader(targetEl) {
    return (
      (this.currentDropTarget !== this.canvas) &&
      this.currentDropTarget &&
      this.currentDropTarget.parentElement &&
      this.currentDropTarget.parentElement.dataset?.variant === 'header'
    );
  }
  
  // Helper methods
  
  _styleHeaderButtons(nodeComp) {
    const btns = nodeComp.el.querySelectorAll('[data-variant="button"]');
    if (btns[0]) {
      btns[0].classList.remove('btn-secondary', 'btn-tertiary', 'btn-icon');
      btns[0].dataset.btnStyle = 'primary';
    }
    if (btns[1]) {
      btns[1].classList.remove('btn-secondary', 'btn-tertiary', 'btn-icon');
      btns[1].classList.add('btn-icon');
      btns[1].dataset.btnStyle = 'icon';
    }
    if (btns[2]) {
      btns[2].classList.remove('btn-secondary', 'btn-tertiary', 'btn-icon');
      btns[2].classList.add('btn-icon');
      btns[2].dataset.btnStyle = 'icon';
    }
    btns.forEach((btn) => {
      if (btn.dataset.btnStyle === 'icon') {
        if (!btn.dataset.icon) btn.dataset.icon = 'more';
        this.editor.iconManager?.ensureIconVisual(btn, btn.dataset.icon || 'more');
      }
    });
  }
  
  _insertHeaderNode(nodeComp) {
    // Insert before the first dataset child (ignores overlays/empty-hint)
    const firstDataChild = [...this.canvas.children].find(c => c.dataset && c.dataset.id);
    if (firstDataChild) {
      this.canvas.insertBefore(nodeComp.el, firstDataChild);
    } else {
      this.canvas.appendChild(nodeComp.el);
    }
  }
  
  _clearDropIndicator() {
    this.editor.showOverlay(this.editor.dropRect, false);
    this.currentDropTarget = null;
  }
  
  // Cleanup
  dispose() {
    // Remove event listeners if needed in the future
    this.currentDropTarget = null;
    this.dragPayload = null;
  }
}
