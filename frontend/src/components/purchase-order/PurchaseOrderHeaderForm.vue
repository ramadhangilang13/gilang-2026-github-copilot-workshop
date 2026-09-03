<template>
  <div class="card-panel">
    <p class="form-section-title">PO Header</p>
    <div class="form-row">
      <div class="form-group">
        <label>Vendor Name</label>
        <input v-model="vendorName" placeholder="Type..." data-testid="po-vendor-input" required />
      </div>
      <div class="form-group">
        <label>Source Purchase Requisition</label>
        <select v-model="sourcePrId" data-testid="po-source-pr-select">
          <option value="">Select approved PR...</option>
          <option v-for="pr in approvedRequisitions" :key="pr.id" :value="pr.id">
            {{ pr.prNumber }} — {{ pr.title }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>Order Date</label>
        <input v-model="orderDate" type="date" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  approvedRequisitions: {
    type: Array,
    default: () => [],
  },
});

const vendorName = defineModel('vendorName', { type: String, default: '' });
const sourcePrId = defineModel('sourcePrId', { type: String, default: '' });
const orderDate = defineModel('orderDate', { type: String, default: '' });
</script>
