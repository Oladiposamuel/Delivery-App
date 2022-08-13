const mongodb = require('mongodb');
const {getDb} = require('../util/database');

class Category{
    constructor(name) {
        this.name = name;
    }

    save() {
        const db = getDb();
        return db.collection('category').insertOne(this)
        .then(category => {
            return category;
        })
        .catch(error => {
            console.log(error);
        })
    }

    static findCategory(name) {
        const db = getDb();
        return db.collection('category').findOne({name:{ "$regex" : name , "$options" : "i"}})
        .then(category => {
            return category;
        })
        .catch(error => {
            console.log(error);
        })
    }
}

module.exports = Category;