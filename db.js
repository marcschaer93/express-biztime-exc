/** Database setup for BizTime. */

const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = "postgresgl:///biztime-test";
} else {
  DB_URI = "postgresgl:///biztime";
}

let db = new Client({ connectionString: DB_URI });

db.connect();

module.exports = db;
