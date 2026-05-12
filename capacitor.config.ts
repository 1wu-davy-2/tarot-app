import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tarot.mirroroffate",
  appName: "命运之镜",
  webDir: "out",
  android: {
    allowMixedContent: true,
    backgroundColor: "1a0a2e",
  },
};

export default config;
