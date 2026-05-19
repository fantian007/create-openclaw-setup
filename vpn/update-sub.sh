#!/bin/bash
set -e

# 订阅地址更新脚本
# 用法: bash update-sub.sh <订阅地址> [output路径]

if [ $# -lt 1 ]; then
  echo "用法: bash update-sub.sh <订阅地址> [output路径]"
  echo ""
  echo "示例:"
  echo "  bash update-sub.sh 'https://example.com/sub?token=xxx'"
  echo "  bash update-sub.sh 'https://example.com/sub' ~/.config/mihomo/config.yaml"
  exit 1
fi

SUB_URL="$1"
OUTPUT="${2:-${HOME}/.config/mihomo/config.yaml}"
TMP_FILE="/tmp/mihomo_sub_$$.yaml"

echo "==> 拉取订阅..."
echo "地址: ${SUB_URL}"

# 添加 User-Agent 并请求 clash 格式
curl -s --max-time 30 \
  -H "User-Agent: clash.meta" \
  "${SUB_URL}&clash=1" \
  -o "${TMP_FILE}"

LINE_COUNT=$(wc -l < "${TMP_FILE}")
echo "==> 下载完成: ${LINE_COUNT} 行"

# 检查是否有效 YAML
python3 -c "
import yaml
try:
    cfg = yaml.safe_load(open('${TMP_FILE}'))
    proxies = cfg.get('proxies', [])
    groups = cfg.get('proxy-groups', [])
    print(f'  节点数: {len(proxies)}')
    print(f'  分组数: {len(groups)}')
except Exception as e:
    print(f'  YAML 解析失败: {e}')
    exit(1)
" 2>&1

# 备份旧配置
if [ -f "${OUTPUT}" ]; then
  cp "${OUTPUT}" "${OUTPUT}.bak"
  echo "==> 旧配置已备份: ${OUTPUT}.bak"
fi

# 安装新配置
cp "${TMP_FILE}" "${OUTPUT}"
rm -f "${TMP_FILE}"
echo "==> 新配置已写入: ${OUTPUT}"

# 重启 mihomo
echo "==> 重启 mihomo..."
pkill -f mihomo 2>/dev/null || true
sleep 1
rm -f "${HOME}/.config/mihomo/geoip.metadb" "${HOME}/.config/mihomo/cache.db"
nohup /tmp/mihomo -d "${HOME}/.config/mihomo" > /tmp/mh.log 2>&1 &
sleep 2

# 验证
echo "==> 验证代理..."
curl -x http://127.0.0.1:7890 -s --max-time 8 "https://www.google.com" \
  -o /dev/null -w "  Google: %{http_code} %{time_total}s\n" || echo "  Google: 失败"
curl -x http://127.0.0.1:7890 -s --max-time 8 "https://www.youtube.com" \
  -o /dev/null -w "  YouTube: %{http_code}\n" || echo "  YouTube: 失败"

echo "==> 完成!"
