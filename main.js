"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => FolderHomePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var VIEW_TYPE = "folder-column-home";
var TITLE = "\u6587\u4EF6\u9996\u9875";
var nameOrder = new Intl.Collator(void 0, { numeric: true, sensitivity: "base" });
var folderHues = [25, 57, 101, 153, 220, 272, 323];
function stringPaths(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}
function movePath(path, oldPath, newPath) {
  return path === oldPath || path.startsWith(oldPath + "/") ? newPath + path.slice(oldPath.length) : path;
}
var FolderHomePlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.visibility = { columns: [], items: [] };
    this.favorites = [];
    this.pendingSave = Promise.resolve();
    this.enabled = false;
  }
  async onload() {
    const saved = await this.loadData();
    this.visibility = { columns: stringPaths(saved?.columns), items: stringPaths(saved?.items) };
    this.favorites = stringPaths(saved?.favorites);
    this.registerView(VIEW_TYPE, (leaf) => new FolderHomeView(leaf, this));
    this.addCommand({ id: "open-home", name: "\u6253\u5F00\u6587\u4EF6\u9996\u9875", callback: () => this.showHome() });
    this.addRibbonIcon("columns-3", TITLE, () => this.toggleHome());
    this.enabled = true;
    this.register(() => {
      this.enabled = false;
    });
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      if (leaf?.view instanceof FolderHomeView) void leaf.view.refreshFavorites();
    }));
    const vault = this.app.vault;
    this.registerEvent(vault.on("create", () => this.refresh()));
    this.registerEvent(vault.on("rename", (file, oldPath) => {
      this.updatePaths((path) => movePath(path, oldPath, file.path));
    }));
    this.registerEvent(vault.on("delete", (file) => {
      this.updatePaths((path) => path === file.path || path.startsWith(file.path + "/") ? null : path);
    }));
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => {
      if (file instanceof import_obsidian.TFolder && file.parent?.isRoot()) {
        const included = this.isVisible("columns", file.path);
        menu.addItem((item) => item.setTitle(included ? "\u5728\u9996\u9875\u9690\u85CF\u6B64\u5217" : "\u5728\u9996\u9875\u663E\u793A\u6B64\u5217").setIcon("columns-3").onClick(() => this.setVisible("columns", file.path, !included)));
      }
      if (file.parent && !file.parent.isRoot()) {
        const included = this.isVisible("items", file.path);
        menu.addItem((item) => item.setTitle(included ? "\u5728\u9996\u9875\u5217\u5185\u9690\u85CF" : "\u5728\u9996\u9875\u5217\u5185\u663E\u793A").setIcon(included ? "eye-off" : "eye").onClick(() => this.setVisible("items", file.path, !included)));
      }
      if (file instanceof import_obsidian.TFile && file.extension.toLowerCase() === "md") {
        this.addFavoriteMenu(menu, file);
      }
    }));
  }
  showHome() {
    if (this.opening) return;
    this.opening = this.openHome().catch((error) => {
      console.error("\u6253\u5F00\u6587\u4EF6\u9996\u9875\u5931\u8D25", error);
      new import_obsidian.Notice("\u65E0\u6CD5\u6253\u5F00\u6587\u4EF6\u9996\u9875\u3002");
    }).finally(() => {
      this.opening = void 0;
    });
  }
  toggleHome() {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (leaf) {
      leaf.detach();
      return;
    }
    this.showHome();
  }
  async openHome() {
    const workspace = this.app.workspace;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (leaf && !leaf.view.containerEl.closest(".mod-left-split")) {
      leaf.detach();
      leaf = void 0;
    }
    if (!leaf) {
      leaf = workspace.getLeftLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await workspace.revealLeaf(leaf);
    if (this.enabled) {
      workspace.setActiveLeaf(leaf, { focus: true });
      if (leaf.view instanceof FolderHomeView) void leaf.view.refreshFavorites();
    }
  }
  isVisible(group, path) {
    return !this.visibility[group].includes(path);
  }
  setVisible(group, path, visible) {
    if (this.isVisible(group, path) === visible) return;
    const paths = this.visibility[group];
    this.visibility = {
      ...this.visibility,
      [group]: visible ? paths.filter((entry) => entry !== path) : [...paths, path]
    };
    this.persist();
    this.refresh();
  }
  setFavorite(path, included) {
    const favorites = this.favorites;
    if (favorites.includes(path) === included) return;
    this.favorites = included ? [...favorites, path] : favorites.filter((entry) => entry !== path);
    this.persist();
    this.refresh();
  }
  addFavoriteMenu(menu, file) {
    if (!(file instanceof import_obsidian.TFile) || file.extension.toLowerCase() !== "md") return;
    const included = this.favorites.includes(file.path);
    menu.addItem((item) => item
      .setTitle(included ? "\u4ECE\u5FEB\u901F\u8FDB\u5165\u79FB\u9664" : "\u52A0\u5165\u5FEB\u901F\u8FDB\u5165")
      .setIcon("bookmark")
      .onClick(() => this.setFavorite(file.path, !included)));
  }
  updatePaths(update) {
    const updateGroup = (paths) => [...new Set(paths.map(update).filter((path) => path !== null))];
    const { columns, items } = this.visibility;
    const next = { columns: updateGroup(columns), items: updateGroup(items) };
    const favorites = updateGroup(this.favorites);
    const changed = (before, after) => before.length !== after.length || before.some((path, index) => path !== after[index]);
    if (changed(columns, next.columns) || changed(items, next.items) || changed(this.favorites, favorites)) {
      this.visibility = next;
      this.favorites = favorites;
      this.persist();
    }
    this.refresh();
  }
  persist() {
    const snapshot = { ...this.visibility, favorites: [...this.favorites] };
    this.pendingSave = this.pendingSave.then(() => this.saveData(snapshot)).catch((error) => {
      console.error("\u4FDD\u5B58\u6587\u4EF6\u9996\u9875\u8BBE\u7F6E\u5931\u8D25", error);
      new import_obsidian.Notice("\u6587\u4EF6\u9996\u9875\u7684\u663E\u793A\u8BBE\u7F6E\u4FDD\u5B58\u5931\u8D25\u3002");
    });
  }
  refresh() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach(({ view }) => {
      if (view instanceof FolderHomeView) view.refresh();
    });
  }
};
var FolderHomeView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.favoriteRead = 0;
    this.expandedFolders = /* @__PURE__ */ new Set();
    this.reading = Promise.resolve();
    this.readingRequest = 0;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return TITLE;
  }
  getIcon() {
    return "columns-3";
  }
  async onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("folder-home");
    const layout = this.contentEl.createDiv("folder-home-layout");
    const quick = layout.createEl("aside", { cls: "folder-home-quick", attr: { "aria-label": "\u5FEB\u901F\u8FDB\u5165" } });
    const quickHeader = quick.createEl("header", { cls: "folder-home-quick-heading" });
    (0, import_obsidian.setIcon)(quickHeader.createSpan({ cls: "folder-home-icon" }), "bookmark");
    quickHeader.createEl("h2", { text: "\u5FEB\u901F\u8FDB\u5165" });
    this.favoriteList = quick.createDiv("folder-home-bookmarks");
    const folders = layout.createDiv("folder-home-folders");
    this.board = folders.createDiv("folder-home-board");
    this.renderBoard();
    void this.refreshFavorites();
  }
  async onClose() {
    if (this.frame !== void 0) this.contentEl.win.cancelAnimationFrame(this.frame);
    this.frame = void 0;
    this.board = void 0;
    this.favoriteList = void 0;
    this.renderedFavorites = void 0;
    this.favoriteRead++;
    this.expandedFolders.clear();
    this.readingRequest++;
    this.reader = void 0;
    this.modal?.close();
  }
  refresh() {
    if (!this.board || this.frame !== void 0) return;
    this.frame = this.contentEl.win.requestAnimationFrame(() => {
      this.frame = void 0;
      for (const folder of this.expandedFolders) {
        if (this.app.vault.getFolderByPath(folder.path) !== folder) this.expandedFolders.delete(folder);
      }
      this.renderBoard();
      void this.refreshFavorites();
    });
  }
  async refreshFavorites() {
    const list = this.favoriteList;
    if (!list) return;
    const read = ++this.favoriteRead;
    const vault = this.app.vault;
    const available = [];
    for (const path of this.plugin.favorites) {
      const file = vault.getFileByPath(path);
      if (!file || file.extension.toLowerCase() !== "md") continue;
      available.push({ file, label: file.basename });
    }
    if (read !== this.favoriteRead) return;
    const previous = this.renderedFavorites;
    if (previous?.length === available.length && available.every(({ file, label, subpath }, index) => {
      const entry = previous[index];
      return file === entry.file && label === entry.label && subpath === entry.subpath;
    })) return;
    this.renderedFavorites = available;
    list.empty();
    if (available.length) {
      const entries = list.createEl("ul", { cls: "folder-home-items" });
      for (const { file, label } of available) {
        const button = this.itemButton(entries, label, "file-text");
        button.addEventListener("click", () => this.openFile(file));
        this.registerFavoriteContextMenu(button, file);
      }
    } else {
      list.createEl("p", { cls: "folder-home-muted", text: "\u53F3\u952E\u6587\u4EF6\u5217\u8868\u4E2D\u7684\u7B14\u8BB0\uFF0C\u9009\u62E9\u300C\u52A0\u5165\u5FEB\u901F\u8FDB\u5165\u300D\u3002" });
    }
  }
  folders() {
    return this.app.vault.getRoot().children.filter((entry) => entry instanceof import_obsidian.TFolder).sort((first, second) => nameOrder.compare(first.name, second.name));
  }
  children(folder) {
    return [...folder.children].sort((first, second) => {
      const folderFirst = Number(second instanceof import_obsidian.TFolder) - Number(first instanceof import_obsidian.TFolder);
      return folderFirst || nameOrder.compare(first.name, second.name);
    });
  }
  renderBoard() {
    if (!this.board) return;
    const folders = this.folders();
    const columns = folders.filter((folder) => this.plugin.isVisible("columns", folder.path));
    this.board.empty();
    if (!columns.length) this.board.createEl("p", { cls: "folder-home-muted", text: "\u6CA1\u6709\u53EF\u663E\u793A\u7684\u5217\u3002\u53EF\u5728\u300C\u7BA1\u7406\u5217\u300D\u4E2D\u6062\u590D\u3002" });
    for (const folder of columns) {
      const name = folder.name;
      const column = this.board.createEl("section", { cls: "folder-home-column", attr: { "aria-label": name } });
      column.style.setProperty("--folder-home-hue", String(folderHues[folders.indexOf(folder) % folderHues.length]));
      const header = column.createEl("header", { cls: "folder-home-column-heading" });
      (0, import_obsidian.setIcon)(header.createSpan({ cls: "folder-home-icon" }), "folder");
      const heading = header.createDiv("folder-home-column-name");
      heading.createEl("h2", { text: name });
      header.addEventListener("contextmenu", (event) => this.showFolderMenu(event, folder));
      const options = header.createEl("button", {
        cls: "folder-home-more",
        text: "\u22EF",
        attr: { type: "button", "aria-label": "\u8BBE\u7F6E" + name + "\u5217\u5185\u5185\u5BB9" }
      });
      options.dataset.folderPath = folder.path;
      options.addEventListener("click", () => this.showOptions(name + " \xB7 \u5217\u5185\u5185\u5BB9", this.children(folder), "items", options));
      this.renderItems(column, folder);
    }
  }
  itemButton(list, title, icon) {
    const button = list.createEl("li").createEl("button", { cls: "folder-home-item", attr: { type: "button" } });
    (0, import_obsidian.setIcon)(button.createSpan({ cls: "folder-home-icon" }), icon);
    button.createSpan({ text: title });
    return button;
  }
  registerFavoriteContextMenu(button, file) {
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const menu = new import_obsidian.Menu();
      this.plugin.addFavoriteMenu(menu, file);
      menu.showAtMouseEvent(event);
    });
  }
  renderItems(container, folder, depth = 0) {
    const entries = this.children(folder).filter((entry) => this.plugin.isVisible("items", entry.path));
    if (!entries.length) {
      container.createEl("p", { cls: "folder-home-muted", text: "\u6CA1\u6709\u53EF\u663E\u793A\u7684\u9879\u76EE\u3002" });
      return;
    }
    const list = container.createEl("ul", { cls: "folder-home-items" });
    for (const [index, entry] of entries.entries()) {
      if (entry instanceof import_obsidian.TFile) {
        const title = entry.extension === "md" ? entry.basename : entry.name;
        const noteButton = this.itemButton(list, title, "file-text");
        noteButton.addEventListener("click", () => this.openFile(entry));
        this.registerFavoriteContextMenu(noteButton, entry);
        noteButton.addEventListener("contextmenu", (event) => this.showNoteMenu(event, entry));
      } else if (entry instanceof import_obsidian.TFolder) {
        const button = this.itemButton(list, entry.name, "folder");
        button.addEventListener("contextmenu", (event) => this.showFolderMenu(event, entry));
        if (depth === 0) {
          button.addClass("folder-home-top-folder");
          button.style.setProperty("--folder-home-row-hue", String(folderHues[index % folderHues.length]));
        }
        const arrow = button.createSpan({ cls: "folder-home-arrow" });
        const branch = button.parentElement?.createDiv(depth < 5 ? "folder-home-branch" : void 0);
        if (!branch) continue;
        const render = () => {
          const expanded = this.expandedFolders.has(entry);
          button.setAttribute("aria-expanded", String(expanded));
          (0, import_obsidian.setIcon)(arrow, expanded ? "chevron-down" : "chevron-right");
          branch.hidden = !expanded;
          branch.empty();
          if (expanded) this.renderItems(branch, entry, depth + 1);
        };
        button.addEventListener("click", () => {
          if (this.expandedFolders.has(entry)) this.expandedFolders.delete(entry);
          else this.expandedFolders.add(entry);
          render();
        });
        render();
      }
    }
  }
  openFile(file, subpath) {
    const request = ++this.readingRequest;
    this.reading = this.reading.then(async () => {
      if (request !== this.readingRequest || !this.board) return;
      const workspace = this.app.workspace;
      const leaf = this.getReader(file);
      const anchor = subpath?.startsWith("#") ? { subpath } : void 0;
      if (leaf.getViewState().state?.file !== file.path || anchor) {
        await leaf.openFile(file, { active: true, eState: anchor });
      }
      if (request !== this.readingRequest) return;
      await workspace.revealLeaf(leaf);
      if (request === this.readingRequest) workspace.setActiveLeaf(leaf, { focus: true });
    }).catch((error) => {
      console.error("\u6253\u5F00\u6587\u4EF6\u5931\u8D25", error);
      if (request === this.readingRequest) new import_obsidian.Notice("\u65E0\u6CD5\u6253\u5F00\u6B64\u6587\u4EF6\u3002");
    });
  }
  getReader(file) {
    const workspace = this.app.workspace;
    const leaves = [];
    workspace.iterateAllLeaves((leaf) => {
      leaves.push(leaf);
    });
    const current = this.reader;
    if (import_obsidian.Platform.isMobile) {
      if (current && leaves.includes(current) && !current.getViewState().pinned) return current;
      this.reader = workspace.getLeaf("tab");
      return this.reader;
    }
    const homeRight = this.containerEl.getBoundingClientRect().right;
    let adjacent;
    let nearest = Infinity;
    for (const leaf of leaves) {
      if (leaf.parent === this.leaf.parent) continue;
      const rect = leaf.view.containerEl.getBoundingClientRect();
      const visibleWidth = Math.min(rect.right, this.containerEl.win.innerWidth) - rect.left;
      if (rect.left >= homeRight - 2 && rect.left < nearest && visibleWidth >= 120) {
        adjacent = leaf;
        nearest = rect.left;
      }
    }
    if (adjacent) {
      const tabs = leaves.filter((leaf) => leaf.parent === adjacent.parent);
      const target = tabs.find((leaf) => leaf.getViewState().state?.file === file.path);
      if (target) return target;
      if (tabs.includes(current) && !current.getViewState().pinned) return current;
      const state = adjacent.getViewState();
      if (tabs.length === 1 && state.type === "markdown" && !state.pinned) {
        this.reader = adjacent;
        return adjacent;
      }
      workspace.setActiveLeaf(adjacent, { focus: false });
      this.reader = workspace.getLeaf("tab");
      return this.reader;
    }
    const markdownLeaf = leaves.find((leaf) => leaf !== this.leaf && leaf.getViewState().type === "markdown" && !leaf.getViewState().pinned)
      ?? leaves.find((leaf) => leaf !== this.leaf && leaf.getViewState().type === "markdown");
    if (markdownLeaf) {
      this.reader = markdownLeaf;
      return markdownLeaf;
    }
    this.reader = workspace.getLeaf("tab");
    return this.reader;
  }
  openModal() {
    this.modal?.close();
    const modal = new import_obsidian.Modal(this.app);
    modal.contentEl.addClass("folder-home-dialog");
    const originalClose = modal.onClose.bind(modal);
    modal.onClose = () => {
      originalClose();
      if (this.modal === modal) this.modal = void 0;
    };
    this.modal = modal;
    modal.open();
    return modal;
  }
  showFolderMenu(event, folder) {
    event.preventDefault();
    event.stopPropagation();
    const menu = new import_obsidian.Menu();
    menu.addItem((item) => item.setTitle("新建笔记").setIcon("file-plus").onClick(() => this.createNote(folder)));
    menu.showAtMouseEvent(event);
  }
  showNoteMenu(event, file) {
    event.preventDefault();
    event.stopPropagation();
    const menu = new import_obsidian.Menu();
    menu.addItem((item) => item.setTitle("删除笔记").setIcon("trash").onClick(() => this.confirmDeleteNote(file)));
    menu.showAtMouseEvent(event);
  }
  createNote(folder) {
    const modal = this.openModal();
    modal.setTitle("在「" + folder.name + "」中新建笔记");
    const form = modal.contentEl.createEl("form", { cls: "folder-home-create-form" });
    const input = form.createEl("input", { attr: { type: "text", placeholder: "笔记名称", autocomplete: "off" } });
    const submit = form.createEl("button", { text: "新建笔记", attr: { type: "submit" } });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = input.value.trim().replace(/\\/g, "/").split("/").pop().replace(/\.md$/i, "").trim();
      if (!name || name === "." || name === "..") {
        new import_obsidian.Notice("请输入有效的笔记名称。");
        input.focus();
        return;
      }
      const path = (0, import_obsidian.normalizePath)(folder.path + "/" + name + ".md");
      if (this.app.vault.getAbstractFileByPath(path)) {
        new import_obsidian.Notice("同名文件已存在。");
        input.focus();
        return;
      }
      submit.disabled = true;
      try {
        const file = await this.app.vault.create(path, "");
        modal.close();
        this.openFile(file);
      } catch (error) {
        console.error("新建笔记失败", error);
        new import_obsidian.Notice("新建笔记失败，请检查文件名和文件夹权限。");
        submit.disabled = false;
      }
    });
    input.focus();
  }
  confirmDeleteNote(file) {
    const modal = this.openModal();
    modal.setTitle("删除笔记");
    modal.contentEl.createEl("p", { text: "确定删除「" + file.basename + "」吗？" });
    const actions = modal.contentEl.createDiv("folder-home-actions");
    const cancel = actions.createEl("button", { text: "取消", attr: { type: "button" } });
    const remove = actions.createEl("button", { text: "删除", cls: "mod-warning", attr: { type: "button" } });
    cancel.addEventListener("click", () => modal.close());
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      try {
        await this.app.vault.delete(file);
        modal.close();
        new import_obsidian.Notice("笔记已删除。");
      } catch (error) {
        console.error("删除笔记失败", error);
        new import_obsidian.Notice("删除笔记失败。");
        remove.disabled = false;
      }
    });
    cancel.focus();
  }
  showOptions(title, entries, group, trigger) {
    const modal = this.openModal();
    modal.setTitle(title);
    if (!entries.length) modal.contentEl.createEl("p", { text: "\u6CA1\u6709\u53EF\u8BBE\u7F6E\u7684\u9879\u76EE\u3002" });
    for (const entry of entries) {
      const label = modal.contentEl.createEl("label", { cls: "folder-home-option" });
      const checkbox = label.createEl("input", { attr: { type: "checkbox" } });
      checkbox.checked = this.plugin.isVisible(group, entry.path);
      label.createSpan({ text: entry.name });
      checkbox.addEventListener("change", () => this.plugin.setVisible(group, entry.path, checkbox.checked));
    }
    modal.contentEl.querySelector("input")?.focus();
    const closeMenu = modal.onClose.bind(modal);
    modal.onClose = () => {
      closeMenu();
      if (trigger.isConnected) {
        trigger.focus();
      } else {
        const buttons = this.board?.querySelectorAll(".folder-home-more");
        const replacement = buttons && Array.from(buttons).find((button) => button.dataset.folderPath === trigger.dataset.folderPath);
        replacement?.focus();
      }
    };
  }
};
