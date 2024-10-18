const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Charge les variables d'environnement
const User = require("./models/User");
const Lobby = require("./models/Lobby");
const { getMessageById } = require("./models/Post");
const Post = require("./models/Post");

const router = express.Router();

// Route d'inscription (POST /register)
router.post("/register", async (req, res) => {
  const { email, username, password } = req.body;
  console.log(req.body);

  if (!email || !username || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    User.createUser(email, username, password);
    res.status(201).json({ message: "Successfully registered" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Route de connexion (POST /login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await User.getUserbyEmail(email, password);
    if (user === 2) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user === 0) {
      res.status(200).json({ message: "Login successful" });
    } else {
      res.status(401).json({ error: "Incorrect password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

//Route to create a lobby 
router.get('/lobby', authToken, async (req, res) => {
  Lobby.createLobby(req)
  res.status(200).json({ message: "Lobby created" });
})
// Route to get all messages by if (GET /lobby)
router.get("/lobby/:lobby_id", async (req, res,next) =>{
  try {
    const {lobby_id} = req.params
    const messages = await Lobby.getLobbyMessagesById(lobby_id)
    res.json(messages)
  }catch(error){
    console.error("Error fetching lobby messages:", error);
    res.status(500).json({ error: "An error occurred while fetching lobby messages" });
  }
  
})

// Route to get a specific message from a lobby
router.get("/lobby/:lobby_id/:post_id", async (req, res, next) => {
  try {
    const { post_id } = req.params;
    const message = await Post.getMessageById(post_id);

    // Vérifier si le message existe
    if (message) {
      res.json(message);
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  } catch (error) {
    console.error("Error fetching lobby message:", error);
    res.status(500).json({ error: "An error occurred while fetching the message" });
  }
});
module.exports = router;
