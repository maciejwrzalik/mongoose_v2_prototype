class Card extends NodeComponent {
  constructor() { super('container', 'card'); }
  render() {
    const el = super.render();
    el.classList.add('node', 'container-node', 'card-node');
    el.dataset.title = 'Card';
    el.innerHTML = `<div class="label">${el.dataset.title}</div><div class="children"></div>`;
    return el;
  }
}
