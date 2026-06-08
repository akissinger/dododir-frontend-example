import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { DododirServer } from 'dododir';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3001);

const server = new DododirServer({
    port: PORT,
    staticDir: path.join(__dirname, '../../client/dist'),
    staticCatchall: path.join(__dirname, '../../client/dist/index.html'),
    allowOrigin: 'http://localhost:5173',
    dbPath: process.env.DB_PATH ?? path.join(__dirname, '../../dododir.db'),
    userQuotaMB: Number(process.env.USER_QUOTA_MB ?? 100),
    authSecret: process.env.JWT_SECRET,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
});
server.listen();