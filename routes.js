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
        const rows = await db.query('SELECT * FROM users WHERE mail = ?', [email]);
        console.log("Rows returned from database:", rows);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = rows[0];
        console.log("User object from database:", user); 
        const hashPassword = user.password; // Récupère le mot de passe haché de la BDD
        const isMatch = await bcrypt.compare(password, hashPassword); // Compare mdp

        if (isMatch) { // token JWT -> username user
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
            //console.log("Generated token:", token); 
        
            res.status(200).json({ message: 'Login successful', token });
        } else {
            res.status(401).json({ error: 'Incorrect password' });
        }
    } catch (error) {
            res.status(500).json({ error: 'Login failed' });
    }});

    //Middelware pour routes sécuriser->protéger
    function authToken(req, res, next) {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
            return res.status(403).json({ error: 'No token provided.' });
        }
    
        const token = authHeader.split(' ')[1]; // Récupère le token après "Bearer"
        if (!token) {
            console.log("Auth header:", authHeader);
            return res.status(403).json({ error: 'Malformed token' });
        }
    
        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
            if (err) {
                console.log("Token verification error:", err); 
                return res.status(403).json({ error: 'Invalid token' });
            }    
            req.user = user; 
            next();
        });
    }
    
    router.get('/id', authToken, (req, res) => {
        res.status(200).json({ message: `Welcome, user ${req.user.username}`});
    });

module.exports = router;