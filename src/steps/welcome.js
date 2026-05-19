import chalk from 'chalk';
import { which } from '../utils.js';

export async function welcome(ctx) {
  const nodeVersion = process.versions.node;
  const major = parseInt(nodeVersion.split('.')[0], 10);

  console.log(chalk.dim(`   Node.js ${nodeVersion} | ${process.platform} ${process.arch}`));

  if (major < 18) {
    throw new Error(`Node.js >= 18 必需，当前版本: ${nodeVersion}`);
  }
  console.log(chalk.green('   ✓ Node.js 版本合格'));

  if (!which('npm') && !which('pnpm') && !which('yarn')) {
    throw new Error('未找到 npm / pnpm / yarn 包管理器');
  }
  console.log(chalk.green('   ✓ 包管理器可用'));

  ctx.platform = process.platform;
}
