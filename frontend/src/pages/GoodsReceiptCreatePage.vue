<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/goods-receipts" class="back-btn" title="Back to list">&#8592;</RouterLink>
        <div>
          <h2>Create Goods Receipt</h2>
          <p class="muted">Record the receipt of goods for a purchase order</p>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error" data-testid="gr-error">{{ errorMessage }}</p>

    <form @submit.prevent="handleSubmit">
      <div class="card-panel">
        <h3 class="form-section-title">Goods Receipt Details</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>Purchase Order *</label>
            <select v-model="form.poId" required>
              <option value="">Select a PO</option>
              <option v-for="po in purchaseOrders" :key="po.id" :value="po.id">
                {{ po.poNumber }} - {{ po.vendorName }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Receipt Date</label>
            <input type="date" v-model="form.receiptDate" />
          </div>
        </div>

        <div class="form-row full">
          <div class="form-group full">
            <label>Notes</label>
            <textarea v-model="form.notes" placeholder="Add any notes about this receipt"></textarea>
          </div>
        </div>
      </div>

      <div class="btn-group">
        <RouterLink to="/goods-receipts" class="btn btn-outline">Cancel</RouterLink>
        <button
          class="btn btn-primary"
          type="submit"
          data-testid="gr-create-submit"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Saving...' : 'Save As Draft' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { api } from '../api';

const router = useRouter();
const errorMessage = ref('');
const isSaving = ref(false);
const purchaseOrders = reactive([]);

const form = reactive({
  poId: '',
  receiptDate: new Date().toISOString().split('T')[0],
  notes: '',
});

const loadPurchaseOrders = async () => {
  try {
    const data = await api.listPurchaseOrders();
    purchaseOrders.push(...(data.items || []));
  } catch (error) {
    errorMessage.value = 'Failed to load purchase orders';
    console.error(error);
  }
};

const handleSubmit = async () => {
  if (!form.poId) {
    errorMessage.value = 'Please select a purchase order';
    return;
  }

  isSaving.value = true;
  errorMessage.value = '';

  try {
    // In a real scenario, you would submit to an API
    // For now, just redirect to the list
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push('/goods-receipts');
  } catch (error) {
    errorMessage.value = error.message || 'Failed to create goods receipt';
    console.error(error);
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadPurchaseOrders();
});
</script>
