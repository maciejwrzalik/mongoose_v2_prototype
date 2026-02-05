class InputComponent extends NodeComponent {
  constructor() { super('component', 'input', 'Input'); }
  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';
    const label = document.createElement('label');
    label.className = 'comp-label';
    label.textContent = this.name;
    const input = document.createElement('input');
    input.className = 'comp-body';
    input.type = 'text';
    input.placeholder = 'Enter value';
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return wrapper;
  }
}
