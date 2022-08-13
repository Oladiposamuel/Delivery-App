const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv').config();

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect(process.env.MONGO)
    .then(client => {
        console.log('Connected to MongoDB');
        _db = client.db();
        callback();
    })
    .catch(error => {
        console.log(error);
        throw error;
    })
}

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No database found';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;