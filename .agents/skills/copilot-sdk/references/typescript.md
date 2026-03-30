# GitHub Copilot SDK — TypeScript Reference

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Streaming Responses](#streaming-responses)
- [Custom Tools](#custom-tools)
- [Interactive CLI Assistant](#interactive-cli-assistant)
- [MCP Server Integration](#mcp-server-integration)
- [Custom Agents](#custom-agents)
- [System Message](#system-message)
- [External CLI Server](#external-cli-server)
- [Session Persistence](#session-persistence)
- [Error Handling](#error-handling)
- [Graceful Shutdown](#graceful-shutdown)
- [Common Patterns](#common-patterns)
- [Event Types](#event-types)
- [Client Configuration](#client-configuration)
- [Session Configuration](#session-configuration)

---

## Installation

Set up a new project and install dependencies.

```bash
mkdir copilot-demo && cd copilot-demo
npm init -y --init-type module
npm install @github/copilot-sdk tsx
```

Verify the Copilot CLI is installed:

```bash
copilot --version
```

---

## Quick Start

Create a `CopilotClient`, open a session, send a prompt, and print the response.

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1" });

const response = await session.sendAndWait({ prompt: "What is 2 + 2?" });
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

Run with:

```bash
npx tsx index.ts
```

---

## Streaming Responses

Enable real-time output by setting `streaming: true` and subscribing to `SessionEvent`.

```typescript
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
    if (event.type === "session.idle") {
        console.log(); // New line when done
    }
});

await session.sendAndWait({ prompt: "Tell me a short joke" });

await client.stop();
process.exit(0);
```

---

## Custom Tools

Define tools that Copilot can invoke during reasoning. Use `defineTool` with a JSON Schema for parameters and an async handler.

```typescript
import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";

const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "The city name" },
        },
        required: ["city"],
    },
    handler: async (args: { city: string }) => {
        const { city } = args;
        // In a real app, call a weather API here
        const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
    tools: [getWeather],
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
});

await session.sendAndWait({
    prompt: "What's the weather like in Seattle and Tokyo?",
});

await client.stop();
process.exit(0);
```

---

## Interactive CLI Assistant

Build a complete interactive assistant with readline, custom tools, and streaming.

```typescript
import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";
import * as readline from "readline";

const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "The city name" },
        },
        required: ["city"],
    },
    handler: async ({ city }) => {
        const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
    tools: [getWeather],
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log("Weather Assistant (type 'exit' to quit)");
console.log("Try: 'What's the weather in Paris?'\n");

const prompt = () => {
    rl.question("You: ", async (input) => {
        if (input.toLowerCase() === "exit") {
            await client.stop();
            rl.close();
            return;
        }

        process.stdout.write("Assistant: ");
        await session.sendAndWait({ prompt: input });
        console.log("\n");
        prompt();
    });
};

prompt();
```

---

## MCP Server Integration

Connect to MCP (Model Context Protocol) servers for pre-built tools. Pass the `mcpServers` map when creating a session.

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    mcpServers: {
        github: {
            type: "http",
            url: "https://api.githubcopilot.com/mcp/",
        },
    },
});

const response = await session.sendAndWait({
    prompt: "List open issues in owner/repo",
});
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

---

## Custom Agents

Define specialized AI personas for specific tasks via the `customAgents` array.

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    customAgents: [{
        name: "pr-reviewer",
        displayName: "PR Reviewer",
        description: "Reviews pull requests for best practices",
        prompt: "You are an expert code reviewer. Focus on security, performance, and maintainability.",
    }],
});

const response = await session.sendAndWait({
    prompt: "@pr-reviewer Review the latest PR",
});
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

---

## System Message

Override the default system prompt to customize the AI's behavior and personality.

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    systemMessage: {
        content: "You are a helpful assistant for our engineering team. Always be concise.",
    },
});

const response = await session.sendAndWait({ prompt: "Explain microservices" });
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

---

## External CLI Server

Run the Copilot CLI in server mode separately, then connect the SDK to it. Useful for debugging, resource sharing, or custom environments.

Start the CLI server:

```bash
copilot --server --port 4321
```

Connect the SDK client by passing `cliUrl`:

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient({
    cliUrl: "localhost:4321",
});

const session = await client.createSession({ model: "gpt-4.1" });
const response = await session.sendAndWait({ prompt: "Hello!" });
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

> **Note:** When `cliUrl` is provided, the SDK will not spawn or manage a CLI process — it only connects to the existing server.

---

## Session Persistence

Save and resume conversations across restarts using custom session IDs.

### Create with Custom ID

```typescript
const session = await client.createSession({
    sessionId: "user-123-conversation",
    model: "gpt-4.1",
});
```

### Resume Session

```typescript
const session = await client.resumeSession("user-123-conversation");
await session.send({ prompt: "What did we discuss earlier?" });
```

### List and Delete Sessions

```typescript
const sessions = await client.listSessions();
await client.deleteSession("old-session-id");
```

---

## Error Handling

Wrap operations in `try-catch-finally` and inspect error codes for specific failure modes.

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();

try {
    const session = await client.createSession({ model: "gpt-4.1" });
    const response = await session.sendAndWait(
        { prompt: "Hello!" },
        30000 // timeout in ms
    );
    console.log(response?.data.content);
} catch (error) {
    if (error.code === "ENOENT") {
        console.error("Copilot CLI not installed");
    } else if (error.code === "ECONNREFUSED") {
        console.error("Cannot connect to Copilot server");
    } else {
        console.error("Error:", error.message);
    }
} finally {
    await client.stop();
}
```

---

## Graceful Shutdown

Register a `SIGINT` handler to clean up resources on Ctrl+C.

```typescript
process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await client.stop();
    process.exit(0);
});
```

---

## Common Patterns

### Multi-turn Conversation

Maintain context across multiple prompts within the same session.

```typescript
const session = await client.createSession({ model: "gpt-4.1" });

await session.sendAndWait({ prompt: "My name is Alice" });
await session.sendAndWait({ prompt: "What's my name?" });
// Response: "Your name is Alice"
```

### File Attachments

Attach files to a prompt for analysis.

```typescript
await session.send({
    prompt: "Analyze this file",
    attachments: [{
        type: "file",
        path: "./data.csv",
        displayName: "Sales Data",
    }],
});
```

### Abort Long Operations

Cancel a long-running request after a timeout.

```typescript
const timeoutId = setTimeout(() => {
    session.abort();
}, 60000);

session.on((event) => {
    if (event.type === "session.idle") {
        clearTimeout(timeoutId);
    }
});
```

### Query Available Models

Retrieve the list of models available at runtime.

```typescript
const models = await client.getModels();
// Returns: ["gpt-4.1", "gpt-4o", "claude-sonnet-4.5", ...]
```

---

## Event Types

| Event                       | Description                            |
| --------------------------- | -------------------------------------- |
| `user.message`              | User input added                       |
| `assistant.message`         | Complete model response                |
| `assistant.message_delta`   | Streaming response chunk               |
| `assistant.reasoning`       | Model reasoning (model-dependent)      |
| `assistant.reasoning_delta` | Streaming reasoning chunk              |
| `tool.execution_start`      | Tool invocation started                |
| `tool.execution_complete`   | Tool execution finished                |
| `session.idle`              | No active processing                   |
| `session.error`             | Error occurred                         |

---

## Client Configuration

| Option        | Description                                            | Default     |
| ------------- | ------------------------------------------------------ | ----------- |
| `cliPath`     | Path to Copilot CLI executable                         | System PATH |
| `cliUrl`      | Connect to existing server (e.g., `"localhost:4321"`)  | None        |
| `port`        | Server communication port                              | Random      |
| `useStdio`    | Use stdio transport instead of TCP                     | `true`      |
| `logLevel`    | Logging verbosity                                      | `"info"`    |
| `autoStart`   | Launch server automatically                            | `true`      |
| `autoRestart` | Restart on crashes                                     | `true`      |
| `cwd`         | Working directory for CLI process                      | Inherited   |

---

## Session Configuration

| Option           | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `model`          | LLM to use (`"gpt-4.1"`, `"claude-sonnet-4.5"`, etc.)   |
| `sessionId`      | Custom session identifier                                |
| `tools`          | Custom tool definitions                                  |
| `mcpServers`     | MCP server connections                                   |
| `customAgents`   | Custom agent personas                                    |
| `systemMessage`  | Override default system prompt                           |
| `streaming`      | Enable incremental response chunks                       |
| `availableTools` | Whitelist of permitted tools                             |
| `excludedTools`  | Blacklist of disabled tools                              |
