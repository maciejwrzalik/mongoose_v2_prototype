// ===============================
// Editor Class
// ===============================
class Editor {
  constructor() {
    this.canvas = document.getElementById('canvas');
    // Scroll container may be a wrapping element (.canvas-wrap) that actually scrolls
    this.scrollContainer = this.canvas.closest('.canvas-wrap') || this.canvas;
    this.tree = new TreeView(document.getElementById('tree'), this);
    this.properties = new PropertiesPanel(document.getElementById('propertiesContent'), this);
    
    // Initialize managers
    this.overlayManager = new OverlayManager(this);
    this.selectionManager = new SelectionManager(this);
    this.dragDropManager = new DragDropManager(this);
    this.keyboardManager = new KeyboardManager(this);
    this.iconManager = new IconManager(this);
    
    // Legacy references for backward compatibility
    this.hoverRect = this.overlayManager.hoverRect;
    this.selectedRect = this.overlayManager.selectedRect;
    this.dropRect = this.overlayManager.dropRect;
    this.layoutBadge = this.overlayManager.layoutBadge;

    // Delegate selectedNode to SelectionManager
    Object.defineProperty(this, 'selectedNode', {
      get: () => this.selectionManager.selectedNode,
      set: (value) => {
        if (value) {
          this.selectionManager.selectNode(value);
        } else {
          this.selectionManager.clearSelection();
        }
      }
    });

    this.currentDropTarget = null;

    this.initEvents();
    this.tree.update();

    // Observe DOM mutations inside canvas to keep overlays in sync
    this._mutationObserver = new MutationObserver(() => this.overlayManager.scheduleOverlaySync());
    this._mutationObserver.observe(this.canvas, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'data-layout', 'data-cols', 'data-flex-dir', 'data-grid-column']
    });

    // Observe size changes (e.g., content expansion or viewport mode affects positions)
    if ('ResizeObserver' in window) {
      this._resizeObserver = new ResizeObserver(() => this.overlayManager.scheduleOverlaySync());
      this._resizeObserver.observe(this.canvas);
    }

    // Observe canvas attribute changes that affect layout (e.g., data-vw)
    this._canvasAttrObserver = new MutationObserver(() => this.overlayManager.scheduleOverlaySync());
    this._canvasAttrObserver.observe(this.canvas, { attributes: true, attributeFilter: ['data-vw', 'style'] });
  }

  // Provide scroll container for overlay sync (canvas-wrap or canvas fallback)
  getScrollContainer() {
    return this.scrollContainer || this.canvas;
  }

  // Legacy wrapper methods for backward compatibility
  rectTo(el) {
    return this.overlayManager.rectTo(el);
  }

  placeOverlay(div, rect) {
    this.overlayManager.placeOverlay(div, rect);
  }

  showOverlay(div, show) {
    this.overlayManager.showOverlay(div, show);
  }

  syncOverlays() {
    this.overlayManager.syncOverlays();
  }

  scheduleOverlaySync() {
    this.overlayManager.scheduleOverlaySync();
  }

  updateLayoutBadge() {
    this.overlayManager.updateLayoutBadge(this.selectedNode);
  }

  initEvents() {
    // Hover and selection events (DragDropManager handles drag/drop)
    this.canvas.addEventListener('mousemove', (e) => this.onCanvasHover(e));
    this.canvas.addEventListener('mouseleave', () => this.showOverlay(this.hoverRect, false));
    window.addEventListener('pointermove', (e) => {
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      if (!this.canvas.contains(elUnder)) {
        this.showOverlay(this.hoverRect, false);
      }
    }, { capture: true });
    this.canvas.addEventListener('click', (e) => {
      const node = e.target.closest('[data-id]');
      if (node) {
        this.selectionManager.selectNode(node);
      } else {
        this.selectionManager.clearSelection();
      }
    });

    document.getElementById('btn-delete').addEventListener('click', () => this.selectionManager.deleteSelected());
    document.getElementById('btn-select-parent').addEventListener('click', () => this.selectionManager.selectParent());

    document.getElementById('toggle-section-borders').addEventListener('change', (e) => {
      const checked = e.target.checked;
      document.querySelectorAll('.section-node').forEach(sec => {
        if (checked) sec.classList.remove('hide-borders');
        else sec.classList.add('hide-borders');
      });
    });

    // KeyboardManager now handles all keyboard shortcuts

    // Scroll overlays with scroll container (throttled)
    this.getScrollContainer().addEventListener('scroll', () => this.overlayManager.scheduleOverlaySync(), { passive: true });
    window.addEventListener('resize', () => this.overlayManager.syncOverlays());

    // Viewport toggle: default desktop
    const viewport = document.getElementById('viewport-toggle');
    if(viewport){
      const buttons = viewport.querySelectorAll('.seg-btn');
      const applyWidth = (mode)=>{
        if(mode==='desktop') this.canvas.setAttribute('data-vw','desktop');
        if(mode==='tablet') this.canvas.setAttribute('data-vw','tablet');
        if(mode==='mobile') this.canvas.setAttribute('data-vw','mobile');
        this.scheduleOverlaySync();
      };
      // Initialize default
      applyWidth('desktop');
      // Mark Desktop as active by default
      buttons.forEach(b=>{
        const isDesktop = b.getAttribute('data-width')==='100%';
        b.classList.toggle('active', isDesktop);
        b.setAttribute('aria-checked', String(isDesktop));
      });
      buttons.forEach(btn=>{
        btn.addEventListener('click',()=>{
          const w = btn.getAttribute('data-width');
          let mode='desktop';
          if(w==='100%') mode='desktop';
          else if(w==='768') mode='tablet';
          else if(w==='360') mode='mobile';
          buttons.forEach(b=>{ const active=b===btn; b.classList.toggle('active',active); b.setAttribute('aria-checked',active); });
          applyWidth(mode);
        });
      });
    }
  }

  onCanvasHover(e){
    // Use elementFromPoint to ensure we capture topmost underlying element even if overlays present
    const elUnder = document.elementFromPoint(e.clientX, e.clientY);
    let node = elUnder && elUnder.closest('[data-id]');
    if (node && node.classList.contains('splitter-node') && !elUnder.closest('.section-node')) {
      node = null;
    }
    if (node) {
      const rect = this.overlayManager ? this.overlayManager.getHoverRect(node) : this.rectTo(node);
      this.placeOverlay(this.hoverRect, rect);
      this.showOverlay(this.hoverRect, true);
    } else {
      this.showOverlay(this.hoverRect, false);
    }
  }

  // Legacy wrapper methods for backward compatibility
  selectNode(node){
    this.selectionManager.selectNode(node);
  }

  clearSelection(){
    this.selectionManager.clearSelection();
  }

  deleteSelected(){
    this.selectionManager.deleteSelected();
  }

  selectParent(){
    this.selectionManager.selectParent();
  }

  // Legacy wrapper methods for backward compatibility
  syncOverlays() {
    this.overlayManager.syncOverlays();
  }

  scheduleOverlaySync() {
    this.overlayManager.scheduleOverlaySync();
  }

  // Legacy wrapper method for backward compatibility
  updateLayoutBadge() {
    this.overlayManager.updateLayoutBadge(this.selectionManager.selectedNode);
  }

  moveSelected(direction) {
    this.selectionManager.moveSelected(direction);
  }

  createNodeFromPayload(kind, variant) {
    // Use the component factory
    return window.componentFactory.create(kind, variant);
  }

  /**
   * Cleanup all observers, event listeners, and managers
   * Call this before removing the editor instance to prevent memory leaks
   */
  dispose() {
    // Disconnect all observers
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this._canvasAttrObserver) {
      this._canvasAttrObserver.disconnect();
      this._canvasAttrObserver = null;
    }

    // Clean up managers
    if (this.overlayManager) {
      this.overlayManager.dispose();
      this.overlayManager = null;
    }

    if (this.selectionManager) {
      this.selectionManager.dispose();
      this.selectionManager = null;
    }

    if (this.dragDropManager) {
      this.dragDropManager.dispose();
      this.dragDropManager = null;
    }

    if (this.keyboardManager) {
      this.keyboardManager.dispose();
      this.keyboardManager = null;
    }

    if (this.iconManager) {
      this.iconManager.dispose();
      this.iconManager = null;
    }

    // Clear references
    this.canvas = null;
    this.scrollContainer = null;
    this.tree = null;
    this.properties = null;

    // Note: Event listeners added via addEventListener in initEvents()
    // would ideally be removed here, but since they're not stored in instance variables,
    // they'll be garbage collected when the editor instance is removed.
    // For production use, consider storing listener references for explicit removal.
  }
}

// ===============================
// Boot
// ===============================
window.addEventListener('DOMContentLoaded',()=>{
  window.__editor=new Editor();
  // DragDropManager now handles palette drag start events
});

// --- Form support late-patch block ---
(function () {
  function isInsideForm(nodeOrEl) {
    let cur = nodeOrEl;
    while (cur) {
      const kind = cur.kind ?? cur.type ?? cur.dataset?.kind;
      const variant = cur.variant ?? cur.subtype ?? cur.dataset?.variant;
      if (kind === 'container' && variant === 'form') return true;
      cur = cur.parent ?? cur.parentNode ?? null;
    }
    return false;
  }

  // Patch canDrop after it’s defined (poll up to ~2.5s)
  (function patchCanDropLate(attempts = 0) {
    if (typeof window.canDrop === 'function') {
      const originalCanDrop = window.canDrop;
      window.canDrop = function (dragNode, dropTargetNode, position) {
        // Restrict Input/Button to Form subtree
        if (
          dragNode?.kind === 'component' &&
          (dragNode.variant === 'input' || dragNode.variant === 'button')
        ) {
          if (!isInsideForm(dropTargetNode)) return false;
        }
        // Treat Form like Section for placement acceptance
        if (dragNode?.kind === 'container' && dragNode.variant === 'form') {
          const asSection = { ...dragNode, variant: 'section' };
          return originalCanDrop(asSection, dropTargetNode, position);
        }
        return originalCanDrop(dragNode, dropTargetNode, position);
      };
      return;
    }
    if (attempts < 50) {
      setTimeout(() => patchCanDropLate(attempts + 1), 50);
    }
  })();

  // Ensure form containers reuse section visuals and border toggle
  function applyFormClasses(root = document) {
    const list =
      root.querySelectorAll?.('[data-kind="container"][data-variant="form"]') || [];
    list.forEach((el) => el.classList.add('container', 'section', 'form'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize component factory
    if (window.componentFactory) {
      window.componentFactory.initialize();
    }
    
    const canvas = document.getElementById('canvas') || document;
    applyFormClasses(canvas);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.matches?.('[data-kind="container"][data-variant="form"]')) {
            n.classList.add('container', 'section', 'form');
          }
          applyFormClasses(n);
        }
      }
    });
    mo.observe(canvas, { childList: true, subtree: true });

    // Include Form in "Show Section Borders"
    const toggle = document.getElementById('toggle-section-borders');
    if (toggle) {
      const setBorders = () => {
        const show = !!toggle.checked;
        document
          .querySelectorAll(
            '[data-kind="container"][data-variant="section"], [data-kind="container"][data-variant="form"]'
          )
          .forEach((el) => el.classList.toggle('show-borders', show));
      };
      toggle.addEventListener('change', setBorders);
      setBorders();
    }
  });
// Patch label function so tree shows "Form"
  (function patchLabelsLate(attempts = 0) {
    const lbl = window.getNodeLabel || window.labelForTree;
    if (typeof lbl === 'function') {
      const original = lbl;
      const patched = function (node, ...rest) {
        if (node?.kind === 'container' && node?.variant === 'form') return 'Form';
        return original(node, ...rest);
      };
      if (window.getNodeLabel) window.getNodeLabel = patched;
      if (window.labelForTree) window.labelForTree = patched;
      return;
    }
    if (attempts < 50) {
      setTimeout(() => patchLabelsLate(attempts + 1), 50);
    }
  })();
})();

// --- Button icon picker (PropertiesPanel late-patch) ---
