const databaseConnection = require("mariadb");
const bcrypt = require("bcrypt");
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
class User {
  static async createUser(email, username, password) {
    const hashPassword = await bcrypt.hash(password, 10);
    const conn = await connectToDB();
    try {
      await conn.query(
        "INSERT INTO users (mail, username, password, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [email, username, hashPassword]
      );
      console.log("User successfully registered");
      conn.end();
    } catch (error) {
      console.error("Error during registration:", error);
    }
  }
  static async getUserbyEmail(email, password) {
    let flag = 1;
    try {
      const conn = await connectToDB();
      const rows = await conn.query(
        "SELECT password FROM users WHERE mail = ?",
        [email]
      );
      if (rows.length === 0) {
        flag = 2;
        return flag;
      }
      const hashPassword = rows[0].password; // Récupère le mot de passe haché de la BDD
      const isMatch = await bcrypt.compare(password, hashPassword); // Compare les mots de passe
      if (isMatch) {
        flag = 0;
        console.log("Successful login");
        return flag;
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  }
  static async getId(email) {
    try {
      const conn = await connectToDB();
      const rows = await conn.query("SELECT id FROM users WHERE mail = ?", [
        email,
      ]);
      if (rows.length > 0) {
        return rows[0].id;
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  }
}

module.exports = User;
