const databaseConnection = require("mariadb");
const User = require("./User");
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

class Access {
  static async addUser(lobby_id, user_id) {
    const conn = await connectToDB();
    try {
      const accessCheck = await conn.query(
        "SELECT * FROM access WHERE user_id = ? AND lobby_id = ?",
        [user_id, lobby_id]
      );
      if (accessCheck.length > 0) {
        throw new Error("User already has access to this lobby");
      }

      const result = await conn.query(
        "INSERT INTO access (user_id,lobby_id) values (?,?)",
        [user_id, lobby_id]
      );
      return result;
    } catch (error) {
      console.error("Error adding user to lobby:", error.message);
      throw new Error("Failed to add user to lobby: " + error.message);
    }
  }
  static async removeUser(lobby_id, user_id) {
    const conn = await connectToDB();
    try {
      const accessCheck = await conn.query(
        "SELECT * FROM access WHERE user_id = ? AND lobby_id = ?",
        [user_id, lobby_id]
      );

      if (accessCheck[0].length === 0) {
        throw new Error("User does not have access to this lobby");
      }

      // Supprimer l'utilisateur du lobby
      const result = await conn.query(
        "DELETE FROM access WHERE user_id = ? AND lobby_id = ?",
        [user_id, lobby_id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Failed to remove user from lobby");
      }

      return result; // Retourner le résultat si nécessaire
    } catch (error) {
      console.error("Error removing user from lobby:", error.message);
      throw new Error("Failed to remove user from lobby: " + error.message);
    }
  }
  static async showAllUser(email) {
    const conn = await connectToDB();
    try {
      // Obtenir l'ID de l'utilisateur à partir de l'email
      const idFromEmail = await User.getId(email);

      // Récupérer tous les lobbies auxquels cet utilisateur a accès
      const result = await conn.query(
        "SELECT lobby_id FROM access WHERE user_id = ?",
        [idFromEmail]
      );

      return result; // retourne tous les lobby_ids auxquels l'utilisateur a accès
    } catch (error) {
      console.error("Error while fetching lobbies for user:", error);
      throw new Error("Failed to retrieve lobbies for user.");
    }
  }
  static async addAdmin(user_id, lobby_id) {
    const conn = await connectToDB();
    try {
      const result = await conn.query(
        "INSERT INTO access (user_id, lobby_id, role) VALUES (?, ?, ?)",
        [user_id, lobby_id, "admin"]
      );
      return result;
    } catch (error) {
      console.error("Error adding admin to lobby:", error.message);
      throw new Error("Failed to add admin to lobby: " + error.message);
    }
  }
}

module.exports = Access;
