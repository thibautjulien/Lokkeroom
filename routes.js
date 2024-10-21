const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Charge les variables d'environnement
const User = require("./models/User");
const Lobby = require("./models/Lobby");
const { getMessageById } = require("./models/Post");
const Post = require("./models/Post");
const Access = require("./models/Access");

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
      const token = await jwt.sign({ email: email }, process.env.TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.status(200).json({ message: "Login successful", token });
    } else {
      res.status(401).json({ error: "Incorrect password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

//Route to create a lobby
router.get("/lobby", authToken, async (req, res) => {
  const email = req.user.email;
  try {
    await Lobby.createLobby(email);
    res.status(200).json({ message: "Lobby created" });
    const id_admin = await User.getId(email);
    const id_lobby = await Lobby.getLastLobbyIdByUser(email);
    await Access.addAdmin(id_admin, id_lobby);
  } catch (error) {
    res.status(500).json({ error: "Failed to create lobby" });
  }
});
// Route to get all messages by lobby_id(GET /lobby)
router.get("/lobby/:lobby_id", authToken, async (req, res, next) => {
  try {
    const { lobby_id } = req.params;
    const messages = await Lobby.getLobbyMessagesById(lobby_id);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching lobby messages:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching lobby messages" });
  }
});

// Route to get a specific message from a lobby
router.get("/lobby/:lobby_id/:post_id", authToken, async (req, res, next) => {
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
    res
      .status(500)
      .json({ error: "An error occurred while fetching the message" });
  }
});
//Route to add message lobby and the statement
router.post("/lobby/:lobby_id", authToken, async (req, res) => {
  const { message } = req.body;
  const { lobby_id } = req.params;
  const email = req.user.email;

  // Vérification des champs requis
  if (!message || !lobby_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const isAdmin = await Lobby.verifAdmin(email, lobby_id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "You are not the admin of this lobby" });
    }

    const verifMsg = await Lobby.verifMessage(lobby_id);

    if (verifMsg.length > 0) {
      await Lobby.createMessage(message, lobby_id);
      return res.status(200).json({ message: "Message updated successfully" });
    } else {
      await Lobby.createMessage(message, lobby_id);
      return res.status(201).json({ message: "Message created successfully" });
    }
  } catch (error) {
    console.error("Error while posting/updating lobby message:", error);
    res
      .status(500)
      .json({ error: "An error occurred while handling the lobby message" });
    res;
  }
});

//Route to Add a user to a lobby
router.post("/lobby/:lobby_id/add-user", authToken, async (req, res, next) => {
  const lobby_id = req.params.lobby_id;
  const { id } = req.body;
  const email = req.user.email;
  if (!id) {
    return res.status(400).json({ error: "Missing required fields: id " });
  }
  try {
    const isAdmin = await Lobby.verifAdmin(email, lobby_id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "You are not the admin of this lobby" });
    }
    const result = await Access.addUser(lobby_id, id);
    if (result.affectedRows > 0) {
      return res
        .status(201)
        .json({ message: "User added to the lobby successfully" });
    } else {
      return res.status(500).json({ error: "Failed to add user to the lobby" });
    }
  } catch (error) {
    console.error("Error while adding user to lobby:", error);
  }
});

//Route to remove a user to a lobby
router.post(
  "/lobby/:lobby_id/remove-user",
  authToken,
  async (req, res, next) => {
    const lobby_id = req.params.lobby_id;
    const { id } = req.body;
    const email = req.user.email;
    if (!id) {
      return res.status(400).json({ error: "Missing required fields: id " });
    }
    try {
      const isAdmin = await Lobby.verifAdmin(email, lobby_id);
      if (!isAdmin) {
        return res
          .status(403)
          .json({ error: "You are not the admin of this lobby" });
      }
      const result = await Access.removeUser(lobby_id, id);
      if (result.affectedRows > 0) {
        return res
          .status(201)
          .json({ message: "User deleted to the lobby successfully" });
      } else {
        return res.status(500).json({ error: "Failed to remove to the lobby" });
      }
    } catch (error) {
      console.error("Error while removing user to lobby:", error);
    }
  }
);

//Route to show all users in a specific lobby
router.get("/users", authToken, async (req, res) => {
  try {
    const email = req.user.email;

    // Récupérer tous les lobbies auxquels cet utilisateur a accès
    const allLobbies = await Access.showAllUser(email);

    // Vérifier s'il a accès à au moins un lobby
    if (allLobbies.length === 0) {
      return res.status(404).json({ error: "User is not part of any lobby." });
    }

    const lobbyUsers = [];

    // Récupérer les utilisateurs pour chaque lobby
    for (const lobby of allLobbies) {
      const lobby_id = lobby.lobby_id;

      // Vérifier si l'utilisateur est admin pour ce lobby
      const isAdmin = await Lobby.verifAdmin(email, lobby_id);
      if (!isAdmin) {
        continue; // Passer au lobby suivant s'il n'est pas admin de ce lobby
      }

      // Obtenir les utilisateurs de ce lobby
      const users = await Lobby.getUsersLobbyById(lobby_id);

      if (users.length > 0) {
        lobbyUsers.push({
          lobby_id: lobby_id,
          users: users,
        });
      }
    }

    // Si aucun utilisateur n'a été trouvé
    if (lobbyUsers.length === 0) {
      return res.status(404).json({ error: "No users found in any lobbies." });
    }

    // Renvoyer les utilisateurs par lobby
    res.json(lobbyUsers);
  } catch (error) {
    console.error("Error fetching users for lobby:", error);
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
});

async function authToken(req, res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(403).json({ error: "No token provided." });
  }

  const token = authHeader.split(" ")[1]; // Récupère le token après "Bearer"
  if (!token) {
    console.log("Auth header:", authHeader);
    return res.status(403).json({ error: "Malformed token" });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log("Token verification error:", err);
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
}
module.exports = router;
