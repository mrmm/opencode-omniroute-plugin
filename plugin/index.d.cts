import type { Plugin } from "@opencode-ai/plugin";

declare const plugin: {
  readonly id: "@omniroute/opencode-plugin";
  readonly server: Plugin;
};

export = plugin;
