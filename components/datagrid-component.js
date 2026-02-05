class DatagridComponent extends NodeComponent {
  constructor() { super('component', 'datagrid', 'Datagrid'); }
  render() {
    const wrapper = document.createElement('div');
    wrapper.className = 'datagrid-wrapper';

    const title = document.createElement('div');
    title.className = 'datagrid-title';
    title.textContent = this.name;
    wrapper.appendChild(title);

    const table = document.createElement('table');
    table.className = 'datagrid-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const thSelect = document.createElement('th');
    thSelect.className = 'dg-select-col';
    const selectAllCb = document.createElement('input');
    selectAllCb.type = 'checkbox';
    selectAllCb.className = 'dg-select-all';
    selectAllCb.setAttribute('aria-label', 'Select all');
    selectAllCb.disabled = true;
    thSelect.appendChild(selectAllCb);
    headerRow.appendChild(thSelect);

    const cols = ['ID','First Name','Last Name','Address','Status'];
    cols.forEach(c => {
      const th = document.createElement('th');
      th.textContent = c;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const statuses = ['new','active','paused','blocked','draft','done','hold','archived'];
    const firstNames = ['John','Anna','Michael','Emily','David','Sophia','James','Olivia','Robert','Ava','William','Mia','Daniel','Isabella','Matthew','Charlotte','Joseph','Amelia','Henry','Harper'];
    const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Miller','Davis','Garcia','Rodriguez','Wilson','Martinez','Anderson','Taylor','Thomas','Moore','Jackson','Martin','Lee','Perez','Thompson'];
    const streetNames = ['Oak','Maple','Pine','Cedar','Elm','Washington','Lake','Hill','Sunset','Riverside','Highland','Forest','Meadow','View','Lincoln','Franklin','Adams','Jefferson','Madison','Monroe'];
    const streetTypes = ['St','Ave','Blvd','Rd','Ln','Dr','Ct','Pl','Way'];
    const cities = ['Springfield','Riverton','Fairview','Franklin','Greenville','Bristol','Clinton','Centerville','Georgetown','Salem','Madison','Oxford'];
    const states = ['CA','NY','TX','FL','IL','PA','OH','GA','NC','MI','AZ','WA','MA','TN','IN','MO','MD','WI','CO','MN'];

    const usedIds = new Set();
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const rand8DigitId = () => {
      let n;
      do { n = Math.floor(Math.random() * 90000000) + 10000000; } while (usedIds.has(n));
      usedIds.add(n);
      return String(n);
    };
    const randZip = () => String(Math.floor(Math.random() * 90000) + 10000);
    const randAddress = () => {
      const num = Math.floor(Math.random() * 9900) + 100;
      const street = `${pick(streetNames)} ${pick(streetTypes)}`;
      const city = pick(cities);
      const state = pick(states);
      const zip = randZip();
      return `${num} ${street}, ${city}, ${state} ${zip}`;
    };

    for(let i=0;i<8;i++){
      const tr = document.createElement('tr');

      const tdSelect = document.createElement('td');
      tdSelect.className = 'dg-select-col';
      const rowCb = document.createElement('input');
      rowCb.type = 'checkbox';
      rowCb.className = 'dg-select';
      rowCb.setAttribute('aria-label', 'Select row');
      rowCb.disabled = true;
      tdSelect.appendChild(rowCb);
      tr.appendChild(tdSelect);

      const id = rand8DigitId();
      const first = pick(firstNames);
      const last = pick(lastNames);
      const addr = randAddress();
      const stat = pick(statuses);
      [id, first, last, addr, stat].forEach(v=>{
        const td = document.createElement('td');
        td.textContent = v;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
  }
}
