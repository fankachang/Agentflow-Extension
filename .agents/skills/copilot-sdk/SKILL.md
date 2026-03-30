---
name: copilot-sdk
description: Build agentic applications with GitHub Copilot SDK. Use when embedding AI agents in apps, creating custom tools, implementing streaming responses, managing sessions, connecting to MCP servers, or creating custom agents. Triggers on Copilot SDK, GitHub SDK, agentic app, embed Copilot, programmable agent, MCP server, custom agent.
---

# GitHub Copilot SDK

Embed Copilot's agentic workflows in any application using TypeScript, Python, Go, or .NET.

## Overview

The Copilot SDK exposes the same agent runtime behind Copilot CLI as a programmatic API. Define agent behavior; Copilot handles planning, tool invocation, file edits, and more.

## Prerequisites

1. **GitHub Copilot CLI** installed and authenticated (`copilot --version`)
2. **Runtime**: Node.js 18+ | Python 3.8+ | Go 1.21+ | .NET 8.0+

## Installation

| Language | Command |
|----------|---------|
| TypeScript | `npm install @github/copilot-sdk tsx` |
| Python | `pip install github-copilot-sdk` |
| Go | `go get github.com/github/copilot-sdk/go` |
| .NET | `dotnet add package GitHub.Copilot.SDK` |

## Quick Start (TypeScript)

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1" });
const response = await session.sendAndWait({ prompt: "What is 2 + 2?" });
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

Run: `npx tsx index.ts`

For other languages: [Python](references/python.md) | [Go](references/go.md) | [.NET](references/dotnet.md)

## Streaming Responses

Enable `streaming: true` and subscribe to events for real-time output:

```typescript
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", streaming: true });

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") process.stdout.write(event.data.deltaContent);
    if (event.type === "session.idle") console.log();
});

await session.sendAndWait({ prompt: "Tell me a short joke" });
await client.stop();
```

For other languages: [Python](references/python.md#streaming-responses) | [Go](references/go.md#streaming-responses) | [.NET](references/dotnet.md#streaming-responses)

## Custom Tools

Define tools Copilot can invoke during reasoning — specify description, parameter schema, and handler:

```typescript
import { CopilotClient, defineTool } from "@github/copilot-sdk";

const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: {
        type: "object",
        properties: { city: { type: "string", description: "The city name" } },
        required: ["city"],
    },
    handler: async ({ city }) => ({
        city, temperature: `${Math.floor(Math.random() * 30) + 50}°F`, condition: "sunny"
    }),
});

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1", tools: [getWeather] });
await session.sendAndWait({ prompt: "What's the weather in Seattle?" });
await client.stop();
```

Tool invocation flow: Copilot sends parameters → SDK runs handler → result returns to Copilot → incorporated into response.

For other languages: [Python (Pydantic)](references/python.md#custom-tools) | [Go (struct)](references/go.md#custom-tools) | [.NET (Microsoft.Extensions.AI)](references/dotnet.md#custom-tools)

## MCP Server Integration

Connect to MCP servers for pre-built tools (e.g., GitHub's MCP server for repo/issue/PR access):

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    mcpServers: {
        github: { type: "http", url: "https://api.githubcopilot.com/mcp/" },
    },
});
```

For other languages: [Python](references/python.md#mcp-server-integration) | [Go](references/go.md#mcp-server-integration) | [.NET](references/dotnet.md#mcp-server-integration)

## Custom Agents

Define specialized AI personas:

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    customAgents: [{
        name: "pr-reviewer",
        displayName: "PR Reviewer",
        description: "Reviews pull requests for best practices",
        prompt: "You are an expert code reviewer. Focus on security, performance, and maintainability.",
    }],
});
```

## System Message

Override default system prompt to customize behavior:

```typescript
const session = await client.createSession({
    model: "gpt-4.1",
    systemMessage: { content: "You are a helpful assistant. Always be concise." },
});
```

## External CLI Server

Run the CLI in server mode separately, then connect the SDK to it:

```bash
copilot --server --port 4321
```

```typescript
const client = new CopilotClient({ cliUrl: "localhost:4321" });
const session = await client.createSession({ model: "gpt-4.1" });
```

When `cliUrl` is provided, the SDK connects to the existing server without spawning a new CLI process.

For other languages: [Python](references/python.md#external-cli-server) | [Go](references/go.md#external-cli-server) | [.NET](references/dotnet.md#external-cli-server)

## Event Types

| Event | Description |
|-------|-------------|
| `user.message` | User input added |
| `assistant.message` | Complete model response |
| `assistant.message_delta` | Streaming response chunk |
| `assistant.reasoning` | Model reasoning (model-dependent) |
| `assistant.reasoning_delta` | Streaming reasoning chunk |
| `tool.execution_start` | Tool invocation started |
| `tool.execution_complete` | Tool execution finished |
| `session.idle` | No active processing |
| `session.error` | Error occurred |

## Client Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `cliPath` | Path to Copilot CLI executable | System PATH |
| `cliUrl` | Connect to existing server (e.g., "localhost:4321") | None |
| `port` | Server communication port | Random |
| `useStdio` | Use stdio transport instead of TCP | true |
| `logLevel` | Logging verbosity | "info" |
| `autoStart` | Launch server automatically | true |
| `autoRestart` | Restart on crashes | true |
| `cwd` | Working directory for CLI process | Inherited |

## Session Configuration

| Option | Description |
|--------|-------------|
| `model` | LLM to use ("gpt-4.1", "claude-sonnet-4.5", etc.) |
| `sessionId` | Custom session identifier |
| `tools` | Custom tool definitions |
| `mcpServers` | MCP server connections |
| `customAgents` | Custom agent personas |
| `systemMessage` | Override default system prompt |
| `streaming` | Enable incremental response chunks |
| `availableTools` | Whitelist of permitted tools |
| `excludedTools` | Blacklist of disabled tools |

## Best Practices

1. **Always cleanup** — use `try-finally` or `defer` to ensure `client.stop()` is called
2. **Set timeouts** — use `sendAndWait` with timeout for long operations
3. **Handle events** — subscribe to error events for robust error handling
4. **Use streaming** — enable streaming for better UX on long responses
5. **Persist sessions** — use custom session IDs for multi-turn conversations
6. **Define clear tools** — write descriptive tool names and descriptions

## Architecture

```
Your Application → SDK Client → (JSON-RPC) → Copilot CLI (server mode) → GitHub (models, auth)
```

The SDK manages CLI process lifecycle automatically via JSON-RPC over stdio or TCP.

## Common Patterns & Advanced Usage

For session persistence, error handling, graceful shutdown, multi-turn conversations, file attachments, abort operations, and model queries, see [patterns.md](references/patterns.md).

## Language-Specific Guides

- **[TypeScript Guide](references/typescript.md)** — Full examples: streaming, custom tools, interactive CLI, MCP, agents, system message, external server
- **[Python Guide](references/python.md)** — Full examples with asyncio, Pydantic, SessionEventType
- **[Go Guide](references/go.md)** — Full examples with structs, goroutines, DefineTool
- **[.NET Guide](references/dotnet.md)** — Full examples with Microsoft.Extensions.AI, async/await

## Resources

- [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- [Getting Started Tutorial](https://github.com/github/copilot-sdk/blob/main/docs/tutorials/first-app.md)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Cookbook](https://github.com/github/copilot-sdk/tree/main/cookbook) | [Samples](https://github.com/github/copilot-sdk/tree/main/samples)

## Status

This SDK is in **Technical Preview** and may have breaking changes.
