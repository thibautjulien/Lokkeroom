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

        await checkTableUsers(db);
        await checkTablePosts(db);
        await checkTableAccess(db);
        await checkTableLobbies(db);
        await addForeignKeys(db);
    } catch (err) {
        console.error(err);
    } finally {
        if (db) await db.close();
    }
}

async function checkTableUsers(db) {
    try {

        const tableExists = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'lokkeroom'`);
    
        if (tableExists.length > 0) {
            console.log('[Lokkeroom-Database] : Table "users" already exists.');
        } else {
            console.log('[Lokkeroom-Database] : Table "users" does not exist. Creation in progress..');
    
            // Create the table "users"
            await db.query(`
                CREATE TABLE users
                (id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(20) NOT NULL,
                mail VARCHAR(35) NOT NULL,
                password VARCHAR(255) NOT NULL,
                statut ENUM('member', 'admin') DEFAULT 'member');`);
    
            console.log('[Lokkeroom-Database] : The table "users" was successfully created.');
        }

    } catch (err) {
        console.log(err);
    }
}

async function checkTablePosts(db) {
    try {

        const tableExists = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'posts' AND table_schema = 'lokkeroom'`);
    
        if (tableExists.length > 0) {
            console.log('[Lokkeroom-Database] : Table "posts" already exists.');
        } else {
            console.log('[Lokkeroom-Database] : Table "posts" does not exist. Creation in progress..');
    
            // Create the table "posts"
            await db.query(`
                CREATE TABLE posts
                (id INT PRIMARY KEY AUTO_INCREMENT,
                content TEXT NOT NULL,
                user_id INT NOT NULL,
                lobby_id INT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL);`);
    
            console.log('[Lokkeroom-Database] : The table "posts" was successfully created.');
        }

    } catch (err) {
        console.log(err);
    }
}

async function checkTableAccess(db) {
    try {

        const tableExists = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'access' AND table_schema = 'lokkeroom'`);
    
        if (tableExists.length > 0) {
            console.log('[Lokkeroom-Database] : Table "access" already exists.');
        } else {
            console.log('[Lokkeroom-Database] : Table "access" does not exist. Creation in progress..');
    
            // Create the table "access"
            await db.query(`
                CREATE TABLE access
                (id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                lobby_id INT NOT NULL);`);
    
            console.log('[Lokkeroom-Database] : The table "access" was successfully created.');
        }

    } catch (err) {
        console.log(err);
    }
}

async function checkTableLobbies(db) {
    try {

        const tableExists = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'lobbies' AND table_schema = 'lokkeroom'`);
    
        if (tableExists.length > 0) {
            console.log('[Lokkeroom-Database] : Table "lobbies" already exists.');
        } else {
            console.log('[Lokkeroom-Database] : Table "lobbies" does not exist. Creation in progress..');
    
            // Create the table "lobbies"
            await db.query(`
                CREATE TABLE lobbies
                (id INT PRIMARY KEY AUTO_INCREMENT,
                admin_id INT NOT NULL, 
                message TEXT NOT NULL);`);
    
            console.log('[Lokkeroom-Database] : The table "lobbies" was successfully created.');
        }

    } catch (err) {
        console.log(err);
    }
}

async function addForeignKeys(db) {
    try {

        await db.query(`ALTER TABLE posts ADD FOREIGN KEY (user_id) REFERENCES users (id);`);
        await db.query(`ALTER TABLE access ADD FOREIGN KEY (user_id) REFERENCES users (id);`);
        await db.query(`ALTER TABLE lobbies ADD FOREIGN KEY (admin_id) REFERENCES users (id);`);
        await db.query(`ALTER TABLE posts ADD FOREIGN KEY (lobby_id) REFERENCES lobbies (id);`);
        await db.query(`ALTER TABLE access ADD FOREIGN KEY (lobby_id) REFERENCES lobbies (id);`);

    } catch (err) {
        console.log(err);
    }
}

module.exports = initializeDB;