import { test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { $ } from 'bun';
import { runCli } from './cli';
import NodeID3 from 'node-id3';

const TEST_DIR = `${import.meta.dir}/run`;
const ORIGINAL_MP3 = `${import.meta.dir}/test.mp3`;
const TEST_MP3 = `${TEST_DIR}/test.mp3`;

beforeAll(async () => {
  await $`mkdir -p ${TEST_DIR}`;
});

beforeEach(async () => {
  // Clear all files in run directory
  await $`rm -rf ${TEST_DIR} && mkdir -p ${TEST_DIR}`.quiet();
  await Bun.write(TEST_MP3, Bun.file(ORIGINAL_MP3));
});

afterAll(async () => {
  await $`rm -rf ${TEST_DIR}`;
});

test('CLI runs interactive prompt smoothly without throwing errors', async () => {
  // We type Artist, then Enter, Title, Enter, Album, Enter, Year, Enter
  const inputs = [
    'John Coltrane', 'ENTER',
    'Moment\'s Notice', 'ENTER',
    'Blue Train', 'ENTER',
    '1958', 'ENTER',
    'J', 'a', 'z', 'z', 'ENTER', // Search genre
    'ENTER' // Confirm rename
  ];

  const out = await runCli([TEST_MP3], inputs);

  // Verify the CLI ran to completion successfully
  expect(out).toContain('Done!');
  expect(out).not.toContain('TypeError');
});

test('CLI pre-fills existing tags and works when just pressing ENTER', async () => {
  // Write initial tags
  NodeID3.update({
    artist: 'John Coltrane',
    title: 'Blue Train',
    album: 'Blue Train',
    year: '1958',
    genre: 'Jazz'
  }, TEST_MP3);

  // Just press enter through all prompts:
  // Artist -> Title -> Album -> Year -> Genre -> Rename
  const inputs = [
    'ENTER', // Artist
    'ENTER', // Title
    'ENTER', // Album
    'ENTER', // Year
    'ENTER', // Genre (since Jazz is pre-selected)
    'ENTER'  // Rename
  ];

  const out = await runCli([TEST_MP3], inputs);

  expect(out).toContain('Done!');
  expect(out).not.toContain('TypeError');

  // Verify the rename logic successfully used the pre-filled tags
  const newFilename = 'John Coltrane - Blue Train (1958).mp3';
  const newPath = `${TEST_DIR}/${newFilename}`;
  expect(await Bun.file(newPath).exists()).toBe(true);
});
