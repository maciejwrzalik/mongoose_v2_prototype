class HeaderComponent extends NodeComponent {
  constructor() { super('component', 'header', 'Header'); }
  render() {
    const wrapper = document.createElement('div');
    // Make it a drop-capable container
    wrapper.className = 'header node container-node';

    // Title (left)
    const title = document.createElement('h1');
    title.className = 'header-title';
    title.textContent = 'This Is Nice Page';

    // Actions container is the direct .buttons (right)
    const buttons = document.createElement('div');
    buttons.className = 'buttons'; // must be direct child for editor drop logic

    // Default buttons
    const btn1 = window.componentFactory.create('component', 'button');
    if (btn1) {
      btn1.el.textContent = 'Export';
      btn1.el.dataset.btnStyle = 'primary';
    }

    const btn2 = window.componentFactory.create('component', 'button');
    if (btn2) {
      btn2.el.textContent = 'Print';
      btn2.el.classList.add('btn-icon');
      btn2.el.dataset.btnStyle = 'icon';
      btn2.el.dataset.icon = 'print';
    }

    const btn3 = window.componentFactory.create('component', 'button');
    if (btn3) {
      btn3.el.textContent = 'More';
      btn3.el.classList.add('btn-icon');
      btn3.el.dataset.btnStyle = 'icon';
      btn3.el.dataset.icon = 'more';
    }

    if (btn1) buttons.appendChild(btn1.el);
    if (btn2) buttons.appendChild(btn2.el);
    if (btn3) buttons.appendChild(btn3.el);

    wrapper.appendChild(title);
    wrapper.appendChild(buttons);
    return wrapper;
  }
}
