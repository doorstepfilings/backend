import 'dotenv/config';
import { runLegacyMigration } from './lib/legacy-migration';

runLegacyMigration().catch((error) => {
    console.error('[migrate:legacy] Migration failed.');
    console.error(error);
    process.exit(1);
});
