const mongodb = require('mongodb');
const {getDb} = require('../util/database');

class Customer {
    constructor (firstName, lastName, email, password, phoneNumber, cartId) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.phoneNumber = phoneNumber;
        this.cartId = cartId;
        this.orders = [];
        this.isVerified = false;
    }

    save() {
        const db = getDb();
        return db.collection('customer').insertOne(this)
        .then(customer => {
            return customer;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findCustomer(email) {
        const db = getDb();
        return db.collection('customer').findOne({email: email})
        .then(customer => {
            return customer;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findCustomerById(id) {
        const db = getDb();
        return db.collection('customer').findOne({_id: id})
        .then(customer => {
            return customer;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updateCustomerVerification(id) {
        const db = getDb();
        return db.collection('customer').updateOne({_id: id},  {$set: {isVerified: true}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updatePassword(id, hashNewPassword) {
        const db = getDb();
        return db.collection('customer').updateOne({_id: id}, {$set: {password: hashNewPassword}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updateCartId (id, cartId) {
        const db = getDb();
        return db.collection('customer').updateOne({_id: id}, {$set: {cartId: cartId}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }
}

module.exports = Customer;