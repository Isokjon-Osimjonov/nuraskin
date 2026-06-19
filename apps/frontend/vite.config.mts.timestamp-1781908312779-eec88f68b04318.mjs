// apps/frontend/vite.config.mts
import { defineConfig } from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.9_less@4.5.1_lightningcss@1.32.0_sass-embedded@1.99.0_sass@1.99.0_terser@5.46.1/node_modules/vite/dist/node/index.js";
import path from "path";
import tailwindcss from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@tailwindcss+vite@4.2.2_vite@5.4.21_@types+node@20.19.9_less@4.5.1_lightningcss@1.32.0__77efcbef924a44220d825bfab9beea7e/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@20.19.9_less@4.5.1_lightningcss@1.32_61816e7bb832c49d79e404e1074ec68f/node_modules/@vitejs/plugin-react/dist/index.js";
import { TanStackRouterVite } from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@tanstack+router-plugin@1.167.22_@tanstack+react-router@1.168.23_react-dom@19.2.5_react_95aa4f41fb25f4fbc43018523b7d31ef/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
import { nxViteTsPaths } from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@nx+vite@22.6.5_@babel+traverse@7.29.0_@swc-node+register@1.11.1_@emnapi+core@1.10.0_@e_470fc0c87163ecd1d4ad6cd88be76723/node_modules/@nx/vite/plugins/nx-tsconfig-paths.plugin.js";
import { nxCopyAssetsPlugin } from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@nx+vite@22.6.5_@babel+traverse@7.29.0_@swc-node+register@1.11.1_@emnapi+core@1.10.0_@e_470fc0c87163ecd1d4ad6cd88be76723/node_modules/@nx/vite/plugins/nx-copy-assets.plugin.js";
import basicSsl from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@vitejs+plugin-basic-ssl@1.2.0_vite@5.4.21_@types+node@20.19.9_less@4.5.1_lightningcss@_55554a7a4b54f1a16864ee85b12f0302/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/isokjon/nuraskin/apps/frontend";
var vite_config_default = defineConfig(() => ({
  root: __vite_injected_original_dirname,
  cacheDir: "../../node_modules/.vite/apps/frontend",
  envDir: "../../",
  server: {
    port: 4300,
    host: true,
    allowedHosts: ["salon-cofounder-shawl.ngrok-free.dev"],
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  },
  preview: {
    port: 4300,
    host: true,
    allowedHosts: ["salon-cofounder-shawl.ngrok-free.dev"]
  },
  plugins: [
    ...process.env.NODE_ENV !== "production" ? [basicSsl()] : [],
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts"
    }),
    tailwindcss(),
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(["*.md"])
  ],
  resolve: {
    alias: {
      "@nuraskin/shared-utils": path.resolve(
        __vite_injected_original_dirname,
        "../../libs/shared-utils/src/index.ts"
      ),
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "../../dist/apps/frontend",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBwcy9mcm9udGVuZC92aXRlLmNvbmZpZy5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvaXNva2pvbi9udXJhc2tpbi9hcHBzL2Zyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvaXNva2pvbi9udXJhc2tpbi9hcHBzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvaXNva2pvbi9udXJhc2tpbi9hcHBzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLm10c1wiOy8vLyA8cmVmZXJlbmNlIHR5cGVzPSd2aXRlc3QnIC8+XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBUYW5TdGFja1JvdXRlclZpdGUgfSBmcm9tICdAdGFuc3RhY2svcm91dGVyLXBsdWdpbi92aXRlJztcbmltcG9ydCB7IG54Vml0ZVRzUGF0aHMgfSBmcm9tICdAbngvdml0ZS9wbHVnaW5zL254LXRzY29uZmlnLXBhdGhzLnBsdWdpbic7XG5pbXBvcnQgeyBueENvcHlBc3NldHNQbHVnaW4gfSBmcm9tICdAbngvdml0ZS9wbHVnaW5zL254LWNvcHktYXNzZXRzLnBsdWdpbic7XG5pbXBvcnQgYmFzaWNTc2wgZnJvbSAnQHZpdGVqcy9wbHVnaW4tYmFzaWMtc3NsJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCgpID0+ICh7XG4gIHJvb3Q6IGltcG9ydC5tZXRhLmRpcm5hbWUsXG4gIGNhY2hlRGlyOiAnLi4vLi4vbm9kZV9tb2R1bGVzLy52aXRlL2FwcHMvZnJvbnRlbmQnLFxuICBlbnZEaXI6ICcuLi8uLi8nLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA0MzAwLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgYWxsb3dlZEhvc3RzOiBbJ3NhbG9uLWNvZm91bmRlci1zaGF3bC5uZ3Jvay1mcmVlLmRldiddLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjQwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHdzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQzMDAsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBhbGxvd2VkSG9zdHM6IFsnc2Fsb24tY29mb3VuZGVyLXNoYXdsLm5ncm9rLWZyZWUuZGV2J10sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICAuLi4ocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IFtiYXNpY1NzbCgpXSA6IFtdKSxcbiAgICBUYW5TdGFja1JvdXRlclZpdGUoe1xuICAgICAgcm91dGVzRGlyZWN0b3J5OiAnLi9zcmMvcm91dGVzJyxcbiAgICAgIGdlbmVyYXRlZFJvdXRlVHJlZTogJy4vc3JjL3JvdXRlVHJlZS5nZW4udHMnLFxuICAgIH0pLFxuICAgIHRhaWx3aW5kY3NzKCksXG4gICAgcmVhY3QoKSxcbiAgICBueFZpdGVUc1BhdGhzKCksXG4gICAgbnhDb3B5QXNzZXRzUGx1Z2luKFsnKi5tZCddKSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQG51cmFza2luL3NoYXJlZC11dGlscyc6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgaW1wb3J0Lm1ldGEuZGlybmFtZSxcbiAgICAgICAgJy4uLy4uL2xpYnMvc2hhcmVkLXV0aWxzL3NyYy9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJy4uLy4uL2Rpc3QvYXBwcy9mcm9udGVuZCcsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IHRydWUsXG4gICAgY29tbW9uanNPcHRpb25zOiB7XG4gICAgICB0cmFuc2Zvcm1NaXhlZEVzTW9kdWxlczogdHJ1ZSxcbiAgICB9LFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sVUFBVTtBQUNqQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFdBQVc7QUFDbEIsU0FBUywwQkFBMEI7QUFDbkMsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUywwQkFBMEI7QUFDbkMsT0FBTyxjQUFjO0FBUnJCLElBQU0sbUNBQW1DO0FBVXpDLElBQU8sc0JBQVEsYUFBYSxPQUFPO0FBQUEsRUFDakMsTUFBTTtBQUFBLEVBQ04sVUFBVTtBQUFBLEVBQ1YsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sY0FBYyxDQUFDLHNDQUFzQztBQUFBLElBQ3JELFlBQVk7QUFBQSxJQUNaLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLElBQUk7QUFBQSxNQUNOO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGNBQWMsQ0FBQyxzQ0FBc0M7QUFBQSxFQUN2RDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsR0FBSSxRQUFRLElBQUksYUFBYSxlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztBQUFBLElBQzVELG1CQUFtQjtBQUFBLE1BQ2pCLGlCQUFpQjtBQUFBLE1BQ2pCLG9CQUFvQjtBQUFBLElBQ3RCLENBQUM7QUFBQSxJQUNELFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQzdCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCwwQkFBMEIsS0FBSztBQUFBLFFBQzdCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLEtBQUssS0FBSyxRQUFRLGtDQUFxQixPQUFPO0FBQUEsSUFDaEQ7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixzQkFBc0I7QUFBQSxJQUN0QixpQkFBaUI7QUFBQSxNQUNmLHlCQUF5QjtBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
