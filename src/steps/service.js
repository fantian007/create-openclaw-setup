import chalk from 'chalk';
import prompts from 'prompts';
import { run, isLinux, isMacOS, isWindows } from '../utils.js';

export async function setupService(ctx) {
  if (isLinux()) {
    console.log(chalk.dim('   检测到 Linux，配置 systemd 服务…'));

    // Enable and start service
    try {
      run('systemctl --user enable openclaw-gateway.service 2>&1', { ignoreError: true });
      run('systemctl --user restart openclaw-gateway.service 2>&1', { ignoreError: true });
      console.log(chalk.green('   ✓ systemd 服务已启用'));
      console.log(chalk.dim('   管理: systemctl --user status openclaw-gateway'));
    } catch (err) {
      console.log(chalk.yellow(`   ⚠ ${err.message}`));
    }
  } else if (isMacOS()) {
    console.log(chalk.yellow('   macOS 环境，跳过服务部署。'));
    console.log(chalk.dim('   手动运行: openclaw gateway run'));
  } else if (isWindows()) {
    console.log(chalk.yellow('   Windows 环境，跳过服务部署。'));
    console.log(chalk.dim('   手动运行: openclaw gateway run'));
  }

  // Build summary
  const lines = ['\n配置摘要:'];
  if (ctx.channel) lines.push(`  飞书: ON (domain=${ctx.channel})`);
  if (ctx.modelProvider) lines.push(`  模型: ${ctx.modelProvider}/${ctx.model}`);
  if (ctx.webhook) lines.push(`  Webhook: ${ctx.webhook} (port=${ctx.webhookPort})`);
  if (ctx.tailscale && ctx.tailscale !== 'off') lines.push(`  Tailscale: ${ctx.tailscale}`);
  ctx.summary = lines.join('\n');
}
