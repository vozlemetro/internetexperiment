const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// 1. Отдаём HTML, CSS, JS, картинки — всё из текущей папки
app.use(express.static('.'));

// 2. Даём Express читать JSON-тела (например, { size: 'M' })
app.use(express.json());

// 3. Отдача корзины (GET /cart.json)
app.get('/cart.json', (req, res) => {
  if (!fs.existsSync('cart.json')) return res.json([]);
  const data = fs.readFileSync('cart.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

// 4. Добавить товар в корзину (POST /api/add-to-cart)
app.post('/api/add-to-cart', (req, res) => {
  const newItem = req.body;
  let cart = [];

  if (fs.existsSync('cart.json')) {
    cart = JSON.parse(fs.readFileSync('cart.json'));
  }

  cart.push(newItem);
  fs.writeFileSync('cart.json', JSON.stringify(cart, null, 2));

  res.json({ status: 'ok', added: newItem });
});

// 5. Удалить товар по индексу (POST /api/remove-from-cart)
app.post('/api/remove-from-cart', (req, res) => {
  const { index } = req.body;

  if (!fs.existsSync('cart.json')) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  const cart = JSON.parse(fs.readFileSync('cart.json'));
  if (index < 0 || index >= cart.length) {
    return res.status(400).json({ error: 'Invalid index' });
  }

  cart.splice(index, 1);
  fs.writeFileSync('cart.json', JSON.stringify(cart, null, 2));

  res.json({ status: 'deleted', index });
});

// 6. Запускаем сервер
app.listen(PORT, () => {
  console.log(`🔥 Сервер запущен: http://localhost:${PORT}`);
});
