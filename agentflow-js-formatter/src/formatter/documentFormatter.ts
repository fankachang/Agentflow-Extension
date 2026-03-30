import { FormattingContext, FormattingResult } from '../types';
import { JsFormatter } from './jsFormatter';
import { BlankLineCompressor } from './blankLineCompressor';

export class DocumentFormatter {
  private jsFormatter = new JsFormatter();
  private compressor = new BlankLineCompressor();

  async format(context: FormattingContext): Promise<FormattingResult> {
    try {
      const formatted = await this.jsFormatter.format(context.sourceText, {
        tabSize: context.tabSize,
        insertSpaces: context.insertSpaces,
      });
      const compressed = this.compressor.compress(formatted);
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
