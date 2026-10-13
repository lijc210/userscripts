# GitHub Time Format Converter

将 GitHub 页面上的相对时间转换为绝对日期，并在鼠标悬停时显示具体时间。

例如，将 `2 days ago` 转换为 `26-10-10`，悬停后可以查看具体时分秒。

## 功能特性

- **相对时间转换**：将 GitHub 页面上的相对时间（如 `2 days ago`）转换为绝对日期（如 `26-10-10`）。
- **悬停显示时间**：鼠标悬停或键盘聚焦在日期上时，显示具体的时分秒（如 `16:04:58`）。
- **自动适配语言**：根据浏览器语言自动选择日期格式，支持简体中文、繁体中文和英文。
- **动态页面支持**：监听 DOM 变化，自动处理 GitHub 动态加载的时间元素，包括异步渲染和 SPA 页面切换。
- **仓库首页保持原样**：仓库首页（`/owner/repo`）不进行转换，issues、Pull requests、commits 等其他页面正常转换。
- **深浅色模式适配**：提示框自动适配浏览器的深色 / 浅色模式。
- **无效日期保护**：无法解析的日期显示"无效日期"占位，不影响页面其他功能。
- **轻量简洁**：使用原生 JavaScript 实现，无需额外依赖。

## 安装

### 方式一：直接安装（推荐）

1. 确保浏览器已安装 [Tampermonkey（篡改猴）](https://www.tampermonkey.net/) 扩展。
2. 点击下面的链接打开脚本原始文件：

   **[安装 GitHub Time Format Converter](https://raw.githubusercontent.com/lijc210/userscripts/main/github-time-format-converter.user.js)**

3. 在 Tampermonkey 弹出的安装页面中，点击 **安装（Install）**。
4. 打开或刷新 [GitHub](https://github.com/)，即可体验时间格式转换功能。

### 方式二：通过 URL 导入

如果点击安装链接后只显示 JavaScript 源代码，可以手动导入：

1. 点击浏览器工具栏中的 Tampermonkey 图标。
2. 打开 **管理面板（Dashboard）**，进入 **实用工具（Utilities）**。
3. 找到 **从 URL 导入（Import from URL）**。
4. 粘贴以下地址：

   ```text
   https://raw.githubusercontent.com/lijc210/userscripts/main/github-time-format-converter.user.js
   ```

5. 点击导入，并在后续页面中确认安装。

## 使用说明

安装完成后，访问 GitHub 并刷新页面。

- 原本显示相对时间的位置将显示绝对日期（两位数年份）。
- 将鼠标悬停在日期上（或使用键盘聚焦），可以查看具体的时分秒。
- 日期和时间根据浏览器语言设置进行格式化。

### 生效范围

| 页面 | 是否转换 |
| --- | --- |
| issues、Pull requests、commits、releases、文件浏览等 | ✅ 转换 |
| 仓库首页（如 `https://github.com/owner/repo`） | ❌ 保持原始相对时间 |
| `https://github.com/topics/*` | ❌ 排除 |

> 注意：脚本仅匹配 `https://github.com/*`。GitHub 为单页应用（SPA），从仓库首页切换到其他页面时无需刷新，转换会自动生效。

## 更新

脚本托管在 GitHub 上：

- **源代码**：[github-time-format-converter.user.js](https://github.com/lijc210/userscripts/blob/main/github-time-format-converter.user.js)
- **原始文件**：[Raw 文件](https://raw.githubusercontent.com/lijc210/userscripts/main/github-time-format-converter.user.js)

脚本更新后，可以在 Tampermonkey 管理面板中检查更新。

> 提示：如果点击更新一直提示"暂时没有更新"，可能是旧版本脚本的更新源配置不完整。删除后通过上方安装链接重新安装即可解决。

## 许可证

本项目使用 [MIT License](https://github.com/lijc210/userscripts/blob/main/LICENSE)。
