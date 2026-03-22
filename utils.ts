import sanitizeFilename from 'sanitize-filename';

export function generateSuggestedName(artist: string, album: string, year: string, title: string, originalFilename: string): string {
    const a = artist.trim();
    const al = album.trim();
    const y = year.trim();
    const t = title.trim();

    let nameParts: string[] = [];

    // Prepend track number if it exists in the original filename
    const trackNumber = extractTrackNumber(originalFilename);
    if (trackNumber) {
        nameParts.push(trackNumber.padStart(2, '0'));
    }

    if (a) nameParts.push(a);

    if (al && al === t) {
        nameParts.push(al);
    } else {
        if (al) nameParts.push(al);
        if (t) nameParts.push(t);
    }

    let baseName = nameParts.join(' - ');

    if (y) baseName += ` (${y})`;
    
    if (!baseName) {
        return originalFilename;
    }

    return sanitizeFilename(baseName) + '.mp3';
}

export function generateBatchSuggestedName(artist: string, album: string, year: string, originalFilename: string): string {
    const a = artist.trim();
    const al = album.trim();
    const y = year.trim();

    let prefix = '';
    if (a) prefix += a;
    if (al) prefix += (prefix ? ' - ' : '') + al;
    if (y) prefix += ` (${y})`;

    let newName = '';
    if (prefix) {
        // Prevent duplicate prefixes if the tool is run twice
        if (originalFilename.startsWith(prefix + ' - ')) {
            return sanitizeFilename(originalFilename);
        }
        newName = `${prefix} - ${originalFilename}`;
    } else {
        newName = originalFilename;
    }

    return sanitizeFilename(newName);
}

/**
 * Extracts a track number from the beginning of a filename.
 * E.g., "01 - Intro.mp3" -> "1", "12 track.mp3" -> "12"
 */
export function extractTrackNumber(filename: string): string | undefined {
    const match = filename.match(/^0*(\d+)/);
    if (match) {
        return match[1];
    }
    return undefined;
}

/**
 * Returns a unique filename by appending an incrementing suffix if the file already exists.
 * E.g., "song.mp3" -> "song (1).mp3" -> "song (2).mp3"
 */
export async function getUniqueFilename(directory: string, filename: string): Promise<string> {
    const { join, extname, basename } = await import('node:path');
    
    let currentPath = join(directory, filename);
    let currentName = filename;
    let counter = 1;

    const ext = extname(filename);
    const nameWithoutExt = basename(filename, ext);

    // Using Bun.file to check for existence per the project guidelines
    while (await Bun.file(currentPath).exists()) {
        currentName = `${nameWithoutExt} (${counter})${ext}`;
        currentPath = join(directory, currentName);
        counter++;
    }

    return currentName;
}


