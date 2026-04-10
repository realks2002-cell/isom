import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bizstart.interiorsim",
  appName: "이소플랜 3D",
  webDir: "public",
  server: {
    url: "https://isom-neon.vercel.app",
    androidScheme: "https",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
