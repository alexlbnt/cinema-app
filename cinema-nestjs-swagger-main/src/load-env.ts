import { existsSync } from 'fs';
import { join } from 'path';

// O Nest não lê o .env sozinho (só o Prisma lê, para o DATABASE_URL).
// Carrega o .env da pasta do backend antes de qualquer outro módulo.
// Variáveis já definidas no ambiente têm prioridade sobre o arquivo.
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
