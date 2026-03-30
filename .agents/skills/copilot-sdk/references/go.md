# GitHub Copilot SDK — Go Reference

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Streaming Responses](#streaming-responses)
- [Custom Tools](#custom-tools)
- [MCP Server Integration](#mcp-server-integration)
- [External CLI Server](#external-cli-server)
- [Event Types](#event-types)
- [Client Configuration](#client-configuration)
- [Session Configuration](#session-configuration)
- [Best Practices](#best-practices)

## Installation

Require Go 1.21+ and [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) installed and authenticated.

Verify CLI before starting:

```bash
copilot --version
```

Initialize a Go module and install the SDK:

```bash
mkdir copilot-demo && cd copilot-demo
go mod init copilot-demo
go get github.com/github/copilot-sdk/go
```

## Quick Start

Create a client, open a session, send a prompt, and print the response:

```go
package main

import (
    "fmt"
    "log"
    "os"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    client := copilot.NewClient(nil)
    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    session, err := client.CreateSession(&copilot.SessionConfig{Model: "gpt-4.1"})
    if err != nil {
        log.Fatal(err)
    }

    response, err := session.SendAndWait(copilot.MessageOptions{Prompt: "What is 2 + 2?"}, 0)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(*response.Data.Content)
    os.Exit(0)
}
```

Run:

```bash
go run main.go
```

## Streaming Responses

Enable streaming for real-time token output. Subscribe to session events and print deltas as they arrive:

```go
package main

import (
    "fmt"
    "log"
    "os"
    copilot "github.com/github/copilot-sdk/go"
)

func main() {
    client := copilot.NewClient(nil)
    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    session, err := client.CreateSession(&copilot.SessionConfig{
        Model:     "gpt-4.1",
        Streaming: true,
    })
    if err != nil {
        log.Fatal(err)
    }

    session.On(func(event copilot.SessionEvent) {
        if event.Type == "assistant.message_delta" {
            fmt.Print(*event.Data.DeltaContent)
        }
        if event.Type == "session.idle" {
            fmt.Println()
        }
    })

    _, err = session.SendAndWait(copilot.MessageOptions{Prompt: "Tell me a short joke"}, 0)
    if err != nil {
        log.Fatal(err)
    }

    os.Exit(0)
}
```

## Custom Tools

Define tools that Copilot can invoke during reasoning. Use `DefineTool` with typed parameter and result structs. Tag struct fields with `jsonschema` to provide descriptions:

```go
package main

import (
    "fmt"
    "log"
    "math/rand"
    "os"
    copilot "github.com/github/copilot-sdk/go"
)

type WeatherParams struct {
    City string `json:"city" jsonschema:"The city name"`
}

type WeatherResult struct {
    City        string `json:"city"`
    Temperature string `json:"temperature"`
    Condition   string `json:"condition"`
}

func main() {
    client := copilot.NewClient(nil)
    if err := client.Start(); err != nil {
        log.Fatal(err)
    }
    defer client.Stop()

    getWeather := copilot.DefineTool(
        "get_weather",
        "Get the current weather for a city",
        func(params WeatherParams, inv copilot.ToolInvocation) (WeatherResult, error) {
            conditions := []string{"sunny", "cloudy", "rainy", "partly cloudy"}
            temp := rand.Intn(30) + 50
            condition := conditions[rand.Intn(len(conditions))]
            return WeatherResult{
                City:        params.City,
                Temperature: fmt.Sprintf("%d°F", temp),
                Condition:   condition,
            }, nil
        },
    )

    session, err := client.CreateSession(&copilot.SessionConfig{
        Model:     "gpt-4.1",
        Streaming: true,
        Tools:     []copilot.Tool{getWeather},
    })
    if err != nil {
        log.Fatal(err)
    }

    session.On(func(event copilot.SessionEvent) {
        if event.Type == "assistant.message_delta" {
            fmt.Print(*event.Data.DeltaContent)
        }
        if event.Type == "session.idle" {
            fmt.Println()
        }
    })

    _, err = session.SendAndWait(
        copilot.MessageOptions{Prompt: "What's the weather like in Seattle and Tokyo?"},
        0,
    )
    if err != nil {
        log.Fatal(err)
    }

    os.Exit(0)
}
```

### How Tools Work

1. Copilot sends a tool call request with parameters.
2. The SDK deserializes parameters into the typed struct and runs the handler.
3. The result is serialized and sent back to Copilot.
4. Copilot incorporates the result into its response.

## MCP Server Integration

Connect to MCP (Model Context Protocol) servers for pre-built tools. Pass a map of server names to `MCPServerConfig` in session config:

```go
session, err := client.CreateSession(&copilot.SessionConfig{
    Model: "gpt-4.1",
    MCPServers: map[string]copilot.MCPServerConfig{
        "github": {
            Type: "http",
            URL:  "https://api.githubcopilot.com/mcp/",
        },
    },
})
if err != nil {
    log.Fatal(err)
}
```

Use the GitHub MCP server for repository, issue, and PR access.

## External CLI Server

Run the CLI in server mode separately and connect the SDK to it. Useful for debugging, resource sharing, or custom environments.

Start CLI in server mode:

```bash
copilot --server --port 4321
```

Connect the SDK to the external server by specifying `CLIUrl` in client options:

```go
client := copilot.NewClient(&copilot.ClientOptions{
    CLIUrl: "localhost:4321",
})
if err := client.Start(); err != nil {
    log.Fatal(err)
}
defer client.Stop()

session, err := client.CreateSession(&copilot.SessionConfig{Model: "gpt-4.1"})
if err != nil {
    log.Fatal(err)
}
```

> **Note:** When `CLIUrl` is provided, the SDK will not spawn or manage a CLI process — it only connects to the existing server.

## Event Types

Subscribe to these events via `session.On()`:

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

Pass `*copilot.ClientOptions` to `copilot.NewClient()`. Pass `nil` for defaults:

| Option | Description | Default |
|--------|-------------|---------|
| `CLIPath` | Path to Copilot CLI executable | System PATH |
| `CLIUrl` | Connect to existing server (e.g., `"localhost:4321"`) | None |
| `Port` | Server communication port | Random |
| `UseStdio` | Use stdio transport instead of TCP | `true` |
| `LogLevel` | Logging verbosity | `"info"` |
| `AutoStart` | Launch server automatically | `true` |
| `AutoRestart` | Restart on crashes | `true` |
| `Cwd` | Working directory for CLI process | Inherited |

## Session Configuration

Pass `*copilot.SessionConfig` to `client.CreateSession()`:

| Option | Description |
|--------|-------------|
| `Model` | LLM to use (`"gpt-4.1"`, `"claude-sonnet-4.5"`, etc.) |
| `SessionId` | Custom session identifier |
| `Tools` | Custom tool definitions (`[]copilot.Tool`) |
| `MCPServers` | MCP server connections (`map[string]copilot.MCPServerConfig`) |
| `CustomAgents` | Custom agent personas |
| `SystemMessage` | Override default system prompt |
| `Streaming` | Enable incremental response chunks |
| `AvailableTools` | Whitelist of permitted tools |
| `ExcludedTools` | Blacklist of disabled tools |

## Best Practices

1. **Always clean up** — Use `defer client.Stop()` to ensure graceful shutdown.
2. **Set timeouts** — Pass a timeout value (in milliseconds) to `SendAndWait` for long operations.
3. **Handle events** — Subscribe to `session.error` events for robust error handling.
4. **Use streaming** — Enable streaming for better UX on long responses.
5. **Define clear tools** — Write descriptive tool names and descriptions so Copilot invokes them correctly.
6. **Use typed structs** — Leverage Go structs with `json` and `jsonschema` tags for type-safe tool parameters.
