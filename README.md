# ChatGPT Chat Capture & Export

**Version 1.0.0** · Chrome Manifest V3 extension · MIT License

Capture ChatGPT conversations as structured Markdown or directly generated PDF files. PDF output uses a print-oriented approximation of ChatGPT’s light theme.

> This is an independent open-source project, not an official OpenAI or ChatGPT extension.

## Features

- **By search phrase:** find occurrences, select the starting message, and export through the end of the conversation.
- **From current scroll location:** start near the current visible message and export through the end.
- **Complete conversation:** attempt to load and export the entire conversation.
- **Markdown:** export headings, lists, tables, links, code blocks, and image references when available.
- **PDF:** generate a real PDF through Chrome's debugging/printing interface with light-theme message bubbles and print styling.
- **Preview:** inspect the first and last selected messages and the message count.

There is **no estimated-page limit**; capture proceeds to the last message the extension discovers.

## Installation (unpacked extension)

1. Download the release ZIP and extract it.
2. In Chrome, open `chrome://extensions` and enable **Developer mode**.
3. Remove any older installed version of this extension to avoid stale background scripts.
4. Select **Load unpacked** and choose the extracted folder containing `manifest.json`.
5. Refresh the ChatGPT conversation tab.

Chrome may warn about the **debugger** permission. It is used for direct PDF generation and is a powerful permission; only install extensions from sources you trust. Chrome may show a debugging banner during PDF creation.

## Usage

1. Open a ChatGPT conversation at `chatgpt.com`.
2. Open the extension popup and choose one of the three capture modes.
3. For phrase search, select a match; otherwise use the current position or complete conversation.
4. Choose **Markdown** or **PDF (direct download)** and provide a filename.
5. Click **Capture & Export**, then inspect the preview and exported file.

## Limitations

- ChatGPT can change its HTML structure without notice, potentially affecting capture.
- Virtualized or asynchronously loaded messages may not all be available; verify the first/last message preview and exported content.
- Remote images, embedded media, interactive widgets, and complex layouts may not reproduce exactly.
- Very long conversations can exceed browser extension or PDF generation limits.
- PDF layout is designed to resemble ChatGPT's light theme, not to be a pixel-perfect screenshot.
- This release is the previously user-tested v0.4.4 codebase with release branding and documentation; it has **not** undergone an additional automated browser test in this packaging step.

## Privacy and permissions

The extension operates on the active conversation and uses Chrome extension APIs to export locally. It requests `activeTab`, `scripting`, `downloads`, `storage`, `debugger`, and `tabs`. The PDF flow temporarily uses local extension storage and a viewer tab to render the PDF. Review `background.js` and the other source files before installing if you have privacy concerns.

## Development

The extension uses plain JavaScript and Chrome Manifest V3; no build step is required. Load the repository directory as an unpacked extension when developing.

## License

MIT — Copyright (c) 2026 Alan Workman. See [LICENSE](LICENSE).
