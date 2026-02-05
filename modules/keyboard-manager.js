// ===============================
// Keyboard Manager
// ===============================
// Handles all keyboard shortcuts and interactions

class KeyboardManager {
  constructor(editor) {
    this.editor = editor;
    this.selectionManager = editor.selectionManager;
    this._keydownHandler = null;
    
    this._init();
  }
  
  _init() {
    // Bind handler so it can be removed later
    this._keydownHandler = (e) => this._handleKeydown(e);
    document.addEventListener('keydown', this._keydownHandler);
  }
  
  /**
   * Handle keydown events
   * @param {KeyboardEvent} e - The keyboard event
   */
  _handleKeydown(e) {
    const t = e.target;
    const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
    const isEditable = t && (t.isContentEditable || ['input', 'textarea', 'select'].includes(tag));
    const inPropertiesPanel = !!(t && t.closest && t.closest('.properties'));
    
    // Don't interfere with editable inputs or properties panel
    if (isEditable || inPropertiesPanel) {
      return;
    }
    
    // Delete/Backspace - Delete selected node
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.selectionManager.deleteSelected();
    }
    
    // Arrow Up - Select parent node
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectionManager.selectParent();
    }
    
    // Arrow Left - Move node left among siblings
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.selectionManager.moveSelected('left');
    }
    
    // Arrow Right - Move node right among siblings
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.selectionManager.moveSelected('right');
    }
    
    // Escape - Clear selection
    if (e.key === 'Escape') {
      this.selectionManager.clearSelection();
    }
  }
  
  /**
   * Cleanup
   */
  dispose() {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }
    this.editor = null;
    this.selectionManager = null;
  }
}
