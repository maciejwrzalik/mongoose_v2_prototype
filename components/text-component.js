if (!window.TextComponent) {
  class TextComponent extends NodeComponent {
    constructor() { super('component', 'text', 'Text'); }
    render() {
      const span = document.createElement('span');
      span.className = 'comp-body';
      span.textContent = 'Sample text';
      return span;
    }
  }
  window.TextComponent = TextComponent;
}
