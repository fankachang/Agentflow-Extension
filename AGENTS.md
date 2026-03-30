# Base Rules

* **Response Language:** `zh-TW`
* All specifications, plans, and user-facing documentation MUST be written in Traditional Chinese (zh-TW). Only the constitution MUST be in English.
* When drafting the constitution, the context MUST be translated into `constitution_zhTW.md` and placed in the same directory (file names are case-sensitive).
* Git logs and code annotations MUST be written in Traditional Chinese (zh-TW).

## Development Guidelines

* When the frontend calls a backend API or function, ensure the API/function actually exists on the backend. Do not arbitrarily name or assume APIs/functions.
* Avoid over-design and over-engineering.
* During development, the frontend UI should account for layout height. Input fields, components, and their placement should be consistent across the interface.

## Virtual Environment

* Check whether a virtual environment (e.g., `.venv`) exists in the current folder. If it does, do not create a new virtual environment.

## Skills

Skills in this project are stored as folders under `.agents/skills/`. Each skill has a fixed entry file named `SKILL.md`.

* **How to reference / find skills**
  * Open directly: `.agents/skills/<skill-id>/SKILL.md`
  * VS Code global search: search for `path:.agents/skills SKILL.md`, or search by skill-id (e.g. `python-venv-check`)
  * Browse the directory: open `.agents/skills/` to see the list of available skills

* **Included skills (folder name = skill-id)**
  * `RunPowerShell`: `.agents/skills/RunPowerShell/SKILL.md`
  * `algorithmic-art`: `.agents/skills/algorithmic-art/SKILL.md`
  * `brand-guidelines`: `.agents/skills/brand-guidelines/SKILL.md`
  * `canvas-design`: `.agents/skills/canvas-design/SKILL.md`
  * `commit-message-helper`: `.agents/skills/commit-message-helper/SKILL.md`
  * `copilot-sdk`: `.agents/skills/copilot-sdk/SKILL.md`
  * `container-image-hygiene`: `.agents/skills/container-image-hygiene/SKILL.md`
  * `doc-coauthoring`: `.agents/skills/doc-coauthoring/SKILL.md`
  * `docx`: `.agents/skills/docx/SKILL.md`
  * `frontend-design`: `.agents/skills/frontend-design/SKILL.md`
  * `internal-comms`: `.agents/skills/internal-comms/SKILL.md`
  * `mcp-builder`: `.agents/skills/mcp-builder/SKILL.md`
  * `pdf`: `.agents/skills/pdf/SKILL.md`
  * `pptx`: `.agents/skills/pptx/SKILL.md`
  * `python-venv-check`: `.agents/skills/python-venv-check/SKILL.md`
  * `skill-creator`: `.agents/skills/skill-creator/SKILL.md`
  * `slack-gif-creator`: `.agents/skills/slack-gif-creator/SKILL.md`
  * `theme-factory`: `.agents/skills/theme-factory/SKILL.md`
  * `web-artifacts-builder`: `.agents/skills/web-artifacts-builder/SKILL.md`
  * `webapp-testing`: `.agents/skills/webapp-testing/SKILL.md`
  * `xlsx`: `.agents/skills/xlsx/SKILL.md`

## Agent

* If you have questions, use #askQuestions and provide your proposed solutions for the user to choose from.
* If the specification is not clearly defined, default to using TDD for planning and development.
