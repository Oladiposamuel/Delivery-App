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
            //console.log(order);
            return db.collection('order').findOne({_id: order.insertedId})
            .then(orderDetails => {
                return orderDetails;
            })
        })
        .catch (error => {
            console.log(error);
        })
    }

    static findById(id) {
        const db = getDb();
        return db.collection('order').findOne({_id: id})
        .then(order => {
            return order;
        })
        .catch(error => {
            console.log(error);
        })
    }
}

module.exports = Order;