#!/bin/bash
set -e

# Mihomo 安装脚本
# 用法: bash install-mihomo.sh [版本号]
# 默认版本: v1.19.3

VERSION="${1:-v1.19.3}"
MIRROR="${2:-direct}"  # direct 或 ghproxy

MCHOME="${HOME}/.config/mihomo"
BIN="/tmp/mihomo"

echo "==> Mihomo 安装脚本 (${VERSION})"

# 1. 下载二进制
URL="https://github.com/MetaCubeX/mihomo/releases/download/${VERSION}/mihomo-linux-amd64-${VERSION}.gz"
if [ "$MIRROR" = "ghproxy" ]; then
  URL="https://ghproxy.com/${URL}"
fi

echo "==> 下载: ${URL}"
curl -L -o /tmp/mihomo.gz "$URL" || {
  echo "ERROR: 下载失败，请尝试手动下载"
  exit 1
}

gunzip -f /tmp/mihomo.gz
chmod +x "$BIN"
echo "==> 二进制: ${BIN} ($($BIN -v 2>&1))"

# 2. 创建配置目录
mkdir -p "$MCHOME"
echo "==> 配置目录: ${MCHOME}"

# 3. 通知用户配置
echo ""
echo "==> 安装完成！请将 config.yaml 放入 ${MCHOME}/"
echo ""
echo "启动命令:"
echo "  nohup ${BIN} -d ${MCHOME} > /tmp/mh.log 2>&1 &"
echo ""
echo "测试:"
echo "  curl -x http://127.0.0.1:7890 -s --max-time 5 https://www.google.com"
