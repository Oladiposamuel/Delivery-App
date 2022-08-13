const mongodb = require('mongodb');
const {getDb} = require('../util/database');

class Admin{
    constructor(firstName, lastName, email, password) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.isVerified = false;
    }

    save() {
        const db = getDb();
        return db.collection('admin').insertOne(this)
        .then(admin => {
            return admin;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findAdmin(email) {
        const db = getDb();
        return db.collection('admin').findOne({email: email})
        .then(admin => {
            return admin;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findAdminById(id) {
        const db = getDb();
        return db.collection('admin').findOne({_id: id})
        .then(admin => {
            return admin;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updateAdminVerification(id) {
        const db = getDb();
        return db.collection('admin').updateOne({_id: id},  {$set: {isVerified: true}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updatePassword(id, hashNewPassword) {
        const db = getDb();
        return db.collection('admin').updateOne({_id: id}, {$set: {password: hashNewPassword}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }
}

module.exports = Admin;