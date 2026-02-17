if (!window.Form) {
  class Form extends NodeComponent {
    constructor() { super('container', 'form'); }
    render() {
      const el = super.render();
      el.classList.add('node', 'container-node', 'section-node');
      el.dataset.titleVisible = 'false';
      el.dataset.title = 'Form Title';
      el.dataset.cols = el.dataset.cols || '4';
      el.innerHTML = `<div class="section-title" hidden>Form Title</div><div class="children"></div>`;
      return el;
    }
  }
  window.Form = Form;
}
