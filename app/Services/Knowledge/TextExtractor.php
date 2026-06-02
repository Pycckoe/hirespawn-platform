<?php

namespace App\Services\Knowledge;

use RuntimeException;

/**
 * Extracts plain text from an uploaded knowledge file. Plain-text formats
 * (txt/md/csv/json) work out of the box; PDF requires the optional
 * smalot/pdfparser package — when it's absent we raise a clear error
 * instead of silently storing garbage.
 */
class TextExtractor
{
    public function extract(string $absolutePath, ?string $mime, string $filename): string
    {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        if (in_array($ext, ['txt', 'md', 'markdown', 'csv', 'json', 'text'], true)
            || str_starts_with((string) $mime, 'text/')) {
            $text = @file_get_contents($absolutePath);
            if ($text === false) {
                throw new RuntimeException('Could not read the uploaded file.');
            }

            return $text;
        }

        if ($ext === 'pdf' || $mime === 'application/pdf') {
            if (! class_exists(\Smalot\PdfParser\Parser::class)) {
                throw new RuntimeException('PDF support is not installed on the server yet. Upload a .txt or .md file, or paste the text directly.');
            }
            $parser = new \Smalot\PdfParser\Parser();

            return $parser->parseFile($absolutePath)->getText();
        }

        throw new RuntimeException("Unsupported file type: .{$ext}. Use txt, md, or pdf.");
    }
}
