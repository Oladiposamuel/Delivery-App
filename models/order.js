const mongodb = require('mongodb');
const {getDb} = require('../util/database');

class Order {
    constructor(customerId, totalPrice, products) {
        this.products = products;
        this.customerId = customerId;
        this.totalPrice = totalPrice;
        this.isProcessed = false;
        this.dateAdded = new Date();
    }

    save() {
        const db = getDb();
        return db.collection('order').insertOne(this)
        .then(order => {
            return order;
        })
        .catch (error => {
            console.log(error);
        })
    }
}

module.exports = Order;