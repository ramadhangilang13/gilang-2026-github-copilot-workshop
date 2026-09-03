<template>
  <section>
    <div class="page-header">
      <div>
        <h2>Goods Receipts</h2>
        <p class="muted">View all goods receipt records</p>
      </div>
      <div class="btn-group">
        <RouterLink to="/" class="btn btn-outline">← Back</RouterLink>
      </div>
    </div>

    <div class="card-panel">
      <table>
        <thead>
          <tr>
            <th>GR No</th>
            <th>PO No</th>
            <th>Vendor</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in goodsReceipts" :key="item.id">
            <td><RouterLink :to="`/goods-receipts/${item.id}`">{{ item.grNumber }}</RouterLink></td>
            <td>{{ item.poNumber }}</td>
            <td>{{ item.vendorName }}</td>
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
import { onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../api';

const goodsReceipts = reactive([]);

onMounted(async () => {
  const data = await api.listGoodsReceipts();
  goodsReceipts.push(...(data.items || []));
});
</script>
