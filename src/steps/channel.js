import chalk from 'chalk';
import prompts from 'prompts';
import { run } from '../utils.js';

export async function configChannel(ctx) {
  console.log(chalk.dim('   飞书通道需要 App ID 和 App Secret。'));
  console.log(chalk.dim('   获取: 飞书开放平台 → 创建应用 → 添加机器人能力 → 发布'));

  const { setupFeishu } = await prompts({
    type: 'confirm',
    name: 'setupFeishu',
    message: '是否配置飞书通道？',
    initial: true,
  });

  if (!setupFeishu) {
    ctx.channel = null;
    return false;
  }

  const feishu = await prompts([
    {
      type: 'text',
      name: 'appId',
      message: '飞书 App ID（格式: cli_xxx）',
      validate: (v) => (v.startsWith('cli_') ? true : 'App ID 应以 cli_ 开头'),
    },
    {
      type: 'password',
      name: 'appSecret',
      message: '飞书 App Secret',
      validate: (v) => (v.length > 0 ? true : 'Secret 不能为空'),
    },
    {
      type: 'select',
      name: 'domain',
      message: '选择域名',
      choices: [
        { title: '飞书（中国大陆 feishu.cn）', value: 'feishu' },
        { title: 'Lark（国际版 larksuite.com）', value: 'lark' },
      ],
    },
  ]);

  const oc = ctx.ocBin || 'openclaw';

  run(`${oc} plugins install @openclaw/feishu --force 2>&1`, { ignoreError: true });
  run(
    `${oc} channels add --channel feishu --app-token ${feishu.appId} --secret ${feishu.appSecret}`,
    { ignoreError: true }
  );
  run(`${oc} config set channels.feishu.domain ${feishu.domain}`, { ignoreError: true });
  run(`${oc} gateway restart 2>&1`, { ignoreError: true });

  console.log(chalk.green('   ✓ 飞书通道配置完成'));
  ctx.channel = 'feishu';
}
