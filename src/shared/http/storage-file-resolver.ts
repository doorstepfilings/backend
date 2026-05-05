import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_LEGACY_STORAGE_ROOTS =
    process.platform === 'win32'
        ? [
              'D:\\wamp64\\www\\doorstepfilings\\public\\storage',
              'D:\\wamp64\\www\\doorstepfilings\\storage\\app\\public',
          ]
        : [];

function normalizeRoot(storageRoot: string) {
    const resolvedRoot = path.resolve(storageRoot);

    return process.platform === 'win32'
        ? resolvedRoot.toLowerCase()
        : resolvedRoot;
}

function normalizeRequestedStoragePath(requestPath: string) {
    try {
        const decodedPath = decodeURIComponent(requestPath);
        const segments = decodedPath
            .replace(/\\/g, '/')
            .split('/')
            .filter(Boolean);

        if (
            segments.length === 0 ||
            segments.some((segment) => segment === '.' || segment === '..')
        ) {
            return null;
        }

        return segments.join(path.sep);
    } catch {
        return null;
    }
}

export function buildStorageRoots(
    configuredLegacyRoots?: string,
    currentStorageRoot = path.resolve(process.cwd(), 'public', 'storage'),
) {
    const parsedLegacyRoots = configuredLegacyRoots
        ? configuredLegacyRoots
              .split(/[;,\n]/)
              .map((value) => value.trim())
              .filter(Boolean)
        : [];

    const storageRoots = [
        currentStorageRoot,
        ...parsedLegacyRoots,
        ...DEFAULT_LEGACY_STORAGE_ROOTS,
    ];

    const uniqueRoots = new Map<string, string>();

    for (const storageRoot of storageRoots) {
        uniqueRoots.set(normalizeRoot(storageRoot), path.resolve(storageRoot));
    }

    return [...uniqueRoots.values()];
}

export function resolveStorageFilePath(
    requestPath: string,
    storageRoots: readonly string[],
) {
    const normalizedPath = normalizeRequestedStoragePath(requestPath);

    if (normalizedPath === null) {
        return null;
    }

    for (const storageRoot of storageRoots) {
        const resolvedRoot = path.resolve(storageRoot);
        const candidatePath = path.resolve(resolvedRoot, normalizedPath);
        const relativeToRoot = path.relative(resolvedRoot, candidatePath);

        if (
            relativeToRoot.startsWith('..') ||
            path.isAbsolute(relativeToRoot) ||
            !fs.existsSync(candidatePath)
        ) {
            continue;
        }

        if (fs.statSync(candidatePath).isFile()) {
            return candidatePath;
        }
    }

    return null;
}
