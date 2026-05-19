# VPN — Mihomo 代理配置

使用 clash.meta 内核（Mihomo）构建 HTTP/SOCKS5 代理服务。

## 架构

```
订阅地址 ──→ config.yaml ──→ Mihomo ─┬─ HTTP Proxy :7890
                                     ├─ SOCKS5    :7891
                                     ├─ Mixed     :7893
                                     └─ API       :9090 (external-controller)
```

## 安装流程

### 1. 下载 Mihomo 二进制

```bash
# 下载 mihomo-linux-amd64 (v1.19.3)
curl -L -o /tmp/mihomo.tar.gz \
  "https://github.com/MetaCubeX/mihomo/releases/download/v1.19.3/mihomo-linux-amd64-v1.19.3.gz"
gunzip /tmp/mihomo.tar.gz
chmod +x /tmp/mihomo
```

> 若境外 GitHub 下载慢，通过 `ghproxy.com` 镜像：
> `https://ghproxy.com/https://github.com/...`

### 2. 准备配置目录

```bash
mkdir -p /home/zys/.config/mihomo
```

### 3. 写入配置

将生成的 `config.yaml` 放入 `~/.config/mihomo/`。

### 4. 启动

```bash
# 启动（后台）
/tmp/mihomo -d /home/zys/.config/mihomo > /tmp/mh.log 2>&1 &

# 验证代理可用
curl -x http://127.0.0.1:7890 -s --max-time 5 https://www.google.com -o /dev/null -w "%{http_code}\n"
# 返回 200 或 302 表示成功

# 查看日志
tail -f /tmp/mh.log
```

### 5. 通过 API 管理

```bash
# 查看代理组状态
curl -s http://127.0.0.1:9090/proxies | jq '.proxies."🚀默认节点"'

# 切换节点
curl -X PUT http://127.0.0.1:9090/proxies/🚀默认节点 \
  -d '{"name":"香港01"}'
```

## 配置文件说明

`config.yaml` 包含：

| 节点来源 | 说明 |
|----------|------|
| 自动从订阅获取 | VLESS/Trojan 节点，通过订阅地址拉取 |
| 手动节点 | 可额外添加直连节点 |

### 代理组

- **🚀默认节点** — 默认出口（香港节点优先）
- **🤖人工智能** — ChatGPT / OpenAI 流量
- **🌍环球剧场** — Google / YouTube 等
- **📲电报信息** — Telegram / Twitter
- **🚫不走代理** — 国内/局域网直连

## 更新订阅

```bash
bash vpn/update-sub.sh <订阅地址>
```

或直接：

```bash
curl -s "<订阅地址>&clash=1" -o /home/zys/.config/mihomo/config.yaml
pkill -f mihomo
/tmp/mihomo -d /home/zys/.config/mihomo &
```

## 排除故障

| 问题 | 原因 | 解决 |
|------|------|------|
| Google 200 但 YouTube 403 | IP 被风控 | 切换到其他节点 |
| 所有节点不可用 | 订阅过期 | 更新订阅地址 |
| TLS handshake error | 服务器 TLS 版本不匹配 | 检查 mihomo 版本 |
| 内存不足被 OOM kill | 节点过多 | 精简节点数（< 30） |
