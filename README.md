# 文件首页（Folder Column Home）

Obsidian 插件：在独立首页按文件夹列浏览 Vault 内容，并可配置显示的顶层文件夹与快速进入笔记。

## 功能

- 使用左侧功能区图标打开独立首页，不将首页内容写成普通笔记。
- 以文件夹列展示内容；顶层文件夹及列内第一级项目使用彩虹色横条。
- 通过首页管理菜单选择要显示的文件夹。
- 在文件列表或首页中右键笔记，可加入或移出“快速进入”。
- 快速进入列表独立于 Obsidian 核心书签。

## 安装

1. 下载本仓库 Release 中的 `folder-column-home-0.1.0.zip`。
2. 解压到 `<Vault>/.obsidian/plugins/folder-column-home/`。
3. 在 Obsidian 设置 → 第三方插件中启用“文件首页”。

也可以将 Release 中的 `main.js`、`manifest.json`、`styles.css` 放入上述目录，然后重新加载 Obsidian。

## 配置

在 Obsidian 设置 → 第三方插件 → 文件首页中配置首页显示的文件夹和快速进入内容。

## 兼容性

- 最低 Obsidian 版本：1.12.4
- 支持桌面端与移动端（插件清单未限制为桌面端）

## 发布文件

Release 包仅包含运行所需的 `main.js`、`manifest.json` 和 `styles.css`。Vault 私人配置不包含在发布包内。
