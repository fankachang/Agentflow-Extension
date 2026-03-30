# GitHub Copilot SDK — .NET (C#) Reference

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Streaming Responses](#streaming-responses)
- [Custom Tools](#custom-tools)
- [MCP Server Integration](#mcp-server-integration)
- [External CLI Server](#external-cli-server)

---

## Installation

Create a new console project and add the SDK package:

```bash
dotnet new console -n CopilotDemo && cd CopilotDemo
dotnet add package GitHub.Copilot.SDK
```

## Quick Start

Create a client, open a session, and send a prompt:

```csharp
using GitHub.Copilot.SDK;

await using var client = new CopilotClient();
await using var session = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-4.1" });

var response = await session.SendAndWaitAsync(new MessageOptions { Prompt = "What is 2 + 2?" });
Console.WriteLine(response?.Data.Content);
```

Run the application:

```bash
dotnet run
```

## Streaming Responses

Enable streaming and handle delta events to display tokens as they arrive:

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4.1",
    Streaming = true,
});

session.On(ev =>
{
    if (ev is AssistantMessageDeltaEvent deltaEvent)
        Console.Write(deltaEvent.Data.DeltaContent);
    if (ev is SessionIdleEvent)
        Console.WriteLine();
});

await session.SendAndWaitAsync(new MessageOptions { Prompt = "Tell me a short joke" });
```

## Custom Tools

Define custom tools with `AIFunctionFactory.Create` and `Microsoft.Extensions.AI`.
Provide a lambda, a tool name, and a description. Pass the tools into `SessionConfig.Tools`.

```csharp
using GitHub.Copilot.SDK;
using Microsoft.Extensions.AI;
using System.ComponentModel;

var getWeather = AIFunctionFactory.Create(
    ([Description("The city name")] string city) =>
    {
        var conditions = new[] { "sunny", "cloudy", "rainy", "partly cloudy" };
        var temp = Random.Shared.Next(50, 80);
        var condition = conditions[Random.Shared.Next(conditions.Length)];
        return new { city, temperature = $"{temp}°F", condition };
    },
    "get_weather",
    "Get the current weather for a city"
);

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4.1",
    Streaming = true,
    Tools = [getWeather],
});
```

> Add the `Microsoft.Extensions.AI` NuGet package to use `AIFunctionFactory`:
>
> ```bash
> dotnet add package Microsoft.Extensions.AI
> ```

## MCP Server Integration

Connect to a remote MCP server by specifying `McpServers` in the session config:

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = "gpt-4.1",
    McpServers = new Dictionary<string, McpServerConfig>
    {
        ["github"] = new McpServerConfig
        {
            Type = "http",
            Url = "https://api.githubcopilot.com/mcp/",
        },
    },
});
```

## External CLI Server

Point the client at an already-running CLI server instead of spawning one automatically:

```csharp
using var client = new CopilotClient(new CopilotClientOptions
{
    CliUrl = "localhost:4321"
});

await using var session = await client.CreateSessionAsync(new SessionConfig { Model = "gpt-4.1" });
```

> **Note:** When `CliUrl` is provided, the SDK will not spawn or manage a CLI process.
