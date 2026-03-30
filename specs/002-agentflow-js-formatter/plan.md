# Implementation Plan: Agentflow JS 格式化外掛

**Branch**: `002-agentflow-js-formatter` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-agentflow-js-formatter/spec.md`

## Summary

開發一個 VS Code 外掛（TypeScript），針對 `.js` 檔案提供格式化功能：以 Prettier 作為 JS 格式化引擎，並在格式化前後識別並保護 `{KEY:\n...\n}` 自訂語法區塊（採用非 AST 的分段替換策略），同時壓縮整個檔案的多餘空白行。外掛透過 `vsce package` 打包為 `.vsix` 供離線安裝。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+  
**Primary Dependencies**: `prettier` ^3（JS 格式化引擎）、`@vscode/vsce`（打包工具）、VS Code Extension API 1.75+  
**Storage**: N/A（純文字轉換，無持久化儲存）  
**Testing**: `@vscode/test-electron` + Mocha（VS Code 官方測試框架）  
**Target Platform**: VS Code 1.75+ desktop（Windows / macOS / Linux 本地端）  
**Project Type**: VS Code Extension（desktop-app plugin）  
**Performance Goals**: ≤ 500ms 格式化 1000 行檔案；打包完成 ≤ 60 秒  
**Constraints**: 格式化結果冪等；自訂語法零破壞率；閒置時 CPU 趨近於零  
**Scale/Scope**: 單一 `.js` 格式化工具；無多人協作需求；v1 本地端部署

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> 專案 constitution 尚未填寫具體原則（目前為空白範本），無特定 gates 需要評估。
> Constitution Check：**PASS（無 gates）**。
>
> **設計完成後再確認（Post-Phase-1）**：分段替換策略（Block Extraction）保持最小複雜度，格式化邏輯拆分為三個獨立純函式模組，符合簡潔設計原則。無需 Constitution violations 豁免。

## Project Structure

### Documentation (this feature)

```text
specs/002-agentflow-js-formatter/
├── plan.md              # 本檔案
├── research.md          # Phase 0 研究輸出
├── data-model.md        # Phase 1 資料模型
├── quickstart.md        # Phase 1 快速入門
├── contracts/           # Phase 1 介面契約
│   └── formatter-api.md
└── tasks.md             # Phase 2（由 /speckit.tasks 產生）
```

### Source Code (repository root)

```text
agentflow-js-formatter/       # VS Code 外掛根目錄
├── src/
│   ├── extension.ts          # 外掛進入點（activate / deactivate）
│   ├── formatter/
│   │   ├── documentFormatter.ts    # DocumentFormattingEditProvider 實作
│   │   ├── customBlockDetector.ts  # {KEY:\n} 自訂語法偵測器（行掃描 + brace depth）
│   │   ├── jsFormatter.ts          # Prettier 封裝（格式化非自訂段落）
│   │   └── blankLineCompressor.ts  # 多空白行 → 單空白行
│   └── commands/
│       └── formatDocument.ts       # 手動格式化指令處理器
├── test/
│   └── suite/
│       ├── customBlockDetector.test.ts
│       ├── documentFormatter.test.ts
│       └── index.ts
├── out/                            # 編譯輸出（gitignored）
├── package.json                    # 外掛 manifest
├── tsconfig.json
└── .vscodeignore
```

**Structure Decision**: 採用 VS Code 官方 extension 單專案結構。格式化邏輯拆分為三個獨立模組（偵測器、JS 格式化器、空白行壓縮器），透過 `DocumentFormatter` 組合，便於獨立測試。

## Complexity Tracking

> 無 Constitution gates 違反，本表略。
