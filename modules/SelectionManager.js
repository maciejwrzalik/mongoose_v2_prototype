// ===============================
// Selection Manager
// ===============================
// Handles node selection state and related UI updates

class SelectionManager {
  constructor(editor) {
    this.editor = editor;
    this.canvas = editor.canvas;
    this._selectedNode = null;
  }
  
  /**
   * Get the currently selected node
   */
  get selectedNode() {
    return this._selectedNode;
  }
  
  /**
   * Select a node and update all related UI
   * @param {HTMLElement} node - The node to select
   */
  selectNode(node) {
    if (!node) {
      this.clearSelection();
      return;
    }
    
    this._selectedNode = node;
    
    // Attach scroll listeners to ancestors of the selected node
    if (this.editor.overlayManager) {
      this.editor.overlayManager.attachAncestorScroll(node);
    }
    
    // Update selection overlay
    const rect = this.editor.rectTo(node);
    this.editor.placeOverlay(this.editor.selectedRect, rect);
    this.editor.showOverlay(this.editor.selectedRect, true);
    this.editor.updateLayoutBadge();
    
    // Sync tree and properties
    if (this.editor.tree) {
      this.editor.tree.syncSelection();
    }
    
    if (this.editor.properties) {
      this.editor.properties.show(node);
    }
    
    // Inject icon picker for buttons (if available)
    this.editor._injectIconPicker?.(node);
    
    // Normalize button label span on selection
    if (node?.dataset?.variant === 'button') {
      const btn = node.matches('button.comp-body') ? 
        node : 
        node.querySelector('button.comp-body') || node;
      
      if (btn) {
        // Icon visual and label span normalization handled by editor's helpers
        const hasIcon = !!btn.dataset.icon;
        // Could invoke editor helpers here if needed
      }
    }
  }
  
  /**
   * Clear current selection
   */
  clearSelection() {
    this._selectedNode = null;
    
    // Detach scroll listeners
    if (this.editor.overlayManager) {
      this.editor.overlayManager.detachAncestorScroll();
    }
    
    // Hide selection overlay
    this.editor.showOverlay(this.editor.selectedRect, false);
    if (this.editor.layoutBadge) {
      this.editor.layoutBadge.hidden = true;
    }
    
    // Sync tree and properties
    if (this.editor.tree) {
      this.editor.tree.syncSelection();
    }
    
    if (this.editor.properties) {
      this.editor.properties.show(null);
    }
  }
  
  /**
   * Select the parent of the currently selected node
   */
  selectParent() {
    if (!this._selectedNode) return;
    
    const parent = this._selectedNode.parentElement.closest('[data-id]');
    if (parent) {
      this.selectNode(parent);
    }
  }
  
  /**
   * Delete the currently selected node
   */
  deleteSelected() {
    if (!this._selectedNode) return;
    
    const parent = this._selectedNode.parentElement.closest('[data-id]');
    this._selectedNode.remove();
    this.clearSelection();
    
    // Show empty hint if canvas is now empty
    if (!this.canvas.querySelector('[data-id]')) {
      this.canvas.insertAdjacentHTML(
        'afterbegin',
        '<div class="empty-hint">Drop a <b>Section</b> here. Then add cards/components inside.</div>'
      );
    }
    
    // Select parent if it exists
    if (parent) {
      this.selectNode(parent);
    }
    
    // Update tree
    if (this.editor.tree) {
      this.editor.tree.update();
    }
    
    // Hide hover overlay
    this.editor.showOverlay(this.editor.hoverRect, false);
    this.editor.showOverlay(this.editor.selectedRect, false);
  }
  
  /**
   * Move selected node left or right among siblings
   * @param {string} direction - 'left' or 'right'
   */
  moveSelected(direction) {
    if (!this._selectedNode) return;
    
    const parent = this._selectedNode.parentElement;
    if (!parent) return;
    
    const siblings = [...parent.children];
    const idx = siblings.indexOf(this._selectedNode);
    
    if (direction === 'left' && idx > 0) {
      parent.insertBefore(this._selectedNode, siblings[idx - 1]);
    } else if (direction === 'right' && idx < siblings.length - 1) {
      parent.insertBefore(this._selectedNode, siblings[idx + 1].nextSibling);
    }
    
    // Update tree and overlays
    if (this.editor.tree) {
      this.editor.tree.update();
    }
    
    if (this.editor.overlayManager) {
      this.editor.overlayManager.syncOverlays();
    }
  }
  
  /**
   * Check if a node is currently selected
   * @param {HTMLElement} node - The node to check
   * @returns {boolean}
   */
  isSelected(node) {
    return this._selectedNode === node;
  }
  
  /**
   * Check if there is a selection
   * @returns {boolean}
   */
  hasSelection() {
    return this._selectedNode !== null;
  }
  
  /**
   * Cleanup
   */
  dispose() {
    this.clearSelection();
    this._selectedNode = null;
  }
}
