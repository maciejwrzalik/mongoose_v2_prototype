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

    // Actions container is the direct .children (right)
    const children = document.createElement('div');
    children.className = 'children'; // must be direct child for editor drop logic

    // Default buttons
    const btn1 = new ButtonComponent();
    btn1.el.textContent = 'Export';
    btn1.el.classList.add('btn-tertiary');
    btn1.el.dataset.btnStyle = 'tertiary';

    const btn2 = new ButtonComponent();
    btn2.el.textContent = 'Action 2';
    btn2.el.classList.add('btn-icon');
    btn2.el.dataset.btnStyle = 'icon';

    children.appendChild(btn1.el);
    children.appendChild(btn2.el);

    wrapper.appendChild(title);
    wrapper.appendChild(children);
    return wrapper;
  }
}
