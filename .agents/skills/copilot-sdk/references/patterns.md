# Common Patterns Reference

Cross-language patterns for building agentic applications with the GitHub Copilot SDK.
Use TypeScript as the primary demonstration language.

## Table of Contents

- [Session Persistence](#session-persistence)
- [Error Handling](#error-handling)
- [Graceful Shutdown](#graceful-shutdown)
- [Multi-turn Conversation](#multi-turn-conversation)
- [File Attachments](#file-attachments)
- [Abort Long Operations](#abort-long-operations)
- [Query Available Models](#query-available-models)

## Session Persistence

Save and resume conversations across restarts.

### Create with Custom ID

Assign a deterministic session ID to enable later retrieval.

```typescript
const session = await client.createSession({
    sessionId: "user-123-conversation",
    model: "gpt-4.1"
});
```

### Resume Session

Reconnect to an existing session and continue the conversation.

```typescript
const session = await client.resumeSession("user-123-conversation");
await session.send({ prompt: "What did we discuss earlier?" });
```

### List and Delete Sessions

Enumerate active sessions and remove stale ones.

```typescript
const sessions = await client.listSessions();
await client.deleteSession("old-session-id");
```

## Error Handling

Wrap client operations in try/catch to handle connectivity and runtime errors.
Always call `client.stop()` in a `finally` block to release resources.

```typescript
try {
    const client = new CopilotClient();
    const session = await client.createSession({ model: "gpt-4.1" });
    const response = await session.sendAndWait(
        { prompt: "Hello!" },
        30000 // timeout in ms
    );
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

## Graceful Shutdown

Register a signal handler to clean up resources before the process exits.

```typescript
process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await client.stop();
    process.exit(0);
});
```

## Multi-turn Conversation

Send sequential messages within a single session to maintain conversational context.

```typescript
const session = await client.createSession({ model: "gpt-4.1" });

await session.sendAndWait({ prompt: "My name is Alice" });
await session.sendAndWait({ prompt: "What's my name?" });
// Response: "Your name is Alice"
```

## File Attachments

Attach local files to a message for the model to analyze.

```typescript
await session.send({
    prompt: "Analyze this file",
    attachments: [{
        type: "file",
        path: "./data.csv",
        displayName: "Sales Data"
    }]
});
```

## Abort Long Operations

Cancel an in-flight request after a timeout to prevent runaway operations.

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

## Query Available Models

Retrieve the list of models available to the authenticated user.

```typescript
const models = await client.getModels();
// Returns: ["gpt-4.1", "gpt-4o", "claude-sonnet-4.5", ...]
```
