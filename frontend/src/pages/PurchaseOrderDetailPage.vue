<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/purchase-orders" class="back-btn" title="Back to list">&#8592;</RouterLink>
        <div>
          <h2>Detail Purchase Order</h2>
          <p class="muted" data-testid="po-detail-number">
            {{ purchaseOrder?.poNumber || '-' }} &mdash; Purchase Order information detail
          </p>
        </div>
      </div>
      <div class="btn-group" v-if="purchaseOrder">
        <button
          v-if="purchaseOrder.status === 'DRAFT'"
          class="btn btn-primary"
          data-testid="po-submit-btn"
          @click="submitPurchaseOrder"
        >
          Submit PO
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="error" data-testid="po-detail-error">{{ errorMessage }}</p>

    <div class="card-panel" v-if="purchaseOrder">
      <p class="form-section-title">PO Header</p>
      <div class="form-row">
        <div class="form-group">
          <label>PO Number</label>
          <input :value="purchaseOrder.poNumber" disabled />
        </div>
        <div class="form-group">
          <label>Vendor Name</label>
          <input :value="purchaseOrder.vendorName" disabled />
        </div>
        <div class="form-group">
          <label>Created At</label>
          <input :value="formatDate(purchaseOrder.createdAt)" disabled />
        </div>
        <div class="form-group">
          <label>Status</label>
          <span class="status-badge" :class="purchaseOrder.status.toLowerCase()" data-testid="po-detail-status">
            {{ purchaseOrder.status }}
          </span>
        </div>
      </div>
    </div>

    <div class="card-panel" v-if="purchaseOrder">
      <p class="form-section-title">PO Lines</p>
      <table>
        <thead>
          <tr>
            <th style="width:50px">Line</th>
            <th>Item Code</th>
            <th>Item Name</th>
            <th>Qty Ordered</th>
            <th>Qty Received</th>
            <th>Qty Open for GR</th>
            <th>UOM</th>
            <th>Unit Price</th>
            <th>Site</th>
            <th>Source PR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in purchaseOrder.lines" :key="line.id" data-testid="po-detail-line-row">
            <td>{{ line.lineNo }}</td>
            <td>{{ line.itemCode }}</td>
            <td>{{ line.itemName }}</td>
            <td>{{ line.qtyOrdered }}</td>
            <td>{{ line.qtyReceived }}</td>
            <td>{{ line.qtyOpenForGr }}</td>
            <td>{{ line.uom }}</td>
            <td>{{ line.unitPrice }}</td>
            <td>{{ line.siteCode }}</td>
            <td>
              <span v-if="!line.allocations?.length">-</span>
              <span v-for="allocation in line.allocations" :key="allocation.prLineId" class="allocation">
                {{ allocation.prNumber }} ({{ allocation.allocatedQty }})
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { api } from '../api';

const route = useRoute();
const purchaseOrder = ref(null);
const errorMessage = ref('');

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '-';
}

async function load() {
  errorMessage.value = '';
  try {
    purchaseOrder.value = await api.getPurchaseOrder(route.params.id);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function submitPurchaseOrder() {
  errorMessage.value = '';
  try {
    await api.submitPurchaseOrder(route.params.id);
    await load();
  } catch (error) {
    errorMessage.value = error.message;
  }
}

onMounted(load);
</script>

<style scoped>
.form-group input:disabled {
  background: var(--white);
  color: var(--text);
  cursor: default;
  opacity: 1;
}
.allocation {
  display: block;
}
</style>
