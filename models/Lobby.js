const User = require("./User");
const databaseConnection = require("mariadb");
async function connectToDB() {
  try {
    db = await databaseConnection.createConnection({
      host: "localhost",
      port: "3306",
      user: process.env.USER_DB,
      password: process.env.PASSWORD_DB,
      database: "lokkeroom",
    });

    return db;
  } catch (err) {
    console.log("[Lokkeroom-Database] : Connection failed.", err);
  }
}
class Lobby {
  static async createLobby(email) {
    const conn = await connectToDB();
    try {
      const id_admin = await User.getId(email);
      const result = await conn.query(
        `INSERT INTO lobbies (admin_id,message) values (?,?)`,
        [id_admin, ""]
      );
      return result;
    } catch (error) {
      console.error("Error during function : createlobby :", error);
    }
  }
  static async getLobbyMessagesById(lobby_id) {
    try {
      const conn = await connectToDB();
      const result = await conn.query(
        "SELECT * FROM posts WHERE lobby_id = ?",
        [lobby_id]
      );
      return result;
    } catch (error) {
      console.error("Error to get lobby messages:", error);
    }
  }
  static async createMessage(newMsg, lobby_id) {
    const conn = await connectToDB();
    try {
      const result = await conn.query(
        "UPDATE lobbies SET message=? WHERE id = ?",
        [newMsg, lobby_id]
      );
      return result;
    } catch (error) {
      throw new Error("Error to post a message in your lobby");
    }
  }
  static async verifMessage(lobby_id) {
    const conn = await connectToDB();
    try {
      const result = await conn.query(
        "SELECT message FROM lobbies WHERE id =?",
        lobby_id
      );
      return result;
    } catch (error) {
      throw new Error("Error to get message of lobby");
    }
  }
  static async verifAdmin(email, lobby_id) {
    const conn = await connectToDB();
    try {
      const idToCheck = await User.getId(email);
      const [lobby] = await conn.query(
        "SELECT admin_id FROM lobbies WHERE id = ?",
        [lobby_id]
      );

      // Vérifier si le lobby existe et si l'admin_id correspond à l'ID de l'utilisateur
      if (lobby && lobby.admin_id === idToCheck) {
        return true;
      }
      return false;
    } catch (error) {
      throw new Error("Error to verif if is it an admin");
    }
  }
  static async getUsersLobbyByIdForAdmin(lobby_id) {
    try {
      const conn = await connectToDB();
      const result = await conn.query(
        `
        SELECT u.id, u.username,u.mail,a.role,p.content,p.updated_at
        FROM access a 
        JOIN users u 
        ON a.user_id = u.id 
        JOIN posts p
        ON u.id = p.user_id
        WHERE a.lobby_id = ? `,
        [lobby_id]
      );
      return result;
    } catch (error) {
      console.error("Error getting lobby users:", error);
      throw new Error("Failed to retrieve users for the specified lobby.");
    }
  }
  static async getUsersLobbyByIdForMember(lobby_id) {
    try {
      const conn = await connectToDB();
      const result = await conn.query(
        `
        SELECT u.username,a.role,p.content
        FROM access a 
        JOIN users u 
        ON a.user_id = u.id 
        JOIN posts p
        ON u.id = p.user_id
        WHERE a.lobby_id = ?`,
        [lobby_id]
      );
      return result;
    } catch (error) {
      console.error("Error getting lobby users:", error);
      throw new Error("Failed to retrieve users for the specified lobby.");
    }
  }

  static async getLastLobbyIdByUser(email) {
    const conn = await connectToDB();
    try {
      // Récupérer l'ID de l'utilisateur à partir de l'email
      const userId = await User.getId(email);

      // Rechercher le dernier lobby créé par cet utilisateur
      const result = await conn.query(
        "SELECT id FROM lobbies WHERE admin_id = ? ORDER BY id DESC LIMIT 1",
        [userId]
      );

      // Vérifier si un lobby est trouvé et retourner son ID
      if (result.length > 0) {
        return result[0].id;
      } else {
        throw new Error("No lobby found for this user");
      }
    } catch (error) {
      console.error("Error getting last lobby ID:", error);
      throw new Error("Failed to get last lobby ID");
    }
  }
}

module.exports = Lobby;
