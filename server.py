from flask import Flask, request, jsonify, render_template
import sqlite3
import os
import json

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['DATABASE'] = 'all_lists.db'  # путь к базе данных

# подключение к бд 
def get_db():
    db = sqlite3.connect(app.config['DATABASE'])
    db.row_factory = sqlite3.Row  # возвращает данные в виде словаря
    return db

# API для корзины
@app.route('/cart.json') #открытие файла корзины
def get_cart():
    if not os.path.exists('cart.json'):
        return jsonify([])  # пустая корзина, если файла нет
    with open('cart.json', 'r') as f:
        return f.read()  # отправка содержимого файла

@app.route('/api/add-to-cart', methods=['POST']) #добавление товара
def add_to_cart():
    new_item = request.json  # получение товара из запроса
    cart = []

    if os.path.exists('cart.json'):
        with open('cart.json', 'r') as f:
            cart = json.load(f)  # загрузка текущей корзины

    cart.append(new_item)  # новый товар
    with open('cart.json', 'w') as f:
        json.dump(cart, f)  # сохранение обновлённой корзины

    return jsonify({"status": "ok", "added": new_item})

@app.route('/api/remove-from-cart', methods=['POST']) #удаление товара 
def remove_from_cart():
    index = request.json.get('index')  # получение индекса товара
    if not os.path.exists('cart.json'):
        return jsonify({"error": "Корзина пуста"}), 404

    with open('cart.json', 'r') as f:
        cart = json.load(f)  # загрузка корзины

    if index < 0 or index >= len(cart):
        return jsonify({"error": "Неверный индекс"}), 400

    removed_item = cart.pop(index)  # удаление товара
    with open('cart.json', 'w') as f:
        json.dump(cart, f)  # сохранение изменений

    return jsonify({"status": "deleted", "item": removed_item})


# API для заказов
@app.route('/api/place-order', methods=['POST']) #создание заказа
def place_order():
    data = request.json  # данные
    required_fields = ['name', 'email', 'address', 'items', 'total']
    
    # проверка, все ли поля заполнены
    if not all(field in data for field in required_fields):
        return jsonify({"success": False, "message": "Не все поля заполнены"}), 400

    # проверка, есть ли товары в заказе
    if not data['items']:
        return jsonify({"success": False, "message": "Нет товаров в заказе"}), 400

    try:
        db = get_db()
        cursor = db.cursor()

        # 1. создание заказа
        cursor.execute(
            "INSERT INTO orders (cust_name, cust_email, cust_adr, total) VALUES (?, ?, ?, ?)",
            (data['name'], data['email'], data['address'], data['total'])
        )
        order_id = cursor.lastrowid  # ID нового заказа

        # 2. добавление товаров в заказ
        for item in data['items']:
            # проверка на наличие товара
            product = cursor.execute(
                "SELECT size_id, quant FROM products WHERE pr_id = ? AND r_size = ?",
                (item['productId'], item['size'])
            ).fetchone()

            if not product:
                db.rollback()  # отмена изменений
                return jsonify({"success": False, "message": f"Товар {item['name']} (размер {item['size']}) не найден"}), 404

            if product['quant'] < 1: #проверка кол-ва
                db.rollback()
                return jsonify({"success": False, "message": f"Товар {item['name']} (размер {item['size']}) закончился"}), 400

            # добавление товара в заказ
            cursor.execute(
                "INSERT INTO order_items (order_id, pr_id, size_id, quant, price_at_order) VALUES (?, ?, ?, ?, ?)",
                (order_id, item['productId'], product['size_id'], 1, item['price'])
            )

            # уменьшение кол-ва на складе
            cursor.execute(
                "UPDATE products SET quant = quant - 1 WHERE size_id = ?",
                (product['size_id'],)
            )

        db.commit()  # сохранение
        return jsonify({"success": True, "order_id": order_id})

    except Exception as e:
        db.rollback()  #отмена изменений при ошибке
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        db.close()  # закрываем соединение

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/cart')
def cart():
    return render_template('cart.html')

@app.route('/item')
def buy():
    return render_template('buypage.html')

@app.route('/about')
def profile():
    return render_template('profile.html')


# запуск сервера
if __name__ == '__main__':
    app.run(port=3000)  # запуск сервера на порту 3000