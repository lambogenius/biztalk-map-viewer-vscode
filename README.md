# BizTalk Map Viewer

[![Source on GitHub](https://img.shields.io/badge/source-GitHub-181717?logo=github)](https://github.com/lambogenius/biztalk-map-viewer-vscode)

A local-first VS Code custom editor for BizTalk `.btm` map files.

## Features

- Opens `.btm` files directly from the Explorer.
- Shows source and target schema roots and references.
- Lists direct links and functoid connections per map page.
- Exposes functoid IDs, constants, and embedded script bodies.
- Filters mappings by paths, constants, and script content.
- Updates when the underlying text document changes.

## Install locally

Source code: [GitHub repository](https://github.com/lambogenius/biztalk-map-viewer-vscode)

```powershell
npm run package:vsix
code --install-extension artifacts/biztalk-map-viewer.vsix --force
```

Reload VS Code after installation, then click a `.btm` file. If VS Code has a
previous editor association, use **Open With...**, choose **BizTalk Map Viewer**,
and select **Configure default editor for '*.btm'**.
