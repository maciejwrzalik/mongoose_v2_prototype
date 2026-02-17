if (!window.RadioGroupComponent) {
  class RadioGroupComponent extends NodeComponent {
    constructor() { super('component', 'radiogroup', 'Radio Group'); }
    render() {
      const labels = ['Poland','United States','Nederlands','Republic of South Africa','United Kingdom','Sweden','Germany','Norway'];
      const wrapper = document.createElement('div');
      wrapper.className = 'radio-group-wrapper';
      
      // Label (styled to match input label)
      const label = document.createElement('label');
      label.className = 'comp-label';
      label.textContent = this.name;
      wrapper.appendChild(label);

      // Options container (vertical layout)
      const options = document.createElement('div');
      options.className = 'radio-group-options';
      for (let i = 1; i <= 4; i++) {
        const opt = document.createElement('label');
        opt.className = 'radio-group-option';
        const rb = document.createElement('input');
        rb.type = 'radio';
        rb.name = this.id;
        rb.className = 'comp-body';
        const text = document.createElement('span');
        text.textContent = `${labels[i]}`;
        opt.appendChild(rb);
        opt.appendChild(text);
        options.appendChild(opt);
      }
      wrapper.appendChild(options);
      return wrapper;
    }
  }
  window.RadioGroupComponent = RadioGroupComponent;
}
