const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

const ObjectId = mongodb.ObjectId;

class User {
    constructor(username, email, cart, id) {
        this.username = username;
        this.email = email;
        this.cart = cart;
        this._id = id;
    }

    save() {
        const db = getDb();
        db.collection('users').insertOne(this)  
    }

    addToCart(product) {
        const cartProductIndex = this.cart.items.findIndex(cp => {
            return cp.productId.toString() === product._id.toString();
        });
        let newQuantity = 1;
        const updatedacartItems = [...this.cart.items];

        if (cartProductIndex >= 0) {
            newQuantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedacartItems[cartProductIndex].quantity = newQuantity;
        } else {
            updatedacartItems.push({productId: new ObjectId(product._id), quantity: newQuantity});
        }
        const updatedCart = {
            items: updatedacartItems,
        };
        const db = getDb();
        return db
            .collection('users')
            .updateOne(
                {_id: new ObjectId(this._id)},
                {$set: { cart: updatedCart }}
            )
    }

    getCart() {
        const db = getDb();
        const productIds = this.cart.items.map(item => item.productId);
        return db
            .collection('products')
            .find({ _id: {
                $in: productIds,
            }})
            .toArray()
            .then(products => {
                return products.map(product => {
                    return {
                        ...product,
                        quantity: this.cart.items.find(item => {
                            return item.productId.toString() === product._id.toString()
                        }).quantity
                    }
                })
            })
    }

    static findById(userId) {
        const db = getDb();
        return db
          .collection('users')
          .findOne({ _id: new ObjectId(userId) })
          .then(user => {
            console.log(user);
            return user;
          })
          .catch(err => {
            console.log(err);
          });
    }

    deleteItemFromCart(productId) {
        const updatedcartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString();
        });
        const db = getDb();
        return db
            .collection('users')
            .updateOne(
                {_id: new ObjectId(this._id)},
                {$set: { cart : {items: updatedcartItems }}}
            )
    }

    addOrder() {
        const db = getDb();
        return this.getCart()
        .then(products => {
            const order = {
                items: products,
                user: {
                    _id: new ObjectId(this._id),
                    name: this.username,
                }
            };
            return db.collection('orders')
            .insertOne(order)
        })
        .then(result => {
            this.cart = {
                items: [],
            };
            return db
            .collection('users')
            .updateOne(
                {_id: new ObjectId(this._id)},
                {$set: { cart : {items: [] }}}
            )
        })
    }

    getOrders() {
        const db = getDb();
        return db
            .collection('orders')
            .find({'user._id': new ObjectId(this._id) })
            .toArray()
    }
}

module.exports = User;