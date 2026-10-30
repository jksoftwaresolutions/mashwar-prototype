/** Database tests: need DATABASE_URL pointing at a disposable PostgreSQL + PostGIS database. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.db-spec.ts'],
  testTimeout: 60000,
}
