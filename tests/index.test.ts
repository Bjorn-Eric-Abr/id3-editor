import { test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import NodeID3 from 'node-id3';

const TEST_DIR = path.join(import.meta.dir, 'run');
const ORIGINAL_MP3 = path.join(import.meta.dir, 'test.mp3');
const TEST_MP3 = path.join(TEST_DIR, 'test.mp3');

beforeAll(async () => {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
  
  // Download the dummy MP3 file for testing if it doesn't exist (e.g., in CI environments)
  if (!fs.existsSync(ORIGINAL_MP3)) {
    const response = await fetch('https://github.com/mathiasbynens/small/raw/master/mp3.mp3');
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(ORIGINAL_MP3, Buffer.from(buffer));
  }
});

beforeEach(() => {
  // Reset the test file before every test
  if (fs.existsSync(TEST_MP3)) {
    fs.unlinkSync(TEST_MP3);
  }
  fs.copyFileSync(ORIGINAL_MP3, TEST_MP3);
});

afterAll(() => {
  // Clean up the run directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

test('NodeID3 can read and write tags to the test mp3', () => {
  // Arrange
  const newTags: NodeID3.Tags = {
    title: 'Test Title',
    artist: 'Test Artist',
    album: 'Test Album',
    year: '2024',
    genre: 'Rock',
  };

  // Act
  const success = NodeID3.update(newTags, TEST_MP3);

  // Assert
  expect(success).toBe(true);

  const readTags = NodeID3.read(TEST_MP3);
  expect(readTags.title).toBe('Test Title');
  expect(readTags.artist).toBe('Test Artist');
  expect(readTags.album).toBe('Test Album');
  expect(readTags.year).toBe('2024');
  expect(readTags.genre).toBe('Rock');
});