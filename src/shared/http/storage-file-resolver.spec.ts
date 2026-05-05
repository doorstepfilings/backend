import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
    buildStorageRoots,
    resolveStorageFilePath,
} from './storage-file-resolver';

describe('storage-file-resolver', () => {
    let tempRoot: string;

    afterEach(() => {
        if (tempRoot) {
            fs.rmSync(tempRoot, {
                recursive: true,
                force: true,
            });
        }
    });

    it('prefers the current storage root when the file exists there', () => {
        tempRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'doorstep-storage-current-'),
        );
        const currentStorageRoot = path.join(tempRoot, 'current');
        const legacyStorageRoot = path.join(tempRoot, 'legacy');
        const requestedPath = '/service_documents/4/9/invoice.pdf';
        const currentFilePath = path.join(
            currentStorageRoot,
            'service_documents',
            '4',
            '9',
            'invoice.pdf',
        );

        fs.mkdirSync(path.dirname(currentFilePath), { recursive: true });
        fs.writeFileSync(currentFilePath, 'current file');
        fs.mkdirSync(
            path.join(legacyStorageRoot, 'service_documents', '4', '9'),
            { recursive: true },
        );
        fs.writeFileSync(
            path.join(
                legacyStorageRoot,
                'service_documents',
                '4',
                '9',
                'invoice.pdf',
            ),
            'legacy file',
        );

        const resolvedPath = resolveStorageFilePath(requestedPath, [
            currentStorageRoot,
            legacyStorageRoot,
        ]);

        expect(resolvedPath).toBe(currentFilePath);
    });

    it('falls back to a legacy storage root for migrated files', () => {
        tempRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'doorstep-storage-legacy-'),
        );
        const currentStorageRoot = path.join(tempRoot, 'current');
        const legacyStorageRoot = path.join(tempRoot, 'legacy');
        const legacyFilePath = path.join(
            legacyStorageRoot,
            'service_documents',
            '4',
            '9',
            'invoice.pdf',
        );

        fs.mkdirSync(path.dirname(legacyFilePath), { recursive: true });
        fs.writeFileSync(legacyFilePath, 'legacy file');

        const resolvedPath = resolveStorageFilePath(
            '/service_documents/4/9/invoice.pdf',
            [currentStorageRoot, legacyStorageRoot],
        );

        expect(resolvedPath).toBe(legacyFilePath);
    });

    it('rejects path traversal attempts', () => {
        tempRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'doorstep-storage-traversal-'),
        );

        const resolvedPath = resolveStorageFilePath('/../.env', [tempRoot]);

        expect(resolvedPath).toBeNull();
    });

    it('deduplicates configured legacy roots', () => {
        tempRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'doorstep-storage-roots-'),
        );
        const currentStorageRoot = path.join(tempRoot, 'current');
        const legacyStorageRoot = path.join(tempRoot, 'legacy');

        const storageRoots = buildStorageRoots(
            `${legacyStorageRoot};${legacyStorageRoot}`,
            currentStorageRoot,
        );

        expect(storageRoots[0]).toBe(currentStorageRoot);
        expect(
            storageRoots.filter((storageRoot) => storageRoot === legacyStorageRoot),
        ).toHaveLength(1);
    });
});
