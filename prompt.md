我需要实现一个claude code的模型切换器,这个切换器用node.js实现,可以通过npm安装.

实现逻辑非常简单.读取`~/.claude/settings.json`,切换里面和模型有关的环境变量。除了这些env，禁止修改配置文件的任何其他字段。

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "sk-caf695360e7f4b018bb1b308cbf992eb",
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_MODEL": "deepseek-chat",
    "ANTHROPIC_SMALL_FAST_MODEL": "deepseek-chat",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-chat",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-chat",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

这个工具本身通过~/.claude-code-models.json配置多个模型,格式为

```json
{
  "models":{
    "模型名称":{
        "ANTHROPIC_AUTH_TOKEN": "sk-caf695360e7f4b018bb1b308cbf992eb",
        "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
        "ANTHROPIC_MODEL": "deepseek-chat",
        "ANTHROPIC_SMALL_FAST_MODEL": "deepseek-chat",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-chat",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-chat",
        "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
    }
  }
}
```

当用户执行`ccms 模型`命令时，读取`~/.claude-code-model-swich/settings.json`文件，检查是否有这个模型名称，没有报错，有就进行`~/.claude/settings.json`替换

重点：
1. `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`是一个特殊的环境变量，当用户没有设置这个环境变量时，**默认为1**，当用户设置为0时，表示允许非必要的流量，对应修改成0
2. `CLAUDE_CODE_MAX_OUTPUT_TOKENS`用户没有设置的时候，默认为8192
3. ANTHROPIC_SMALL_FAST_MODEL、ANTHROPIC_DEFAULT_SONNET_MODEL、ANTHROPIC_DEFAULT_OPUS_MODEL都可以不设置，只有ANTHROPIC_MODEL是必填的，其余三个环境变量在没有设置的时候，沿用ANTHROPIC_MODEL的值。
4. `~/.claude-code-model-swich/settings.json`文件不存在的时候，创建一个空的默认配置文件`{"models": {}}`，并按照模型不存在的错误提示用户（认为加载了这个空配置文件）
