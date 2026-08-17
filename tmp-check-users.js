require("dotenv/config");
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const users = await client.query(
    'SELECT email, role, active, name, "playerId" FROM users'
  );
  console.log(JSON.stringify(users.rows, null, 2));
  console.log("count", users.rowCount);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
