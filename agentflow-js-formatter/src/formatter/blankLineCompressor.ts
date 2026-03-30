export class BlankLineCompressor {
  compress(text: string): string {
    return text.replace(/\n{3,}/g, '\n\n');
  }
}
