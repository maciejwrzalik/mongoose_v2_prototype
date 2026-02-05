class ListComponent extends NodeComponent {
  constructor() {
    super('component', 'list', 'List');
  }

  render() {
    const root = document.createElement('div');
    root.setAttribute('role', 'list');
    const products = ListComponent._generateProducts(8);
    products.forEach((p) => root.appendChild(ListComponent._renderItem(p)));
    return root;
  }

  static _renderItem(p) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.setAttribute('role', 'listitem');

    const img = document.createElement('img');
    img.className = 'list-thumb';
    img.width = 40;
    img.height = 40;
    img.alt = p.name;
    img.src = ListComponent._thumbFor(p.name);

    const content = document.createElement('div');
    content.className = 'list-content';

    const title = document.createElement('div');
    title.className = 'list-title';
    title.textContent = p.name;

    const sub = document.createElement('div');
    sub.className = 'list-sub';
    const line1 = document.createElement('div');
    line1.className = 'list-line';
    line1.textContent = `${p.category} • ${p.sku}`;
    const line2 = document.createElement('div');
    line2.className = 'list-line';
    line2.textContent = p.desc;

    sub.appendChild(line1);
    sub.appendChild(line2);
    content.appendChild(title);
    content.appendChild(sub);

    item.appendChild(img);
    item.appendChild(content);
    return item;
  }

  static _generateProducts(count = 8) {
    const names = [
      'Aurora Lamp','Nimbus Chair','Terra Pot','Flux Keyboard','Echo Speaker','Vertex Stand',
      'Polar Mug','Ion Bottle','Quill Pen','Atlas Backpack','Nova Watch','Orbit Charger',
      'Lumen Bulb','Drift Blanket','Pulse Headset','Prism Glass','Forge Pan','Aero Fan'
    ];
    const cats = ['Home', 'Office', 'Kitchen', 'Outdoor', 'Tech', 'Lifestyle'];
    const descs = [
      'In stock and ready to ship',
      'Limited edition release',
      'New arrival this week',
      'Bestseller in its category',
      'Sustainably sourced materials',
      'Ergonomic and lightweight',
      'Lifetime warranty included',
      'Premium build quality'
    ];
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const sku = () => 'SKU-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const takeUnique = (n) => {
      const pool = [...names];
      const out = [];
      for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      return out;
    };
    const pickedNames = takeUnique(count);
    return pickedNames.map((name) => ({
      name,
      category: rand(cats),
      sku: sku(),
      desc: rand(descs)
    }));
  }

  static _thumbFor(name) {
    const letter = (name || '?').charAt(0).toUpperCase();
    const colors = ['#2563EB','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];
    const bg = colors[letter.charCodeAt(0) % colors.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
      <rect width="40" height="40" rx="6" fill="${bg}"/>
      <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Inter, Arial, sans-serif"
            font-size="18" fill="#fff">${letter}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}
