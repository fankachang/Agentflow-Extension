import { FormattingContext, FormattingResult } from '../types';
import { JsFormatter } from './jsFormatter';
import { BlankLineCompressor } from './blankLineCompressor';
import { CustomBlockDetector } from './customBlockDetector';

export class DocumentFormatter {
  private jsFormatter = new JsFormatter();
  private compressor = new BlankLineCompressor();
  private detector = new CustomBlockDetector();

  async format(context: FormattingContext): Promise<FormattingResult> {
    try {
      const { extractedText, blocks } = this.detector.extract(context.sourceText);
      const formatted = await this.jsFormatter.format(extractedText, {
        tabSize: context.tabSize,
        insertSpaces: context.insertSpaces,
      });
      const restored = this.detector.restore(formatted, blocks);
      const compressed = this.compressor.compress(restored);
      return { success: true, formattedText: compressed, error: null };
    } catch (err) {
      return {
        success: false,
        formattedText: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}
