import react from "@vitejs/plugin-react";
import stylex from "@stylexjs/unplugin/vite";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [stylex(), react()] });
