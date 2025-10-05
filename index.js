#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// 配置文件路径
const CLAUDE_SETTINGS_PATH = path.join(process.env.HOME, '.claude', 'settings.json');
const MODEL_CONFIG_PATH = path.join(process.env.HOME, '.claude-code-model-switch', 'settings.json');

// 默认值
const DEFAULT_MAX_OUTPUT_TOKENS = '8192';
const DEFAULT_DISABLE_NONESSENTIAL_TRAFFIC = '1';

// 确保配置文件目录存在
function ensureConfigDir() {
  const configDir = path.dirname(MODEL_CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// 加载模型配置
function loadModelConfig() {
  ensureConfigDir();

  if (!fs.existsSync(MODEL_CONFIG_PATH)) {
    // 创建空的默认配置文件
    const defaultConfig = { models: {} };
    fs.writeFileSync(MODEL_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  try {
    const configContent = fs.readFileSync(MODEL_CONFIG_PATH, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('错误：无法解析模型配置文件');
    process.exit(1);
  }
}

// 加载Claude设置
function loadClaudeSettings() {
  if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    console.error('错误：找不到Claude设置文件');
    process.exit(1);
  }

  try {
    const settingsContent = fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf8');
    return JSON.parse(settingsContent);
  } catch (error) {
    console.error('错误：无法解析Claude设置文件');
    process.exit(1);
  }
}

// 保存Claude设置
function saveClaudeSettings(settings) {
  try {
    fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('错误：无法保存Claude设置文件');
    process.exit(1);
  }
}

// 获取模型配置
function getModelConfig(modelName) {
  const config = loadModelConfig();

  if (!config.models || !config.models[modelName]) {
    console.error(`错误：找不到模型 "${modelName}"`);
    console.log('可用的模型：', Object.keys(config.models || {}).join(', ') || '无');
    process.exit(1);
  }

  const modelConfig = config.models[modelName];

  // 检查模型配置是否为空
  if (Object.keys(modelConfig).length === 0) {
    console.error(`错误：模型 "${modelName}" 的配置为空`);
    process.exit(1);
  }

  return modelConfig;
}

// 应用模型配置
function applyModelConfig(modelConfig) {
  const settings = loadClaudeSettings();

  // 确保env对象存在
  if (!settings.env) {
    settings.env = {};
  }

  // 只更新模型相关的环境变量
  const modelEnvVars = [
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_MODEL',
    'ANTHROPIC_SMALL_FAST_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL',
    'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
    'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC'
  ];

  // 应用配置
  for (const key of modelEnvVars) {
    if (modelConfig[key] !== undefined) {
      settings.env[key] = modelConfig[key];
    }
  }

  // 处理默认值逻辑
  // 检查必填的环境变量
  const requiredEnvVars = [
    'ANTHROPIC_MODEL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!settings.env[envVar]) {
      console.error(`错误：${envVar} 是必填的`);
      process.exit(1);
    }
  }

  // 如果其他模型字段未设置，使用ANTHROPIC_MODEL的值
  const derivedModelFields = [
    'ANTHROPIC_SMALL_FAST_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL'
  ];

  for (const field of derivedModelFields) {
    if (!settings.env[field]) {
      settings.env[field] = settings.env.ANTHROPIC_MODEL;
    }
  }

  // 处理特殊环境变量默认值
  if (!settings.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS) {
    settings.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = DEFAULT_MAX_OUTPUT_TOKENS;
  }

  if (!settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = DEFAULT_DISABLE_NONESSENTIAL_TRAFFIC;
  }

  saveClaudeSettings(settings);
  console.log(`✅ 已切换到模型: ${settings.env.ANTHROPIC_MODEL}`);
}

// 列出所有模型
function listModels() {
  const config = loadModelConfig();
  const models = Object.keys(config.models || {});

  if (models.length === 0) {
    console.log('没有配置任何模型');
    return;
  }

  console.log('可用的模型：');
  models.forEach(model => {
    console.log(`  - ${model}`);
  });
}

// 检查是否是有效的模型名称
function isValidModel(modelName) {
  const config = loadModelConfig();
  return config.models &&
         config.models[modelName] &&
         Object.keys(config.models[modelName]).length > 0;
}

// 主程序
program
  .name('ccms')
  .description('Claude Code Model Switch - 切换Claude Code模型')
  .version('1.0.0')
  .argument('[model]', '要切换的模型名称')
  .action((model) => {
    if (model) {
      // 如果提供了模型名称参数，尝试切换模型
      if (isValidModel(model)) {
        const modelConfig = getModelConfig(model);
        applyModelConfig(modelConfig);
      } else {
        const config = loadModelConfig();
        const modelConfig = config.models && config.models[model];

        if (modelConfig && Object.keys(modelConfig).length === 0) {
          console.error(`错误：模型 "${model}" 的配置为空`);
        } else {
          console.error(`错误：找不到模型 "${model}"`);
        }

        const validModels = Object.keys(config.models || {}).filter(name =>
          config.models[name] && Object.keys(config.models[name]).length > 0
        );
        console.log('可用的模型：', validModels.join(', ') || '无');
        process.exit(1);
      }
    } else {
      // 如果没有参数，显示帮助信息
      program.help();
    }
  });

program
  .command('switch <model>')
  .description('切换到指定模型')
  .action((model) => {
    const modelConfig = getModelConfig(model);
    applyModelConfig(modelConfig);
  });

program
  .command('list')
  .description('列出所有可用的模型')
  .action(() => {
    listModels();
  });

program
  .command('config-path')
  .description('显示配置文件路径')
  .action(() => {
    console.log('模型配置文件路径:', MODEL_CONFIG_PATH);
    console.log('Claude设置文件路径:', CLAUDE_SETTINGS_PATH);
  });

program.parse();