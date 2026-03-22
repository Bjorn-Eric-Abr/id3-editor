import { test, expect } from 'bun:test';
import sanitizeFilename from 'sanitize-filename';
import { generateSuggestedName, generateBatchSuggestedName, extractTrackNumber } from '../utils';

test('generates valid single file name from tags', () => {
    const artist = 'John Coltrane';
    const album = 'Blue Train';
    const year = '1958';
    const title = 'Moment\'s Notice';
    const originalFilename = 'track01.mp3';

    const suggested = generateSuggestedName(artist, album, year, title, originalFilename);
    expect(suggested).toBe('John Coltrane - Blue Train - Moment\'s Notice (1958).mp3');
});

test('handles missing tags gracefully in single mode', () => {
    const suggested = generateSuggestedName('John Coltrane', '', '', 'Moment\'s Notice', 'track01.mp3');
    expect(suggested).toBe('John Coltrane - Moment\'s Notice.mp3');
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
    const artist = 'John Coltrane';
    const album = 'Blue Train';
    const year = '1958';
    const title = 'Blue Train';
    const originalFilename = 'track02.mp3';

    const suggested = generateSuggestedName(artist, album, year, title, originalFilename);
    expect(suggested).toBe('John Coltrane - Blue Train (1958).mp3');
});

test('generates valid batch name from tags', () => {
    const artist = 'John Coltrane';
    const album = 'Blue Train';
    const year = '1958';
    const originalName = '03 Moment\'s Notice.mp3';

    const suggested = generateBatchSuggestedName(artist, album, year, originalName);
    expect(suggested).toBe('John Coltrane - Blue Train (1958) - 03 Moment\'s Notice.mp3');
});

test('sanitizes illegal characters in batch mode', () => {
    const suggested = generateBatchSuggestedName('AC/DC', 'Back: In Black', '1980', 'Hells/Bells.mp3');
    expect(suggested).toBe('ACDC - Back In Black (1980) - HellsBells.mp3');
});

test('extracts track number from filename starting with a number', () => {
    expect(extractTrackNumber('01 - Track.mp3')).toBe('1');
    expect(extractTrackNumber('12 Track.mp3')).toBe('12');
    expect(extractTrackNumber('005.mp3')).toBe('5');
    expect(extractTrackNumber('3_song.mp3')).toBe('3');
});

test('returns undefined for filename not starting with a number', () => {
    expect(extractTrackNumber('Track 01.mp3')).toBeUndefined();
    expect(extractTrackNumber('song.mp3')).toBeUndefined();
    expect(extractTrackNumber(' - 01 Track.mp3')).toBeUndefined();
});
