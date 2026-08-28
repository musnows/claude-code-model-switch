# Claude Code Model Switch (CCMS)

A CLI tool for switching between different AI models in Claude Code.

## 🚀 Features

- Launch Claude Code with a preconfigured model in one command (yolo mode)
- Support for multiple pre-configured model environments
- `start` injects model config as env vars; `config` persists to settings.json
- `shared` env vars apply to all models (model-specific values override shared)
- Automatic handling of model-related environment variables and defaults
- Simple command-line interface
- `unset` removes model-related entries from settings.json

## 📦 Installation

```bash
npm install -g claude-code-model-switch
```

## 🛠️ Usage

### Basic Commands

```bash
# Launch Claude Code with the specified model (yolo mode enabled)
ccms start deepseek-chat

# Pass extra arguments directly to claude
ccms start deepseek-chat -p "hello"

# Write model configuration to ~/.claude/settings.json
ccms config deepseek-chat

# List all available models
ccms list

# Show configuration file paths
ccms config-path

# Remove model-related configuration from settings.json
ccms unset

# Manage shared environment variables for all models
ccms shared list
ccms shared set API_TIMEOUT_MS 600000
ccms shared unset API_TIMEOUT_MS
```

### Model Configuration

Edit the configuration file `~/.claude-code-model-switch/settings.json`:

```json
{
  "shared": {
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "API_TIMEOUT_MS": "600000"
  },
  "models": {
    "deepseek-chat": {
      "ANTHROPIC_AUTH_TOKEN": "sk-your-token-here",
      "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
      "ANTHROPIC_MODEL": "deepseek-chat",
      "ANTHROPIC_SMALL_FAST_MODEL": "deepseek-chat",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-chat",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-chat",
      "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    },
    "claude-3-5-sonnet": {
      "ANTHROPIC_AUTH_TOKEN": "your-anthropic-token-here",
      "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
      "ANTHROPIC_MODEL": "claude-3-5-sonnet-20241022",
      "ANTHROPIC_SMALL_FAST_MODEL": "claude-3-haiku-20240307",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-3-5-sonnet-20241022",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-3-opus-20240229",
      "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "0"
    }
  }
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_AUTH_TOKEN` | ✅ | - | API authentication token |
| `ANTHROPIC_BASE_URL` | ✅ | - | API base URL |
| `ANTHROPIC_MODEL` | ✅ | - | Main model name |
| `ANTHROPIC_SMALL_FAST_MODEL` | ❌ | Same as `ANTHROPIC_MODEL` | Small fast model |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | ❌ | Same as `ANTHROPIC_MODEL` | Default Sonnet model |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | ❌ | Same as `ANTHROPIC_MODEL` | Default Opus model |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | ❌ | `8192` | Maximum output tokens |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | ❌ | Not set | Disable non-essential traffic |

### Special Rules

1. **start command**: `ccms start <model>` injects model config as environment variables and launches `claude` with `--dangerously-skip-permissions` (yolo mode)
2. **config command**: `ccms config <model>` writes model config to `~/.claude/settings.json` for persistent configuration
3. **shared env vars**: variables in `shared` apply to every model; model-specific values override shared ones
4. **Default Values**:
   - `CLAUDE_CODE_MAX_OUTPUT_TOKENS` defaults to `8192`
   - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is only set when explicitly configured
   - Unset model fields automatically use the value of `ANTHROPIC_MODEL`
4. **Configuration File**: Empty configuration file `{"shared": {}, "models": {}}` is automatically created on first run
5. **Unset Command**: `ccms unset` removes only model-specific variables from `settings.json` and restores official models

## 📁 File Locations

- Model configuration file: `~/.claude-code-model-switch/settings.json`
- Claude Code settings file (used by `config` / `unset`): `~/.claude/settings.json`

## 🔧 Development

```bash
# Clone repository
git clone https://github.com/musnows/claude-code-model-switch.git
cd claude-code-model-switch

# Install dependencies
npm install

# Global link (for development)
npm link
```

## 📄 License

MIT License

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 🔗 Repository

https://github.com/musnows/claude-code-model-switch
