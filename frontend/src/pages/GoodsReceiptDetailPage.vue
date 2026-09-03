<template>
  <section>
    <div class="page-header">
      <div>
        <button @click="goBack" class="back-btn">←</button>
        <div>
          <h2 v-if="goodsReceipt.grNumber">{{ goodsReceipt.grNumber }}</h2>
          <p class="muted" v-if="goodsReceipt.poNumber">PO: {{ goodsReceipt.poNumber }}</p>
        </div>
      </div>
    </div>

    <div v-if="goodsReceipt.id" class="card-panel">
      <div class="form-row">
        <div class="form-group">
          <label>GR Number</label>
          <input type="text" v-model="goodsReceipt.grNumber" readonly />
        </div>
        <div class="form-group">
          <label>PO Number</label>
          <input type="text" v-model="goodsReceipt.poNumber" readonly />
        </div>
        <div class="form-group">
          <label>Vendor</label>
          <input type="text" v-model="goodsReceipt.vendorName" readonly />
        </div>
        <div class="form-group">
          <label>Status</label>
          <input type="text" v-model="goodsReceipt.status" readonly />
        </div>
      </div>

      <h3 class="form-section-title">Receipt Details</h3>
      <div v-if="goodsReceipt.lines && goodsReceipt.lines.length" class="card-panel">
        <table>
          <thead>
            <tr>
              <th>Line No</th>
              <th>Qty Received</th>
              <th>Site Code</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in goodsReceipt.lines" :key="line.id">
              <td>{{ line.lineNo }}</td>
              <td>{{ line.qtyReceived }}</td>
              <td>{{ line.actualSiteCode }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card-panel">
      <p class="muted">Loading...</p>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api } from '../api';

const router = useRouter();
const route = useRoute();

const goodsReceipt = reactive({
  id: null,
  grNumber: '',
  poNumber: '',
  vendorName: '',
  status: '',
  lines: [],
});

const goBack = () => {
  router.back();
};

onMounted(async () => {
  const id = route.params.id;
  const data = await api.listGoodsReceipts();
  const gr = data.items?.find(item => item.id === id);
  
  if (gr) {
    Object.assign(goodsReceipt, gr);
  }
});
</script>
