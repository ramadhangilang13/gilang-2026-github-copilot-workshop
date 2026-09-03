<template>
  <div class="card-panel po-header-panel">
    <p class="form-section-title">PO Header</p>
    
    <!-- First row: Vendor, Needed By, Currency, Payment Terms -->
    <div class="po-header-grid">
      <div class="form-group">
        <label>Vendor</label>
        <input v-model="vendor" placeholder="Type..." data-testid="po-vendor-input" />
      </div>
      <div class="form-group">
        <label>Needed By date</label>
        <input v-model="neededByDate" type="date" data-testid="po-needed-by-date-input" />
      </div>
      <div class="form-group">
        <label>Currency</label>
        <input v-model="currency" placeholder="IDR..." data-testid="po-currency-input" />
      </div>
      <div class="form-group">
        <label>Payment Terms</label>
        <input v-model="paymentTerms" placeholder="Type..." data-testid="po-payment-terms-input" />
      </div>
    </div>

    <!-- Second row: Notes (full width) -->
    <div class="form-group notes-group">
      <label>Notes</label>
      <textarea v-model="notes" placeholder="Type..." data-testid="po-notes-input" rows="4"></textarea>
    </div>

    <!-- Source PR Selection (for backward compatibility) -->
    <div class="form-group">
      <label>Source Purchase Requisition *</label>
      <select v-model="sourcePrId" data-testid="po-source-pr-select">
        <option value="">Select approved PR...</option>
        <option v-for="pr in approvedRequisitions" :key="pr.id" :value="pr.id">
          {{ pr.prNumber }} — {{ pr.title }}
        </option>
      </select>
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

const vendor = defineModel('vendor', { type: String, default: '' });
const neededByDate = defineModel('neededByDate', { type: String, default: '' });
const currency = defineModel('currency', { type: String, default: '' });
const paymentTerms = defineModel('paymentTerms', { type: String, default: '' });
const notes = defineModel('notes', { type: String, default: '' });
const sourcePrId = defineModel('sourcePrId', { type: String, default: '' });
</script>

<style scoped>
.po-header-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.notes-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 5px;
  font-family: inherit;
  font-size: 13px;
  background: var(--white);
  color: var(--text);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: var(--primary);
  outline: none;
}

.form-group textarea {
  resize: vertical;
  font-family: 'Open Sans', system-ui, -apple-system, sans-serif;
}
</style>
