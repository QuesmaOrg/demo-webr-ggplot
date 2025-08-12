<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Constants
const GITHUB_REPO_OWNER = 'QuesmaOrg'
const GITHUB_REPO_NAME = 'demo-webr-ggplot'
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`

// Types
interface GitHubRepo {
  stargazers_count: number
  [key: string]: unknown
}

// GitHub stars state
const githubStars = ref<number | null>(null)

// Icon paths
const githubIcon = {
  viewBox: "0 0 16 16",
  path: "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
}

const starIcon = {
  viewBox: "0 0 16 16", 
  path: "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"
}

// Fetch GitHub stars
const fetchGitHubStars = async (): Promise<void> => {
  try {
    const response = await fetch(GITHUB_API_URL)
    if (response.ok) {
      const data = await response.json() as GitHubRepo
      githubStars.value = data.stargazers_count
    }
  } catch (error) {
    console.error('Failed to fetch GitHub stars:', error)
  }
}

onMounted(() => {
  void fetchGitHubStars()
})
</script>

<template>
  <header class="header">
    <div class="header-content">
      <div>
        <h1 class="title">
          WebR ggplot2 & dplyr Demo
        </h1>
        <p class="subtitle">
          Interactive R data viz entirely in your browser 
          (<a
            href="https://quesma.com/blog-detail/sandboxing-ai-generated-code-why-we-moved-from-webr-to-aws-lambda"
            target="_blank"
            class="subtitle-link"
          >why we moved from WebR to AWS Lambda</a>)
        </p>
      </div>
      <a
        href="https://github.com/QuesmaOrg/demo-webr-ggplot"
        target="_blank" 
        rel="noopener noreferrer" 
        class="github-link"
        aria-label="View on GitHub"
      >
        <svg
          class="github-icon"
          :viewBox="githubIcon.viewBox"
          width="16"
          height="16"
        >
          <path
            fill="currentColor"
            :d="githubIcon.path"
          />
        </svg>
        <span class="github-text">View on GitHub</span>
        <span
          v-if="githubStars !== null"
          class="github-stars"
        >
          <svg
            :viewBox="starIcon.viewBox"
            width="14"
            height="14"
            class="star-icon"
          >
            <path
              fill="currentColor"
              :d="starIcon.path"
            />
          </svg>
          {{ githubStars }}
        </span>
      </a>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
  font-weight: 300;
}

.github-link {
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.github-link:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.github-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.github-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.github-stars {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  padding-left: 0.75rem;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.star-icon {
  width: 14px;
  height: 14px;
  color: #fbbf24;
}

.subtitle-link {
  color: white;
  text-decoration: underline;
  opacity: 0.9;
}

.subtitle-link:hover {
  opacity: 1;
}
</style>