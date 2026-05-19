import chalk from 'chalk';
import prompts from 'prompts';
import { run } from '../utils.js';

const WEBHOOK_DOCS = {
  github:
    'https://docs.github.com/en/webhooks/about-webhooks\n   设置 → Webhooks → Payload URL: http://<host>:<port>/webhooks/github',
  gitlab:
    'https://docs.gitlab.com/ee/user/project/integrations/webhooks.html\n   设置 → Webhooks → URL: http://<host>:<port>/webhooks/gitlab',
};

export async function configWebhook(ctx) {
  console.log(chalk.dim('   通过 Webhook 将 GitHub/GitLab 事件推送到 OpenClaw。'));
  console.log(chalk.dim('   可用于: Issue 自动回复、PR 审查通知、CI 事件触发的 Agent 任务等。'));

  const { setupWebhook } = await prompts({
    type: 'confirm',
    name: 'setupWebhook',
    message: '是否配置 GitHub / GitLab Webhook？',
    initial: false,
  });

  if (!setupWebhook) {
    ctx.webhook = null;
    return false;
  }

  const { platform: gitPlatform } = await prompts({
    type: 'select',
    name: 'platform',
    message: '选择平台',
    choices: [
      { title: 'GitHub', value: 'github' },
      { title: 'GitLab', value: 'gitlab' },
    ],
  });

  const answers = await prompts([
    {
      type: 'text',
      name: 'secret',
      message: 'Webhook Secret (用于验签，可选)',
    },
    {
      type: 'number',
      name: 'port',
      message: 'Webhook 监听端口',
      initial: 3000,
      min: 1024,
      max: 65535,
    },
    {
      type: 'text',
      name: 'path',
      message: 'Webhook 路径',
      initial: `/webhooks/${gitPlatform}`,
    },
  ]);

  const oc = ctx.ocBin || 'openclaw';

  // Enable webhooks plugin
  run(`${oc} plugins install @openclaw/webhooks --force 2>&1`, { ignoreError: true });

  run(
    `${oc} config set channels.webhooks.enabled true --json 2>&1`,
    { ignoreError: true }
  );

  if (answers.secret) {
    run(
      `${oc} config set channels.webhooks.secret "${answers.secret}" 2>&1`,
      { ignoreError: true }
    );
  }

  if (answers.port) {
    run(
      `${oc} config set channels.webhooks.port ${answers.port} --json 2>&1`,
      { ignoreError: true }
    );
  }

  run(`${oc} gateway restart 2>&1`, { ignoreError: true });

  console.log(chalk.green(`   ✓ Webhook 已配置 (${gitPlatform})`));
  console.log(chalk.yellow('   ⚠ 下一步：'));
  console.log(chalk.dim(`   在 ${gitPlatform === 'github' ? 'GitHub' : 'GitLab'} 仓库设置中：`));
  console.log(chalk.dim(`   ${WEBHOOK_DOCS[gitPlatform]}`));

  ctx.webhook = gitPlatform;
  ctx.webhookPort = answers.port;
}
