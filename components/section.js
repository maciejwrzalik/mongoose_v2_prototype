if (!window.Section) {
  class Section extends NodeComponent {
    constructor() { super('container', 'section'); }
    render() {
      const el = super.render();
      el.classList.add('node', 'container-node', 'section-node');
      el.dataset.titleVisible = 'false';
      el.dataset.title = 'Section Title';
      el.dataset.cols = el.dataset.cols || '4';
      el.innerHTML = `<div class="section-title" hidden>Section Title</div><div class="children"></div>`;
      return el;
    }
  }
  window.Section = Section;
}
