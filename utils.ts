import sanitizeFilename from 'sanitize-filename';

export function generateSuggestedName(artist: string, album: string, year: string, title: string, originalFilename: string): string {
    const a = artist.trim();
    const al = album.trim();
    const y = year.trim();
    const t = title.trim();

    let suggestedName = '';
    if (a) suggestedName += a;
    if (al) suggestedName += (suggestedName ? ' - ' : '') + al;
    if (y) suggestedName += ` (${y})`;
    if (t) suggestedName += (suggestedName ? ' - ' : '') + t;
    
    if (!suggestedName) {
        return originalFilename;
    }

    return sanitizeFilename(suggestedName) + '.mp3';
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
        newName = `${prefix} - ${originalFilename}`;
    } else {
        newName = originalFilename;
    }

    return sanitizeFilename(newName);
}
