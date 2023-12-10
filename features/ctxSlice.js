import {createSlice} from '@reduxjs/toolkit';

export function copySettings(src, dst = {}) {
  if (src.enableAutoFormat !== undefined) {
    dst.enableAutoFormat = src.enableAutoFormat;
  }
  if (src.enableAutoSort !== undefined) {
    dst.enableAutoSort = src.enableAutoSort;
  }
  if (src.enableNestParse !== undefined) {
    dst.enableNestParse = src.enableNestParse;
  }
  if (src.hideRightEditor !== undefined) {
    dst.hideRightEditor = src.hideRightEditor;
  }
  return dst;
}

export const ctxSlice = createSlice({
  name: 'ctx',
  initialState: {
    // 启用自动格式化吗？
    enableAutoFormat: true,
    // 启用自动 JSON 排序吗？
    enableAutoSort: true,
    // 启用嵌套解析吗？
    enableNestParse: true,
    // 隐藏右侧编辑器吗？0 不隐藏、true 隐藏、false 不隐藏（平分两侧编辑器）
    hideRightEditor: 0,
    // 状态栏进入命令模式了吗？
    enableCmdMode: false,
    // 命令模式最后一次输入的命令
    lastCmd: "",
    // 状态栏文案
    statusBar: {},
    // 左侧编辑器
    leftEditor: null,
    // 右侧编辑器
    rightEditor: null,
    // 聚焦在左侧编辑器吗？
    focusLeft: true,
  },
  reducers: {
    setSettings(state, action) {
      const settings = JSON.parse(action.payload) || {};
      copySettings(settings, state);
    },
    switchAutoFormat: (state) => {
      state.enableAutoFormat = !state.enableAutoFormat;
    },
    switchAutoSort: (state) => {
      state.enableAutoSort = !state.enableAutoSort;
    },
    switchNestParse: (state) => {
      state.enableNestParse = !state.enableNestParse;
    },
    switchHideRightEditor: (state) => {
      state.hideRightEditor = !state.hideRightEditor;
    },
    switchEnableCmdMode: (state) => {
      state.enableCmdMode = !state.enableCmdMode;
    },
    showRightEditor: (state) => {
      state.hideRightEditor = false;
    },
    setLastCmd: (state, action) => {
      state.lastCmd = action.payload;
    },
    setStatusBar: (state, action) => {
      state.statusBar = action.payload;
    },
    setLeftEditor: (state, action) => {
      state.leftEditor = action.payload;
    },
    setRightEditor: (state, action) => {
      state.rightEditor = action.payload;
    },
    setFocusLeft: (state) => {
      state.focusLeft = true;
    },
    setFocusRight: (state) => {
      state.focusLeft = false;
    },
  },
});

export const {
  switchAutoFormat,
  switchAutoSort,
  switchNestParse,
  switchHideRightEditor,
  switchEnableCmdMode,
  showRightEditor,
  setLastCmd,
  setStatusBar,
  setLeftEditor,
  setRightEditor,
  setFocusLeft,
  setFocusRight,
} = ctxSlice.actions;

export const ctxReducer = ctxSlice.reducer;

export function getLastEditor(ctx) {
  return ctx.focusLeft? ctx.leftEditor : ctx.rightEditor;
}

// 获取另一个编辑器
export function getPairEditor(ctx) {
  const thisEditor = getLastEditor(ctx);
  return thisEditor === ctx.leftEditor ? ctx.rightEditor : ctx.leftEditor;
}

export function getEditor(ctx, name) {
  return name === "left" ? ctx.leftEditor : ctx.rightEditor;
}
