// ===============================
// Core Component Classes
// ===============================

class NodeComponent {
  constructor(kind, variant, name = null) {
    this.id = 'n_' + Math.random().toString(36).slice(2, 9);
    this.kind = kind;
    this.variant = variant;
    this.name = name || variant;
    this.el = this.render();
    this.el.dataset.id = this.id;
    this.el.dataset.kind = this.kind;
    this.el.dataset.variant = this.variant;
    this.el.dataset.name = this.name;
  }

  render() { return document.createElement('div'); }
  updateName(newName) {
    this.name = newName;
    this.el.dataset.name = newName;
  }
}

// ===============================
// Tree View
// ===============================
class TreeView {
  constructor(container, editor) {
    this.container = container;
    this.editor = editor;
  }
  createIcon(kind, variant) {
    const span = document.createElement('span');
    // Classes drive icon via CSS masks in styles.scss
    span.className = `tree-icon ${kind === 'container' ? 'is-container' : 'is-component'} ${variant ? `v-${variant}` : ''}`;
    return span;
  }
  update() {
    this.container.innerHTML = '';
    const roots = [...this.editor.canvas.children].filter(n => n.dataset && n.dataset.id);
    roots.forEach(n => this.container.appendChild(this.buildTreeItem(n)));
    this.syncSelection();
  }
  buildTreeItem(node) {
    const li = document.createElement('li');
    li.className = 'tree-item';
    li.dataset.id = node.dataset.id;
    // Icon + label
    const row = document.createElement('div');
    row.className = 'tree-row';
    const kind = node.dataset.kind;
    const variant = node.dataset.variant;
    const icon = this.createIcon(kind, variant);
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'tree-label';
    label.textContent = `${node.dataset.name || variant} (${variant})`;
    row.appendChild(icon);
    row.appendChild(label);
    li.appendChild(row);
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      this.editor.selectNode(node);
    });
    if (variant === 'splitter') {
      const panels = node.querySelectorAll(':scope > .splitter-panel > .children');
      const panelChildren = [...panels]
        .flatMap(p => [...p.children])
        .filter(c => c.dataset && c.dataset.id);
      if (panelChildren.length) {
        const ul = document.createElement('ul');
        ul.className = 'tree-children';
        panelChildren.forEach(c => ul.appendChild(this.buildTreeItem(c)));
        li.appendChild(ul);
      }
    } else {
      const childrenContainer = node.querySelector(
        variant === 'header' ? ':scope > .buttons' : ':scope > .children'
      );
      if (childrenContainer) {
        const validChildren = [...childrenContainer.children].filter(c => c.dataset && c.dataset.id);
        if (validChildren.length) {
          const ul = document.createElement('ul');
          ul.className = 'tree-children';
          validChildren.forEach(c => ul.appendChild(this.buildTreeItem(c)));
          li.appendChild(ul);
        }
      }
    }
    return li;
  }
  syncSelection() {
    [...this.container.querySelectorAll('.tree-item')].forEach(li => {
      if (this.editor.selectedNode && li.dataset.id === this.editor.selectedNode.dataset.id) li.classList.add('selected');
      else li.classList.remove('selected');
    });
  }
}

// --- List Component ---
// (moved to components/list.js; ensure that script is loaded before use)
// --- end List Component ---
