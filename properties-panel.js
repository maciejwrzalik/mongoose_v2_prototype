class PropertiesPanel {
  constructor(container, editor) {
    this.container = container;
    this.editor = editor;
  }

  show(node) {
    if (!node) {
      this.container.innerHTML = '<p class="muted">Select an element to edit its properties.</p>';
      return;
    }

    const variant = node.dataset.variant;
    const name = node.dataset.name;
    let extra = '';

    if (variant === 'text') {
      extra = `<div class="form-group"><label for="prop-content">Content</label><input id="prop-content" type="text" value="${node.textContent}" /></div>`;
    } else if (variant === 'button') {
      extra = `
        <div class="form-group">
          <label for="prop-label">Label</label>
          <input id="prop-label" type="text" value="${node.textContent}" />
        </div>
        <div class="form-group">
          <label for="prop-btn-style">Style</label>
          <select id="prop-btn-style">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="tertiary">Tertiary</option>
            <option value="icon">Icon</option>
          </select>
        </div>
      `;
    } else if (variant === 'input') {
      extra = `
        <div class="form-group"><label for="prop-label">Label</label><input id="prop-label" type="text" value="${node.querySelector('.comp-label').textContent}" /></div>
        <div class="form-group"><label for="prop-placeholder">Placeholder</label><input id="prop-placeholder" type="text" value="${node.querySelector('.comp-body').getAttribute('placeholder') || ''}" /></div>
      `;
    } else if (variant === 'radiogroup') {
      extra = `
        <div class="form-group">
          <label for="prop-rg-label">Group Label</label>
          <input id="prop-rg-label" type="text" value="${node.querySelector('.comp-label')?.textContent || 'Radio Group'}" />
        </div>
      `;
    } else if (variant === 'section' || variant === 'form' || variant === 'card' || variant === 'datagrid') {
      extra = `
          ${ (variant === 'section' || variant === 'form') ? `
          <div class="form-group">
            <label><input type="checkbox" id="prop-section-title-visible" /> Show Title</label>
          </div>
          <div class="form-group">
            <label for="prop-section-title-text">Title Text</label>
            <input id="prop-section-title-text" type="text" value="${node.dataset.title || (variant==='form'?'Form Title':'Section Title')}" />
          </div>
          ` : ''}
          ${variant === 'card' ? `
          <div class="form-group">
            <label for="prop-card-title-text">Card Title</label>
            <input id="prop-card-title-text" type="text" value="${node.dataset.title || 'Card'}" />
          </div>
          ` : ''}
          ${variant === 'datagrid' ? `
          <div class="form-group">
            <label for="prop-dg-title-text">Datagrid Title</label>
            <input id="prop-dg-title-text" type="text" value="${node.dataset.name || 'Datagrid'}" />
          </div>
          ` : ''}
      `;
    }

    this.container.innerHTML = `
      <div class="form-group">
        <label for="prop-name">Name</label>
        <input id="prop-name" type="text" value="${name}" />
      </div>
      <div class="form-group">
        <label>Type</label>
        <input type="text" value="${node.dataset.kind} / ${variant}" disabled />
      </div>
      ${extra}
      ${ (variant === 'section' || variant === 'form' || variant === 'card') ? `
      <div class="prop-subsection">Content</div>
      <div class="form-group">
        <label for="prop-layout-type">Layout</label>
        <select id="prop-layout-type">
          <option value="grid">Grid</option>
          <option value="flex">Flex</option>
        </select>
      </div>
      <div id="prop-layout-options"></div>
      ` : '' }
      <div class="form-group">
        <label>Grid Column Span</label>
        <div id="prop-grid-column" class="segmented" role="radiogroup" aria-label="Grid Column Span">
          ${[1,2,3,4].map(n=>`<button type="button" class="seg-btn ${ (node.dataset.gridColumn||'1')==n ? 'active':''}" data-span="${n}" role="radio" aria-checked="${(node.dataset.gridColumn||'1')==n}">${n}</button>`).join('')}
        </div>
      </div>
    `;

    this.bindEvents(node);
  }

  refreshOverlays() {
    this.editor.tree.update();
    this.editor.syncOverlays();
  }

  bindEvents(node) {
    // Name binding (+ sync dg title if present)
    const nameInput = document.getElementById('prop-name');
    nameInput.addEventListener('input', () => {
      node.dataset.name = nameInput.value.trim() || node.dataset.variant;
      const dgTitle = node.querySelector('.datagrid-title');
      if (dgTitle) dgTitle.textContent = node.dataset.name;
      this.refreshOverlays();
    });

    // Text
    if (node.dataset.variant === 'text') {
      const input = document.getElementById('prop-content');
      input.addEventListener('input', () => {
        node.textContent = input.value;
        this.refreshOverlays();
      });
    }
    // Button
    else if (node.dataset.variant === 'button') {
      const input = document.getElementById('prop-label');
      input.addEventListener('input', () => {
        node.textContent = input.value;
        this.refreshOverlays();
      });

      const styleSelect = document.getElementById('prop-btn-style');
      const applyStyle = (el, val) => {
        el.classList.remove('btn-secondary','btn-tertiary','btn-icon');
        if (val === 'secondary') el.classList.add('btn-secondary');
        else if (val === 'tertiary') el.classList.add('btn-tertiary');
        else if (val === 'icon') el.classList.add('btn-icon');
      };
      if (styleSelect) {
        styleSelect.value = node.dataset.btnStyle || 'primary';
        applyStyle(node, styleSelect.value);
        styleSelect.addEventListener('change', () => {
          node.dataset.btnStyle = styleSelect.value;
          applyStyle(node, styleSelect.value);
          this.refreshOverlays();
        });
      }
      return;
    }
    // Input
    else if (node.dataset.variant === 'input') {
      const labelInput = document.getElementById('prop-label');
      labelInput.addEventListener('input', () => {
        node.querySelector('.comp-label').textContent = labelInput.value;
        this.refreshOverlays();
      });
      const placeholderInput = document.getElementById('prop-placeholder');
      placeholderInput.addEventListener('input', () => {
        node.querySelector('.comp-body').setAttribute('placeholder', placeholderInput.value);
        this.refreshOverlays();
      });
      const gridSpanGroup = document.getElementById('prop-grid-column');
      if (gridSpanGroup) {
        const current = node.dataset.gridColumn || '1';
        if (!node.dataset.gridColumn) node.dataset.gridColumn = current;
        const buttons = gridSpanGroup.querySelectorAll('.seg-btn');
        buttons.forEach(btn => {
          btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-span');
            node.dataset.gridColumn = val;
            node.style.gridColumn = `span ${val}`;
            buttons.forEach(b => {
              const active = b === btn;
              b.classList.toggle('active', active);
              b.setAttribute('aria-checked', active);
            });
            this.refreshOverlays();
          });
          if (btn.getAttribute('data-span') === current) {
            node.style.gridColumn = `span ${current}`;
            btn.classList.add('active');
            btn.setAttribute('aria-checked','true');
          }
        });
      }
    }
    // Radio Group
    else if (node.dataset.variant === 'radiogroup') {
      const groupLabel = document.getElementById('prop-rg-label');
      if (groupLabel) {
        groupLabel.addEventListener('input', () => {
          const el = node.querySelector('.comp-label');
          if (el) el.textContent = groupLabel.value;
          this.refreshOverlays();
        });
      }
    }
    // Containers and Datagrid
    else if (node.dataset.variant === 'section' || node.dataset.variant === 'form' || node.dataset.variant === 'card' || node.dataset.variant === 'datagrid') {
      // Section-only: show/hide title + title text
      if (node.dataset.variant === 'section') {
        const titleVisibleCheckbox = document.getElementById('prop-section-title-visible');
        const titleInput = document.getElementById('prop-section-title-text');
        const titleEl = node.querySelector('.section-title');
        const visible = node.dataset.titleVisible === 'true';
        titleVisibleCheckbox.checked = visible;
        titleEl.hidden = !visible;
        titleInput.value = node.dataset.title || titleEl.textContent || 'Section Title';
        titleEl.textContent = titleInput.value;
        titleVisibleCheckbox.addEventListener('change', () => {
          const isOn = titleVisibleCheckbox.checked;
          node.dataset.titleVisible = String(isOn);
          titleEl.hidden = !isOn;
          this.refreshOverlays();
        });
        titleInput.addEventListener('input', () => {
          node.dataset.title = titleInput.value;
          titleEl.textContent = titleInput.value;
          this.refreshOverlays();
        });
      }

      // Card title binding
      if (node.dataset.variant === 'card') {
        const cardTitleInput = document.getElementById('prop-card-title-text');
        const labelEl = node.querySelector('.label');
        if (cardTitleInput && labelEl) {
          cardTitleInput.value = node.dataset.title || labelEl.textContent || 'Card';
          labelEl.textContent = cardTitleInput.value;
          cardTitleInput.addEventListener('input', () => {
            const val = cardTitleInput.value.trim() || 'Card';
            node.dataset.title = val;
            labelEl.textContent = val;
            this.refreshOverlays();
          });
        }
      }

      // Layout select + options
      const layoutSelect = document.getElementById('prop-layout-type');
      const optionsContainer = document.getElementById('prop-layout-options');
      if (layoutSelect) {
        layoutSelect.value = node.dataset.layout || 'grid';
        this.applyLayoutOptions(node, layoutSelect.value, optionsContainer);
        layoutSelect.addEventListener('change', () => {
          node.dataset.layout = layoutSelect.value;
          this.applyLayoutOptions(node, layoutSelect.value, optionsContainer);
          this.refreshOverlays();
        });
      }

      // Datagrid title binding
      if (node.dataset.variant === 'datagrid') {
        const dgTitleInput = document.getElementById('prop-dg-title-text');
        const dgTitleEl = node.querySelector('.datagrid-title');
        if (dgTitleInput && dgTitleEl) {
          dgTitleInput.value = node.dataset.name || dgTitleEl.textContent || 'Datagrid';
          dgTitleInput.addEventListener('input', () => {
            const val = dgTitleInput.value.trim() || 'Datagrid';
            node.dataset.name = val;
            dgTitleEl.textContent = val;
            this.refreshOverlays();
          });
        }
      }
    }

    // Universal grid span binding (enabled only if parent is grid)
    const universalGridSpan = document.getElementById('prop-grid-column');
    if (universalGridSpan && !universalGridSpan._bound) {
      const buttons = universalGridSpan.querySelectorAll('.seg-btn');
      if (!node.dataset.gridColumn) node.dataset.gridColumn = '1';
      const current = node.dataset.gridColumn;
      buttons.forEach(btn => {
        const val = btn.getAttribute('data-span');
        if (val === current) {
          node.style.gridColumn = `span ${current}`;
          btn.classList.add('active');
          btn.setAttribute('aria-checked','true');
        }
        btn.addEventListener('click', () => {
          node.dataset.gridColumn = val;
          node.style.gridColumn = `span ${val}`;
          buttons.forEach(b => {
            const active = b === btn;
            b.classList.toggle('active', active);
            b.setAttribute('aria-checked', active);
          });
          this.refreshOverlays();
        });
      });

      const updateEnabledState = () => {
        const parentContainer = node.parentElement && node.parentElement.closest('.container-node');
        let isGrid = false;
        if (parentContainer) {
          const parentChildren = parentContainer.querySelector('.children');
          const styleDisplay = parentChildren ? getComputedStyle(parentChildren).display : '';
          const layoutAttr = parentContainer.dataset.layout || 'grid';
          isGrid = (layoutAttr === 'grid') && (styleDisplay === 'grid');
        }
        universalGridSpan.setAttribute('aria-disabled', String(!isGrid));
        universalGridSpan.classList.toggle('is-disabled', !isGrid);

        let maxCols = 4;
        if (isGrid) {
          const parentCols = parentContainer && parentContainer.dataset.cols ? parseInt(parentContainer.dataset.cols,10) : NaN;
          if (!isNaN(parentCols)) maxCols = parentCols;
          if (isNaN(parentCols)) {
            const c = parentContainer.querySelector('.children');
            const cstyle = c && getComputedStyle(c);
            const cols = cstyle && cstyle.gridTemplateColumns ? cstyle.gridTemplateColumns.split(' ').length : 4;
            maxCols = cols;
          }
        }
        buttons.forEach(b => {
          const val = parseInt(b.getAttribute('data-span'),10);
          const disable = !isGrid || val > maxCols;
          b.disabled = disable;
        });

        if (isGrid) {
          const curr = parseInt(node.dataset.gridColumn||'1',10);
          if (curr > maxCols) {
            node.dataset.gridColumn = String(maxCols);
            node.style.gridColumn = `span ${maxCols}`;
            buttons.forEach(b => {
              const active = parseInt(b.getAttribute('data-span'),10) === maxCols;
              b.classList.toggle('active', active);
              b.setAttribute('aria-checked', String(active));
            });
          }
        }
      };

      updateEnabledState();
      const parentContainer = node.parentElement && node.parentElement.closest('.container-node');
      if (parentContainer) {
        const spanObs = new MutationObserver(updateEnabledState);
        spanObs.observe(parentContainer, { attributes: true, attributeFilter: ['data-layout', 'data-cols', 'style'] });
        universalGridSpan._obs = spanObs;
      }
      universalGridSpan._bound = true;
    }

    // Also bind Form title controls (same as section, but for 'form' variant)
    if (node.dataset.variant === 'form') {
      const titleVisibleCheckbox = document.getElementById('prop-section-title-visible');
      const titleInput = document.getElementById('prop-section-title-text');
      const titleEl = node.querySelector('.section-title');
      const visible = node.dataset.titleVisible === 'true';
      if (titleVisibleCheckbox) {
        titleVisibleCheckbox.checked = visible;
        titleEl.hidden = !visible;
        titleVisibleCheckbox.addEventListener('change', () => {
          const isOn = titleVisibleCheckbox.checked;
          node.dataset.titleVisible = String(isOn);
          titleEl.hidden = !isOn;
          this.refreshOverlays();
        });
      }
      if (titleInput) {
        titleInput.value = node.dataset.title || 'Form Title';
        titleEl.textContent = titleInput.value;
        titleInput.addEventListener('input', () => {
          node.dataset.title = titleInput.value;
          titleEl.textContent = titleInput.value;
          this.refreshOverlays();
        });
      }
    }
  }

  applyLayoutOptions(node, type, container) {
    const children = node.querySelector('.children');
    if (type === 'grid') {
      children.style.display = 'grid';
      children.style.flexDirection = '';
      if (!node.dataset.cols) {
        if (node.dataset.variant === 'section' || node.dataset.variant === 'form') node.dataset.cols = '4';
        else if (node.dataset.variant === 'card') node.dataset.cols = '1';
        else node.dataset.cols = '3';
      }
      const current = node.dataset.cols;
      container.innerHTML = `
        <div class="form-group">
          <label>Columns</label>
          <div class="segmented" role="radiogroup" aria-label="Grid Columns">
            ${[1,2,3,4].map(n=>`<button type="button" class="seg-btn" data-cols="${n}" role="radio" aria-checked="${current==n}" aria-label="${n} columns">${n}</button>`).join('')}
          </div>
        </div>`;
      children.style.gridTemplateColumns = `repeat(${current}, 1fr)`;
      const btns = container.querySelectorAll('.segmented .seg-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-cols');
          node.dataset.cols = val;
          children.style.gridTemplateColumns = `repeat(${val}, 1fr)`;
          btns.forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-checked', b === btn); });
          this.refreshOverlays();
        });
        if (btn.getAttribute('data-cols') === current) btn.classList.add('active');
      });
    } else if (type === 'flex') {
      children.style.display = 'flex';
      children.style.gridTemplateColumns = '';
      container.innerHTML = `
        <div class="form-group">
          <label for="prop-flex-dir">Flex Direction</label>
          <select id="prop-flex-dir">
            <option value="row">Row</option>
            <option value="column">Column</option>
          </select>
        </div>
      `;
      const dirSelect = document.getElementById('prop-flex-dir');
      dirSelect.value = node.dataset.flexDir || 'row';
      children.style.flexDirection = dirSelect.value;
      dirSelect.addEventListener('change', () => {
        node.dataset.flexDir = dirSelect.value;
        children.style.flexDirection = dirSelect.value;
        this.refreshOverlays();
      });
    }
  }
}
