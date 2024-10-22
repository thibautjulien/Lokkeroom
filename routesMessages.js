const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Charge les variables d'environnement
const User = require("./models/User");
const Lobby = require("./models/Lobby");
const { getMessageById } = require("./models/Post");
const Post = require("./models/Post");
const Access = require("./models/Access");

const router = express.Router();


// Route to edit a message
router.patch("/lobby/:lobby_id/messages/:messageId", authToken, async (req, res) => {
    const { lobby_id, messageId } = req.params;
    const { content } = req.body; // Nouvelle version du message
    const email = req.user.email;

    console.log(`Attempting to update message. Lobby ID: ${lobby_id}, Message ID: ${messageId}, Content: ${content}`);

    if (!content) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const userId = await User.getId(email); // Récupérez l'ID de l'utilisateur
        console.log(`User ID fetched: ${userId}`);
        
        const isOwner = await Post.verifMessageOwner(messageId, userId);
        if (!isOwner) {
            return res.status(403).json({ error: "You are not authorized to edit this message" });
        }

        await Post.updateMessage(messageId, content); // Utilisez une méthode appropriée pour mettre à jour le message
        res.status(200).json({ message: "Message updated successfully" });
    } catch (error) {
        console.error("Error updating message:", error);
        res.status(500).json({ error: "An error occurred while updating the message" });
    }
});


// Route to delete a message
router.delete("/lobby/:lobby_id/messages/:messageId", authToken, async (req, res) => {
    const { messageId } = req.params;
    const email = req.user.email;

    try {
        const userId = await User.getId(email); // Récupérez l'ID de l'utilisateur
        const isOwner = await Post.verifMessageOwner(messageId, userId); // Vérifiez si l'utilisateur est le propriétaire du message
        if (!isOwner) {
            return res.status(403).json({ error: "You are not authorized to delete this message" });
        }

        await Post.deleteMessage(messageId); // Utilisez une méthode appropriée pour supprimer le message
        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "An error occurred while deleting the message" });
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

  router.get("/lobby/:lobby_id/messages", authToken, async (req, res) => {
    const { lobby_id } = req.params;
    
    // Correctement extraire les paramètres `page` et `limit`
    let page = parseInt(req.query.page) || 1;  
    let limit = parseInt(req.query.limit) || 5;

    try {
        // Passer correctement `page` et `limit` à la fonction
        const messages = await Post.getMessagesByLobbyId(lobby_id, page, limit);

        console.log("Messages fetched:", messages); // Log des messages récupérés
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching lobby messages:", error);
        res.status(500).json({ error: error.message });
    }
});
