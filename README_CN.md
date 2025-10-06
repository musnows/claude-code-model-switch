# Claude Code Model Switch (CCMS)

一个用于 Claude Code 的模型切换器，可以轻松在不同 AI 模型之间切换。

## 🚀 功能特性

- 快速切换 Claude Code 使用的 AI 模型
- 支持多个预配置模型环境
- 自动处理模型相关环境变量
- 命令行界面，操作简单
- 安全的配置管理，只修改模型相关设置
- 使用 unset 命令重置为官方模型

## 📦 安装

```bash
npm install -g claude-code-model-switch
```

## 🛠️ 使用方法

### 基本命令

```bash
# 切换到指定模型
ccms deepseek-chat

# 或者使用 switch 子命令
ccms switch deepseek-chat

# 列出所有可用模型
ccms list

# 查看配置文件路径
ccms config-path

# 清除所有模型相关配置，恢复使用官方模型
ccms unset
```

### 配置模型

编辑配置文件 `~/.claude-code-model-switch/settings.json`：

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

## ⚙️ 配置说明

### 环境变量说明

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `ANTHROPIC_AUTH_TOKEN` | ✅ | - | API 认证令牌 |
| `ANTHROPIC_BASE_URL` | ✅ | - | API 基础 URL |
| `ANTHROPIC_MODEL` | ✅ | - | 主模型名称 |
| `ANTHROPIC_SMALL_FAST_MODEL` | ❌ | 同 `ANTHROPIC_MODEL` | 小型快速模型 |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | ❌ | 同 `ANTHROPIC_MODEL` | 默认 Sonnet 模型 |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | ❌ | 同 `ANTHROPIC_MODEL` | 默认 Opus 模型 |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | ❌ | `8192` | 最大输出令牌数 |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | ❌ | `1` | 禁用非必要流量 |

### 特殊规则

1. **安全配置**：工具只会修改与模型相关的环境变量，不会触及配置文件中的其他字段
2. **默认值处理**：
   - `CLAUDE_CODE_MAX_OUTPUT_TOKENS` 默认为 `8192`
   - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` 默认为 `1`
   - 未设置的模型字段会自动使用 `ANTHROPIC_MODEL` 的值
3. **配置文件**：首次运行时会自动创建空的配置文件 `{"models": {}}`
4. **Unset 命令**：`ccms unset` 命令只删除模型特定的变量，同时保留 `CLAUDE_CODE_MAX_OUTPUT_TOKENS` 和 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`

## 📁 文件位置

- Claude 设置文件：`~/.claude/settings.json`
- 模型配置文件：`~/.claude-code-model-switch/settings.json`

## 🔧 开发

```bash
# 克隆仓库
git clone https://github.com/musnows/claude-code-model-switch.git
cd claude-code-model-switch

# 安装依赖
npm install

# 全局链接（开发用）
npm link
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 开源地址

https://github.com/musnows/claude-code-model-switch