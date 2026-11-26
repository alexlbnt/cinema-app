import { execSync } from 'child_process';
import { rmSync } from 'fs';
import { join } from 'path';
import { TEST_DATABASE_URL } from './e2e-env';

// Roda uma vez antes dos testes e2e: recria o banco de teste do zero.
export default function globalSetup(): void {
  const raiz = join(__dirname, '..');
  for (const arquivo of ['test.db', 'test.db-journal']) {
    rmSync(join(raiz, 'prisma', arquivo), { force: true });
  }
  execSync('npx prisma migrate deploy', {
    cwd: raiz,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'ignore',
  });
}
