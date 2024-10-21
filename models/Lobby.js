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
    console.log("[Lokkeroom-Database] : Connected to the database.");
    return db;
  } catch (err) {
    console.log("[Lokkeroom-Database] : Connection failed.", err);
  }
}
class Lobby {
  static async createLobby(email) {
    const conn = await connectToDB();
    try {
      const id_admin = await User.getId(email)
      const result = await conn.query(
        `INSERT INTO lobbies (admin_id,message) values (?,?)`,
        [id_admin,""]
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
  static async createMessage(newMsg,lobby_id){
    const conn = await connectToDB();
    try{
      const result = await conn.query("UPDATE lobbies SET message=? WHERE id = ?",[newMsg,lobby_id])
      return result
    }catch(error){
      throw new Error("Error to post a message in your lobby")
    }
  }
  static async verifMessage(lobby_id){
    const conn = await connectToDB()
    try{
      const result = await conn.query("SELECT message FROM lobbies WHERE id =?",lobby_id)
      return result
    }catch(error){
      throw new Error("Error to get message of lobby")
    }
  }
}

module.exports = Lobby;
