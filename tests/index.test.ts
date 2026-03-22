import { test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import NodeID3 from 'node-id3';

const TEST_DIR = path.join(import.meta.dir, 'run');
const ORIGINAL_MP3 = path.join(import.meta.dir, 'test.mp3');
const TEST_MP3 = path.join(TEST_DIR, 'test.mp3');

beforeAll(() => {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
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
    artist: 'John Coltrane',
    title: 'Moment\'s Notice',
    album: 'Blue Train',
    year: '1958',
    genre: 'Jazz',
  };

  // Act
  const success = NodeID3.update(newTags, TEST_MP3);

  // Assert
  expect(success).toBe(true);

  const readTags = NodeID3.read(TEST_MP3);
  expect(readTags.artist).toBe('John Coltrane');
  expect(readTags.title).toBe('Moment\'s Notice');
  expect(readTags.album).toBe('Blue Train');
  expect(readTags.year).toBe('1958');
  expect(readTags.genre).toBe('Jazz');
});