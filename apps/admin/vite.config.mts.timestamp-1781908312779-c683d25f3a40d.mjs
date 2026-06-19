// apps/admin/vite.config.mts
import { defineConfig } from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.9_less@4.5.1_lightningcss@1.32.0_sass-embedded@1.99.0_sass@1.99.0_terser@5.46.1/node_modules/vite/dist/node/index.js";
import react from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@20.19.9_less@4.5.1_lightningcss@1.32_61816e7bb832c49d79e404e1074ec68f/node_modules/@vitejs/plugin-react/dist/index.js";
import { nxViteTsPaths } from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@nx+vite@22.6.5_@babel+traverse@7.29.0_@swc-node+register@1.11.1_@emnapi+core@1.10.0_@e_470fc0c87163ecd1d4ad6cd88be76723/node_modules/@nx/vite/plugins/nx-tsconfig-paths.plugin.js";
import { nxCopyAssetsPlugin } from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@nx+vite@22.6.5_@babel+traverse@7.29.0_@swc-node+register@1.11.1_@emnapi+core@1.10.0_@e_470fc0c87163ecd1d4ad6cd88be76723/node_modules/@nx/vite/plugins/nx-copy-assets.plugin.js";
import { TanStackRouterVite } from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@tanstack+router-plugin@1.167.22_@tanstack+react-router@1.168.23_react-dom@19.2.5_react_95aa4f41fb25f4fbc43018523b7d31ef/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
import tailwindcss from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@tailwindcss+vite@4.2.2_vite@5.4.21_@types+node@20.19.9_less@4.5.1_lightningcss@1.32.0__77efcbef924a44220d825bfab9beea7e/node_modules/@tailwindcss/vite/dist/index.mjs";
import basicSsl from "file:///Users/isokjon/nuraskin/node_modules/.pnpm/@vitejs+plugin-basic-ssl@2.3.0_vite@5.4.21_@types+node@20.19.9_less@4.5.1_lightningcss@_84b5b4626ae7a1f1e84038f98f148d1a/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/Users/isokjon/nuraskin/apps/admin";
var vite_config_default = defineConfig(() => ({
  root: __vite_injected_original_dirname,
  cacheDir: "../../node_modules/.vite/apps/admin",
  server: {
    port: 4200,
    host: true,
    allowedHosts: "all",
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
    port: 4200,
    host: "localhost",
    allowedHosts: "all"
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
      "@nuraskin/shared-utils": path.resolve(__vite_injected_original_dirname, "../../libs/shared-utils/src/index.ts"),
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "../../dist/apps/admin",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXBwcy9hZG1pbi92aXRlLmNvbmZpZy5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvaXNva2pvbi9udXJhc2tpbi9hcHBzL2FkbWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvaXNva2pvbi9udXJhc2tpbi9hcHBzL2FkbWluL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvaXNva2pvbi9udXJhc2tpbi9hcHBzL2FkbWluL3ZpdGUuY29uZmlnLm10c1wiOy8vLyA8cmVmZXJlbmNlIHR5cGVzPSd2aXRlc3QnIC8+XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBueFZpdGVUc1BhdGhzIH0gZnJvbSAnQG54L3ZpdGUvcGx1Z2lucy9ueC10c2NvbmZpZy1wYXRocy5wbHVnaW4nO1xuaW1wb3J0IHsgbnhDb3B5QXNzZXRzUGx1Z2luIH0gZnJvbSAnQG54L3ZpdGUvcGx1Z2lucy9ueC1jb3B5LWFzc2V0cy5wbHVnaW4nO1xuaW1wb3J0IHsgVGFuU3RhY2tSb3V0ZXJWaXRlIH0gZnJvbSAnQHRhbnN0YWNrL3JvdXRlci1wbHVnaW4vdml0ZSc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuaW1wb3J0IGJhc2ljU3NsIGZyb20gJ0B2aXRlanMvcGx1Z2luLWJhc2ljLXNzbCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoKSA9PiAoe1xuICByb290OiBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICBjYWNoZURpcjogJy4uLy4uL25vZGVfbW9kdWxlcy8udml0ZS9hcHBzL2FkbWluJyxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNDIwMCxcbiAgICBob3N0OiB0cnVlLFxuICAgIGFsbG93ZWRIb3N0czogJ2FsbCcsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NDAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgd3M6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogNDIwMCxcbiAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICBhbGxvd2VkSG9zdHM6ICdhbGwnLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgLi4uKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyBbYmFzaWNTc2woKV0gOiBbXSksXG4gICAgVGFuU3RhY2tSb3V0ZXJWaXRlKHtcbiAgICAgIHJvdXRlc0RpcmVjdG9yeTogJy4vc3JjL3JvdXRlcycsXG4gICAgICBnZW5lcmF0ZWRSb3V0ZVRyZWU6ICcuL3NyYy9yb3V0ZVRyZWUuZ2VuLnRzJyxcbiAgICB9KSxcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIHJlYWN0KCksXG4gICAgbnhWaXRlVHNQYXRocygpLFxuICAgIG54Q29weUFzc2V0c1BsdWdpbihbJyoubWQnXSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0BudXJhc2tpbi9zaGFyZWQtdXRpbHMnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vbGlicy9zaGFyZWQtdXRpbHMvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnLi4vLi4vZGlzdC9hcHBzL2FkbWluJyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogdHJ1ZSxcbiAgICBjb21tb25qc09wdGlvbnM6IHtcbiAgICAgIHRyYW5zZm9ybU1peGVkRXNNb2R1bGVzOiB0cnVlLFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsMEJBQTBCO0FBQ25DLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sY0FBYztBQUNyQixPQUFPLFVBQVU7QUFSakIsSUFBTSxtQ0FBbUM7QUFTekMsSUFBTyxzQkFBUSxhQUFhLE9BQU87QUFBQSxFQUNqQyxNQUFNO0FBQUEsRUFDTixVQUFVO0FBQUEsRUFDVixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxZQUFZO0FBQUEsSUFDWixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsTUFDTjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLEdBQUksUUFBUSxJQUFJLGFBQWEsZUFBZSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFBQSxJQUM1RCxtQkFBbUI7QUFBQSxNQUNqQixpQkFBaUI7QUFBQSxNQUNqQixvQkFBb0I7QUFBQSxJQUN0QixDQUFDO0FBQUEsSUFDRCxZQUFZO0FBQUEsSUFDWixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxtQkFBbUIsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUM3QjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsMEJBQTBCLEtBQUssUUFBUSxrQ0FBVyxzQ0FBc0M7QUFBQSxNQUN4RixLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixzQkFBc0I7QUFBQSxJQUN0QixpQkFBaUI7QUFBQSxNQUNmLHlCQUF5QjtBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
