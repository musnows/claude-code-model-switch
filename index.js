#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { program } = require('commander');

const CLAUDE_SETTINGS_PATH = path.join(process.env.HOME, '.claude', 'settings.json');
const MODEL_CONFIG_PATH = path.join(process.env.HOME, '.claude-code-model-switch', 'settings.json');
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
const YOLO_ARGS = ['--dangerously-skip-permissions'];

const DEFAULT_MAX_OUTPUT_TOKENS = '8192';
const DEFAULT_DISABLE_NONESSENTIAL_TRAFFIC = '1';
const DEFAULT_ATTRIBUTION_HEADER = '0';
const DEFAULT_MAX_CONTEXT_TOKENS = '200000';
const DEFAULT_AUTOCOMPACT_PCT_OVERRIDE = '80';

const MODEL_ENV_VARS = [
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_SMALL_FAST_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
  'CLAUDE_CODE_MAX_CONTEXT_TOKENS',
  'CLAUDE_AUTOCOMPACT_PCT_OVERRIDE',
  'CLAUDE_CODE_ATTRIBUTION_HEADER',
  'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
  'CLAUDE_CODE_AUTO_COMPACT_WINDOW',
  'API_TIMEOUT_MS'
];

const UNSET_ENV_VARS = [
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_MODEL',
  'ANTHROPIC_SMALL_FAST_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL',
  'CLAUDE_CODE_MAX_CONTEXT_TOKENS',
  'CLAUDE_AUTOCOMPACT_PCT_OVERRIDE'
];

const CONTEXT_ENV_VARS = [
  'CLAUDE_CODE_MAX_CONTEXT_TOKENS',
  'CLAUDE_AUTOCOMPACT_PCT_OVERRIDE'
];

const DERIVED_MODEL_FIELDS = [
  'ANTHROPIC_SMALL_FAST_MODEL',
  'ANTHROPIC_DEFAULT_SONNET_MODEL',
  'ANTHROPIC_DEFAULT_OPUS_MODEL',
  'ANTHROPIC_DEFAULT_HAIKU_MODEL'
];

const REQUIRED_ENV_VARS = [
  'ANTHROPIC_MODEL',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL'
];

function ensureConfigDir() {
  const configDir = path.dirname(MODEL_CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

function loadModelConfig() {
  ensureConfigDir();

  if (!fs.existsSync(MODEL_CONFIG_PATH)) {
    const defaultConfig = { shared: {}, models: {} };
    fs.writeFileSync(MODEL_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  try {
    return JSON.parse(fs.readFileSync(MODEL_CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.error('Error: Failed to parse model configuration file');
    process.exit(1);
  }
}

function loadClaudeSettings() {
  if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    console.error('Error: Claude settings file not found');
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf8'));
  } catch (error) {
    console.error('Error: Failed to parse Claude settings file');
    process.exit(1);
  }
}

function saveClaudeSettings(settings) {
  try {
    fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error: Failed to save Claude settings file');
    process.exit(1);
  }
}

function getValidModels(config = loadModelConfig()) {
  return Object.keys(config.models || {}).filter(
    (name) => config.models[name] && Object.keys(config.models[name]).length > 0
  );
}

function reportUnknownModel(model) {
  const config = loadModelConfig();
  const modelConfig = config.models && config.models[model];

  if (modelConfig && Object.keys(modelConfig).length === 0) {
    console.error(`Error: Model "${model}" configuration is empty`);
  } else {
    console.error(`Error: Model "${model}" not found`);
  }

  console.log('Available models:', getValidModels(config).join(', ') || 'None');
  console.log('Run "ccms --help" to see available commands');
  process.exit(1);
}

function saveModelConfig(config) {
  ensureConfigDir();
  try {
    fs.writeFileSync(MODEL_CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error: Failed to save model configuration file');
    process.exit(1);
  }
}

function getSharedEnv(config = loadModelConfig()) {
  const shared = config.shared;
  if (!shared || typeof shared !== 'object' || Array.isArray(shared)) {
    return {};
  }
  return shared;
}

function getRawModelConfig(modelName, config = loadModelConfig()) {
  if (!config.models || !config.models[modelName]) {
    reportUnknownModel(modelName);
  }

  const modelConfig = config.models[modelName];

  if (Object.keys(modelConfig).length === 0) {
    console.error(`Error: Model "${modelName}" configuration is empty`);
    console.log('Run "ccms --help" to see available commands');
    process.exit(1);
  }

  return modelConfig;
}

function mergeModelConfig(modelName) {
  const config = loadModelConfig();
  const shared = getSharedEnv(config);
  const modelConfig = getRawModelConfig(modelName, config);

  return { ...shared, ...modelConfig };
}

function hasConfiguredValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function normalizeModelConfig(modelConfig) {
  const normalized = { ...modelConfig };

  if (normalized.ANTHROPIC_MODEL) {
    for (const field of DERIVED_MODEL_FIELDS) {
      if (!normalized[field]) {
        normalized[field] = normalized.ANTHROPIC_MODEL;
      }
    }
  }

  normalized.CLAUDE_CODE_ATTRIBUTION_HEADER = DEFAULT_ATTRIBUTION_HEADER;

  const hasOneMillionContextSuffix = String(normalized.ANTHROPIC_MODEL || '').endsWith('[1m]');
  const hasConfiguredContextTokens = hasConfiguredValue(normalized.CLAUDE_CODE_MAX_CONTEXT_TOKENS);

  if (!hasOneMillionContextSuffix && !hasConfiguredContextTokens) {
    normalized.CLAUDE_CODE_MAX_CONTEXT_TOKENS = DEFAULT_MAX_CONTEXT_TOKENS;

    if (!hasConfiguredValue(normalized.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE)) {
      normalized.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE = DEFAULT_AUTOCOMPACT_PCT_OVERRIDE;
    }
  }

  return normalized;
}

function buildModelEnv(modelConfig) {
  const normalized = normalizeModelConfig(modelConfig);
  const env = { ...process.env };

  for (const [key, value] of Object.entries(normalized)) {
    if (value !== undefined && value !== null) {
      env[key] = String(value);
    }
  }

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!env[envVar]) {
      console.error(`Error: ${envVar} is required`);
      process.exit(1);
    }
  }

  if (!env.CLAUDE_CODE_MAX_OUTPUT_TOKENS) {
    env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = DEFAULT_MAX_OUTPUT_TOKENS;
  }

  if (!env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = DEFAULT_DISABLE_NONESSENTIAL_TRAFFIC;
  }

  return env;
}

function getStartArgsFromArgv() {
  const args = process.argv.slice(2);

  if (args[0] !== 'start') {
    return [];
  }

  let claudeArgs = args.slice(2);
  if (claudeArgs[0] === '--') {
    claudeArgs = claudeArgs.slice(1);
  }

  return claudeArgs;
}

function hasPermissionOverride(args) {
  return args.some((arg) =>
    arg === '--dangerously-skip-permissions' ||
    arg === '--allow-dangerously-skip-permissions' ||
    arg.startsWith('--permission-mode')
  );
}

function buildStartArgs(userArgs = []) {
  if (hasPermissionOverride(userArgs)) {
    return userArgs;
  }

  return [...YOLO_ARGS, ...userArgs];
}

function launchClaude(env, claudeArgs = []) {
  const child = spawn(CLAUDE_BIN, claudeArgs, {
    env,
    stdio: 'inherit'
  });

  child.on('error', (error) => {
    if (error.code === 'ENOENT') {
      console.error(`Error: "${CLAUDE_BIN}" command not found. Is Claude Code installed?`);
    } else {
      console.error(`Error: Failed to start Claude Code (${error.message})`);
    }
    process.exit(1);
  });

  child.on('close', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

function startClaudeWithModel(modelName) {
  const modelConfig = mergeModelConfig(modelName);
  const env = buildModelEnv(modelConfig);
  const claudeArgs = buildStartArgs(getStartArgsFromArgv());

  console.log(`[ccms] model: ${env.ANTHROPIC_MODEL}, endpoint: ${env.ANTHROPIC_BASE_URL} (yolo mode)\n`);
  launchClaude(env, claudeArgs);
}

function applyModelConfig(modelConfig) {
  const settings = loadClaudeSettings();
  const normalized = normalizeModelConfig(modelConfig);

  if (!settings.env) {
    settings.env = {};
  }

  for (const envVar of CONTEXT_ENV_VARS) {
    if (!Object.prototype.hasOwnProperty.call(normalized, envVar)) {
      delete settings.env[envVar];
    }
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (value !== undefined && value !== null) {
      settings.env[key] = String(value);
    }
  }

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!settings.env[envVar]) {
      console.error(`Error: ${envVar} is required`);
      process.exit(1);
    }
  }

  if (!settings.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS) {
    settings.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = DEFAULT_MAX_OUTPUT_TOKENS;
  }

  if (!settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = DEFAULT_DISABLE_NONESSENTIAL_TRAFFIC;
  }

  saveClaudeSettings(settings);
  console.log(`Switched to model: ${settings.env.ANTHROPIC_MODEL}`);
}

function configModel(modelName) {
  const modelConfig = mergeModelConfig(modelName);
  applyModelConfig(modelConfig);
}

function listSharedEnv() {
  const shared = getSharedEnv();
  const keys = Object.keys(shared);

  if (keys.length === 0) {
    console.log('No shared environment variables configured');
    return;
  }

  console.log('Shared environment variables:');
  keys.forEach((key) => {
    console.log(`  ${key}=${shared[key]}`);
  });
}

function setSharedEnv(key, value) {
  const config = loadModelConfig();

  if (!config.shared || typeof config.shared !== 'object' || Array.isArray(config.shared)) {
    config.shared = {};
  }

  config.shared[key] = value;
  saveModelConfig(config);
  console.log(`[ccms] shared env set: ${key}=${value}`);
}

function unsetSharedEnv(key) {
  const config = loadModelConfig();
  const shared = getSharedEnv(config);

  if (!Object.prototype.hasOwnProperty.call(shared, key)) {
    console.log(`No shared environment variable found: ${key}`);
    return;
  }

  delete config.shared[key];
  saveModelConfig(config);
  console.log(`[ccms] shared env removed: ${key}`);
}

function unsetModelConfig() {
  const settings = loadClaudeSettings();

  if (!settings.env) {
    settings.env = {};
  }

  settings.env.CLAUDE_CODE_ATTRIBUTION_HEADER = DEFAULT_ATTRIBUTION_HEADER;

  let removedCount = 0;
  const removedVars = [];

  for (const key of UNSET_ENV_VARS) {
    if (Object.prototype.hasOwnProperty.call(settings.env, key)) {
      delete settings.env[key];
      removedCount++;
      removedVars.push(key);
    }
  }

  saveClaudeSettings(settings);

  if (removedCount > 0) {
    console.log(`Removed ${removedCount} model-related configurations: ${removedVars.join(', ')}`);
    console.log('Restored to use claude official models');
  } else {
    console.log('No model-related configurations found to remove');
  }
}

function listModels() {
  const models = getValidModels();

  if (models.length === 0) {
    console.log('No models configured');
    return;
  }

  console.log('Available models:');
  models.forEach((model) => {
    console.log(`  - ${model}`);
  });
}

program
  .name('ccms')
  .description('Claude Code Model Switch - Manage and launch Claude Code with configured models')
  .version('2.2.2');

program
  .command('start <model> [claude-args...]')
  .description('Launch Claude Code with model env vars (yolo mode enabled)')
  .allowUnknownOption()
  .allowExcessArguments()
  .action((model) => {
    startClaudeWithModel(model);
  });

program
  .command('config <model>')
  .description('Write model configuration to ~/.claude/settings.json')
  .action((model) => {
    configModel(model);
  });

program
  .command('list')
  .description('List all available models')
  .action(() => {
    listModels();
  });

program
  .command('config-path')
  .description('Display configuration file paths')
  .action(() => {
    console.log('Model configuration file path:', MODEL_CONFIG_PATH);
    console.log('Claude Code settings file path:', CLAUDE_SETTINGS_PATH);
  });

program
  .command('unset')
  .description('Remove model-related configuration from ~/.claude/settings.json')
  .action(() => {
    unsetModelConfig();
  });

program
  .command('shared')
  .description('Manage shared environment variables for all models')
  .argument('[action]', 'list, set, or unset')
  .argument('[key]', 'Environment variable name')
  .argument('[value]', 'Environment variable value')
  .action((action, key, value) => {
    if (!action || action === 'list') {
      listSharedEnv();
      return;
    }

    if (action === 'set') {
      if (!key || value === undefined) {
        console.error('Usage: ccms shared set <key> <value>');
        process.exit(1);
      }
      setSharedEnv(key, value);
      return;
    }

    if (action === 'unset') {
      if (!key) {
        console.error('Usage: ccms shared unset <key>');
        process.exit(1);
      }
      unsetSharedEnv(key);
      return;
    }

    console.error(`Unknown shared action: ${action}`);
    console.log('Usage: ccms shared [list|set <key> <value>|unset <key>]');
    process.exit(1);
  });

program.parse();

if (!process.argv.slice(2).length) {
  program.help();
}
