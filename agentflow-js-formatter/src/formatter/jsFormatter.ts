import * as prettier from 'prettier';

export class JsFormatter {
  async format(
    sourceText: string,
    options: { tabSize: number; insertSpaces: boolean }
  ): Promise<string> {
    return prettier.format(sourceText, {
      parser: 'babel',
      tabWidth: options.tabSize,
      useTabs: !options.insertSpaces,
      semi: true,
      singleQuote: false,
    });
  }
}
