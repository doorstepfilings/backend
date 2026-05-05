"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStorageRoots = buildStorageRoots;
exports.resolveStorageFilePath = resolveStorageFilePath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_LEGACY_STORAGE_ROOTS = process.platform === 'win32'
    ? [
        'D:\\wamp64\\www\\doorstepfilings\\public\\storage',
        'D:\\wamp64\\www\\doorstepfilings\\storage\\app\\public',
    ]
    : [];
function normalizeRoot(storageRoot) {
    const resolvedRoot = path.resolve(storageRoot);
    return process.platform === 'win32'
        ? resolvedRoot.toLowerCase()
        : resolvedRoot;
}
function normalizeRequestedStoragePath(requestPath) {
    try {
        const decodedPath = decodeURIComponent(requestPath);
        const segments = decodedPath
            .replace(/\\/g, '/')
            .split('/')
            .filter(Boolean);
        if (segments.length === 0 ||
            segments.some((segment) => segment === '.' || segment === '..')) {
            return null;
        }
        return segments.join(path.sep);
    }
    catch {
        return null;
    }
}
function buildStorageRoots(configuredLegacyRoots, currentStorageRoot = path.resolve(process.cwd(), 'public', 'storage')) {
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
    const uniqueRoots = new Map();
    for (const storageRoot of storageRoots) {
        uniqueRoots.set(normalizeRoot(storageRoot), path.resolve(storageRoot));
    }
    return [...uniqueRoots.values()];
}
function resolveStorageFilePath(requestPath, storageRoots) {
    const normalizedPath = normalizeRequestedStoragePath(requestPath);
    if (normalizedPath === null) {
        return null;
    }
    for (const storageRoot of storageRoots) {
        const resolvedRoot = path.resolve(storageRoot);
        const candidatePath = path.resolve(resolvedRoot, normalizedPath);
        const relativeToRoot = path.relative(resolvedRoot, candidatePath);
        if (relativeToRoot.startsWith('..') ||
            path.isAbsolute(relativeToRoot) ||
            !fs.existsSync(candidatePath)) {
            continue;
        }
        if (fs.statSync(candidatePath).isFile()) {
            return candidatePath;
        }
    }
    return null;
}
//# sourceMappingURL=storage-file-resolver.js.map