# MP3 ID3 Tag Editor

A lightning-fast, interactive CLI tool built with [Bun](https://bun.com/) and TypeScript to effortlessly edit MP3 ID3 tags and rename files intelligently.

## 🚀 Features

*   **Interactive Prompts:** Beautiful, user-friendly CLI prompts using `@clack/prompts`.
*   **Smart Prefilling:** Automatically reads and injects existing ID3 tags so you can quickly press `Enter` to keep them, or backspace to modify.
*   **Genre Autocomplete:** Features a searchable, standard list of popular music genres while also supporting custom entries.
*   **Single File Mode:** Prompts for Title, Artist, Album, Year, and Genre.
*   **Batch Directory Mode:** Scans an entire folder of MP3s, asks for Artist, Album, and Year, and applies them to all files at once (leaving individual titles and track numbers intact).
*   **Safe Auto-Renaming:** Cleanly renames files using the provided tags (e.g., `Queen - A Night at the Opera (1975) - Bohemian Rhapsody.mp3`), sanitizing illegal filesystem characters to prevent errors.

## 📦 Installation

Since this project uses Bun, ensure you have [Bun installed](https://bun.sh/).

```bash
# Clone the repository
git clone https://github.com/bjorn-eric/id3-editor.git
cd id3-editor

# Install dependencies
bun install
```

## 🛠️ Usage

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

You can compile this tool into an incredibly fast, standalone binary that requires no runtime to execute, and automatically link it to your global Bun `.bin` folder (`~/.bun/bin`) so you can run it from anywhere!

```bash
# Compile and install globally
bun run install:cli
```

*Note: Ensure `~/.bun/bin` is in your shell's `$PATH`.*

Now you can use the CLI from anywhere on your system:
```bash
id3-editor /path/to/song.mp3
```

*(To remove the global link later, simply run `bun run uninstall:cli`)*

## 🧪 Testing

This project uses Bun's built-in, ultra-fast test runner. To execute the test suite:
```bash
bun test
```