# Claude Code Model Switch (CCMS)

A CLI tool for switching between different AI models in Claude Code.

## 🚀 Features

- Quickly switch AI models used by Claude Code
- Support for multiple pre-configured model environments
- Automatic handling of model-related environment variables
- Simple command-line interface
- Secure configuration management - only modifies model-related settings

## 📦 Installation

```bash
npm install -g claude-code-model-switch
```

## 🛠️ Usage

### Basic Commands

```bash
# Switch to specified model
ccms deepseek-chat

# Or use switch subcommand
ccms switch deepseek-chat

# List all available models
ccms list

# Show configuration file paths
ccms config-path
```

### Model Configuration

Edit the configuration file `~/.claude-code-model-switch/settings.json`:

```json
{
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
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | ❌ | `1` | Disable non-essential traffic |

### Special Rules

1. **Secure Configuration**: The tool only modifies model-related environment variables and won't touch other fields in the configuration file
2. **Default Values**:
   - `CLAUDE_CODE_MAX_OUTPUT_TOKENS` defaults to `8192`
   - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` defaults to `1`
   - Unset model fields automatically use the value of `ANTHROPIC_MODEL`
3. **Configuration File**: Empty configuration file `{"models": {}}` is automatically created on first run

## 📁 File Locations

- Claude settings file: `~/.claude/settings.json`
- Model configuration file: `~/.claude-code-model-switch/settings.json`

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