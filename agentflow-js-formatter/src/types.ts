export interface CustomBlock {
  index: number;
  startLine: number;
  endLine: number;
  originalText: string;
  placeholder: string;
}

export interface FormattingContext {
  sourceText: string;
  tabSize: number;
  insertSpaces: boolean;
}

export interface FormattingResult {
  success: boolean;
  formattedText: string | null;
  error: Error | null;
}
