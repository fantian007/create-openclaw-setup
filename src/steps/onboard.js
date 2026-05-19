import ora from 'ora';
import { run } from '../utils.js';

export async function runOnboard(ctx) {
  const oc = ctx.ocBin || 'openclaw';

  const spinner = ora('运行 openclaw onboard…').start();
  try {
    run(`${oc} onboard --yes 2>&1 || ${oc} setup --yes 2>&1`, { ignoreError: true });
    spinner.succeed('初始化完成');
  } catch {
    spinner.warn('部分初始化可能未完成，可稍后手动运行 openclaw configure');
  }
}
