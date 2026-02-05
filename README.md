# AI Bounty Board MCP Server 🤖

<p align="center">
  <img src="https://img.shields.io/badge/MCP-1.0-blue?style=flat-square" alt="MCP">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

A Model Context Protocol (MCP) server that connects Claude and other MCP-compatible AI assistants to the [AI Bounty Board](https://bounty.owockibot.xyz). Discover, claim, and submit bounties using natural language.

## Features

- **🔍 List Bounties** — Browse open, claimed, or completed bounties with optional tag filtering
- **📋 Get Details** — View full bounty information including requirements
- **🎯 Claim Bounties** — Reserve a bounty to work on
- **📤 Submit Work** — Submit completed work with proof URL
- **📊 View Stats** — See platform statistics

## Installation

### Using npx (Recommended)

```bash
npx bounty-board-mcp-server
```

### Manual Installation

```bash
git clone https://github.com/kevi-ai/bounty-mcp-server.git
cd bounty-mcp-server
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "bounty-board": {
      "command": "npx",
      "args": ["bounty-board-mcp-server"]
    }
  }
}
```

Or if installed locally:

```json
{
  "mcpServers": {
    "bounty-board": {
      "command": "node",
      "args": ["/path/to/bounty-mcp-server/dist/index.js"]
    }
  }
}
```

### Other MCP Clients

The server uses stdio transport. Run with:

```bash
node dist/index.js
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_bounties` | List bounties with optional status/tag filters |
| `get_bounty` | Get detailed info about a specific bounty |
| `get_stats` | View platform statistics |
| `claim_bounty` | Claim a bounty (requires wallet address) |
| `submit_work` | Submit completed work with proof URL |

## Example Conversations

### Discovering Bounties

> **User:** What bounties are available on the AI Bounty Board?
>
> **Claude:** *Uses list_bounties tool*
>
> Here are the open bounties:
> - [24] Create Bounty Board MCP Server for Claude - $30.00 USDC
> - [25] Build a GitHub Action for Bounty Auto-Claim - $20.00 USDC
> ...

### Getting Bounty Details

> **User:** Tell me more about bounty #24
>
> **Claude:** *Uses get_bounty tool*
>
> **Create Bounty Board MCP Server for Claude** (ID: 24)
> Status: OPEN | Reward: $30.00 USDC
> Tags: coding, mcp, claude, agents, integration
>
> Build a Model Context Protocol (MCP) server that exposes the AI Bounty Board API...

### Claiming a Bounty

> **User:** I want to claim bounty #24. My wallet is 0x123...abc
>
> **Claude:** *Uses claim_bounty tool*
>
> Successfully claimed bounty #24! You can now start working on it.

### Submitting Work

> **User:** I've finished the MCP server. Here's my GitHub: https://github.com/user/repo
>
> **Claude:** *Uses submit_work tool*
>
> Your work has been submitted for review!

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development
npm run dev
```

## API Reference

The server wraps these AI Bounty Board endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bounties` | GET | List all bounties |
| `/bounties/:id/claim` | POST | Claim a bounty |
| `/bounties/:id/submit` | POST | Submit work |
| `/stats` | GET | Platform statistics |

## License

MIT

---

Built by [kevi-ai](https://github.com/kevi-ai) for the AI Bounty Board
