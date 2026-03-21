import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import NodeID3 from 'node-id3';
import { generateSuggestedName, generateBatchSuggestedName } from './utils';

async function main() {
  const targetPath = process.argv[2];

  if (!targetPath) {
    p.intro('MP3 ID3 Editor');
    p.log.error('Please provide a file or directory path as an argument.');
    p.log.message('Usage: bun run index.ts <file_or_directory>');
    process.exit(1);
  }

  const absolutePath = path.resolve(targetPath);

  if (!fs.existsSync(absolutePath)) {
    p.intro('MP3 ID3 Editor');
    p.log.error(`Path does not exist: ${absolutePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(absolutePath);

  p.intro('MP3 ID3 Editor');

  if (stat.isFile()) {
    if (path.extname(absolutePath).toLowerCase() !== '.mp3') {
      p.log.error('The provided file is not an MP3 file.');
      process.exit(1);
    }
    await handleSingleFile(absolutePath);
  } else if (stat.isDirectory()) {
    await handleDirectory(absolutePath);
  }

  p.outro('Done!');
}

export async function handleSingleFile(filePath: string) {
  const filename = path.basename(filePath);
  p.note(`Editing File: ${filename}`);

  const tags = NodeID3.read(filePath);

  const commonGenres = [
    'Acoustic', 'Alternative', 'Ambient', 'Blues', 'Classical', 'Country', 
    'Dance', 'Electronic', 'Folk', 'Hip-Hop', 'Indie', 'Jazz', 'Latin', 
    'Metal', 'Pop', 'Punk', 'R&B', 'Rap', 'Reggae', 'Rock', 'Soul', 'Soundtrack', 'Techno'
  ];

  let initialGenre = tags.genre || '';
  const genreOptions = commonGenres.map(g => ({ value: g, label: g }));
  if (initialGenre && !commonGenres.includes(initialGenre)) {
    genreOptions.unshift({ value: initialGenre, label: initialGenre });
  }
  genreOptions.push({ value: '__custom__', label: 'Custom...' });

  const results = await p.group(
    {
      title: () => p.text({ message: 'Title:', initialValue: tags.title || '' }),
      artist: () => p.text({ message: 'Artist:', initialValue: tags.artist || '' }),
      album: () => p.text({ message: 'Album:', initialValue: tags.album || '' }),
      year: () => p.text({ message: 'Year:', initialValue: tags.year || '' }),
      genre: () => p.autocomplete({ 
        message: 'Genre:', 
        options: genreOptions, 
        initialValue: initialGenre ? initialGenre : undefined 
      }),
      customGenre: ({ results: r }) => 
        r.genre === '__custom__' ? p.text({ message: 'Enter custom genre:' }) : undefined
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      }
    }
  );

  const finalGenre = results.genre === '__custom__' ? results.customGenre : results.genre;

  // Write new tags
  const newTags: NodeID3.Tags = {
    title: results.title as string,
    artist: results.artist as string,
    album: results.album as string,
    year: results.year as string,
    genre: finalGenre as string,
  };

  const success = NodeID3.update(newTags, filePath);
  if (success) {
    p.log.success('Successfully updated ID3 tags.');
  } else {
    p.log.error('Failed to update ID3 tags.');
    return;
  }

  // Rename
  let suggestedName = generateSuggestedName(
    results.artist as string, 
    results.album as string, 
    results.year as string, 
    results.title as string, 
    filename
  );

  if (suggestedName !== filename) {
    const rename = await p.confirm({
      message: `Rename file to "${suggestedName}"?`,
      initialValue: true,
    });

    if (p.isCancel(rename)) return;

    if (rename) {
      const newPath = path.join(path.dirname(filePath), suggestedName);
      try {
        fs.renameSync(filePath, newPath);
        p.log.success(`Renamed to: ${suggestedName}`);
      } catch (err) {
        p.log.error(`Failed to rename file: ${err}`);
      }
    }
  }
}

export async function handleDirectory(dirPath: string) {
  const files = fs.readdirSync(dirPath);
  const mp3Files = files.filter(f => path.extname(f).toLowerCase() === '.mp3').map(f => path.join(dirPath, f));

  if (mp3Files.length === 0) {
    p.log.warn('No MP3 files found in the directory.');
    return;
  }

  p.note(`Batch Mode: Found ${mp3Files.length} MP3 files in ${path.basename(dirPath)}`);

  // Read tags from the first file to prefill
  let defaultArtist = '';
  let defaultAlbum = '';
  let defaultYear = '';

  if (mp3Files.length > 0) {
    const firstTags = NodeID3.read(mp3Files[0] as string);
    defaultArtist = firstTags.artist || '';
    defaultAlbum = firstTags.album || '';
    defaultYear = firstTags.year || '';
  }

  const results = await p.group(
    {
      artist: () => p.text({ message: 'Artist (for all files):', initialValue: defaultArtist }),
      album: () => p.text({ message: 'Album (for all files):', initialValue: defaultAlbum }),
      year: () => p.text({ message: 'Year (for all files):', initialValue: defaultYear }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      }
    }
  );

  const newTags: NodeID3.Tags = {
    artist: results.artist as string,
    album: results.album as string,
    year: results.year as string,
  };

  const s = p.spinner();
  s.start('Updating ID3 tags for all files...');

  let successCount = 0;
  for (const file of mp3Files) {
    const success = NodeID3.update(newTags, file);
    if (success) successCount++;
  }

  s.stop(`Updated tags for ${successCount}/${mp3Files.length} files.`);

  const rename = await p.confirm({
    message: `Rename all files to include Artist, Album, and Year?`,
    initialValue: true,
  });

  if (p.isCancel(rename)) return;

  if (rename) {
    const rs = p.spinner();
    rs.start('Renaming files...');
    let renameCount = 0;
    
    for (const file of mp3Files) {
      const originalName = path.basename(file);
      
      let newName = generateBatchSuggestedName(
        results.artist as string,
        results.album as string,
        results.year as string,
        originalName
      );
      
      if (newName !== originalName) {
        const newPath = path.join(path.dirname(file), newName);
        try {
          fs.renameSync(file, newPath);
          renameCount++;
        } catch (err) {
          // Ignore individual errors for now
        }
      }
    }
    
    rs.stop(`Renamed ${renameCount}/${mp3Files.length} files.`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
