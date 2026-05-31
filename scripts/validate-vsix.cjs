const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const vsixPath = path.join(root, `pml-aveva-e3d-${version}.vsix`);

if (!fs.existsSync(vsixPath)) {
    fail(`VSIX not found: ${vsixPath}`);
}

const archive = readZipArchive(vsixPath);
const entries = Array.from(archive.entries.keys());

const required = [
    'extension/out/extension.js',
    'extension/packages/pml-language-server/out/server.js',
    'extension/packages/pml-language-server/out/cli.js',
    'extension/package.json',
    'extension.vsixmanifest'
];

const missing = required.filter(entry => !entries.includes(entry));
if (missing.length > 0) {
    fail(`VSIX is missing required files:\n${missing.map(entry => `- ${entry}`).join('\n')}`);
}

const blockedPattern = /(^|\/)(src|node_modules|manuals|objects|\.agents|\.codex|\.claude)\//;
const blocked = entries.filter(entry => blockedPattern.test(entry) || /\.tsx?$/.test(entry) || /\.map$/.test(entry));
if (blocked.length > 0) {
    fail(`VSIX contains blocked development files:\n${blocked.map(entry => `- ${entry}`).join('\n')}`);
}

const jsEntries = entries.filter(entry => entry.startsWith('extension/') && entry.endsWith('.js'));
const unresolvedLocalRequires = [];

for (const entry of jsEntries) {
    const content = readVsixEntry(entry);
    const requirePattern = /\brequire\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
    for (const match of content.matchAll(requirePattern)) {
        const request = match[1];
        if (!resolvePackagedRequire(entry, request, entries)) {
            unresolvedLocalRequires.push(`${entry}: ${request}`);
        }
    }
}

if (unresolvedLocalRequires.length > 0) {
    fail(`VSIX contains unresolved local JavaScript require() imports:\n${unresolvedLocalRequires.map(entry => `- ${entry}`).join('\n')}`);
}

console.log(`VSIX validation passed (${entries.length} files): ${path.basename(vsixPath)}`);

function readVsixEntry(entry) {
    return archive.readFile(entry).toString('utf8');
}

function readZipArchive(zipPath) {
    const buffer = fs.readFileSync(zipPath);
    const entriesByName = new Map();
    const eocdOffset = findEndOfCentralDirectory(buffer);
    const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
    const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
    const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

    let offset = centralDirectoryOffset;
    while (offset < centralDirectoryEnd) {
        if (buffer.readUInt32LE(offset) !== 0x02014b50) {
            fail(`Invalid VSIX central directory at offset ${offset}.`);
        }

        const compressionMethod = buffer.readUInt16LE(offset + 10);
        const compressedSize = buffer.readUInt32LE(offset + 20);
        const uncompressedSize = buffer.readUInt32LE(offset + 24);
        const fileNameLength = buffer.readUInt16LE(offset + 28);
        const extraLength = buffer.readUInt16LE(offset + 30);
        const commentLength = buffer.readUInt16LE(offset + 32);
        const localHeaderOffset = buffer.readUInt32LE(offset + 42);
        const name = buffer.toString('utf8', offset + 46, offset + 46 + fileNameLength);

        entriesByName.set(name, {
            compressionMethod,
            compressedSize,
            uncompressedSize,
            localHeaderOffset
        });

        offset += 46 + fileNameLength + extraLength + commentLength;
    }

    return {
        entries: entriesByName,
        readFile(name) {
            const entry = entriesByName.get(name);
            if (!entry) {
                fail(`VSIX entry not found: ${name}`);
            }

            if (buffer.readUInt32LE(entry.localHeaderOffset) !== 0x04034b50) {
                fail(`Invalid VSIX local file header for ${name}.`);
            }

            const localNameLength = buffer.readUInt16LE(entry.localHeaderOffset + 26);
            const localExtraLength = buffer.readUInt16LE(entry.localHeaderOffset + 28);
            const dataStart = entry.localHeaderOffset + 30 + localNameLength + localExtraLength;
            const dataEnd = dataStart + entry.compressedSize;
            const compressed = buffer.subarray(dataStart, dataEnd);

            if (entry.compressionMethod === 0) {
                return compressed;
            }

            if (entry.compressionMethod === 8) {
                const inflated = zlib.inflateRawSync(compressed);
                if (inflated.length !== entry.uncompressedSize) {
                    fail(`Unexpected uncompressed size for ${name}.`);
                }
                return inflated;
            }

            fail(`Unsupported VSIX compression method ${entry.compressionMethod} for ${name}.`);
        }
    };
}

function findEndOfCentralDirectory(buffer) {
    const minOffset = Math.max(0, buffer.length - 0xffff - 22);
    for (let offset = buffer.length - 22; offset >= minOffset; offset--) {
        if (buffer.readUInt32LE(offset) === 0x06054b50) {
            return offset;
        }
    }

    fail('Failed to find VSIX ZIP end-of-central-directory record.');
}

function resolvePackagedRequire(fromEntry, request, allEntries) {
    const fromDir = path.posix.dirname(fromEntry);
    const base = path.posix.normalize(path.posix.join(fromDir, request));
    const candidates = [
        base,
        `${base}.js`,
        path.posix.join(base, 'index.js')
    ];

    return candidates.some(candidate => allEntries.includes(candidate));
}

function fail(message) {
    console.error(message);
    process.exit(1);
}
