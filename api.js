const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes.js'); // Import renaming to avoid conflicts
const mariadb = require('mariadb');
require("dotenv").config();
const initializeDB = require('./lokkeroom_db');

const app = express();

// Middleware pour parser le corps des requêtes en JSON
app.use(bodyParser.json());

// Utilisation des routes pour l'authentification
app.use('/auth', authRoutes); // Utiliser authRoutes au lieu de router
app.use('/login', authRoutes);
app.use('/register', authRoutes);
app.use('/lobby',authRoutes)

app.get('/test', (req, res) => {
    res.send("OK");
});

// Connexion à la base de données MariaDB
async function connectToDB() { 
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

// Fonction pour démarrer la base de données et le serveur
async function start() {
    await initializeDB();  // Initialiser la base de données
    await connectToDB();   // Connexion à la base de données

    // Démarrer le serveur après l'initialisation de la DB
    app.listen(3000, () => {
        console.log(`Server running on http://localhost:3000`);
    });
}

start();
