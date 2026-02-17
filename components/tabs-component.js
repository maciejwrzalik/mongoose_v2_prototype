if (!window.TabsComponent) {
  class TabsComponent extends NodeComponent {
    constructor() { super('component', 'tabs', 'Tabs'); }
    render() {
      const wrapper = document.createElement('div');
      wrapper.className = 'tabs';
      const list = document.createElement('ul');
      list.className = 'tab-list';
      const labels = ['Users', 'Addresses', 'Orders', 'Products'];
      labels.forEach((txt, i) => {
        const li = document.createElement('li');
        li.className = 'tab-item' + (i === 0 ? ' active' : '');
        li.textContent = txt;
        list.appendChild(li);
      });
      wrapper.appendChild(list);
      return wrapper;
    }
  }
  window.TabsComponent = TabsComponent;
}
