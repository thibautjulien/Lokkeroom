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
class Post {
  static async getMessageById(id) {
    try {
      const conn = await connectToDB();
      const result = await conn.query(
        "SELECT content FROM posts WHERE id = ?",
        [id]
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`Error to get message from id:${id}`, error);
    }
  }
  static async initPost(user_id, lobby_id) {
    const conn = await connectToDB();
    try {
      const firstPost = await conn.query(
        "INSERT INTO posts (content,user_id,lobby_id,created_at,updated_at) VALUES (?, ?, ?,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        ["", user_id, lobby_id]
      );
      console.log("first post successfully registered");
      return firstPost;
    } catch (error) {
      console.error("Error during registration:", error);
    }
  }
}

module.exports = Post;
