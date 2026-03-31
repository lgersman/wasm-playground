# Chrome DevTools MCP Server

This project uses the [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) MCP server, which lets the agent control and debug live Chrome browser instances via the Chrome DevTools Protocol.

## Configuration

Configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--auto-connect", "--no-usage-statistics"]
    }
  }
}
```

## Available Tools

### Input Automation
| Tool | Description |
|---|---|
| `click` | Click elements on the page |
| `drag` | Drag and drop elements |
| `fill` | Fill a single form input |
| `fill_form` | Fill multiple form fields at once |
| `handle_dialog` | Accept or dismiss browser dialogs |
| `hover` | Hover over elements |
| `press_key` | Press keyboard keys and combinations |
| `type_text` | Type text into focused inputs |
| `upload_file` | Upload files through file inputs |

### Navigation
| Tool | Description |
|---|---|
| `new_page` | Open a new browser tab |
| `close_page` | Close a tab |
| `list_pages` | List all open pages |
| `select_page` | Switch between pages |
| `navigate_page` | Navigate to URLs or back/forward/reload |
| `wait_for` | Wait for specific text to appear |

### Emulation
| Tool | Description |
|---|---|
| `emulate` | Emulate devices, network conditions, geolocation, CPU throttling |
| `resize_page` | Change viewport dimensions |

### Performance Analysis
| Tool | Description |
|---|---|
| `performance_start_trace` | Start recording a performance trace |
| `performance_stop_trace` | Stop trace recording |
| `performance_analyze_insight` | Analyze performance insights from a trace |
| `take_memory_snapshot` | Capture a heap snapshot for memory leak detection |

### Network Debugging
| Tool | Description |
|---|---|
| `list_network_requests` | List all network requests made by the page |
| `get_network_request` | Get details of a specific network request |

### Debugging & Analysis
| Tool | Description |
|---|---|
| `take_screenshot` | Capture full-page or element screenshots |
| `take_snapshot` | Take an accessibility tree snapshot of the page |
| `evaluate_script` | Execute JavaScript in the page context |
| `list_console_messages` | List all console messages |
| `get_console_message` | Get details of a specific console message |
| `lighthouse_audit` | Run Lighthouse accessibility, SEO, and best-practices audits |

## CLI Options

| Flag | Description |
|---|---|
| `--auto-connect` | Automatically discover and connect to running Chrome instances |
| `--browserUrl <url>` | Connect to an existing Chrome instance (e.g. `http://127.0.0.1:9222`) |
| `--wsEndpoint <url>` | Connect via WebSocket endpoint |
| `--headless` | Run Chrome without a UI |
| `--isolated` | Use a temporary profile that auto-cleans on exit |
| `--slim` | Expose only 3 basic tools (lightweight mode) |
| `--user-data-dir <path>` | Use a custom Chrome profile directory |
| `--no-usage-statistics` | Disable telemetry |

## Requirements

- Node.js v20.19+
- Chrome (current stable or newer)
