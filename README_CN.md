# Claude Code Model Switch (CCMS)

一个用于 Claude Code 的模型切换器，可以轻松在不同 AI 模型之间切换。

## 🚀 功能特性

- 一条命令启动 Claude Code 并加载指定模型配置（yolo 模式）
- 支持多个预配置模型环境
- `start` 将模型配置注入环境变量，`config` 可持久化写入 settings.json
- 支持 `shared` 公共环境变量，所有模型自动继承（模型配置可覆盖）
- 自动处理模型相关环境变量及默认值
- 命令行界面，操作简单
- `unset` 可清除 settings.json 中的模型相关配置

## 📦 安装

```bash
npm install -g claude-code-model-switch
```

## 🛠️ 使用方法

### 基本命令

```bash
# 用指定模型启动 Claude Code（自动启用 yolo 模式）
ccms start deepseek-chat

# 将额外参数直接传给 claude
ccms start deepseek-chat -p "hello"

# 把模型配置写入 ~/.claude/settings.json
ccms config deepseek-chat

# 列出所有可用模型
ccms list

# 查看配置文件路径
ccms config-path

# 清除 settings.json 中的模型相关配置，恢复使用官方模型
ccms unset

# 管理所有模型共享的环境变量
ccms shared list
ccms shared set API_TIMEOUT_MS 600000
ccms shared unset API_TIMEOUT_MS
```

### 配置模型

编辑配置文件 `~/.claude-code-model-switch/settings.json`：

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
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | ❌ | 不设置 | 禁用非必要流量 |

### 特殊规则

1. **start 命令**：`ccms start <model>` 将模型配置注入环境变量并启动 `claude`，默认附带 `--dangerously-skip-permissions`（yolo 模式）
2. **config 命令**：`ccms config <model>` 将模型配置写入 `~/.claude/settings.json`，适合需要持久化配置的场景
3. **shared 公共变量**：`shared` 中的环境变量会应用到所有模型；单个模型里同名变量会覆盖 shared
4. **默认值处理**：
   - `CLAUDE_CODE_MAX_OUTPUT_TOKENS` 默认为 `8192`
   - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` 仅在显式配置时设置
   - 未设置的模型字段会自动使用 `ANTHROPIC_MODEL` 的值
4. **配置文件**：首次运行时会自动创建空的配置文件 `{"shared": {}, "models": {}}`
5. **Unset 命令**：`ccms unset` 只删除 `settings.json` 中的模型相关变量，恢复使用官方模型

## 📁 文件位置

- 模型配置文件：`~/.claude-code-model-switch/settings.json`
- Claude Code 设置文件（`config` / `unset` 使用）：`~/.claude/settings.json`

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
