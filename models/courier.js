const mongodb = require('mongodb');
const {getDb} = require('../util/database');

class Courier {
    constructor(firstName, lastName, email, password, orders) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.isVerified = false;
        this.orders = orders;
    }

    save() {
        const db = getDb();
        return db.collection('courier').insertOne(this)
        .then(courier => {
            return courier;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findCourier(email) {
        const db = getDb();
        return db.collection('courier').findOne({email: email})
        .then(courier => {
            return courier;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findCourierById(id) {
        const db = getDb();
        return db.collection('courier').findOne({_id: id})
        .then(courier => {
            return courier;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updateCourierVerification(id) {
        const db = getDb();
        return db.collection('courier').updateOne({_id: id},  {$set: {isVerified: true}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updatePassword(id, hashNewPassword) {
        const db = getDb();
        return db.collection('courier').updateOne({_id: id}, {$set: {password: hashNewPassword}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updateOrder(id, orders) {
        const db = getDb();
        return db.collection('courier').updateOne({_id: id}, {$set: {orders: orders}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

}

module.exports = Courier;