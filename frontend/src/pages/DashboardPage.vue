<template>
  <section>
    <!-- Page header with action buttons -->
    <div class="page-header">
      <div>
        <h2>Procurement Dashboard</h2>
        <p class="muted">Overview of PR, PO and GR activities</p>
      </div>
      <div class="btn-group">
        <RouterLink to="/requisitions/new" class="btn btn-outline">+ New PR</RouterLink>
        <RouterLink to="/purchase-orders/new" class="btn btn-outline">+ New PO</RouterLink>
        <RouterLink to="/goods-receipts/new" class="btn btn-outline">+ New GR</RouterLink>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="stat-cards">
      <div class="stat-card">
        <span class="stat-card-title">Open PR</span>
        <span class="stat-card-value">{{ stats.totalPr }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-title">Open PO</span>
        <span class="stat-card-value">{{ stats.recentPo.length }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-title">Pending GR</span>
        <span class="stat-card-value">{{ stats.recentGr.length }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card-title">Today Receipts</span>
        <span class="stat-card-value">{{ todayReceiptsCount }}</span>
      </div>
    </div>

    <!-- Two-column section: Recent Requisitions and Purchase Orders -->
    <div class="panels-row">
      <!-- Recent Purchase Requisitions -->
      <div class="card-panel">
        <div class="card-panel-header">
          <h3>Recent Purchase Requisitions</h3>
          <RouterLink to="/requisitions">View All</RouterLink>
        </div>
        <table>
          <thead>
            <tr>
              <th>PR No</th>
              <th>Requester</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.recentPr" :key="item.id">
              <td><RouterLink :to="`/requisitions/${item.id}`">{{ item.prNumber }}</RouterLink></td>
              <td>{{ item.requesterName }}</td>
              <td>
                <span class="status-badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
              </td>
              <td>{{ item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Recent Purchase Orders -->
      <div class="card-panel">
        <div class="card-panel-header">
          <h3>Recent Purchase Order</h3>
          <RouterLink to="/purchase-orders">View All</RouterLink>
        </div>
        <table>
          <thead>
            <tr>
              <th>PO No</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.recentPo" :key="item.id">
              <td><RouterLink :to="`/purchase-orders/${item.id}`">{{ item.poNumber }}</RouterLink></td>
              <td>{{ item.vendorName }}</td>
              <td>
                <span class="status-badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
              </td>
              <td>{{ item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Goods Receipts (full width) -->
    <div class="card-panel">
      <div class="card-panel-header">
        <h3>Recent Goods Receipts</h3>
        <RouterLink to="/goods-receipts">View All</RouterLink>
      </div>
      <table>
        <thead>
          <tr>
            <th>GR No</th>
            <th>PO No</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in stats.recentGr" :key="item.id">
            <td><RouterLink :to="`/goods-receipts/${item.id}`">{{ item.grNumber }}</RouterLink></td>
            <td>{{ item.poNumber }}</td>
            <td>
              <span class="status-badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
            </td>
            <td>{{ item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../api';

const stats = reactive({
  totalPr: 0,
  recentPr: [],
  recentPo: [],
  recentGr: [],
});

const todayReceiptsCount = computed(() => {
  const today = new Date().toDateString();
  return stats.recentGr.filter(gr => {
    const grDate = new Date(gr.createdAt).toDateString();
    return grDate === today;
  }).length;
});

onMounted(async () => {
  const payload = await api.getDashboard();
  Object.assign(stats, payload);
});
</script>
