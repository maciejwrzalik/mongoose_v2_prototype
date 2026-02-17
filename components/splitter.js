if (!window.Splitter) {
  class Splitter extends NodeComponent {
    constructor() { super('container', 'splitter'); }
    render() {
      const wrapper = super.render();
      wrapper.classList.add('node', 'container-node', 'splitter-node', 'splitter');
      wrapper.style.height = '100%';

    const leftPanel = document.createElement('div');
    leftPanel.className = 'splitter-panel splitter-left';
    const leftChildren = document.createElement('div');
    leftChildren.className = 'children';
    leftPanel.appendChild(leftChildren);

    const divider = document.createElement('div');
    divider.className = 'splitter-divider';
    divider.setAttribute('role', 'separator');
    divider.setAttribute('aria-orientation', 'vertical');

    const rightPanel = document.createElement('div');
    rightPanel.className = 'splitter-panel splitter-right';
    const rightChildren = document.createElement('div');
    rightChildren.className = 'children';
    rightPanel.appendChild(rightChildren);

    leftPanel.style.flex = '0 0 25%';
    rightPanel.style.flex = '1 1 0';

    // Seed locked sections inside panels
    const leftSection = window.componentFactory?.create('container', 'section');
    if (leftSection) {
      leftSection.updateName('Left Panel');
      leftSection.el.dataset.title = 'Left Panel';
      leftSection.el.dataset.titleVisible = 'true';
      const titleEl = leftSection.el.querySelector('.section-title');
      if (titleEl) {
        titleEl.textContent = 'Left Panel';
        titleEl.hidden = false;
      }
      leftSection.el.dataset.locked = 'true';
      leftChildren.appendChild(leftSection.el);
    }

    const rightSection = window.componentFactory?.create('container', 'section');
    if (rightSection) {
      rightSection.updateName('Right Panel');
      rightSection.el.dataset.title = 'Right Panel';
      rightSection.el.dataset.titleVisible = 'true';
      const titleEl = rightSection.el.querySelector('.section-title');
      if (titleEl) {
        titleEl.textContent = 'Right Panel';
        titleEl.hidden = false;
      }
      rightSection.el.dataset.locked = 'true';
      rightChildren.appendChild(rightSection.el);
    }

    const onPointerDown = (e) => {
      e.preventDefault();
      divider.setPointerCapture?.(e.pointerId);
      divider.classList.add('dragging');

      const startX = e.clientX;
      const wrapperRect = wrapper.getBoundingClientRect();
      const startLeft = leftPanel.getBoundingClientRect().width;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const newLeft = startLeft + dx;
        const min = wrapperRect.width * 0.15;
        const max = wrapperRect.width * 0.85;
        const clamped = Math.min(max, Math.max(min, newLeft));
        const percent = (clamped / wrapperRect.width) * 100;
        leftPanel.style.flex = `0 0 ${percent}%`;
        rightPanel.style.flex = '1 1 0';
        
        // Update handle position
        const dividerRect = divider.getBoundingClientRect();
        const relativeY = ev.clientY - dividerRect.top;
        divider.style.setProperty('--handle-y', `${relativeY}px`);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        divider.classList.remove('dragging');
      };

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    const onMouseMove = (e) => {
      const dividerRect = divider.getBoundingClientRect();
      const relativeY = e.clientY - dividerRect.top;
      divider.style.setProperty('--handle-y', `${relativeY}px`);
    };

    divider.addEventListener('pointerdown', onPointerDown);
    divider.addEventListener('mousemove', onMouseMove);

      wrapper.appendChild(leftPanel);
      wrapper.appendChild(divider);
      wrapper.appendChild(rightPanel);
      return wrapper;
    }
  }
  window.Splitter = Splitter;
}
