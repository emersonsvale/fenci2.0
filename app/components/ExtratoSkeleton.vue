<script setup lang="ts">
/**
 * ExtratoSkeleton - Skeleton screen responsivo para a página de extrato
 * Exibe placeholder animado com layout adaptado para mobile e desktop
 */
</script>

<template>
  <div id="extrato-skeleton" class="flex flex-col gap-5 animate-pulse">
    <!-- Header Skeleton -->
    <div class="flex flex-col gap-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-2">
          <div class="skeleton h-5 lg:h-7 w-44 lg:w-56 rounded" />
          <div class="skeleton h-3 w-full sm:w-60 rounded" />
        </div>
        <div class="flex gap-2">
          <div class="skeleton h-9 w-28 rounded-lg" />
          <div class="skeleton h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <div v-for="i in 4" :key="i" class="card p-3 lg:p-4 flex items-center gap-3">
        <div class="skeleton w-9 h-9 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl" />
        <div class="flex-1 space-y-2">
          <div class="skeleton h-2.5 w-14 lg:w-20 rounded" />
          <div class="skeleton h-4 lg:h-6 w-20 lg:w-28 rounded" />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex flex-col lg:flex-row gap-5">
      <!-- Main List -->
      <div class="flex-1 min-w-0 space-y-4">
        <!-- Filters Skeleton -->
        <div class="flex flex-col gap-3">
          <div class="flex gap-2 overflow-hidden">
            <div v-for="i in 4" :key="i" class="skeleton h-9 rounded-lg shrink-0" :class="i === 1 ? 'w-20' : 'w-16'" />
          </div>
          <div class="flex gap-2">
            <div class="skeleton h-9 flex-1 sm:flex-none sm:w-48 rounded-lg" />
            <div class="skeleton h-9 w-9 rounded-lg shrink-0" />
          </div>
        </div>

        <!-- Transaction Items Skeleton -->
        <div class="space-y-2">
          <!-- Date group header -->
          <div class="skeleton h-4 w-32 rounded mb-3" />

          <div v-for="i in 6" :key="i" class="card p-3 lg:p-4 flex items-center gap-2 lg:gap-4">
            <!-- Category icon -->
            <div class="skeleton w-9 h-9 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl shrink-0" />

            <!-- Description -->
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="skeleton h-3.5 rounded" :class="i % 2 === 0 ? 'w-32' : 'w-40'" />
              <div class="skeleton h-2.5 w-20 rounded" />
            </div>

            <!-- Date (hidden on mobile) -->
            <div class="hidden sm:block skeleton h-3 w-16 rounded shrink-0" />

            <!-- Amount -->
            <div class="skeleton h-4 w-20 lg:w-24 rounded shrink-0" />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="w-full lg:w-[320px] lg:flex-shrink-0 space-y-4">
        <div class="card p-4">
          <div class="skeleton h-5 w-28 rounded mb-4" />
          <div class="space-y-3">
            <div v-for="i in 3" :key="i" class="flex items-center gap-3">
              <div class="skeleton w-10 h-10 rounded-full" />
              <div class="flex-1 space-y-1.5">
                <div class="skeleton h-3 w-24 rounded" />
                <div class="skeleton h-2.5 w-16 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
