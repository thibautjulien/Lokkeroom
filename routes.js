const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Charge les variables d'environnement
const User = require("./models/User");
const Lobby = require("./models/Lobby");
const { getMessageById } = require("./models/Post");
const Post = require("./models/Post");
const Access = require("./models/Access");
const loginAttempts = {};
const router = express.Router();

// Route to register (POST /register)
router.post("/register", async (req, res) => {
  const { email, username, password } = req.body;
  console.log(req.body);

  if (!email || !username || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const emailExists = await User.verifEmail(email);
    const usernameExists = await User.verifUsername(username);

    if (!emailExists) {
      return res
        .status(400)
        .json({ error: "This email has an account! Please login" });
    }

    if (!usernameExists) {
      return res
        .status(400)
        .json({ error: "This username already exists! Please try another" });
    }
    await User.createUser(email, username, password);
    res.status(201).json({ message: "Successfully registered" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// Route to login (POST /login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const maxAttempts = 5;
  const timeBetweenMaxAttempts = 60 * 60 * 1000;

  const userAttempts = loginAttempts[email] || { count: 0, blockedUntil: null };

  if (
    userAttempts.blockedUntil != null &&
    userAttempts.blockedUntil > Date.now()
  ) {
    return res
      .status(429)
      .json({ error: "Too many attempts, try again later (1 hour)" });
  }

  try {
    const user = await User.getUserbyEmail(email, password);

    if (user === 2) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user === 0) {
      const token = await jwt.sign({ email }, process.env.TOKEN_SECRET, {
        expiresIn: "1h",
      });
      delete loginAttempts[email];
      return res.status(200).json({ message: "Login successful", token });
    } else {
      userAttempts.count++;
      userAttempts.lastAttempt = Date.now();

      if (userAttempts.count >= maxAttempts) {
        userAttempts.blockedUntil = Date.now() + timeBetweenMaxAttempts;
        return res
          .status(429)
          .json({ error: "Too many attempts, try again later" });
      }
      loginAttempts[email] = userAttempts;
      return res.status(401).json({ error: "Incorrect password" });
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
      await Post.initPost(id, lobby_id);
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
    const allLobbies = await Access.showAllUser(email);

    if (allLobbies.length === 0) {
      return res.status(404).json({ error: "User is not part of any lobby." });
    }

    const lobbyUsers = [];

    for (const lobby of allLobbies) {
      const lobby_id = lobby.lobby_id;
      const lobbyMsg = lobby.message;
      const isAdmin = await Lobby.verifAdmin(email, lobby_id);

      let users;
      if (isAdmin) {
        users = await Lobby.getUsersLobbyByIdForAdmin(lobby_id);
        lobbyUsers.push({
          lobby_id: lobby_id,
          message: lobbyMsg,
          users: users,
        });
      } else {
        users = await Lobby.getUsersLobbyByIdForMember(lobby_id);
        const messages = [];

        for (const user of users) {
          if (user.mail !== email) {
            messages.push({
              username: user.username,
              message: user.content,
              role: user.role,
            });
          }
        }

        lobbyUsers.push({
          lobby_id: lobby_id,
          lobbyMsg: lobbyMsg,
          messages: messages,
        });
      }
    }

    if (lobbyUsers.length === 0) {
      return res.status(404).json({ error: "No users found in any lobbies." });
    }

    res.json(lobbyUsers);
  } catch (error) {
    console.error("Error fetching users for lobby:", error);
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
});

//Route Admin add people that have not yet registered to the platform.
router.post(
  "/lobby/:lobby_id/add-not-registered-user",
  authToken,
  async (req, res) => {
    const { email, username, password } = req.body;
    const adminEmail = req.user.email;
    const lobby_id = req.params.lobby_id;
    console.log(req.body);

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const isAdmin = await Lobby.verifAdmin(adminEmail, lobby_id);
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "You are not the admin of this lobby" });
    }
    try {
      const emailExists = await User.verifEmail(email);
      const usernameExists = await User.verifUsername(username);

      if (!emailExists) {
        return res
          .status(400)
          .json({ error: "This email has an account! Please login" });
      }

      if (!usernameExists) {
        return res
          .status(400)
          .json({ error: "This username already exists! Please try another" });
      }
      await User.createUser(email, username, password);

      res.status(201).json({ message: "Successfully registered" });
      const id = await User.getId(email);
      const result = await Access.addUser(lobby_id, id);
      if (result.affectedRows > 0) {
        await Post.initPost(id, lobby_id);
        return res
          .status(201)
          .json({ message: "User added to the lobby successfully" });
      } else {
        return res
          .status(500)
          .json({ error: "Failed to add user to the lobby" });
      }
    } catch (error) {
      console.error("Error:", error);

      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
);

//Route change password
router.post("/users/changePassword", authToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const email = req.user.email;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Old password and new password are required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters long" });
  }

  try {
    const user_id = await User.getId(email);
    await User.changePassword(user_id, oldPassword, newPassword);
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    if (error.message.includes("Old password is incorrect")) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }
    return res.status(500).json({ error: error.message });
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
