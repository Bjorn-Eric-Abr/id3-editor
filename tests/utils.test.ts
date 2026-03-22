import { test, expect } from 'bun:test';
import sanitizeFilename from 'sanitize-filename';
import { generateSuggestedName, generateBatchSuggestedName } from '../utils';

test('generates valid single file name from tags', () => {
    const artist = 'Queen';
    const album = 'A Night at the Opera';
    const year = '1975';
    const title = 'Bohemian Rhapsody';
    const originalFilename = 'track01.mp3';

    const suggested = generateSuggestedName(artist, album, year, title, originalFilename);
    expect(suggested).toBe('Queen - A Night at the Opera - Bohemian Rhapsody (1975).mp3');
});

test('handles missing tags gracefully in single mode', () => {
    const suggested = generateSuggestedName('Queen', '', '', 'Bohemian Rhapsody', 'track01.mp3');
    expect(suggested).toBe('Queen - Bohemian Rhapsody.mp3');
});

test('falls back to original name if all tags are empty', () => {
    const suggested = generateSuggestedName('', '', '', '', 'track01.mp3');
    expect(suggested).toBe('track01.mp3');
});

test('sanitizes illegal characters in single mode', () => {
    const suggested = generateSuggestedName('AC/DC', 'Back: In Black', '1980', 'Hells/Bells', 'track01.mp3');
    // sanitize-filename removes slashes and colons
    expect(suggested).toBe('ACDC - Back In Black - HellsBells (1980).mp3');
});

test('uses only album in filename if album and title are identical', () => {
    const artist = 'Pink Floyd';
    const album = 'The Dark Side of the Moon';
    const year = '1973';
    const title = 'The Dark Side of the Moon';
    const originalFilename = 'money.mp3';

    const suggested = generateSuggestedName(artist, album, year, title, originalFilename);
    expect(suggested).toBe('Pink Floyd - The Dark Side of the Moon (1973).mp3');
});

test('generates valid batch name from tags', () => {
    const artist = 'Daft Punk';
    const album = 'Discovery';
    const year = '2001';
    const originalName = '03 Digital Love.mp3';

    const suggested = generateBatchSuggestedName(artist, album, year, originalName);
    expect(suggested).toBe('Daft Punk - Discovery (2001) - 03 Digital Love.mp3');
});

test('sanitizes illegal characters in batch mode', () => {
    const suggested = generateBatchSuggestedName('AC/DC', 'Back: In Black', '1980', 'Hells/Bells.mp3');
    expect(suggested).toBe('ACDC - Back In Black (1980) - HellsBells.mp3');
});