import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { run, which } from '../utils.js';

export async function installOpenClaw(ctx) {
  const already = which('openclaw');

  if (already) {
    const current = run('openclaw --version', { ignoreError: true }).trim();
    console.log(chalk.dim(`   已安装: ${current}`));

    const { reinstall } = await prompts({
      type: 'confirm',
      name: 'reinstall',
      message: '更新/重装 OpenClaw 到最新版？',
      initial: false,
    });
    if (!reinstall) {
      console.log(chalk.dim('  保留现有版本。'));
      ctx.ocBin = 'openclaw';
      return false;
    }
  }

  const spinner = ora('安装 OpenClaw…').start();
  try {
    run('npm install -g openclaw@latest', { silent: false });
    spinner.succeed('OpenClaw 安装完成');
    ctx.ocBin = 'openclaw';
  } catch (err) {
    spinner.fail('安装失败');
    throw new Error(`npm install -g openclaw 失败: ${err.message}`);
  }
}
