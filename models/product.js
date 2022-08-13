const mongodb = require('mongodb');
const {getDb} = require('../util/database');

const ObjectId = mongodb.ObjectId;

class Product {

    constructor(image, title, price, description, quantity, category, adminId) {
        this.image = image;
        this.title = title;
        this.price = price;
        this.description = description;
        this.quantity = quantity;
        this.category = category;
        //this._id = _id ? new ObjectId(_id) : null;
        this.adminId = adminId;
    }

    save() {
        const db = getDb();
        return db.collection('product').insertOne(this)
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    edit(id) {
        const db = getDb();
        return db.collection('product').replaceOne({_id: id}, this)
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findProduct(title) {
        const db = getDb();
        return db.collection('product').findOne({title: title})
        .then(product => {
            return product;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findProductById(id) {
        const db = getDb();
        return db.collection('product').findOne({_id: id})
        .then(product => {
            return product;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static updateQuantity(quantity, title) {
        const db = getDb();
        return db.collection('product').updateOne({title: title}, {$set :{quantity: quantity}})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static deleteProduct(id) {
        const db = getDb();

        return db.collection('product').deleteOne({_id: id})
        .then(result => {
            return result;
        })
        .catch(error => {
            console.log(error);
        })
    }
}

module.exports = Product;