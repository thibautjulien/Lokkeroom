const databaseConnection = require("mariadb");
const { removeUser } = require("./Access");

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

  static async getMessageByUserId(id) {
    try {
      const conn = await connectToDB();
      const result = await conn.query(
        `SELECT p.content, p.created_at, p.updated_at FROM posts p JOIN users u ON p.user_id = u.id WHERE u.id = ?`,
        [id]
      );
      return result;
    } catch (error) {
      console.error("Error:", error);
    }
  }
}

module.exports = Post;
