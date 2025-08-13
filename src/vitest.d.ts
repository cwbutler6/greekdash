import type {
  TestAPI,
  vi as vitestVi
} from 'vitest';

declare global {
  const vi: typeof vitestVi;
  const describe: TestAPI['describe'];
  const it: TestAPI['it'];
  const test: TestAPI['test'];
  const expect: TestAPI['expect'];
  const beforeEach: TestAPI['beforeEach'];
  const afterEach: TestAPI['afterEach'];
  const beforeAll: TestAPI['beforeAll'];
  const afterAll: TestAPI['afterAll'];
}

export {};