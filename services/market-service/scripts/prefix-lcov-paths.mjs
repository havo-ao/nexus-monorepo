import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const servicePrefix = 'services/market-service/';
const lcovPath = join(process.cwd(), 'coverage', 'lcov.info');

const lcov = await readFile(lcovPath, 'utf8');
const normalizedLcov = lcov.replace(/^SF:(.+)$/gm, (_line, sourceFile) => {
  const normalizedSourceFile = sourceFile.replaceAll('\\', '/');

  if (normalizedSourceFile.startsWith(servicePrefix)) {
    return `SF:${normalizedSourceFile}`;
  }

  if (normalizedSourceFile.startsWith('src/')) {
    return `SF:${servicePrefix}${normalizedSourceFile}`;
  }

  return `SF:${normalizedSourceFile}`;
});

await writeFile(lcovPath, normalizedLcov);
