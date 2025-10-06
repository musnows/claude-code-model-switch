#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Configuration file paths
const CLAUDE_SETTINGS_PATH = path.join(process.env.HOME, '.claude', 'settings.json');
const MODEL_CONFIG_PATH = path.join(process.env.HOME, '.claude-code-model-switch', 'settings.json');

// Default values
const DEFAULT_MAX_OUTPUT_TOKENS = '8192';
const DEFAULT_DISABLE_NONESSENTIAL_TRAFFIC = '1';

// Ensure configuration directory exists
function ensureConfigDir() {
  const configDir = path.dirname(MODEL_CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// Load model configuration
function loadModelConfig() {
  ensureConfigDir();

  if (!fs.existsSync(MODEL_CONFIG_PATH)) {
    // Create empty default configuration file
    const defaultConfig = { models: {} };
    fs.writeFileSync(MODEL_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  try {
    const configContent = fs.readFileSync(MODEL_CONFIG_PATH, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Error: Failed to parse model configuration file');
    process.exit(1);
  }
}

// Load Claude settings
function loadClaudeSettings() {
  if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    console.error('Error: Claude settings file not found');
    process.exit(1);
  }

  try {
    const settingsContent = fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf8');
    return JSON.parse(settingsContent);
  } catch (error) {
    console.error('Error: Failed to parse Claude settings file');
    process.exit(1);
  }
}

// Save Claude settings
function saveClaudeSettings(settings) {
  try {
    fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error: Failed to save Claude settings file');
    process.exit(1);
  }
}

// Get model configuration
function getModelConfig(modelName) {
  const config = loadModelConfig();

  if (!config.models || !config.models[modelName]) {
    console.error(`Error: Model "${modelName}" not found`);
    console.log('Available models:', Object.keys(config.models || {}).join(', ') || 'None');
    console.log('Run "ccms --help" to see available commands');
    process.exit(1);
  }

  const modelConfig = config.models[modelName];

  // Check if model configuration is empty
  if (Object.keys(modelConfig).length === 0) {
    console.error(`Error: Model "${modelName}" configuration is empty`);
    console.log('Run "ccms --help" to see available commands');
    process.exit(1);
  }

  return modelConfig;
}

// Apply model configuration
function applyModelConfig(modelConfig) {
  const settings = loadClaudeSettings();

  // Ensure env object exists
  if (!settings.env) {
    settings.env = {};
  }

  // Only update model-related environment variables
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

  // Apply configuration
  for (const key of modelEnvVars) {
    if (modelConfig[key] !== undefined) {
      settings.env[key] = modelConfig[key];
    }
  }

  // Handle default value logic
  // Check required environment variables
  const requiredEnvVars = [
    'ANTHROPIC_MODEL',
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!settings.env[envVar]) {
      console.error(`Error: ${envVar} is required`);
      process.exit(1);
    }
  }

  // If other model fields are not set, use ANTHROPIC_MODEL value
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

  // Handle special environment variable defaults
  if (!settings.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS) {
    settings.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = DEFAULT_MAX_OUTPUT_TOKENS;
  }

  if (!settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
    settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = DEFAULT_DISABLE_NONESSENTIAL_TRAFFIC;
  }

  saveClaudeSettings(settings);
  console.log(`✅ Switched to model: ${settings.env.ANTHROPIC_MODEL}`);
}

// List all models
function listModels() {
  const config = loadModelConfig();
  const models = Object.keys(config.models || {});

  if (models.length === 0) {
    console.log('No models configured');
    return;
  }

  console.log('Available models:');
  models.forEach(model => {
    console.log(`  - ${model}`);
  });
}

// Check if model name is valid
function isValidModel(modelName) {
  const config = loadModelConfig();
  return config.models &&
         config.models[modelName] &&
         Object.keys(config.models[modelName]).length > 0;
}

// Main program
program
  .name('ccms')
  .description('Claude Code Model Switch - Switch Claude Code models')
  .version('1.0.2')
  .argument('[model]', 'Model name to switch to')
  .action((model) => {
    if (model) {
      // If model name argument provided, attempt to switch model
      if (isValidModel(model)) {
        const modelConfig = getModelConfig(model);
        applyModelConfig(modelConfig);
      } else {
        const config = loadModelConfig();
        const modelConfig = config.models && config.models[model];

        if (modelConfig && Object.keys(modelConfig).length === 0) {
          console.error(`Error: Model "${model}" configuration is empty`);
        } else {
          console.error(`Error: Model "${model}" not found`);
        }

        const validModels = Object.keys(config.models || {}).filter(name =>
          config.models[name] && Object.keys(config.models[name]).length > 0
        );
        console.log('Available models:', validModels.join(', ') || 'None');
        console.log('Run "ccms --help" to see available commands');
        process.exit(1);
      }
    } else {
      // If no arguments provided, show help information
      program.help();
    }
  });

program
  .command('switch <model>')
  .description('Switch to specified model')
  .action((model) => {
    const modelConfig = getModelConfig(model);
    applyModelConfig(modelConfig);
  });

program
  .command('list')
  .description('List all available models')
  .action(() => {
    listModels();
  });

// Unset all model-related configuration
function unsetModelConfig() {
  const settings = loadClaudeSettings();

  // Ensure env object exists
  if (!settings.env) {
    settings.env = {};
  }

  // Model-related environment variables to remove (excluding some settings)
  const modelEnvVars = [
    'ANTHROPIC_AUTH_TOKEN',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_MODEL',
    'ANTHROPIC_SMALL_FAST_MODEL',
    'ANTHROPIC_DEFAULT_SONNET_MODEL',
    'ANTHROPIC_DEFAULT_OPUS_MODEL'
  ];

  let removedCount = 0;
  const removedVars = [];

  // Remove only existing model-related environment variables
  for (const key of modelEnvVars) {
    if (settings.env.hasOwnProperty(key)) {
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

program
  .command('config-path')
  .description('Display configuration file paths')
  .action(() => {
    console.log('Model configuration file path:', MODEL_CONFIG_PATH);
    console.log('Claude Code settings file path:', CLAUDE_SETTINGS_PATH);
  });

program
  .command('unset')
  .description('Remove all model-related configuration and use official models')
  .action(() => {
    unsetModelConfig();
  });

program.parse();