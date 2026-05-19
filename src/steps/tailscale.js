import chalk from 'chalk';
import prompts from 'prompts';
import { run, which, isLinux, isMacOS } from '../utils.js';

export async function configTailscale(ctx) {
  console.log(chalk.dim('   Tailscale 可将 OpenClaw 网关安全暴露到虚拟内网或公网。'));
  console.log(chalk.dim('   serve: 仅 Tailnet 内网可访问 | funnel: 公网可访问'));

  const { setupVpn } = await prompts({
    type: 'confirm',
    name: 'setupVpn',
    message: '是否配置 Tailscale VPN 接入？',
    initial: false,
  });

  if (!setupVpn) {
    ctx.tailscale = null;
    return false;
  }

  // Check if Tailscale is installed
  const hasTailscale = which('tailscale');
  if (!hasTailscale) {
    console.log(chalk.yellow('   ⚠ 未检测到 tailscale，请先安装：'));
    if (isLinux()) {
      console.log(chalk.dim('   curl -fsSL https://tailscale.com/install.sh | sh'));
    } else if (isMacOS()) {
      console.log(chalk.dim('   brew install tailscale'));
    }
    const { skip } = await prompts({
      type: 'confirm',
      name: 'skip',
      message: '继续配置 Tailscale？（安装后生效）',
      initial: true,
    });
    if (!skip) return false;
  }

  // Check Tailscale auth status
  if (hasTailscale) {
    const status = run('tailscale status --json 2>&1', { ignoreError: true });
    if (status.includes('not logged in') || status.includes('NeedsLogin')) {
      console.log(chalk.yellow('   ⚠ Tailscale 未登录，请先运行:'));
      console.log(chalk.dim('   sudo tailscale up'));
      const { skip } = await prompts({
        type: 'confirm',
        name: 'skip',
        message: '继续配置？（tailscale up 后生效）',
        initial: true,
      });
      if (!skip) return false;
    }
  }

  const { mode } = await prompts({
    type: 'select',
    name: 'mode',
    message: '选择 Tailscale 暴露模式',
    choices: [
      {
        title: 'serve — 仅 Tailnet 内网可访问（推荐）',
        value: 'serve',
        description: '通过 tailscale serve 暴露，仅你 Tailnet 中的设备可访问',
      },
      {
        title: 'funnel — 公网可访问',
        value: 'funnel',
        description: '通过 tailscale funnel 暴露到公网，需 Tailscale Funnel 已启用',
      },
      {
        title: 'off — 关闭',
        value: 'off',
        description: '关闭 Tailscale 集成',
      },
    ],
  });

  const oc = ctx.ocBin || 'openclaw';

  if (mode === 'serve') {
    const { servePath } = await prompts({
      type: 'text',
      name: 'servePath',
      message: 'Tailscale Serve 路径 (e.g. /)',
      initial: '/',
    });
    run(`${oc} config set gateway.tailscale.mode serve 2>&1`, { ignoreError: true });

    // Also configure the Tailscale serve for the gateway port
    const port = run(`${oc} config get gateway.port 2>&1`, { ignoreError: true }).trim() || '18789';
    run(`tailscale serve --bg --set-path ${servePath} / http://127.0.0.1:${port} 2>&1`, { ignoreError: true });

    console.log(chalk.green('   ✓ Tailscale serve 已配置'));
  } else if (mode === 'funnel') {
    const { funnelPath } = await prompts({
      type: 'text',
      name: 'funnelPath',
      message: 'Tailscale Funnel 路径 (e.g. /)',
      initial: '/',
    });
    run(`${oc} config set gateway.tailscale.mode funnel 2>&1`, { ignoreError: true });

    const port = run(`${oc} config get gateway.port 2>&1`, { ignoreError: true }).trim() || '18789';
    run(`tailscale funnel --bg --set-path ${funnelPath} / http://127.0.0.1:${port} 2>&1`, { ignoreError: true });

    console.log(chalk.yellow('   ⚠ Funnel 模式，网关端口已暴露到公网'));
    console.log(chalk.dim('   确保网关已配置认证 (gateway.auth.mode)'));
  } else {
    run(`${oc} config set gateway.tailscale.mode off 2>&1`, { ignoreError: true });
    console.log(chalk.dim('   Tailscale 已关闭'));
  }

  run(`${oc} gateway restart 2>&1`, { ignoreError: true });

  ctx.tailscale = mode;
}
