if (!window.ButtonComponent) {
  class ButtonComponent extends NodeComponent {
    constructor() { super('component', 'button', 'Button'); }
    render() {
      const btn = document.createElement('button');
      btn.className = 'comp-body';
      btn.textContent = this.name;
      return btn;
    }
  }
  window.ButtonComponent = ButtonComponent;
}
