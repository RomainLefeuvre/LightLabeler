import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When deployed via GitHub Actions, GITHUB_REPOSITORY is "user/repo-name"
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  plugins: [react()],
  base,
})
