import sanitizeFilename from 'sanitize-filename';

export function generateSuggestedName(artist: string, album: string, year: string, title: string, originalFilename: string): string {
    const a = artist.trim();
    const al = album.trim();
    const y = year.trim();
    const t = title.trim();

    let nameParts: string[] = [];

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
        newName = `${prefix} - ${originalFilename}`;
    } else {
        newName = originalFilename;
    }

    return sanitizeFilename(newName);
}
