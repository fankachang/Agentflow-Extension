import { CustomBlock } from '../types';

const BLOCK_START_RE = /^[\t ]*\{[^}\n]+:\s*$/;
const PLACEHOLDER_PREFIX = '__AGENTFLOW_BLOCK_';
const PLACEHOLDER_SUFFIX = '__';

interface ParseState {
  inString: null | "'" | '"' | '`';
  inBlockComment: boolean;
}

function cloneState(s: ParseState): ParseState {
  return { inString: s.inString, inBlockComment: s.inBlockComment };
}

/**
 * 逐字元掃描一行，更新解析狀態（字串/註解追蹤）。
 * 回傳該行在「活躍上下文」（非字串/非註解）中的大括號序列。
 */
function scanLine(line: string, state: ParseState): Array<{ char: '{' | '}' }> {
  const braces: Array<{ char: '{' | '}' }> = [];
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    const next = i + 1 < line.length ? line[i + 1] : '';

    if (state.inBlockComment) {
      if (ch === '*' && next === '/') {
        state.inBlockComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (state.inString !== null) {
      if (ch === '\\') {
        i += 2; // 跳過跳脫字元
      } else if (ch === state.inString) {
        state.inString = null;
        i++;
      } else {
        i++;
      }
      continue;
    }

    // 活躍上下文
    if (ch === '/' && next === '/') {
      break; // 單行註解：本行其餘皆為註解
    }
    if (ch === '/' && next === '*') {
      state.inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      state.inString = ch as "'" | '"' | '`';
      i++;
      continue;
    }
    if (ch === '{') {
      braces.push({ char: '{' });
    } else if (ch === '}') {
      braces.push({ char: '}' });
    }
    i++;
  }

  return braces;
}

export class CustomBlockDetector {
  detect(sourceText: string): CustomBlock[] {
    const lines = sourceText.split('\n');
    const blocks: CustomBlock[] = [];
    const state: ParseState = { inString: null, inBlockComment: false };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const isActive = state.inString === null && !state.inBlockComment;

      if (isActive && BLOCK_START_RE.test(line)) {
        // 處理起始行以更新狀態
        scanLine(line, state);

        // 向後尋找配對的結尾行
        const countState = cloneState(state);
        let depth = 1;
        let endLine = -1;

        for (let j = i + 1; j < lines.length; j++) {
          const braces = scanLine(lines[j], countState);
          for (const b of braces) {
            if (b.char === '{') {
              depth++;
            } else {
              depth--;
              if (depth === 0) {
                endLine = j;
                break;
              }
            }
          }
          if (endLine !== -1) {
            break;
          }
        }

        if (endLine !== -1) {
          const originalText = lines.slice(i, endLine + 1).join('\n');
          const placeholder = `${PLACEHOLDER_PREFIX}${blocks.length}${PLACEHOLDER_SUFFIX}`;
          blocks.push({
            index: blocks.length,
            startLine: i,
            endLine,
            originalText,
            placeholder,
          });
          // 快轉狀態與行索引至區塊結尾之後
          state.inString = countState.inString;
          state.inBlockComment = countState.inBlockComment;
          i = endLine + 1;
          continue;
        }
        // 找不到結尾行，視為一般行繼續
      } else {
        scanLine(line, state);
      }
      i++;
    }

    return blocks;
  }

  extract(sourceText: string): { extractedText: string; blocks: CustomBlock[] } {
    const blocks = this.detect(sourceText);
    if (blocks.length === 0) {
      return { extractedText: sourceText, blocks: [] };
    }

    const lines = sourceText.split('\n');
    const resultLines: string[] = [];
    let lineIdx = 0;

    for (const block of blocks) {
      while (lineIdx < block.startLine) {
        resultLines.push(lines[lineIdx++]);
      }
      resultLines.push(block.placeholder);
      lineIdx = block.endLine + 1;
    }

    while (lineIdx < lines.length) {
      resultLines.push(lines[lineIdx++]);
    }

    return { extractedText: resultLines.join('\n'), blocks };
  }

  restore(extractedText: string, blocks: CustomBlock[]): string {
    let result = extractedText;
    for (const block of blocks) {
      result = result.replace(block.placeholder, block.originalText);
    }
    return result;
  }
}
