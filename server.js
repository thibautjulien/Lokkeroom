const mariadb = require('mariadb');
require("dotenv").config();

let db;

async function initializeDB() {
    try {
        db = await mariadb.createConnection({
            host: 'localhost',
            port: '3306',
            user: process.env.USER_DB,
            password: process.env.PASSWORD_DB,
            database: 'lokkeroom'
        })
    } catch (err) {
        console.error(err);
    } finally {
        if (db) await db.close();
    }
}

module.exports = initializeDB;