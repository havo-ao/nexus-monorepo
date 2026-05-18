import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const serviceName = process.argv[2];

if (!serviceName) {
  throw new Error('Usage: node ../scripts/normalize-lcov-paths.mjs <service-name>');
}

const servicePrefix = `services/${serviceName}/`;
const lcovPath = join('services', serviceName, 'coverage', 'lcov.info');

try {
  await access(lcovPath);
} catch {
  console.warn(`No lcov.info found for ${serviceName}, skipping normalization`);
  process.exit(0);
}

const lcov = await readFile(lcovPath, 'utf8');

const normalizedLcov = lcov.replace(/^SF:(.+)$/gm, (_line, sourceFile) => {
  const normalizedSourceFile = sourceFile.replaceAll('\\', '/').replace(/^.\//, '');

  if (normalizedSourceFile.startsWith(servicePrefix)) {
    return `SF:${normalizedSourceFile}`;
  }

  if (
    normalizedSourceFile.startsWith('src/') &&
    !normalizedSourceFile.includes(servicePrefix)
  ) {
    return `SF:${servicePrefix}${normalizedSourceFile}`;
  }

  return `SF:${normalizedSourceFile}`;
});

await writeFile(lcovPath, normalizedLcov);