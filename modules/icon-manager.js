// ===============================
// Icon Manager
// ===============================
// Handles SVG icon loading from assets and button icon picker injection

class IconManager {
  constructor(editor) {
    this.editor = editor;
    this.propContainer = document.getElementById('propertiesContent');
    
    // Icon registry: name -> file path
    this._iconRegistry = {};
    
    // Icon names and corresponding SVG file paths
    this._iconFiles = {
      compose: 'assets/compose.svg',
      delete: 'assets/delete.svg',
      'insert-image': 'assets/insert-image.svg',
      inventory: 'assets/inventory.svg',
      print: 'assets/print.svg',
      save: 'assets/save.svg',
      url: 'assets/url.svg',
      'user-profile': 'assets/user-profile.svg'
    };
    
    this._ICON_OPTIONS = Object.keys(this._iconFiles);
    this._suspendIconInject = false;
    this._propMo = null;
    
    this._init();
  }
  
  _init() {
    // Pre-populate registry with icon file paths (will be verified during load)
    Object.entries(this._iconFiles).forEach(([name, path]) => {
      this._iconRegistry[name] = `url('${path}')`;
    });
    
    // Verify SVG files exist (optional validation)
    this._validateSvgIcons();
    
    // Initialize existing buttons
    this._initializeExistingButtons();
    
    // Set up property panel observer
    this._setupPropertyPanelObserver();
  }
  
  /**
   * Validate that SVG icons are accessible
   */
  async _validateSvgIcons() {
    for (const [name, path] of Object.entries(this._iconFiles)) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          console.warn(`Icon file not found: ${path}`);
        }
      } catch (err) {
        console.warn(`Error accessing icon ${name}: ${err.message}`);
      }
    }
  }
  
  /**
   * Ensure visual span exists on a button and set placeholder/icon
   * @param {HTMLElement} btn - The button element
   * @param {string} iconName - The icon name (or null)
   */
  ensureIconVisual(btn, iconName) {
    let vis = btn.querySelector('.btn-icon-visual');
    if (!vis) {
      vis = document.createElement('span');
      vis.className = 'btn-icon-visual';
      btn.prepend(vis);
    }
    
    if (iconName) {
      vis.classList.remove('is-placeholder');
      vis.textContent = '';
      
      // Apply the icon background-image
      const filePath = this._iconRegistry[iconName];
      if (filePath) {
        vis.style.setProperty('--icon-url', filePath);
      } else {
        vis.style.removeProperty('--icon-url');
      }
    } else {
      vis.classList.add('is-placeholder');
      vis.textContent = '⋯';
      vis.style.removeProperty('--icon-url');
    }
    
    // Also ensure a label span exists
    this.ensureLabelSpan(btn);
  }
  
  /**
   * Wrap button label text into a <span class="btn-label">
   * @param {HTMLElement} btn - The button element
   */
  ensureLabelSpan(btn) {
    if (!btn || !btn.matches('button.comp-body')) return;
    
    // Check if label span already exists
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
  }
  
  /**
   * Inject icon picker into properties panel for icon-style buttons
   * @param {HTMLElement} node - The currently selected node
   */
  injectIconPicker(node) {
    const container = this.propContainer || document.getElementById('propertiesContent');
    if (!container) return;
    
    const isButton = !!(node && node.dataset && node.dataset.variant === 'button');
    const isIconStyle = isButton && (
      (node.dataset.btnStyle || '').toLowerCase() === 'icon' ||
      node.classList.contains('btn-icon') ||
      node.getAttribute('data-btn-style') === 'icon'
    );
    
    const existingGrp = container.querySelector('#btn-icon-group');
    
    // Remove picker if not icon-style button
    if (existingGrp && !isIconStyle) {
      existingGrp.remove();
      return;
    }
    
    // Sync existing picker
    if (existingGrp) {
      const sel = existingGrp.querySelector('#prop-btn-icon');
      if (sel) sel.value = node.dataset.icon || '';
      return;
    }
    
    // Don't create picker if not icon-style button
    if (!isIconStyle) return;
    
    // Create new picker
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
    
    // Prevent inject during interaction
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
        
        this.ensureIconVisual(node, v);
        
        // Apply SVG file path via CSS variable on the visual span
        const vis = node.querySelector('.btn-icon-visual');
        if (vis) {
          const filePath = this._iconRegistry[v];
          if (filePath) {
            vis.style.setProperty('--icon-url', filePath);
          } else {
            vis.style.removeProperty('--icon-url');
          }
        }
      } else {
        delete node.dataset.icon;
        this.ensureIconVisual(node, null);
        
        const vis = node.querySelector('.btn-icon-visual');
        if (vis) {
          vis.style.removeProperty('--icon-url');
        }
      }
      
      resume();
      this.editor.scheduleOverlaySync();
    });
    
    // Sync current visual on open
    this.ensureIconVisual(node, node.dataset.icon || null);
  }
  
  /**
   * Initialize placeholders and label spans for existing buttons
   */
  _initializeExistingButtons() {
    document.querySelectorAll('button.comp-body').forEach(btn => {
      const hasIcon = !!btn.dataset.icon;
      const iconName = btn.dataset.icon || null;
      this.ensureIconVisual(btn, iconName);
      this.ensureLabelSpan(btn);
    });
  }
  
  /**
   * Set up property panel observer to inject icon picker on changes
   */
  _setupPropertyPanelObserver() {
    if (!this.propContainer) return;
    
    this._propMo?.disconnect?.();
    
    this._propMo = new MutationObserver(() => {
      if (this._suspendIconInject) return;
      
      requestAnimationFrame(() => {
        this.injectIconPicker(this.editor.selectedNode);
        
        // Normalize selected button label after panel changes
        if (this.editor.selectedNode?.dataset?.variant === 'button') {
          this.ensureLabelSpan(this.editor.selectedNode);
        }
      });
    });
    
    this._propMo.observe(this.propContainer, { childList: true, subtree: true });
    
    this.propContainer.addEventListener('change', () => {
      if (this._suspendIconInject) return;
      
      this.injectIconPicker(this.editor.selectedNode);
      
      if (this.editor.selectedNode?.dataset?.variant === 'button') {
        this.ensureLabelSpan(this.editor.selectedNode);
      }
    });
  }
  
  /**
   * Get icon registry (for debugging or external access)
   */
  getIconRegistry() {
    return { ...this._iconRegistry };
  }
  
  /**
   * Get available icon options
   */
  getIconOptions() {
    return [...this._ICON_OPTIONS];
  }
  
  /**
   * Cleanup
   */
  dispose() {
    if (this._propMo) {
      this._propMo.disconnect();
      this._propMo = null;
    }
    
    this.editor = null;
    this.propContainer = null;
    this._iconRegistry = null;
    this._figmaIconIds = null;
    this._ICON_OPTIONS = null;
  }
}
