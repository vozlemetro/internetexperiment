
let currentPage = 0;
const itemsPerPage = 3;
let cartItems = [];

// добавление товара в корзину
function setupAddToCart() {

    const addButton = document.getElementById('buttonBuy');
    if (!addButton) return;
  
    // обработчик клика на кнопку "Купить"
    addButton.addEventListener('click', () => {
      const selectedSize = document.querySelector('input[name="radio"]:checked').value;
  
      // данные товара
      const productData = {
        productId: 'dragonborn-jacket', // придумать логику получения
        name: document.querySelector('.itemname').textContent, 
        size: selectedSize, 
        price: parseInt(document.querySelector('.itemprice').textContent) 
      };
  
      // отправка данных на сервер
      fetch('/api/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      .then(response => response.json())
      .then(data => {
        alert(`Товар добавлен в корзину! Размер: ${selectedSize}`);
      })
      .catch(error => {
        console.error('Ошибка:', error);
        alert('Не удалось добавить товар');
      });
    });
  }
  
  // обновлление при загрузке страницы
  document.addEventListener('DOMContentLoaded', () => {
    setupAddToCart(); // добавление обработчика для кнопки "Купить"
    loadCart(); // загрузка корзины 
    setupEventListeners(); // остальные обработчики
  });

  //при загрузке корзины
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    setupEventListeners();
});
                           
//загрузка корзины с сервера
function loadCart() {
    fetch('/cart.json') //запрос
        .then(response => {
            if (!response.ok) throw new Error('Ошибка загрузки корзины');
            return response.json();
        })
        .then(data => {
            cartItems = data;
            renderCartItems();
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить корзину');
        });
}

//отображение товаров
function renderCartItems() {
    const startIdx = currentPage * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const itemsToShow = cartItems.slice(startIdx, endIdx);

    document.querySelectorAll('.binitem').forEach(item => {
        item.style.display = 'none';
    });

    //заполнение блоков данными
    itemsToShow.forEach((item, idx) => {
        const binItem = document.querySelectorAll('.binitem')[idx];
        if (!binItem) return;

        binItem.style.display = 'flex';
        binItem.querySelector('.binh1').textContent = item.name;
        binItem.querySelector('.binh2').textContent = `${item.price} rub.`;
        binItem.querySelector('.binsize').textContent = `SIZE: ${item.size}`;

        
        const deleteBtn = binItem.querySelector('.cancelbutton');
        deleteBtn.onclick = () => removeItem(startIdx + idx);
    });

}

// удаление предмета
function removeItem(index) {
    fetch('/api/remove-from-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
    })
    .then(response => response.json())
    .then(() => loadCart())
    .catch(error => {
        console.error('Ошибка удаления:', error);
        alert('Не удалось удалить товар');
    });
}

// функции заказа
function showOrderForm() {

    document.getElementById('orderForm').addEventListener('submit', (e) => {
        e.preventDefault();
        placeOrder();
    });

    
    document.getElementById('close-popup').addEventListener('click', () => {
        orderPopup.style.display = 'none';
    });
}

// отправка заказа в бэк
function placeOrder() {
    const form = document.getElementById('orderForm');
    const formData = new FormData(form);

    const orderData = {
        name: formData.get('name'),
        email: formData.get('email'),
        address: formData.get('address'),
        items: cartItems,
        total: cartItems.reduce((sum, item) => sum + item.price, 0)
    };

    fetch('/api/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Заказ оформлен! Номер заказа: ' + data.order_id);
            fetch('/api/clear-cart', { method: 'POST' })
                .then(() => {
                    document.getElementById('order').style.display = 'none';
                    loadCart();
                });
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка при оформлении заказа');
    });
}

// функционал кнопок заказать, следующие и предыдущие предметы
function setupEventListeners() {
    
    document.querySelector('.nextitem').addEventListener('click', () => {
        currentPage++;
        renderCartItems();
    });

    document.querySelector('.previtem').addEventListener('click', () => {
        currentPage--;
        renderCartItems();
    });


    
    document.getElementById('orderon').addEventListener('click', showOrderForm);
}