// ===============================
// Overlay Manager
// ===============================
// Manages selection, hover, and drop overlays

class OverlayManager {
  constructor(editor) {
    this.editor = editor;
    this.canvas = editor.canvas;
    
    // Overlay elements
    this.hoverRect = document.getElementById('hoverRect');
    this.selectedRect = document.getElementById('selectedRect');
    this.dropRect = null;
    
    // Layout badge for selected overlay
    this.layoutBadge = null;
    
    // Throttling
    this._overlaySyncPending = false;
    this._lastPointer = null;
    
    // Scroll tracking
    this._scrollAncestors = [];
    this._ancestorScrollHandlers = new Map();
    
    this._init();
  }
  
  _init() {
    // Ensure overlay rectangles live inside the canvas so they scroll with content
    if (this.hoverRect.parentElement !== this.canvas) {
      this.canvas.appendChild(this.hoverRect);
    }
    if (this.selectedRect.parentElement !== this.canvas) {
      this.canvas.appendChild(this.selectedRect);
    }
    
    // Create and append layout badge
    this.layoutBadge = document.createElement('div');
    this.layoutBadge.className = 'layout-badge';
    this.layoutBadge.hidden = true;
    this.selectedRect.appendChild(this.layoutBadge);
    
    // Create drop indicator
    this.dropRect = document.createElement('div');
    this.dropRect.id = 'dropRect';
    this.dropRect.style.position = 'absolute';
    this.dropRect.style.background = window.CONSTANTS?.OVERLAY?.BACKGROUND?.DROP || 'rgba(121, 40, 225, 0.05)';
    this.dropRect.style.pointerEvents = 'none';
    this.dropRect.style.zIndex = window.CONSTANTS?.OVERLAY?.Z_INDEX?.DROP || '999998';
    this.dropRect.hidden = true;
    this.canvas.appendChild(this.dropRect);
    
    // Track pointer for deferred hover updates
    this.canvas.addEventListener('pointermove', (e) => {
      this._lastPointer = { x: e.clientX, y: e.clientY };
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.showOverlay(this.hoverRect, false);
    });
  }
  
  // Position an overlay element
  placeOverlay(div, { x, y, w, h }) {
    Object.assign(div.style, {
      left: x + 'px',
      top: y + 'px',
      width: w + 'px',
      height: h + 'px'
    });
  }
  
  // Show or hide an overlay
  showOverlay(div, show) {
    div.hidden = !show;
  }
  
  // Compute rect relative to canvas with clipping
  rectTo(el) {
    const parent = this.canvas;
    const targetRect = el.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const offset = window.CONSTANTS?.OVERLAY?.OFFSET || 1;
    
    // Base rectangle in canvas coordinates
    let rect = {
      x: (targetRect.left - parentRect.left) - offset,
      y: (targetRect.top - parentRect.top) - offset,
      w: targetRect.width + offset * 2,
      h: targetRect.height + offset * 2
    };
    
    // Intersect with scrollable ancestors' visible rects to clip overlays
    const ancestors = this.getScrollableAncestors(el);
    for (const anc of ancestors) {
      const ar = anc.getBoundingClientRect();
      // Convert ancestor rect to canvas coordinates
      const ancRect = {
        x: ar.left - parentRect.left,
        y: ar.top - parentRect.top,
        w: ar.width,
        h: ar.height
      };
      rect = this._intersectRects(rect, ancRect);
      if (!rect) return { x: -9999, y: -9999, w: 0, h: 0 }; // fully clipped
    }
    return rect;
  }
  
  _intersectRects(a, b) {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    const y2 = Math.min(a.y + a.h, b.y + b.h);
    if (x2 <= x1 || y2 <= y1) return null;
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  
  // Collect ancestors with overflow that causes scrolling
  getScrollableAncestors(el) {
    const list = [];
    let node = el.parentElement;
    while (node && node !== this.canvas) {
      const style = getComputedStyle(node);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;
      const isScrollable =
        (overflowY === 'auto' || overflowY === 'scroll') ||
        (overflowX === 'auto' || overflowX === 'scroll');
      if (isScrollable) list.push(node);
      node = node.parentElement;
    }
    // Also include canvas-wrap (outer scroller)
    const wrap = this.editor.getScrollContainer();
    if (wrap && wrap !== this.canvas) list.push(wrap);
    return list;
  }
  
  // Attach scroll listeners to all ancestors to keep overlays in sync
  attachAncestorScroll(el) {
    this.detachAncestorScroll();
    const ancestors = this.getScrollableAncestors(el) || [];
    this._scrollAncestors = ancestors;
    ancestors.forEach((anc) => {
      const handler = () => this.scheduleOverlaySync();
      anc.addEventListener('scroll', handler, { passive: true });
      this._ancestorScrollHandlers.set(anc, handler);
    });
  }
  
  detachAncestorScroll() {
    this._scrollAncestors.forEach((anc) => {
      const h = this._ancestorScrollHandlers.get(anc);
      if (h) anc.removeEventListener('scroll', h);
    });
    this._scrollAncestors = [];
    this._ancestorScrollHandlers.clear();
  }
  
  // Sync all overlays based on current state
  syncOverlays() {
    const selectedNode = this.editor.selectedNode;
    
    if (selectedNode) {
      this.placeOverlay(this.selectedRect, this.rectTo(selectedNode));
      this.updateLayoutBadge(selectedNode);
    }
    
    // Recompute hover based on last known mouse position if available
    if (this._lastPointer) {
      const elUnder = document.elementFromPoint(this._lastPointer.x, this._lastPointer.y);
      const node = elUnder && elUnder.closest('[data-id]');
      if (node) {
        this.placeOverlay(this.hoverRect, this.rectTo(node));
        this.showOverlay(this.hoverRect, true);
      } else {
        this.showOverlay(this.hoverRect, false);
      }
    }
  }
  
  // Schedule overlay sync with requestAnimationFrame throttling
  scheduleOverlaySync() {
    if (this._overlaySyncPending) return;
    this._overlaySyncPending = true;
    requestAnimationFrame(() => {
      this._overlaySyncPending = false;
      this.syncOverlays();
    });
  }
  
  // Update layout badge for selected element
  updateLayoutBadge(node) {
    if (!node) {
      this.layoutBadge.hidden = true;
      return;
    }
    
    const variant = node.dataset.variant;
    if (!(variant === 'section' || variant === 'form' || variant === 'card')) {
      this.layoutBadge.hidden = true;
      return;
    }
    
    const layout = node.dataset.layout || 'grid';
    let text = ' ';
    
    if (layout === 'grid') {
      text += 'GRID';
    } else if (layout === 'flex') {
      const dir = (node.dataset.flexDir || 'row').toUpperCase();
      text += `FLEX ${dir}`;
    } else {
      this.layoutBadge.hidden = true;
      return;
    }
    
    this.layoutBadge.textContent = text;
    this.layoutBadge.hidden = false;
  }
  
  // Show hover overlay on specific node
  showHoverOnNode(node) {
    if (node) {
      this.placeOverlay(this.hoverRect, this.rectTo(node));
      this.showOverlay(this.hoverRect, true);
    } else {
      this.showOverlay(this.hoverRect, false);
    }
  }
  
  // Show selection overlay on specific node
  showSelectionOnNode(node) {
    if (node) {
      this.placeOverlay(this.selectedRect, this.rectTo(node));
      this.showOverlay(this.selectedRect, true);
      this.updateLayoutBadge(node);
      this.attachAncestorScroll(node);
    } else {
      this.showOverlay(this.selectedRect, false);
      this.layoutBadge.hidden = true;
    }
  }
  
  // Show drop indicator
  showDropIndicator(rect) {
    if (rect) {
      this.placeOverlay(this.dropRect, rect);
      this.dropRect.hidden = false;
    } else {
      this.dropRect.hidden = true;
    }
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    // Detach all scroll listeners
    this.detachAncestorScroll();
    
    // Clear ancestor handlers
    this._ancestorScrollHandlers.clear();
    this._scrollAncestors = [];
    
    // Clear references
    this.editor = null;
    this.canvas = null;
    this.hoverRect = null;
    this.selectedRect = null;
    this.dropRect = null;
    this.layoutBadge = null;
  }
}
