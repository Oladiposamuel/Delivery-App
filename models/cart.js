const mongodb = require('mongodb');
const {getDb} = require('../util/database');

class Cart {
    constructor(customerId) {
        this.products = [];
        this.customerId = customerId;
    }

    save() {
        const db = getDb();
        return db.collection('cart').insertOne(this)
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updateCart(id, prodId) {
        const db = getDb();
        return db.collection('cart').findOne({_id: id})
        .then(customerCart => {
            let isEqual;
            let productIndex;

            customerCart.products.map((product, index) => {
                if ( product.prodId.toString() === prodId.toString() ) {
                    console.log(product);
                    isEqual = true;
                    productIndex = index;
                }
            }) 

            console.log(isEqual);
            console.log(productIndex);

            if (isEqual === true) {
                const newQuantity = customerCart.products[productIndex].quantity += 1;
                return db.collection('cart').updateOne({_id: id, "products.prodId": prodId}, {$set: {"products.$.quantity": newQuantity}})
            } else {
                customerCart.products.push({prodId: prodId, quantity: +1});
                console.log(customerCart);
                return db.collection('cart').updateOne({_id: id}, {$set: {products: customerCart.products}})
            }   
        })
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updateCartDec (id, prodId) {
        const db = getDb();
        return db.collection('cart').findOne({_id: id})
        .then(customerCart => {
            let isEqual;
            let productIndex;

            customerCart.products.map((product, index) => {
                if ( product.prodId.toString() === prodId.toString() ) {
                    console.log(product);
                    isEqual = true;
                    productIndex = index;
                }
            }) 

            console.log(isEqual);
            console.log(productIndex);

            if (isEqual === true) {
                const newQuantity = customerCart.products[productIndex].quantity -= 1;
                return db.collection('cart').updateOne({_id: id, "products.prodId": prodId}, {$set: {"products.$.quantity": newQuantity}})
            }
        })
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findByCustomerId (id) {
        const db = getDb();
        return db.collection('cart').findOne({customerId: id })
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findById (id) {
        const db = getDb();
        return db.collection('cart').findOne({_id: id})
        .then(cart => {
            return cart;
        })
        .catch(error => {
            console.log(error);
        })
    }
}

module.exports = Cart;