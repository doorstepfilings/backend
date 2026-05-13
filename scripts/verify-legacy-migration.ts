import 'dotenv/config';
import { verifyLegacyMigration } from './lib/legacy-migration';

verifyLegacyMigration().catch((error) => {
    console.error('[migrate:verify] Verification failed.');
    console.error(error);
    process.exit(1);
});
