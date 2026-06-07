import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const fileEnv = mode === "production" ? {} : loadEnv(mode, process.cwd(), "");
  const env = { ...fileEnv, ...process.env } as Record<string, string | undefined>;
  const isProduction = mode === "production";
  const backendPort = env.API_PORT || (isProduction ? env.PORT || "10000" : "10000");

  const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || "";
  const paystackPublicKey = env.VITE_PAYSTACK_PUBLIC_KEY || env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
  const hcaptchaSiteKey = env.VITE_HCAPTCHA_SITEKEY || env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || "";

  const viteVars = Object.keys(env).filter((key) => key.startsWith("VITE_")).length;
  const supabaseVars = Object.keys(env).filter((key) => key.startsWith("SUPABASE_")).length;
  const envSource = isProduction ? "host process.env" : "local .env files + process.env";

  console.log("[Vite Build] Environment Variables:");
  console.log(`  Source: ${envSource}`);
  console.log(`  VITE_* variables: ${viteVars}`);
  console.log(`  SUPABASE_* variables: ${supabaseVars}`);
  console.log(supabaseUrl ? "  OK Supabase URL configured" : "  Missing Supabase URL");
  console.log(supabaseKey ? "  OK Supabase Key configured" : "  Missing Supabase Key");
  console.log(hcaptchaSiteKey ? "  OK hCaptcha site key configured" : "  Missing hCaptcha site key");

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseKey),
      "import.meta.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(supabaseKey),
      "import.meta.env.VITE_PAYSTACK_PUBLIC_KEY": JSON.stringify(paystackPublicKey),
      "import.meta.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY": JSON.stringify(paystackPublicKey),
      "import.meta.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY": JSON.stringify(hcaptchaSiteKey),
      "import.meta.env.VITE_HCAPTCHA_SITEKEY": JSON.stringify(hcaptchaSiteKey),
    },
    server: {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
        clientPort: 8080,
      },
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    build: {
      minify: "esbuild",
      cssMinify: true,
      sourcemap: false,
      target: "es2020",
      chunkSizeWarningLimit: 1500,
      modulePreload: { polyfill: true },
      rollupOptions: {
        treeshake: true,
      },
    },
  };
});
