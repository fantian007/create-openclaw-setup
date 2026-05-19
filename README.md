# create-openclaw-setup

OpenClaw 网关服务器一键初始化配置。

## 项目结构

```
create-openclaw-setup/
├── README.md              # 本文件
├── setup.sh               # 全自动初始化脚本
├── vpn/
│   ├── README.md          # VPN 配置说明
│   ├── install-mihomo.sh  # Mihomo 安装脚本
│   ├── config.yaml        # Mihomo 配置文件模板
│   └── update-sub.sh      # 订阅地址更新脚本
└── .env.example           # 环境变量示例
```

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/fantian007/create-openclaw-setup.git
cd create-openclaw-setup

# 2. 运行完整 setup（安装依赖、配置 VPN）
bash setup.sh
```

## 功能

- **Mihomo VPN** — clash.meta 内核的代理服务，支持 VLESS/Trojan 节点
- **订阅管理** — 通过订阅地址自动更新节点
- **OpenClaw** — 已预装 OpenClaw 网关（Node.js + TypeScript 版本）
