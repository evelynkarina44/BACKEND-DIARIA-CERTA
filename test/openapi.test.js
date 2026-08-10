import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import SwaggerParser from '@apidevtools/swagger-parser';
import openApiDocument from '../src/docs/openapi.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const methods = ['get', 'post', 'put', 'patch', 'delete'];

function normalizePath(path) {
  return path
    .replace(/\/+/g, '/')
    .replace(/:([A-Za-z0-9_]+)/g, '{$1}')
    .replace(/\/$/, '') || '/';
}

async function expressOperations() {
  const appSource = await readFile(resolve(projectRoot, 'src/app.js'), 'utf8');
  const routeImports = new Map(
    [...appSource.matchAll(/import\s+(\w+)\s+from\s+['"]\.\/routes\/([^'"]+)['"]/g)]
      .map((match) => [match[1], match[2]]),
  );
  const operations = new Set();

  for (const match of appSource.matchAll(/app\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g)) {
    operations.add(`${match[1].toUpperCase()} ${normalizePath(match[2])}`);
  }

  for (const match of appSource.matchAll(/app\.use\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g)) {
    const [, mount, variable] = match;
    const routeFile = routeImports.get(variable);
    if (!routeFile) continue;

    const routeSource = await readFile(resolve(projectRoot, 'src/routes', routeFile), 'utf8');
    for (const routeMatch of routeSource.matchAll(/router\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g)) {
      const subpath = routeMatch[2] === '/' ? '' : routeMatch[2];
      operations.add(`${routeMatch[1].toUpperCase()} ${normalizePath(`${mount}${subpath}`)}`);
    }
  }

  return operations;
}

function documentedOperations() {
  const operations = new Set();
  for (const [path, pathItem] of Object.entries(openApiDocument.paths)) {
    for (const method of methods) {
      if (pathItem[method]) operations.add(`${method.toUpperCase()} ${path}`);
    }
  }
  return operations;
}

test('contrato é uma especificação OpenAPI 3 válida', async () => {
  await assert.doesNotReject(() => SwaggerParser.validate(openApiDocument));
});

test('OpenAPI documenta exatamente as operações registradas nas Routes', async () => {
  const actual = await expressOperations();
  const documented = documentedOperations();

  assert.deepEqual(
    [...documented].filter((operation) => !actual.has(operation)),
    [],
    'Swagger contém operações que não existem nas Routes',
  );
  assert.deepEqual(
    [...actual].filter((operation) => !documented.has(operation)),
    [],
    'Existem operações nas Routes que não foram documentadas',
  );
  assert.equal(documented.size, actual.size);
});

test('todas as operações possuem tag, resumo, operationId único e respostas', () => {
  const operationIds = [];
  for (const pathItem of Object.values(openApiDocument.paths)) {
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;
      assert.ok(operation.tags?.length);
      assert.ok(operation.summary);
      assert.ok(operation.operationId);
      assert.ok(Object.keys(operation.responses ?? {}).length);
      operationIds.push(operation.operationId);
    }
  }
  assert.equal(new Set(operationIds).size, operationIds.length, 'operationId duplicado');
});

test('OpenAPI não contém os endpoints usados apenas como referência visual', () => {
  const paths = Object.keys(openApiDocument.paths);
  assert.equal(paths.some((path) => path.startsWith('/banner')), false);
  assert.equal(paths.some((path) => path.startsWith('/bidding-document')), false);
  assert.equal(paths.some((path) => path.startsWith('/bidding-document-type')), false);
});
