/**
 * PropertiesPanel - Manages property editing for canvas elements
 * Uses DOM API for security (no innerHTML)
 * Extensible renderer pattern for component types
 */
class PropertiesPanel {
  constructor(container, editor) {
    this.container = container;
    this.editor = editor;
    this.currentNode = null;
    this._observers = new Map(); // Track observers for cleanup
  }

  /**
   * Show properties for a node, or empty state if no node
   * @param {HTMLElement} node - The selected node
   */
  show(node) {
    // Clear previous observers
    this._clearObservers();
    this.currentNode = node;

    if (!node) {
      this._showEmptyState();
      return;
    }

    // Clear and build fresh panel
    this.container.innerHTML = '';
    
    // Always show type
    this._addTypeField(node);

    // Get renderer for this variant
    const variant = node.dataset.variant;
    const renderer = this._getRenderer(variant);
    
    if (renderer) {
      renderer.call(this, node);
    }

    // Add layout options for containers
    if (['section', 'form', 'card'].includes(variant)) {
      this._addLayoutSection(node);
    }

    // Add grid column span for all (except header)
    if (variant !== 'header') {
      this._addGridColumnSection(node);
    }

    // Bind events
    this.bindEvents(node);
  }

  /**
   * Show empty state
   */
  _showEmptyState() {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'Select an element to edit its properties.';
    this.container.appendChild(p);
  }

  /**
   * Add name field (universal)
   */
  _addNameField(node) {
    const group = this._createFormGroup('Name');
    const input = document.createElement('input');
    input.id = 'prop-name';
    input.type = 'text';
    input.value = node.dataset.name || '';
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Add type field (read-only)
   */
  _addTypeField(node) {
    const group = this._createFormGroup('Type');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = `${node.dataset.kind} / ${node.dataset.variant}`;
    input.disabled = true;
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Get renderer function for a variant
   * @param {string} variant - Component variant
   * @returns {Function|null} Renderer function
   */
  _getRenderer(variant) {
    const renderers = {
      'text': this._renderText,
      'button': this._renderButton,
      'input': this._renderInput,
      'radiogroup': this._renderRadioGroup,
      'section': this._renderSection,
      'form': this._renderSection, // Form uses same as section
      'card': this._renderCard,
      'datagrid': this._renderDatagrid,
      'header': this._renderHeader,
      'list': this._renderList,
      'tabs': this._renderTabs
    };

    return renderers[variant] || null;
  }

  /**
   * Render properties for Text component
   */
  _renderText(node) {
    const group = this._createFormGroup('Content');
    const input = document.createElement('input');
    input.id = 'prop-content';
    input.type = 'text';
    input.value = node.textContent || '';
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Render properties for Button component
   */
  _renderButton(node) {
    // Label
    const labelGroup = this._createFormGroup('Label');
    const labelInput = document.createElement('input');
    labelInput.id = 'prop-label';
    labelInput.type = 'text';
    labelInput.value = node.textContent || '';
    labelGroup.appendChild(labelInput);
    this.container.appendChild(labelGroup);

    // Style dropdown
    const styleGroup = this._createFormGroup('Style');
    const select = document.createElement('select');
    select.id = 'prop-btn-style';
    
    const options = [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'tertiary', label: 'Tertiary' },
      { value: 'icon', label: 'Icon' }
    ];
    
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
    
    select.value = node.dataset.btnStyle || 'primary';
    styleGroup.appendChild(select);
    this.container.appendChild(styleGroup);
  }

  /**
   * Render properties for Input component
   */
  _renderInput(node) {
    // Label
    const labelGroup = this._createFormGroup('Label');
    const labelInput = document.createElement('input');
    labelInput.id = 'prop-label';
    labelInput.type = 'text';
    const labelEl = node.querySelector('.comp-label');
    labelInput.value = labelEl ? labelEl.textContent : '';
    labelGroup.appendChild(labelInput);
    this.container.appendChild(labelGroup);

    // Placeholder
    const placeholderGroup = this._createFormGroup('Placeholder');
    const placeholderInput = document.createElement('input');
    placeholderInput.id = 'prop-placeholder';
    placeholderInput.type = 'text';
    const bodyEl = node.querySelector('.comp-body');
    placeholderInput.value = bodyEl ? (bodyEl.getAttribute('placeholder') || '') : '';
    placeholderGroup.appendChild(placeholderInput);
    this.container.appendChild(placeholderGroup);
  }

  /**
   * Render properties for RadioGroup component
   */
  _renderRadioGroup(node) {
    const group = this._createFormGroup('Group Label');
    const input = document.createElement('input');
    input.id = 'prop-rg-label';
    input.type = 'text';
    const labelEl = node.querySelector('.comp-label');
    input.value = labelEl ? labelEl.textContent : 'Radio Group';
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Render properties for Section component (shared with Form)
   */
  _renderSection(node) {
    const variant = node.dataset.variant;

    // Title visibility checkbox
    const titleVisGroup = this._createFormGroup('');
    const titleVisCheckbox = document.createElement('input');
    titleVisCheckbox.id = 'prop-section-title-visible';
    titleVisCheckbox.type = 'checkbox';
    const titleVisLabel = document.createElement('label');
    titleVisLabel.style.display = 'flex';
    titleVisLabel.style.alignItems = 'center';
    titleVisLabel.style.gap = '0.5rem';
    titleVisLabel.appendChild(titleVisCheckbox);
    titleVisLabel.appendChild(document.createTextNode('Show Title'));
    titleVisGroup.appendChild(titleVisLabel);
    this.container.appendChild(titleVisGroup);

    // Title text
    const titleGroup = this._createFormGroup('Title Text');
    const titleInput = document.createElement('input');
    titleInput.id = 'prop-section-title-text';
    titleInput.type = 'text';
    const titleEl = node.querySelector('.section-title');
    titleInput.value = node.dataset.title || (titleEl ? titleEl.textContent : variant === 'form' ? 'Form Title' : 'Section Title');
    titleGroup.appendChild(titleInput);
    this.container.appendChild(titleGroup);

    // Initialize checkbox state
    const visible = node.dataset.titleVisible === 'true';
    titleVisCheckbox.checked = visible;
    if (titleEl) titleEl.hidden = !visible;
  }

  /**
   * Render properties for Card component
   */
  _renderCard(node) {
    const group = this._createFormGroup('Card Title');
    const input = document.createElement('input');
    input.id = 'prop-card-title-text';
    input.type = 'text';
    const labelEl = node.querySelector('.label');
    input.value = node.dataset.title || (labelEl ? labelEl.textContent : 'Card');
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Render properties for Datagrid component
   */
  _renderDatagrid(node) {
    const group = this._createFormGroup('Datagrid Title');
    const input = document.createElement('input');
    input.id = 'prop-dg-title-text';
    input.type = 'text';
    const titleEl = node.querySelector('.datagrid-title');
    input.value = node.dataset.name || (titleEl ? titleEl.textContent : 'Datagrid');
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Render properties for Header component
   */
  _renderHeader(node) {
    const group = this._createFormGroup('Title');
    const input = document.createElement('input');
    input.id = 'prop-header-title';
    input.type = 'text';
    const titleEl = node.querySelector('.header-title');
    input.value = titleEl ? titleEl.textContent : 'Header';
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Render properties for List component
   */
  _renderList(node) {
    const group = this._createFormGroup('List Title');
    const input = document.createElement('input');
    input.id = 'prop-list-title';
    input.type = 'text';
    input.value = node.dataset.title || 'List';
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Render properties for Tabs component
   */
  _renderTabs(node) {
    const group = this._createFormGroup('Tabs Label');
    const input = document.createElement('input');
    input.id = 'prop-tabs-label';
    input.type = 'text';
    input.value = node.dataset.label || 'Tabs';
    group.appendChild(input);
    this.container.appendChild(group);
  }

  /**
   * Add layout section for containers
   */
  _addLayoutSection(node) {
    // Subsection title
    const subtitle = document.createElement('div');
    subtitle.className = 'prop-subsection';
    subtitle.textContent = 'Content';
    this.container.appendChild(subtitle);

    // Layout type selector
    const layoutGroup = this._createFormGroup('Layout');
    const select = document.createElement('select');
    select.id = 'prop-layout-type';
    
    ['grid', 'flex'].forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val.charAt(0).toUpperCase() + val.slice(1);
      select.appendChild(opt);
    });
    
    select.value = node.dataset.layout || 'grid';
    layoutGroup.appendChild(select);
    this.container.appendChild(layoutGroup);

    // Layout options container
    const optionsContainer = document.createElement('div');
    optionsContainer.id = 'prop-layout-options';
    this.container.appendChild(optionsContainer);

    // Populate initial layout options
    this.applyLayoutOptions(node, select.value, optionsContainer);
  }

  /**
   * Add grid column span section
   */
  _addGridColumnSection(node) {
    const group = this._createFormGroup('Grid Column Span');
    const radioGroup = document.createElement('div');
    radioGroup.id = 'prop-grid-column';
    radioGroup.className = 'segmented';
    radioGroup.setAttribute('role', 'radiogroup');
    radioGroup.setAttribute('aria-label', 'Grid Column Span');

    const current = node.dataset.gridColumn || '1';
    for (let i = 1; i <= 4; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seg-btn';
      btn.setAttribute('data-span', String(i));
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(i === parseInt(current)));
      if (i === parseInt(current)) btn.classList.add('active');
      btn.textContent = String(i);
      radioGroup.appendChild(btn);
    }

    group.appendChild(radioGroup);
    this.container.appendChild(group);
  }

  /**
   * Utility: create a form group
   */
  _createFormGroup(labelText) {
    const group = document.createElement('div');
    group.className = 'form-group';
    
    if (labelText) {
      const label = document.createElement('label');
      label.textContent = labelText;
      group.appendChild(label);
    }
    
    return group;
  }

  /**
   * Refresh overlays and tree after changes
   */
  refreshOverlays() {
    this.editor.tree.update();
    this.editor.syncOverlays();
  }

  /**
   * Bind all events to form inputs
   */
  bindEvents(node) {
    const variant = node.dataset.variant;

    // Text content
    if (variant === 'text') {
      const input = document.getElementById('prop-content');
      if (input) {
        input.addEventListener('input', () => {
          node.textContent = input.value;
          this.refreshOverlays();
        });
      }
    }

    // Button label and style
    if (variant === 'button') {
      const labelInput = document.getElementById('prop-label');
      if (labelInput) {
        labelInput.addEventListener('input', () => {
          node.textContent = labelInput.value;
          this.refreshOverlays();
        });
      }

      const styleSelect = document.getElementById('prop-btn-style');
      if (styleSelect) {
        styleSelect.addEventListener('change', () => {
          this._applyButtonStyle(node, styleSelect.value);
          node.dataset.btnStyle = styleSelect.value;
          if (styleSelect.value === 'icon' && !node.dataset.icon) {
            node.dataset.icon = 'more';
            this.editor?.iconManager?.ensureIconVisual(node, 'more');
            this.editor?.iconManager?.injectIconPicker(node);
          }
          this.refreshOverlays();
        });
        // Apply initial style
        this._applyButtonStyle(node, styleSelect.value);
      }
    }

    // Input label and placeholder
    if (variant === 'input') {
      const labelInput = document.getElementById('prop-label');
      if (labelInput) {
        labelInput.addEventListener('input', () => {
          const labelEl = node.querySelector('.comp-label');
          if (labelEl) labelEl.textContent = labelInput.value;
          this.refreshOverlays();
        });
      }

      const placeholderInput = document.getElementById('prop-placeholder');
      if (placeholderInput) {
        placeholderInput.addEventListener('input', () => {
          const bodyEl = node.querySelector('.comp-body');
          if (bodyEl) bodyEl.setAttribute('placeholder', placeholderInput.value);
          this.refreshOverlays();
        });
      }
    }

    // Radio group label
    if (variant === 'radiogroup') {
      const groupLabel = document.getElementById('prop-rg-label');
      if (groupLabel) {
        groupLabel.addEventListener('input', () => {
          const labelEl = node.querySelector('.comp-label');
          if (labelEl) labelEl.textContent = groupLabel.value;
          this.refreshOverlays();
        });
      }
    }

    // Section/Form title
    if (variant === 'section' || variant === 'form') {
      const titleVisCheckbox = document.getElementById('prop-section-title-visible');
      const titleInput = document.getElementById('prop-section-title-text');
      const titleEl = node.querySelector('.section-title');

      if (titleVisCheckbox) {
        titleVisCheckbox.addEventListener('change', () => {
          node.dataset.titleVisible = String(titleVisCheckbox.checked);
          if (titleEl) titleEl.hidden = !titleVisCheckbox.checked;
          this.refreshOverlays();
        });
      }

      if (titleInput) {
        titleInput.addEventListener('input', () => {
          node.dataset.title = titleInput.value;
          if (titleEl) titleEl.textContent = titleInput.value;
          this.refreshOverlays();
        });
      }
    }

    // Card title
    if (variant === 'card') {
      const cardTitleInput = document.getElementById('prop-card-title-text');
      if (cardTitleInput) {
        cardTitleInput.addEventListener('input', () => {
          const labelEl = node.querySelector('.label');
          if (labelEl) {
            const val = cardTitleInput.value.trim() || 'Card';
            node.dataset.title = val;
            labelEl.textContent = val;
            this.refreshOverlays();
          }
        });
      }
    }

    // Datagrid title
    if (variant === 'datagrid') {
      const dgTitleInput = document.getElementById('prop-dg-title-text');
      if (dgTitleInput) {
        dgTitleInput.addEventListener('input', () => {
          const dgTitleEl = node.querySelector('.datagrid-title');
          if (dgTitleEl) {
            const val = dgTitleInput.value.trim() || 'Datagrid';
            node.dataset.name = val;
            dgTitleEl.textContent = val;
            this.refreshOverlays();
          }
        });
      }
    }

    // Header title
    if (variant === 'header') {
      const headerTitleInput = document.getElementById('prop-header-title');
      if (headerTitleInput) {
        headerTitleInput.addEventListener('input', () => {
          const titleEl = node.querySelector('.header-title');
          if (titleEl) {
            const val = headerTitleInput.value.trim() || 'Header';
            titleEl.textContent = val;
            this.refreshOverlays();
          }
        });
      }
    }

    // Layout selector and options
    if (['section', 'form', 'card'].includes(variant)) {
      const layoutSelect = document.getElementById('prop-layout-type');
      const optionsContainer = document.getElementById('prop-layout-options');

      if (layoutSelect) {
        layoutSelect.addEventListener('change', () => {
          node.dataset.layout = layoutSelect.value;
          this.applyLayoutOptions(node, layoutSelect.value, optionsContainer);
          this.bindLayoutOptionEvents(node); // Rebind layout option events
          this.refreshOverlays();
        });
      }
    }

    // Grid column span
    const gridSpanGroup = document.getElementById('prop-grid-column');
    if (gridSpanGroup) {
      this.bindGridColumnEvents(node);
    }
  }

  /**
   * Bind grid column span button events
   */
  bindGridColumnEvents(node) {
    const gridSpanGroup = document.getElementById('prop-grid-column');
    if (!gridSpanGroup) return;

    const buttons = gridSpanGroup.querySelectorAll('.seg-btn');
    if (!node.dataset.gridColumn) node.dataset.gridColumn = '1';

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-span');
        node.dataset.gridColumn = val;
        node.style.gridColumn = `span ${val}`;
        buttons.forEach(b => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-checked', String(active));
        });
        this.refreshOverlays();
      });
    });

    // Setup parent mutation observer to update enabled state
    this._setupGridSpanObserver(node, buttons);
  }

  /**
   * Setup observer for parent grid column updates
   */
  _setupGridSpanObserver(node, buttons) {
    const parentContainer = node.parentElement?.closest('.container-node');
    if (!parentContainer) return;

    const updateEnabledState = () => {
      const parentChildren = parentContainer.querySelector(
        parentContainer.dataset?.variant === 'header' ? '.buttons' : '.children'
      );
      const styleDisplay = parentChildren ? getComputedStyle(parentChildren).display : '';
      const layoutAttr = parentContainer.dataset.layout || 'grid';
      const isGrid = (layoutAttr === 'grid') && (styleDisplay === 'grid');

      const gridSpanGroup = document.getElementById('prop-grid-column');
      if (gridSpanGroup) {
        gridSpanGroup.setAttribute('aria-disabled', String(!isGrid));
        gridSpanGroup.classList.toggle('is-disabled', !isGrid);
      }

      let maxCols = 4;
      if (isGrid) {
        const parentCols = parentContainer.dataset.cols ? parseInt(parentContainer.dataset.cols, 10) : NaN;
        if (!isNaN(parentCols)) {
          maxCols = parentCols;
        }
      }

      buttons.forEach(b => {
        const val = parseInt(b.getAttribute('data-span'), 10);
        b.disabled = !isGrid || val > maxCols;
      });

      if (isGrid) {
        const curr = parseInt(node.dataset.gridColumn || '1', 10);
        if (curr > maxCols) {
          node.dataset.gridColumn = String(maxCols);
          node.style.gridColumn = `span ${maxCols}`;
          buttons.forEach(b => {
            const active = parseInt(b.getAttribute('data-span'), 10) === maxCols;
            b.classList.toggle('active', active);
            b.setAttribute('aria-checked', String(active));
          });
        }
      }
    };

    updateEnabledState();

    const obs = new MutationObserver(updateEnabledState);
    obs.observe(parentContainer, {
      attributes: true,
      attributeFilter: ['data-layout', 'data-cols', 'style']
    });

    // Track for cleanup
    this._observers.set('gridSpan', obs);
  }

  /**
   * Apply and render layout option controls
   */
  applyLayoutOptions(node, type, container) {
    container.innerHTML = '';
    
    const children = node.querySelector(
      node.dataset?.variant === 'header' ? '.buttons' : '.children'
    );
    if (!children) return;

    if (type === 'grid') {
      this._renderGridOptions(node, children, container);
    } else if (type === 'flex') {
      this._renderFlexOptions(node, children, container);
    }
  }

  /**
   * Render grid layout options
   */
  _renderGridOptions(node, children, container) {
    // Initialize columns if not set
    if (!node.dataset.cols) {
      if (['section', 'form'].includes(node.dataset.variant)) {
        node.dataset.cols = '4';
      } else if (node.dataset.variant === 'card') {
        node.dataset.cols = '1';
      } else {
        node.dataset.cols = '3';
      }
    }

    children.style.display = 'grid';
    children.style.flexDirection = '';
    const current = node.dataset.cols;
    children.style.gridTemplateColumns = `repeat(${current}, 1fr)`;

    // Create columns selector
    const group = this._createFormGroup('Columns');
    const radioGroup = document.createElement('div');
    radioGroup.className = 'segmented';
    radioGroup.setAttribute('role', 'radiogroup');
    radioGroup.setAttribute('aria-label', 'Grid Columns');

    for (let i = 1; i <= 4; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seg-btn';
      btn.setAttribute('data-cols', String(i));
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(i === parseInt(current)));
      btn.setAttribute('aria-label', `${i} columns`);
      if (i === parseInt(current)) btn.classList.add('active');
      btn.textContent = String(i);

      btn.addEventListener('click', () => {
        node.dataset.cols = String(i);
        children.style.gridTemplateColumns = `repeat(${i}, 1fr)`;
        radioGroup.querySelectorAll('.seg-btn').forEach(b => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-checked', String(active));
        });
        this.refreshOverlays();
      });

      radioGroup.appendChild(btn);
    }

    group.appendChild(radioGroup);
    container.appendChild(group);
  }

  /**
   * Render flex layout options
   */
  _renderFlexOptions(node, children, container) {
    children.style.display = 'flex';
    children.style.gridTemplateColumns = '';

    const group = this._createFormGroup('Flex Direction');
    const select = document.createElement('select');
    select.id = 'prop-flex-dir';

    const directions = [
      { value: 'row', label: 'Row' },
      { value: 'column', label: 'Column' }
    ];

    directions.forEach(dir => {
      const opt = document.createElement('option');
      opt.value = dir.value;
      opt.textContent = dir.label;
      select.appendChild(opt);
    });

    select.value = node.dataset.flexDir || 'row';
    children.style.flexDirection = select.value;

    select.addEventListener('change', () => {
      node.dataset.flexDir = select.value;
      children.style.flexDirection = select.value;
      this.refreshOverlays();
    });

    group.appendChild(select);
    container.appendChild(group);
  }

  /**
   * Bind layout option events (called when layout changes)
   */
  bindLayoutOptionEvents(node) {
    // Layout options already have events bound via applyLayoutOptions
    // This is a hook for any additional binding if needed
  }

  /**
   * Apply button style classes
   */
  _applyButtonStyle(node, style) {
    node.classList.remove('btn-secondary', 'btn-tertiary', 'btn-icon');
    if (style === 'secondary') node.classList.add('btn-secondary');
    else if (style === 'tertiary') node.classList.add('btn-tertiary');
    else if (style === 'icon') node.classList.add('btn-icon');
  }

  /**
   * Clear all observers
   */
  _clearObservers() {
    this._observers.forEach(obs => obs.disconnect?.());
    this._observers.clear();
  }

  /**
   * Cleanup
   */
  dispose() {
    this._clearObservers();
    this.currentNode = null;
    this.container = null;
    this.editor = null;
  }
}
