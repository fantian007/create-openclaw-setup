import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { run, isLinux } from '../utils.js';

const PROVIDERS = [
  { title: 'DeepSeek', value: 'deepseek', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { title: 'Anthropic (Claude)', value: 'anthropic', models: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5'] },
  { title: 'GitHub Copilot (免费)', value: 'github-copilot', models: ['copilot-gpt-5', 'copilot-gpt-4o', 'copilot-claude-sonnet-4', 'copilot-gemini-2.5-pro'], hint: 'GitHub PAT 登录，Copilot 订阅免 API 费用' },
  { title: 'GitLab AI (Duo)', value: 'gitlab', models: ['gitlab-duo'], hint: 'GitLab Access Token 登录' },
  { title: 'OpenAI', value: 'openai', models: ['gpt-4o', 'gpt-4o-mini'] },
  { title: 'Moonshot (月之暗面)', value: 'moonshot', models: ['moonshot-v1-8k', 'moonshot-v1-32k'] },
  { title: 'Qwen (通义千问)', value: 'qwen', models: ['qwen-max', 'qwen-plus'] },
  { title: 'Zhipu (智谱)', value: 'zhipu', models: ['glm-4', 'glm-4-flash'] },
  { title: '自定义 provider', value: 'custom' },
];

export async function configModel(ctx) {
  const { setModel } = await prompts({
    type: 'confirm',
    name: 'setModel',
    message: '是否配置或切换大模型？',
    initial: true,
  });

  if (!setModel) {
    ctx.modelProvider = null;
    return false;
  }

  const { provider } = await prompts({
    type: 'select',
    name: 'provider',
    message: '选择模型 Provider',
    choices: PROVIDERS.map((p) => ({ title: p.title, value: p.value })),
  });

  const selected = PROVIDERS.find((p) => p.value === provider);

  let model, apiKey, envKey, authMode;

  if (provider === 'github-copilot') {
    // GitHub Copilot login via Personal Access Token
    console.log(chalk.dim('   需要 GitHub Personal Access Token（经典令牌）。'));
    console.log(chalk.dim('   获取: GitHub → Settings → Developer settings → Personal access tokens'));
    console.log(chalk.dim('   所需权限: read:user, read:org (Copilot 订阅必需)'));

    const { copilotModel } = await prompts({
      type: 'select',
      name: 'copilotModel',
      message: '选择 Copilot 模型',
      choices: selected.models.map((m) => ({ title: m, value: m })),
    });
    model = copilotModel;

    const { token } = await prompts({
      type: 'password',
      name: 'token',
      message: 'GitHub Personal Access Token',
      validate: (v) => (v.startsWith('ghp_') || v.startsWith('github_pat_') ? true : 'Token 格式: ghp_xxx 或 github_pat_xxx'),
    });
    apiKey = token;
    envKey = 'GITHUB_TOKEN';
    authMode = 'token';
  } else if (provider === 'gitlab') {
    // GitLab AI login via Access Token
    console.log(chalk.dim('   需要 GitLab Personal Access Token。'));
    console.log(chalk.dim('   获取: GitLab → Settings → Access Tokens'));
    console.log(chalk.dim('   所需权限: api, read_user'));

    model = selected.models[0];

    const { token } = await prompts({
      type: 'password',
      name: 'token',
      message: 'GitLab Personal Access Token',
      validate: (v) => (v.startsWith('glpat-') || v.startsWith('gldt-') ? true : 'Token 格式: glpat-xxx 或 gldt-xxx'),
    });
    apiKey = token;
    envKey = 'GITLAB_TOKEN';
    authMode = 'token';
  } else if (provider === 'custom') {
    const custom = await prompts([
      { type: 'text', name: 'provider', message: 'Provider ID (e.g. deepseek)' },
      { type: 'text', name: 'model', message: '模型 ID (e.g. deepseek-chat)' },
      { type: 'password', name: 'apiKey', message: 'API Key' },
      { type: 'text', name: 'envKey', message: '环境变量名 (e.g. DEEPSEEK_API_KEY)' },
    ]);
    model = custom.model;
    apiKey = custom.apiKey;
    envKey = custom.envKey;
    provider = custom.provider;
  } else {
    if (selected.models.length > 1) {
      const { chosen } = await prompts({
        type: 'select',
        name: 'chosen',
        message: '选择模型',
        choices: selected.models.map((m) => ({ title: m, value: m })),
      });
      model = chosen;
    } else {
      model = selected.models[0];
    }

    const { key } = await prompts({
      type: 'password',
      name: 'key',
      message: `API Key for ${selected.title}`,
    });
    apiKey = key;
    envKey = `${provider.toUpperCase()}_API_KEY`;
    authMode = 'api_key';
  }

  const oc = ctx.ocBin || 'openclaw';

  // Add auth profile
  const spinner = ora('配置模型…').start();

  try {
    run(`echo '{"auth":{"profiles":{"${provider}:default":{"provider":"${provider}","mode":"${authMode}"}}}}' | ${oc} config patch --stdin 2>&1`, { ignoreError: true });
    run(`${oc} config set agents.defaults.model.primary ${provider}/${model} 2>&1`, { ignoreError: true });

    // Save API key for service setup
    ctx.modelEnvKey = envKey;
    ctx.modelApiKey = apiKey;
    ctx.modelProvider = provider;
    ctx.model = model;

    // Apply env now if on Linux (skip for oauth-based providers)
    if (isLinux() && envKey && apiKey) {
      const { mkdirSync, writeFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      const { homedir } = await import('node:os');
      const dir = join(homedir(), '.config/systemd/user/openclaw-gateway.service.d');
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, 'env.conf'),
        `[Service]\nEnvironment=${envKey}=${apiKey}\n`
      );
      run('systemctl --user daemon-reload 2>&1', { ignoreError: true });
    }

    run(`${oc} gateway restart 2>&1`, { ignoreError: true });
    spinner.succeed(`模型已切换为: ${provider}/${model}`);
  } catch (err) {
    spinner.fail('模型配置失败');
    console.error(chalk.red(`   ${err.message}`));
  }
}
