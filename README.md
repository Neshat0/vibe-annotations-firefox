# Vibe Annotations

> **⚠️ This is a personal fork.** The original project is [RaphaelRegnier/vibe-annotations](https://github.com/RaphaelRegnier/vibe-annotations) by Raphael Regnier. This fork is maintained by [@Neshat0](https://github.com/Neshat0) for personal use.
>
> **🦊 Firefox Developer Edition support** was added to this fork by [GitHub Copilot](https://github.com/features/copilot) because Firefox is my default browser. The changes are provided **as-is with no guarantee** — they may not be stable, may break with future Firefox updates, and have not been officially reviewed or endorsed by the original author.

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-6K+_users-green?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/gkofobaeeepjopdpahbicefmljcmpeof) [![Server Package](https://img.shields.io/badge/Server-NPM-blue)](https://www.npmjs.com/package/vibe-annotations-server) [![License: PolyForm Shield](https://img.shields.io/badge/License-PolyForm%20Shield-blue)](https://polyformproject.org/licenses/shield/1.0.0)

Visual feedback tool for web development. Annotate elements on your pages, make design tweaks, and share with AI coding agents or teammates.

## Get started

**1.** Install the [browser extension](https://chromewebstore.google.com/detail/gkofobaeeepjopdpahbicefmljcmpeof)

### Firefox Developer Edition (this fork)

If you use Firefox Developer Edition, install the extension as a temporary add-on:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `packages/extension/manifest.firefox.json` from your cloned repository.
4. Pin the extension and open the popup from the toolbar.
5. Open a localhost page and start annotating.

Note: Temporary add-ons are removed when Firefox fully restarts, so you need to load it again next session.  
More Firefox details and troubleshooting: [`packages/extension/FIREFOX.md`](packages/extension/FIREFOX.md).

**2.** Run the setup wizard

```bash
npx vibe-annotations-server init
```

One interactive command installs the global server, starts it in the background, and configures your AI coding agent (Claude Code, Cursor, Windsurf, Codex, OpenClaw, VS Code). Prefer manual? See [Installation](https://vibe-annotations.com/docs/installation).

**3.** Open a localhost page, click **Annotate**. You can annotate multiple pages on your web app. Then:

A (recommended) - [Use the MCP](https://vibe-annotations.com/docs/mcp-setup) to implement your Annotations

B - Copy to your clipboard: **View all** > **Copy** and send to your AI coding agent.

## Demos

**Annotate, copy/paste to your AI coding agent:**

https://github.com/user-attachments/assets/ebcf5a17-423c-459c-b5d5-2876b671c5a7

**Make persisting direct design tweaks:**

https://github.com/user-attachments/assets/66bc31ed-86d6-4fc0-ab69-7e4ed8c7c27a

**Use the MCP server to share your annotations, any websites, multiple pages:**

https://github.com/user-attachments/assets/2dc8e03c-a760-4e31-afac-537200387788

**Annotate with a browser-capable AI coding agent:**

https://github.com/user-attachments/assets/5839d3df-f3e6-4b05-b58a-fdd619487aa4

**Collaborate with teammates using export / import features:**

https://github.com/user-attachments/assets/58de5fad-d7fa-490d-849f-d25771758067

**Use watch mode, never leave your website:**

https://github.com/user-attachments/assets/c74d3a43-61c4-4542-ab43-c559cd6e44bf

## Documentation

Full docs at [**vibe-annotations.com/docs**](https://vibe-annotations.com/docs) — including [installation](https://vibe-annotations.com/docs/installation), [MCP setup](https://vibe-annotations.com/docs/mcp-setup), [workflows](https://vibe-annotations.com/docs/workflows), [architecture](https://vibe-annotations.com/docs/architecture), and [troubleshooting](https://vibe-annotations.com/docs/troubleshooting).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome.

## License

[PolyForm Shield 1.0.0](https://polyformproject.org/licenses/shield/1.0.0) — see [LICENSE](LICENSE) and [NOTICE](NOTICE).
