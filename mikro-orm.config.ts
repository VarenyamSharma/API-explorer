import { Options } from '@mikro-orm/core';
import { Request } from './entities/Request';

const config: Options = {
  entities: [Request],
  dbName: 'api-explorer',
  clientUrl: 'mongodb://localhost:27017',
  type: 'mongodb',
  // Consider adding migrations and other options for production
  // Migrations for MongoDB might have different considerations or might not be used
  // in the same way as with SQL databases.
  // migrations: {
  //   tableName: 'mikroorm_migrations', // name of database table for migrations
  //   path: './migrations', // path to folder with migration files
  //   transactional: true, // wrap migrations in transactions
  //   disableForeignKeys: true, // wrap alter commands in `SET session_replication_role = 'replica';` and `SET session_replication_role = 'origin';`
  //   allOrNothing: true, // wrap all migrations in master transaction
  //   dropTables: true, // allow dropping tables as part of migrations
  //   createPaths: true, // create folders for migrations if they don't exist
  //   emit: 'ts', // migration generation mode
  // },
};

export default config;
