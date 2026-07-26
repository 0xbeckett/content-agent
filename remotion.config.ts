import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setEntryPoint("./src/index.ts");
Config.setChromiumOpenGlRenderer("angle");
Config.overrideWebpackConfig((config) => config);
