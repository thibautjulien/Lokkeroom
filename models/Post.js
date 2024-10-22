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
  static async modifyContent(user_id, lobby_id, newContent) {
    const conn = await connectToDB();
    try {
      const result = await conn.query(
        "UPDATE posts SET content = ?,updated_at = NOW() WHERE user_id = ? AND lobby_id=?",
        [newContent, user_id, lobby_id]
      );
      return result;
    } catch (error) {
      console.error("Error : ", error);
      throw new Error("Can't add content in existing post");
    }
  }
  static async addPost(user_id, lobby_id, newContent) {
    const conn = await connectToDB();
    try {
      const result = await conn.query(
        "INSERT INTO posts (content,user_id,lobby_id,created_at,updated_at) VALUES (?, ?, ?,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [newContent, user_id, lobby_id]
      );
      return result;
    } catch (error) {
      console.error("Error : ", error);
      throw new Error("Can't add this post");
    }
  }
  static async verifExistingPost(user_id, lobby_id) {
    const conn = await connectToDB();
    try {
      const res = await conn.query(
        "SELECT * FROM posts WHERE user_id = ? AND lobby_id = ?",
        [user_id, lobby_id]
      );
      if (res.length === 0) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error verifying existing post:", error);
      throw new Error("Database error while checking for existing post");
    }
  }
  static async deletePost(user_id, lobby_id) {
    const conn = await connectToDB();
    try {
      const result = await conn.query(
        "DELETE FROM posts WHERE user_id = ? AND lobby_id = ?",
        [user_id, lobby_id]
      );
      return result;
    } catch (error) {
      console.error("Error deleting post: ", error);
      throw new Error("Can't delete this post");
    }
  }
}

module.exports = Post;
