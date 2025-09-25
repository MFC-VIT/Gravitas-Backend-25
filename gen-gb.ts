// generate-gameboard-sql.ts
import { writeFileSync } from 'fs';
import { transportConnections } from './scotland-yard/transport-connections.ts';

let sql = `TRUNCATE TABLE "GameBoard" RESTART IDENTITY CASCADE;\n\n`;

for (const [nodeId, connections] of Object.entries(transportConnections)) {
  const connectionsJSON = JSON.stringify({
    connections: connections,
  });

  const transportTypes = JSON.stringify(connections);

  sql += `INSERT INTO "GameBoard" (nodeId, connectionsJSON, transportTypes)\n`;
  sql += `VALUES (${nodeId}, '${connectionsJSON.replace(/'/g, "''")}', '${transportTypes.replace(/'/g, "''")}');\n\n`;
}

writeFileSync('seed-gameboard.sql', sql);
console.log('✅ Generated seed-gameboard.sql with all inserts');
