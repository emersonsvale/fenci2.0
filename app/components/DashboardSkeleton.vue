<script setup lang="ts">
/**
 * DashboardSkeleton - Skeleton screen responsivo para o dashboard
 * Exibe placeholder animado enquanto os dados carregam
 * Se adapta automaticamente entre mobile (2 colunas) e desktop (4 colunas)
 */
</script>

<template>
  <div id="dashboard-skeleton" class="flex flex-col w-full gap-6 animate-pulse">
    <!-- Header Skeleton -->
    <div class="flex flex-col gap-3 lg:gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-2">
          <div class="skeleton h-5 lg:h-7 w-48 lg:w-64 rounded" />
          <div class="skeleton h-3 lg:h-4 w-32 lg:w-40 rounded" />
        </div>
        <div class="flex gap-2">
          <div class="skeleton h-9 w-28 rounded-lg" />
          <div class="skeleton h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>

    <!-- Summary Cards Skeleton -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <div v-for="i in 4" :key="i" class="card p-3 lg:p-4 flex items-center gap-3">
        <div class="skeleton w-9 h-9 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl" />
        <div class="flex-1 space-y-2">
          <div class="skeleton h-2.5 w-14 lg:w-20 rounded" />
          <div class="skeleton h-4 lg:h-6 w-20 lg:w-28 rounded" />
        </div>
      </div>
    </div>

    <!-- Chart Skeleton -->
    <div class="card p-4 lg:p-6">
      <div class="skeleton h-5 w-36 rounded mb-4" />
      <div class="skeleton h-[140px] lg:h-[180px] w-full rounded-xl" />
    </div>

    <!-- Content Grid -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Main Content -->
      <div class="flex-1 min-w-0 space-y-6">
        <!-- Categories + Contas pagas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Category List Skeleton -->
          <div class="card p-4 lg:p-5">
            <div class="skeleton h-5 w-32 rounded mb-4" />
            <div class="space-y-3">
              <div v-for="i in 4" :key="i" class="flex items-center gap-3">
                <div class="skeleton w-8 h-8 rounded-full" />
                <div class="flex-1 space-y-1.5">
                  <div class="skeleton h-3 w-24 rounded" />
                  <div class="skeleton h-2 w-full rounded-full" />
                </div>
                <div class="skeleton h-3.5 w-16 rounded" />
              </div>
            </div>
          </div>

          <!-- Contas Pagas Skeleton -->
          <div class="card p-4 lg:p-5">
            <div class="skeleton h-5 w-36 rounded mb-4" />
            <div class="space-y-3">
              <div v-for="i in 3" :key="i" class="p-3 rounded-lg bg-surface-overlay">
                <div class="flex items-center justify-between">
                  <div class="space-y-1.5">
                    <div class="skeleton h-3.5 w-28 rounded" />
                    <div class="skeleton h-2.5 w-16 rounded" />
                  </div>
                  <div class="skeleton h-7 w-14 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Skeleton -->
      <div class="w-full lg:w-[320px] lg:flex-shrink-0 space-y-4">
        <!-- Limit Card Skeleton -->
        <div class="card p-4">
          <div class="skeleton h-5 w-28 rounded mb-3" />
          <div class="skeleton h-3 w-full rounded-full mb-2" />
          <div class="flex justify-between">
            <div class="skeleton h-3 w-20 rounded" />
            <div class="skeleton h-3 w-20 rounded" />
          </div>
        </div>

        <!-- Balance Card Skeleton -->
        <div class="card p-4">
          <div class="skeleton h-5 w-24 rounded mb-3" />
          <div class="skeleton h-8 w-32 rounded mb-4" />
          <div class="space-y-2">
            <div class="flex justify-between">
              <div class="skeleton h-3 w-16 rounded" />
              <div class="skeleton h-3 w-20 rounded" />
            </div>
            <div class="flex justify-between">
              <div class="skeleton h-3 w-16 rounded" />
              <div class="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        </div>

        <!-- Credit Card Skeleton -->
        <div class="card p-4">
          <div class="skeleton h-5 w-32 rounded mb-3" />
          <div class="skeleton h-[120px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  </div>
</template>
