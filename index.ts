import { promises as fs } from 'node:fs';
import path from 'node:path';
import enquirer from 'enquirer';
// @ts-ignore
const { Confirm, AutoComplete, Input } = enquirer;
import chalk from 'chalk';
import NodeID3 from 'node-id3';
import { generateSuggestedName, generateBatchSuggestedName, extractTrackNumber, getUniqueFilename, createFormPrompt } from './utils';

async function main() {
  const targetPath = process.argv[2];

  if (!targetPath) {
    console.log(chalk.bold.blue('MP3 ID3 Editor'));
    console.error(chalk.red('Please provide a file or directory path as an argument.'));
    console.error(chalk.gray('Usage: bun run index.ts <file_or_directory>'));
    process.exit(1);
  }

  const absolutePath = path.resolve(targetPath);

  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch {
    console.log(chalk.bold.blue('MP3 ID3 Editor'));
    console.error(chalk.red(`Path does not exist: ${absolutePath}`));
    process.exit(1);
  }

  console.log(chalk.bold.blue('\n🎧 MP3 ID3 Editor\n'));

  if (stat.isFile()) {
    if (path.extname(absolutePath).toLowerCase() !== '.mp3') {
      console.error(chalk.red('The provided file is not an MP3 file.'));
      process.exit(1);
    }
    await handleSingleFile(absolutePath);
  } else if (stat.isDirectory()) {
    await handleDirectory(absolutePath);
  }

  console.log(chalk.green('\n✨ Done!\n'));
}

export async function handleSingleFile(filePath: string) {
  const filename = path.basename(filePath);
  console.log(chalk.cyan(`Editing File: ${filename}\n`));

  const tags = NodeID3.read(filePath);

  const commonGenres = [
    'Acoustic', 'Alternative', 'Ambient', 'Blues', 'Classical', 'Country', 
    'Dance', 'Electronic', 'Folk', 'Hip-Hop', 'Indie', 'Jazz', 'Latin', 
    'Metal', 'Pop', 'Punk', 'R&B', 'Rap', 'Reggae', 'Rock', 'Soul', 'Soundtrack', 'Techno'
  ];

  let initialGenre = tags.genre || '';
  const genreChoices = commonGenres.map(g => ({ name: g, message: g }));
  let initialGenreIndex = 0;

  if (initialGenre && !commonGenres.includes(initialGenre)) {
    genreChoices.unshift({ name: initialGenre, message: initialGenre });
  } else if (initialGenre) {
    // If initialGenre is one of the common genres, find its index
    initialGenreIndex = genreChoices.findIndex(choice => choice.name === initialGenre);
  }

  genreChoices.push({ name: 'Custom...', message: 'Custom...' });

  try {
    const prompt = createFormPrompt(
      'metadata',
      'Update ID3 Tags (Enter to go to next field, submit on last field):',
      [
        { name: 'artist', message: chalk.blue('Artist'), initial: tags.artist || '' },
        { name: 'title', message: chalk.blue('Title'), initial: tags.title || '' },
        { name: 'album', message: chalk.blue('Album'), initial: tags.album || '' },
        { name: 'year', message: chalk.blue('Year'), initial: tags.year || '' },
      ]
    );

    const results = await prompt.run();

    let genre = await new AutoComplete({
      name: 'genre',
      message: 'Select Genre (start typing to filter):',
      limit: 10,
      initial: initialGenreIndex, // Use the determined index
      choices: genreChoices,
      suggest: (input: string, choices: { name: string; message: string }[]) => 
        choices.filter(choice => choice.name.toLowerCase().includes(input.toLowerCase()))
    }).run();

    if (genre === 'Custom...') {
      genre = await new Input({
        message: 'Enter custom genre:',
      }).run();
    }

    // Write new tags
    const newTags: NodeID3.Tags = {
      title: results.title,
      artist: results.artist,
      album: results.album,
      year: results.year,
      genre: genre,
    };

    const success = NodeID3.update(newTags, filePath);
    if (success) {
      console.log(chalk.green('\n✔ Successfully updated ID3 tags.'));
    } else {
      console.error(chalk.red('\n✖ Failed to update ID3 tags.'));
      return;
    }

    // Rename
    let suggestedName = generateSuggestedName(
      results.artist, 
      results.album, 
      results.year, 
      results.title, 
      filename
    );

    if (suggestedName !== filename) {
      const dirName = path.dirname(filePath);
      suggestedName = await getUniqueFilename(dirName, suggestedName);

      const rename = await new Confirm({
        name: 'question',
        message: `Rename file to "${suggestedName}"?`,
        initial: true
      }).run();

      if (rename) {
        const newPath = path.join(dirName, suggestedName);
        try {
          await fs.rename(filePath, newPath);
          console.log(chalk.green(`✔ Renamed to: ${suggestedName}`));
        } catch (err) {
          console.error(chalk.red(`✖ Failed to rename file: ${err}`));
        }
      }
    }
  } catch (err) {
    // Handling Ctrl+C
    console.log(chalk.gray('\nOperation cancelled.'));
    process.exit(0);
  }
}

export async function handleDirectory(dirPath: string) {
  const files = await fs.readdir(dirPath);
  const mp3Files = files.filter((f: string) => path.extname(f).toLowerCase() === '.mp3').map((f: string) => path.join(dirPath, f));

  if (mp3Files.length === 0) {
    console.log(chalk.yellow('⚠ No MP3 files found in the directory.'));
    return;
  }

  console.log(chalk.cyan(`Batch Mode: Found ${mp3Files.length} MP3 files in ${path.basename(dirPath)}\n`));

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

  try {
    const prompt = createFormPrompt(
      'metadata',
      'Update ID3 Tags for ALL files (Enter to go to next field, submit on last field):',
      [
        { name: 'artist', message: chalk.blue('Artist'), initial: defaultArtist },
        { name: 'album', message: chalk.blue('Album'), initial: defaultAlbum },
        { name: 'year', message: chalk.blue('Year'), initial: defaultYear },
      ]
    );

    const results = await prompt.run();

    const newTags: NodeID3.Tags = {
      artist: results.artist,
      album: results.album,
      year: results.year,
    };

    console.log(chalk.gray('\nUpdating ID3 tags for all files...'));

    let successCount = 0;
    
    // Process files sequentially to avoid EMFILE (Too many open files) on large directories
    for (const file of mp3Files) {
      const originalName = path.basename(file);
      const trackNumber = extractTrackNumber(originalName);
      
      const fileTags = { ...newTags };
      if (trackNumber) {
        fileTags.trackNumber = trackNumber;
      }

      try {
        await NodeID3.Promise.update(fileTags, file);
        successCount++;
      } catch (err) {
        console.error(chalk.red(`\n✖ Failed to update ID3 tags for ${originalName}: ${err}`));
      }
    }

    console.log(chalk.green(`✔ Updated tags for ${successCount}/${mp3Files.length} files.\n`));

    const rename = await new Confirm({
      name: 'question',
      message: 'Rename all files to include Artist, Album, and Year?',
      initial: true
    }).run();

    if (rename) {
      console.log(chalk.gray('Renaming files...'));
      let renameCount = 0;
      
      for (const file of mp3Files) {
        const originalName = path.basename(file);
        
        let newName = generateBatchSuggestedName(
          results.artist,
          results.album,
          results.year,
          originalName
        );
        
        if (newName !== originalName) {
          const dirName = path.dirname(file);
          newName = await getUniqueFilename(dirName, newName);
          
          const newPath = path.join(dirName, newName);
          try {
            await fs.rename(file, newPath);
            renameCount++;
          } catch (err) {
            console.warn(chalk.yellow(`⚠ Failed to rename ${originalName}: ${err}`));
          }
        }
      }
      
      console.log(chalk.green(`✔ Renamed ${renameCount}/${mp3Files.length} files.`));
    }
  } catch (err) {
    console.log(chalk.gray('\nOperation cancelled.'));
    process.exit(0);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}
