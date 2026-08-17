require("dotenv/config");
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const payments = await client.query(`
    SELECT pl.name, pay.year, pay.month, pay.amount, pay."paidAmount", pay.status, pl.type
    FROM payments pay
    JOIN players pl ON pl.id = pay."playerId"
    WHERE pay.year = 2026 AND pay.month = 8 AND pay.status <> 'CANCELLED'
    ORDER BY pl.name
  `);

  const shares = await client.query(`
    SELECT pl.name, ms.amount, ms."paidAmount", ms.status, m."playedOn"
    FROM match_shares ms
    JOIN players pl ON pl.id = ms."playerId"
    JOIN matches m ON m.id = ms."matchId"
    WHERE ms.status <> 'CANCELLED'
      AND m."playedOn" >= '2026-08-01'
      AND m."playedOn" < '2026-09-01'
    ORDER BY m."playedOn", pl.name
  `);

  const paySum = payments.rows.reduce((s, r) => s + Number(r.paidAmount || 0), 0);
  const shareSum = shares.rows.reduce((s, r) => s + Number(r.paidAmount || 0), 0);

  console.log("PAYMENTS", JSON.stringify(payments.rows, null, 2));
  console.log("payment paid sum", paySum);
  console.log("SHARES", JSON.stringify(shares.rows, null, 2));
  console.log("share paid sum", shareSum);
  console.log("dashboard income would be", paySum + shareSum);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
