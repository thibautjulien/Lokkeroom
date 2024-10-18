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

    static async getMessageById(id){
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

}

module.exports = Post