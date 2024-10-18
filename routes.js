const express = require('express');
const bcrypt = require('bcrypt');
const mariadb = require('mariadb');
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); // Charge les variables d'environnement


const router = express.Router();

// Fonction pour initialiser la connexion à la base de données
async function initializeDB() {
    try {
        const db = await mariadb.createConnection({
            host: 'localhost',
            user: process.env.USER_DB,
            password: process.env.PASSWORD_DB,
            database: 'lokkeroom'
        });
        return db; // Retourne l'objet de connexion
    } catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
}

// Route d'inscription (POST /register)
router.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    console.log(req.body)

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = await initializeDB();
        const hashPassword = await bcrypt.hash(password, 10);

        await db.query('INSERT INTO users (mail, username, password, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', 
            [email, username, hashPassword]);

        console.log('User successfully registered');
        db.end(); // Ferme la connexion

        res.status(201).json({ message: 'Successfully registered' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Route de connexion (POST /login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = await initializeDB();
        const rows = await db.query('SELECT password FROM users WHERE mail = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashPassword = rows[0].password; // Récupère le mot de passe haché de la BDD
        const isMatch = await bcrypt.compare(password, hashPassword); // Compare les mots de passe

        if (isMatch) {
            console.log('Successful login');
            res.status(200).json({ message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Incorrect password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;