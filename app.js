// const marvel = {
//     render: () => {
//       const urlAPI = 'https://gateway.marvel.com:443/v1/public/characters?ts=1&apikey=66871a4efa9fb001fd69fe57f6b84ffc&hash=3d44a2a8f21791dc555a103aa393bb57';
   
//       const container = document.querySelector('#marvel-row');
//       let contentHTML = '';
  
//       fetch(urlAPI)
//         .then(res => res.json()) 
//         .then((json) => {
//           for (const hero of json.data.results) {
//             let urlHero = hero.urls[1].url;
//             contentHTML += `
//               <div class="col-md-4">
//                   <a href="${urlHero}" target="_blank">
//                     <img src="${hero.thumbnail.path}.${hero.thumbnail.extension}" alt="${hero.name}" class="img-thumbnail">
//                   </a>
//                   <h3 class="title">${hero.name}</h3>
//               </div>`;
//           }
//           container.innerHTML = contentHTML;
//         })
//     }
//   };
//   marvel.render();
const marvel = {
  selectedHeroes: new Set(),
  render: function() {
      const urlAPI = 'https://gateway.marvel.com:443/v1/public/characters?ts=1&100&apikey=66871a4efa9fb001fd69fe57f6b84ffc&hash=3d44a2a8f21791dc555a103aa393bb57';
      const container = document.querySelector('#marvel-row');
      let contentHTML = '';

      fetch(urlAPI)
          .then(res => res.json()) 
          .then((json) => {
            for (const hero of json.data.results) {
              let urlHero = hero.urls[1].url;
              contentHTML += `
    <div class="col-md-4 hero" data-id="${hero.id}" data-price="100">
        <input type="checkbox" class="hero-checkbox" id="checkbox-${hero.id}">
        <label for="checkbox-${hero.id}">
            <a href="${urlHero}" target="_blank">
                <img src="${hero.thumbnail.path}.${hero.thumbnail.extension}" alt="${hero.name}" class="img-thumbnail">
            </a>
            <h3 class="title">${hero.name}</h3>
          
        </label>
        <span>Precio: $100</span> 
        </div>`;
          }
              container.innerHTML = contentHTML;
              this.addClickListeners();
          })
  },
  addClickListeners: function() {
    const heroes = document.querySelectorAll('.hero');
    heroes.forEach(hero => {
        const checkbox = hero.querySelector('.hero-checkbox');
        checkbox.addEventListener('change', () => {
            const heroId = hero.getAttribute('data-id');
            if (checkbox.checked) {
                this.selectedHeroes.add(heroId);
                hero.classList.add('selected');
            } else {
                this.selectedHeroes.delete(heroId);
                hero.classList.remove('selected');
            }
          
            this.updateCounter();
              this.updateTotal();
        });
        
    });
},

  updateCounter: function() {
      const counter = document.querySelector('#contador');
      counter.textContent = `Personajes seleccionados: ${this.selectedHeroes.size}`;
  },

  saveSelection: function() {
    const selectedHeroes = Array.from(this.selectedHeroes);
    sessionStorage.setItem('selectedHeroes', JSON.stringify(selectedHeroes));
},

// Función para cargar la selección desde sessionStorage
loadSelection: function() {
 
 
  //  const savedHeroes = JSON.parse(sessionStorage.getItem('selectedHeroes'));
  const savedHeroes = JSON.parse(sessionStorage.getItem('selectedHeroes'));
  if (savedHeroes && savedHeroes.length > 0) {
      savedHeroes.forEach(heroId => {
          const heroElement = document.querySelector(`.hero[data-id="${heroId}"]`);
          if (heroElement) {
              const checkbox = heroElement.querySelector('.hero-checkbox');
              checkbox.checked = true;
              this.selectedHeroes.add(heroId);
              heroElement.classList.add('selected');
          }
      });
      this.updateCounter();
    }
  

},
updateTotal: function() {
  let total = 0;
  this.selectedHeroes.forEach(heroId => {
      const heroElement = document.querySelector(`.hero[data-id="${heroId}"]`);
      if (heroElement) {
          const price = parseInt(heroElement.getAttribute('data-price'), 10);
          if (!isNaN(price)) {
              total += price;
          }
      }
  });
  document.querySelector('#totalCarrito').textContent = `Total del Carrito: $${total}`;
},


  // Inicialización
  init: function() {
    this.render();
    this.loadSelection();
    document.querySelector('#saveSelection').addEventListener('click', () => this.saveSelection());
    document.querySelector('#loadSelection').addEventListener('click', () => this.loadSelection());
}
};

app.get('/data', async (req, res) => {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM usuarios');
        connection.end();

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener los datos');
    }
});



//marvel.render();
marvel.init();
