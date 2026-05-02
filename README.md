# 🤣 段子库 — GitHub Pages 网站

一个基于 GitHub Pages 的静态段子展示网站，数据来自 Obsidian 笔记库。

## ✨ 功能特色

| 功能 | 说明 |
|------|------|
| 🎲 随机展示 | 每次刷新随机展示一条段子，点击「换一个」刷新 |
| 🏷️ 词云标签 | 自动提取高频词生成可点击词云，点击筛选相关段子 |
| 🔍 全文搜索 | 实时搜索段子内容，支持分页浏览 |
| 📂 分类切换 | 全部 / 抽象 / 情感 三个分类 |
| 🌙 深色模式 | 一键切换深色/浅色主题，偏好自动保存 |
| 📱 响应式 | 完美适配手机和桌面端 |

## 📁 文件结构

```
你的仓库/
├── index.html          # 主页面
├── style.css           # 样式文件
├── app.js              # 主逻辑（加载数据、随机展示、搜索、词云）
├── data/
│   ├── 抽象段子_整合_v2.json   # 抽象段子数据
│   └── 情感段子_整合.json     # 情感段子数据
├── update_data.py      # 数据更新脚本（本地运行）
└── README.md           # 本文件
```

## 🚀 部署到 GitHub Pages

### 第一步：创建 GitHub 仓库

```bash
# 在 GitHub 上新建一个仓库，例如：jokes-website
# 然后本地初始化并推送
cd D:\Users\shiji\WorkBuddy\20260502101926
git init
git add .
git commit -m "初始提交：段子库网站"
git remote add origin https://github.com/你的用户名/jokes-website.git
git push -u origin main
```

### 第二步：开启 GitHub Pages

1. 进入仓库页面 → **Settings**
2. 左侧菜单找到 **Pages**
3. **Source** 选择 `Deploy from a branch`
4. **Branch** 选择 `main` 和 `/ (root)`
5. 点击 **Save**

等待约 1 分钟，网站就会发布在：
```
https://你的用户名.github.io/jokes-website/
```

## 🔄 如何更新段子

### 方式一：本地运行更新脚本（推荐）

当有新段子加入 Obsidian 后，本地运行脚本重新生成 JSON：

```bash
cd D:\Users\shiji\WorkBuddy\20260502101926
python update_data.py
```

脚本会：
1. 读取 Obsidian vault 中的最新笔记
2. 重新切分段子
3. 输出到 `data/` 目录下的 JSON 文件

然后提交并推送：

```bash
git add data/
git commit -m "更新段子数据"
git push
```

GitHub Pages 会在 1～2 分钟内自动更新网站。

### 方式二：GitHub Actions 自动更新（进阶）

在仓库中创建 `.github/workflows/update.yml`：

```yaml
name: Update Jokes Data
on:
  schedule:
    - cron: '0 2 * * *'   # 每天凌晨2点自动运行
  workflow_dispatch:        # 支持手动触发

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run update script
        run: python update_data.py
      - name: Commit and push
        run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add data/
          git commit -m "Auto-update jokes data" || echo "No changes"
          git push
```

> ⚠️ 注意：方式二需要 GitHub 能访问你的 Obsidian 文件，适合将 Obsidian vault 同步到仓库的场景。

## 🛠️ 本地预览

```bash
# 在网站目录下启动简易服务器
cd D:\Users\shiji\WorkBuddy\20260502101926
python -m http.server 8000
```

然后浏览器访问：`http://localhost:8000`

## 📊 数据结构

每条段子的 JSON 格式：

```json
{
  "id": "abs_盗_1",
  "text": "段子内容...",
  "source_file": "盗版群（抽象）（2025）.md",
  "original_date": "2025年3月15日",
  "category": "抽象",
  "source_tag": "抽象"
}
```

## 📝 自定义

| 需求 | 修改文件 | 位置 |
|------|---------|------|
| 修改主题色 | `style.css` | `:root` 中的 `--accent` |
| 修改每页搜索结果数 | `app.js` | `STATE.pageSize` |
| 修改词云停用词 | `app.js` | `stopWords` 集合 |
| 修改网站标题 | `index.html` | `<title>` 和 `nav-brand` |

---

Made with ❤️ by 元宝 & Jakarta
