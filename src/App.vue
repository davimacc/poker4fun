<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav class="app-nav">
    <RouterLink to="/">Classifica</RouterLink>
    <RouterLink to="/tornei">Tornei</RouterLink>
  </nav>
  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--color-nav-bg);
  display: flex;
  height: var(--nav-height);
  padding: 0 1rem;
}

.app-nav a {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-nav-link);
  text-decoration: none;
  font-size: var(--font-size-base);
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: var(--transition-color);
}

.app-nav a.router-link-active {
  color: var(--color-nav-link-active);
  border-bottom-color: var(--color-accent);
}

.app-main {
  position: fixed;
  top: var(--nav-height);
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.app-main::-webkit-scrollbar {
  display: none;
}

.app-main > * {
  max-width: var(--max-width);
  margin: 0 auto;
}
</style>
