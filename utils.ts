import sanitizeFilename from 'sanitize-filename';
import enquirer from 'enquirer';
import chalk from 'chalk';
// @ts-ignore
const { Form } = enquirer;

export function logBox(label: string, value: string, labelColor: (text: string) => string = chalk.blue, valueColor: (text: string) => string = chalk.cyan.bold) {
    const textLabel = ` ${label} `;
    const textValue = `${value} `;
    const totalLen = textLabel.length + textValue.length;
    const topBorder = '┌' + '─'.repeat(totalLen) + '┐';
    const bottomBorder = '└' + '─'.repeat(totalLen) + '┘';

    console.log();
    console.log(chalk.gray(topBorder));
    console.log(`${chalk.gray('│')}${' '.repeat(totalLen)}${chalk.gray('│')}`);
    console.log(`${chalk.gray('│')}${labelColor(textLabel)}${valueColor(textValue)}${chalk.gray('│')}`);
    console.log(`${chalk.gray('│')}${' '.repeat(totalLen)}${chalk.gray('│')}`);
    console.log(chalk.gray(bottomBorder) + '\n');
}

export function createFormPrompt(name: string, message: string, choices: { name: string, message: string, initial: string }[]) {
    const prompt = new Form({
        name,
        message,
        choices
    });

    const originalSubmit = prompt.submit.bind(prompt);
    
    // Override the submit behavior so Enter moves to the next field
    // unless we are on the very last field.
    prompt.submit = async function (this: any) {
        if (this.index < this.choices.length - 1) {
            return this.down();
        }
        return originalSubmit();
    };

    return prompt;
}

export function generateSuggestedName(artist: string, album: string, year: string, title: string, originalFilename: string): string {
    const a = artist.trim();
    const al = album.trim();
    const y = year.trim();
    const t = title.trim();

    let nameParts: string[] = [];

    // Prepend track number if it exists in the original filename
    const trackNumber = extractTrackNumber(originalFilename);
    if (trackNumber) {
        nameParts.push(trackNumber.padStart(2, '0'));
    }

    if (a) nameParts.push(a);

    if (al && al === t) {
        nameParts.push(al);
    } else {
        if (al) nameParts.push(al);
        if (t) nameParts.push(t);
    }

    let baseName = nameParts.join(' - ');

    if (y) baseName += ` (${y})`;
    
    if (!baseName) {
        return originalFilename;
    }

    return sanitizeFilename(baseName) + '.mp3';
}

export function generateBatchSuggestedName(artist: string, album: string, year: string, originalFilename: string): string {
    const a = artist.trim();
    const al = album.trim();
    const y = year.trim();

    let prefix = '';
    if (a) prefix += a;
    if (al) prefix += (prefix ? ' - ' : '') + al;
    if (y) prefix += ` (${y})`;

    let newName = '';
    if (prefix) {
        // Prevent duplicate prefixes if the tool is run twice
        if (originalFilename.startsWith(prefix + ' - ')) {
            return sanitizeFilename(originalFilename);
        }
        newName = `${prefix} - ${originalFilename}`;
    } else {
        newName = originalFilename;
    }

    return sanitizeFilename(newName);
}

/**
 * Extracts a track number from the beginning of a filename.
 * E.g., "01 - Intro.mp3" -> "1", "12 track.mp3" -> "12"
 */
export function extractTrackNumber(filename: string): string | undefined {
    const match = filename.match(/^0*(\d+)/);
    if (match) {
        return match[1];
    }
    return undefined;
}

/**
 * Returns a unique filename by appending an incrementing suffix if the file already exists.
 * E.g., "song.mp3" -> "song (1).mp3" -> "song (2).mp3"
 */
export async function getUniqueFilename(directory: string, filename: string): Promise<string> {
    const { join, extname, basename } = await import('node:path');
    
    let currentPath = join(directory, filename);
    let currentName = filename;
    let counter = 1;

    const ext = extname(filename);
    const nameWithoutExt = basename(filename, ext);

    // Using Bun.file to check for existence per the project guidelines
    while (await Bun.file(currentPath).exists()) {
        currentName = `${nameWithoutExt} (${counter})${ext}`;
        currentPath = join(directory, currentName);
        counter++;
    }

    return currentName;
}


