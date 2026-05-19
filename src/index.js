import chalk from 'chalk';
import { welcome } from './steps/welcome.js';
import { installOpenClaw } from './steps/install.js';
import { runOnboard } from './steps/onboard.js';
import { configChannel } from './steps/channel.js';
import { configModel } from './steps/model.js';
import { configWebhook } from './steps/webhook.js';
import { setupService } from './steps/service.js';

const steps = [
  { name: '环境检测', fn: welcome },
  { name: '安装 OpenClaw', fn: installOpenClaw },
  { name: '初始化配置', fn: runOnboard },
  { name: '飞书通道', fn: configChannel },
  { name: '模型配置', fn: configModel },
  { name: 'GitHub/GitLab Webhook', fn: configWebhook },
  { name: '服务部署', fn: setupService },
];

export async function run() {
  console.log(chalk.cyanBright(`
   ╭──────────────────────────────────────╮
   │                                      │
   │   🦞  OpenClaw 一键配置脚手架         │
   │   安装 · 通道 · 模型 · Webhook       │
   │                                      │
   ╰──────────────────────────────────────╯
  `));

  const ctx = {};

  for (const step of steps) {
    const label = chalk.bold(`[${steps.indexOf(step) + 1}/${steps.length}]`);
    console.log(`\n${label} ${chalk.cyan(step.name)}…`);

    try {
      const result = await step.fn(ctx);
      if (result === false) {
        console.log(chalk.yellow('  已跳过。'));
      }
    } catch (err) {
      console.error(chalk.red(`  ✗ 失败: ${err.message}`));
      console.error(chalk.dim('  请修复问题后重新运行。'));
      process.exit(1);
    }
  }

  console.log(chalk.greenBright('\n╭──────────────────────────────────────╮'));
  console.log(chalk.greenBright('│                                      │'));
  console.log(chalk.greenBright('│   ✓  配置完成！                       │'));
  console.log(chalk.greenBright('│                                      │'));
  console.log(chalk.greenBright('│   验证: openclaw status               │'));
  console.log(chalk.greenBright('│   日志: openclaw logs --follow        │'));
  console.log(chalk.greenBright('│                                      │'));
  console.log(chalk.greenBright('╰──────────────────────────────────────╯\n'));

  if (ctx.summary) {
    console.log(chalk.dim(ctx.summary));
  }
}
