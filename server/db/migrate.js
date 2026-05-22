import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not set. Copy .env.example to .env and fill it in.');
        process.exit(1);
    }

    const client = new pg.Client({
        connectionString,
        ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false,
    });

    await client.connect();
    try {
        for (const file of ['schema.sql', 'seed.sql']) {
            const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
            console.log(`Applying ${file}...`);
            await client.query(sql);
        }
        console.log('Migration complete.');
    } finally {
        await client.end();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
