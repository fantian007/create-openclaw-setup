#!/bin/bash
set -e

# =========================================
# create-openclaw-setup — 全自动初始化脚本
# =========================================

echo "========================================"
echo "  create-openclaw-setup 初始化"
echo "========================================"

# --- 0. 检查环境 ---
echo ""
echo "[0/4] 检查环境..."

OS_NAME=$(grep -oP '^NAME="?\K[^"]+' /etc/os-release 2>/dev/null || echo "unknown")
OS_VER=$(grep -oP '^VERSION_ID="?\K[^"]+' /etc/os-release 2>/dev/null || echo "unknown")
ARCH=$(uname -m)
MEM_MB=$(free -m | awk '/^Mem:/{print $2}')

echo "  OS:     ${OS_NAME} ${OS_VER}"
echo "  Arch:   ${ARCH}"
echo "  Memory: ${MEM_MB}MB"
echo "  User:   $(whoami)"
echo "  Home:   ${HOME}"

# --- 1. 安装系统依赖 ---
echo ""
echo "[1/4] 安装系统依赖..."

# CentOS 8
if command -v dnf &>/dev/null; then
  echo "  检测到 dnf (CentOS/RHEL)"

  # 安装基础工具
  PACKAGES="curl wget git python3 python3-pip jq"
  for pkg in $PACKAGES; do
    if ! command -v "$pkg" &>/dev/null; then
      echo "  安装: ${pkg}"
      sudo dnf install -y "$pkg" 2>/dev/null || echo "  !! ${pkg} 安装失败，跳过"
    else
      echo "  已存在: ${pkg}"
    fi
  done

  # 安装 Node.js (OpenClaw 需要)
  if ! command -v node &>/dev/null; then
    echo "  安装 Node.js 22..."
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - 2>/dev/null
    sudo dnf install -y nodejs 2>/dev/null || echo "  !! Node.js 安装失败"
  fi
fi

# --- 2. 安装 Mihomo ---
echo ""
echo "[2/4] 安装 Mihomo..."

if [ -f /tmp/mihomo ]; then
  echo "  已存在: /tmp/mihomo"
else
  echo "  下载 Mihomo v1.19.3..."
  curl -L -o /tmp/mihomo.gz \
    "https://github.com/MetaCubeX/mihomo/releases/download/v1.19.3/mihomo-linux-amd64-v1.19.3.gz" \
    2>/dev/null || {
    echo "  GitHub 下载失败，尝试 ghproxy 镜像..."
    curl -L -o /tmp/mihomo.gz \
      "https://ghproxy.com/https://github.com/MetaCubeX/mihomo/releases/download/v1.19.3/mihomo-linux-amd64-v1.19.3.gz" \
      2>/dev/null
  }
  gunzip -f /tmp/mihomo.gz 2>/dev/null
  chmod +x /tmp/mihomo
  echo "  版本: $(/tmp/mihomo -v 2>&1)"
fi

mkdir -p "${HOME}/.config/mihomo"

# --- 3. 配置 VPN ---
echo ""
echo "[3/4] 配置 VPN..."

CONFIG="${HOME}/.config/mihomo/config.yaml"

if [ -f "$CONFIG" ]; then
  echo "  配置文件已存在: ${CONFIG}"
  PROXY_COUNT=$(python3 -c "
import yaml
with open('${CONFIG}') as f:
    c = yaml.safe_load(f)
print(len(c.get('proxies', [])))
" 2>/dev/null || echo "0")
  echo "  当前节点数: ${PROXY_COUNT}"
else
  echo "  !! 请将 config.yaml 放入 ${CONFIG}"
  echo "  可通过 update-sub.sh 从订阅地址获取"
fi

# --- 4. 配置 OpenClaw ---
echo ""
echo "[4/4] 验证 OpenClaw..."

if command -v openclaw &>/dev/null; then
  echo "  已安装: $(openclaw --version 2>&1 || echo 'ok')"
else
  echo "  OpenClaw 未作为全局命令安装"
  if [ -f "${HOME}/.npm-global/bin/openclaw" ]; then
    echo "  发现本地安装: ${HOME}/.npm-global/bin/openclaw"
  fi
fi

# --- 完成 ---
echo ""
echo "========================================"
echo "  初始化完成！"
echo "========================================"
echo ""
echo "下一步:"
echo ""
echo "  VPN 启动:"
echo "    nohup /tmp/mihomo -d ${HOME}/.config/mihomo > /tmp/mh.log 2>&1 &"
echo ""
echo "  更新订阅:"
echo "    bash vpn/update-sub.sh <订阅地址>"
echo ""
echo "  测试代理:"
echo "    curl -x http://127.0.0.1:7890 -s --max-time 5 https://www.google.com"
echo ""
