const initializeDB = require('./lokkeroom_db')
const mariadb = require('mariadb');
require("dotenv").config();

async function connectToDB() { // Créer la connexion à la base de données
    try {
        db = await mariadb.createConnection({
            host: 'localhost',
            port: '3306',
            user: process.env.USER_DB,
            password: process.env.PASSWORD_DB,
            database: 'lokkeroom',
        });
        console.log('[Lokkeroom-Database] : Connected to the database.');
    } catch (err) {
        console.log('[Lokkeroom-Database] : Connection failed.', err);
    }
}

async function start() {
    await initializeDB();
    await connectToDB();
};

start();