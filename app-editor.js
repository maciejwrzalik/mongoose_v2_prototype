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

    // === Icon picker + Figma registry ===
    this.propContainer = document.getElementById('propertiesContent');
    this._iconRegistry = {}; // name -> dataUrl
    // Figma symbol IDs from #get_design_context
    this._figmaIconIds = {
      compose: '111:12315',
      delete: '111:12333',
      'insert-image': '111:12324', // fix: quote hyphenated key
      inventory: '111:12359',
      print: '111:12370',
      save: '111:12402',
      url: '111:12365',
      'user-profile': '111:12411'
    };
    this._ICON_OPTIONS = Object.keys(this._figmaIconIds);
    this._suspendIconInject = false;

    this._loadFigmaIcons = async () => {
      if (typeof window.get_design_context !== 'function') return; // fallback to static
      const entries = Object.entries(this._figmaIconIds);
      for (const [name, id] of entries) {
        try {
          // MUST call get_design_context on nodes individually
          const ctx = await window.get_design_context(id);
          // Try common shapes of returned payloads for SVG markup
          let svg = ctx?.svg || ctx?.content || ctx?.node?.svg || ctx?.node?.content || '';
          if (typeof svg !== 'string' || !svg.includes('<svg')) continue;
          // Normalize viewBox/size is assumed correct in Figma (18x18)
          const encoded = encodeURIComponent(svg).replace(/%23/g, '%2523'); // double-escape # for CSS url()
          this._iconRegistry[name] = `url('data:image/svg+xml;utf8,${encoded}')`;
        } catch (_) { /* ignore; fallback stays */ }
      }
      // If loaded anything, refresh options and current picker
      if (Object.keys(this._iconRegistry).length) {
        this._ICON_OPTIONS = Object.keys(this._iconRegistry);
        // Rebuild picker for current selection if applicable
        this._injectIconPicker?.(this.selectedNode);
      }
    };
    // Kick off async load (no await needed)
    this._loadFigmaIcons();

    // Helper: ensure visual span exists on a button and set placeholder/icon
    const ensureIconVisual = (btn, iconName) => {
      let vis = btn.querySelector('.btn-icon-visual');
      if (!vis) {
        vis = document.createElement('span');
        vis.className = 'btn-icon-visual';
        btn.prepend(vis);
      }
      if (iconName) {
        vis.classList.remove('is-placeholder');
        vis.textContent = '';
      } else {
        vis.classList.add('is-placeholder');
        vis.textContent = '⋯';
      }
      // also ensure a label span exists
      ensureLabelSpan(btn);
    };

    // Helper: wrap button label text into a <span class="btn-label">
    const ensureLabelSpan = (btn) => {
      if (!btn || !btn.matches('button.comp-body')) return;
      // do not descend into nested components; only direct text nodes
      let labelEl = btn.querySelector(':scope > .btn-label');
      if (!labelEl) {
        // Gather direct text from text nodes (ignore icon span)
        let text = '';
        [...btn.childNodes].forEach(n => {
          if (n.nodeType === Node.TEXT_NODE && n.nodeValue.trim()) {
            text += n.nodeValue.trim();
            n.nodeValue = ''; // strip raw text
          }
        });
        labelEl = document.createElement('span');
        labelEl.className = 'btn-label';
        labelEl.textContent = text || btn.getAttribute('data-label') || btn.dataset.name || 'Button';
        btn.appendChild(labelEl);
      }
    };

    this._injectIconPicker = (node) => {
      const container = this.propContainer || document.getElementById('propertiesContent');
      if (!container) return;

      const isButton = !!(node && node.dataset && node.dataset.variant === 'button');
      const isIconStyle =
        isButton && (
          (node.dataset.btnStyle || '').toLowerCase() === 'icon' ||
          node.classList.contains('btn-icon') ||
          node.getAttribute('data-btn-style') === 'icon'
        );

      const existingGrp = container.querySelector('#btn-icon-group');
      if (existingGrp) {
        if (!isIconStyle) { existingGrp.remove(); return; }
        // Sync only
        const sel = existingGrp.querySelector('#prop-btn-icon');
        if (sel) sel.value = node.dataset.icon || '';
        return;
      }
      if (!isIconStyle) return;

      const grp = document.createElement('div');
      grp.className = 'form-group';
      grp.id = 'btn-icon-group';
      grp.innerHTML = `
        <label for="prop-btn-icon">Icon</label>
        <select id="prop-btn-icon">
          <option value="">(none)</option>
          ${this._ICON_OPTIONS.map(n => `<option value="${n}">${n}</option>`).join('')}
        </select>
      `;
      container.appendChild(grp);

      const sel = grp.querySelector('#prop-btn-icon');
      sel.value = node.dataset.icon || '';

      const suspend = () => { this._suspendIconInject = true; };
      const resume = () => { setTimeout(() => { this._suspendIconInject = false; }, 0); };
      sel.addEventListener('pointerdown', suspend, { passive: true });
      sel.addEventListener('mousedown', suspend, { passive: true });
      sel.addEventListener('blur', resume);

      sel.addEventListener('change', () => {
        const v = sel.value;
        if (v) {
          node.dataset.icon = v;
          node.classList.add('btn-icon');
          node.dataset.btnStyle = 'icon';
          // Apply Figma-loaded mask (if available) via CSS variable
          const dataUrl = this._iconRegistry[v];
          if (dataUrl) node.style.setProperty('--icon-mask', dataUrl);
          else node.style.removeProperty('--icon-mask');
          ensureIconVisual(node, v);
        } else {
          delete node.dataset.icon;
          node.style.removeProperty('--icon-mask');
          ensureIconVisual(node, null);
        }
        resume();
        this.scheduleOverlaySync();
      });

      // Sync current visual on open
      ensureIconVisual(node, node.dataset.icon || null);
    };

    // Initialize placeholders and label spans for any existing buttons
    document.querySelectorAll('button.comp-body').forEach(btn => {
      const hasIcon = !!btn.dataset.icon;
      ensureIconVisual(btn, hasIcon ? btn.dataset.icon : null);
      ensureLabelSpan(btn);
    });

    if (this.propContainer) {
      this._propMo?.disconnect?.();
      this._propMo = new MutationObserver(() => {
        if (this._suspendIconInject) return;
        requestAnimationFrame(() => {
          this._injectIconPicker(this.selectedNode);
          // normalize selected button label after panel changes
          if (this.selectedNode?.dataset?.variant === 'button') ensureLabelSpan(this.selectedNode);
        });
      });
      this._propMo.observe(this.propContainer, { childList: true, subtree: true });
      this.propContainer.addEventListener('change', () => {
        if (this._suspendIconInject) return;
        this._injectIconPicker(this.selectedNode);
        if (this.selectedNode?.dataset?.variant === 'button') ensureLabelSpan(this.selectedNode);
      });
    }
    // === end icon picker + registry ===
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

    document.addEventListener('keydown', (e) => {
      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      const isEditable = t && (t.isContentEditable || ['input', 'textarea', 'select'].includes(tag));
      const inPropertiesPanel = !!(t && t.closest && t.closest('.properties'));
      if (isEditable || inPropertiesPanel) {
        // Let native editing/navigation happen inside inputs/properties
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { 
        e.preventDefault(); 
        this.selectionManager.deleteSelected(); 
      }
      if (e.key === 'ArrowUp') { 
        e.preventDefault(); 
        this.selectionManager.selectParent(); 
      }
      if (e.key === 'ArrowLeft') { 
        e.preventDefault(); 
        this.selectionManager.moveSelected('left'); 
      }
      if (e.key === 'ArrowRight') { 
        e.preventDefault(); 
        this.selectionManager.moveSelected('right'); 
      }
      if (e.key === 'Escape') {
        this.selectionManager.clearSelection();
      }
    });

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
    const node = elUnder && elUnder.closest('[data-id]');
    const selected = this.selectionManager.selectedNode;
    if(node && node !== selected){
      this.placeOverlay(this.hoverRect,this.rectTo(node));
      this.showOverlay(this.hoverRect,true);
    } else if(!node || node===selected){
      this.showOverlay(this.hoverRect,false);
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

    if (this._propMo) {
      this._propMo.disconnect();
      this._propMo = null;
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

    // Clear references
    this.canvas = null;
    this.scrollContainer = null;
    this.tree = null;
    this.properties = null;
    this.propContainer = null;
    this._iconRegistry = null;
    this._figmaIconIds = null;
    this._ICON_OPTIONS = null;

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
