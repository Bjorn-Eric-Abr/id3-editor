# MP3 ID3 Tag Editor

A CLI tool built with [Bun](https://bun.com/) and TypeScript to edit MP3 ID3
tags and rename files.

## Features

* **Interactive Prompts:** CLI prompts using `@clack/prompts`.
* **Prefilling:** Reads existing ID3 tags and uses them as default values for
  the prompts.
* **Genre Autocomplete:** Searchable list of standard music genres, with
  support for custom entries.
* **Single File Mode:** Prompts for Title, Artist, Album, Year, and Genre.
* **Batch Directory Mode:** Scans a folder of MP3s, prompts for Artist, Album,
  and Year, and applies them to all files.
* **Auto-Renaming:** Renames files using the provided tags (e.g.,
  `Queen - A Night at the Opera (1975) - Bohemian Rhapsody.mp3`), sanitizing
  illegal filesystem characters.

## Installation

Requires [Bun](https://bun.sh/).

```bash
git clone https://github.com/Bjorn-Eric-Abr/id3-edit.git
cd id3-edit
bun install
```

## Usage

### Running via Bun

To edit a single file:

```bash
bun run index.ts /path/to/song.mp3
```

To edit an entire directory of MP3s:

```bash
bun run index.ts /path/to/album_folder/
```

### Compiling and Installing Globally

You can compile this tool into a standalone binary and link it to your global
Bun `.bin` folder (`~/.bun/bin`).

```bash
bun run install:cli
```

*Note: Ensure `~/.bun/bin` is in your shell's `$PATH`.*

Now you can use the CLI from anywhere on your system:

```bash
id3-edit /path/to/song.mp3
```

*(To remove the global link later, run `bun run uninstall:cli`)*

## Testing

To execute the test suite:

```bash
bun test
```
