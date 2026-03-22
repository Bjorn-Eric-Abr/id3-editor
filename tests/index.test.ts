import { test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { $ } from 'bun';
import path from 'node:path';
import NodeID3 from 'node-id3';

const TEST_DIR = path.join(import.meta.dir, 'run');
const ORIGINAL_MP3 = path.join(import.meta.dir, 'test.mp3');
const TEST_MP3 = path.join(TEST_DIR, 'test.mp3');

beforeAll(async () => {
  await $`mkdir -p ${TEST_DIR}`.quiet();
});

beforeEach(async () => {
  // Reset the test file before every test
  await $`rm -rf ${TEST_DIR} && mkdir -p ${TEST_DIR}`.quiet();
  await Bun.write(TEST_MP3, Bun.file(ORIGINAL_MP3));
});

afterAll(async () => {
  // Clean up the run directory
  await $`rm -rf ${TEST_DIR}`.quiet();
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

test('NodeID3.Promise can read and write trackNumber to the test mp3', async () => {
  const newTags: NodeID3.Tags = {
    artist: 'Miles Davis',
    title: 'Kind of Blue',
    trackNumber: '3'
  };

  const success = await NodeID3.Promise.update(newTags, TEST_MP3)
    .then(() => true)
    .catch(() => false);
  expect(success).toBe(true);

  const readTags = NodeID3.read(TEST_MP3);
  expect(readTags.trackNumber).toBe('3');
});


