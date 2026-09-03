<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/purchase-orders" class="back-btn" title="Back to list">&#8592;</RouterLink>
        <div>
          <h2>Create Purchase Order</h2>
          <p class="muted">Create PO with vendor information and allocated PR lines</p>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error" data-testid="po-error">{{ errorMessage }}</p>

    <form @submit.prevent="handleSubmit">
      <PurchaseOrderHeaderForm
        v-model:vendor="form.vendor"
        v-model:needed-by-date="form.neededByDate"
        v-model:currency="form.currency"
        v-model:payment-terms="form.paymentTerms"
        v-model:notes="form.notes"
        v-model:source-pr-id="form.sourcePrId"
        :approved-requisitions="approvedRequisitions"
      />

      <PurchaseOrderLineAllocationTable
        :lines="form.lines"
        @add-line="addLine"
        @remove-line="removeLine"
        @update-line="updateLine"
        @refresh-lines="refreshLines"
      />

      <div class="btn-group">
        <RouterLink to="/purchase-orders" class="btn btn-outline">Cancel</RouterLink>
        <button
          class="btn btn-primary"
          type="submit"
          data-testid="po-create-submit"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Saving...' : 'Save As Draft' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { api } from '../api';
import PurchaseOrderHeaderForm from '../components/purchase-order/PurchaseOrderHeaderForm.vue';
import PurchaseOrderLineAllocationTable from '../components/purchase-order/PurchaseOrderLineAllocationTable.vue';

const router = useRouter();
const approvedRequisitions = ref([]);
const errorMessage = ref('');
const isSaving = ref(false);

function emptyLine() {
  return {
    selected: true,
    prNumber: '',
    prLineNo: null,
    prLineId: '',
    itemCode: '',
    itemName: '',
    qtyOpenForPo: null,
    qtyOrdered: 1,
    uom: 'PCS',
    unitPrice: 0,
    siteCode: '',
    requiredDate: '',
  };
}

const form = reactive({
  vendor: '',
  neededByDate: '',
  currency: 'IDR',
  paymentTerms: '',
  notes: '',
  sourcePrId: '',
  orderDate: '',
  lines: [emptyLine()],
});

function toDateInput(value) {
  return value ? String(value).slice(0, 10) : '';
}

onMounted(async () => {
  try {
    const payload = await api.listRequisitions();
    approvedRequisitions.value = (payload.items || []).filter((item) => item.status === 'APPROVED');
  } catch (error) {
    errorMessage.value = error.message;
  }
});

// Selecting a PR replaces the grid with that PR's still-open lines.
watch(
  () => form.sourcePrId,
  async (prId) => {
    console.log('🔍 watch sourcePrId triggered with value:', prId);
    errorMessage.value = '';

    if (!prId) {
      console.log('📭 No PR selected, resetting to empty line');
      form.lines = [emptyLine()];
      return;
    }

    try {
      console.log('📡 Calling API for PR:', prId);
      const payload = await api.getRequisitionOpenLines(prId);
      console.log('✅ API Response:', payload);
      
      const openLines = payload.openLines || [];
      const requisitionNumber = payload.requisition?.prNumber || '';
      
      console.log('📊 Open lines count:', openLines.length);

      form.lines = openLines.length
        ? openLines.map((line) => ({
            selected: true,
            prNumber: requisitionNumber,
            prLineNo: line.lineNo,
            prLineId: line.id,
            itemCode: line.itemCode,
            itemName: line.itemName,
            qtyOpenForPo: line.qtyOpenForPo,
            qtyOrdered: line.qtyOpenForPo,
            uom: line.uom,
            unitPrice: line.estUnitPrice,
            siteCode: line.siteCode,
            requiredDate: toDateInput(line.requiredDate),
          }))
        : [emptyLine()];

      console.log('📋 Form lines updated:', form.lines);

      if (!openLines.length) {
        errorMessage.value = 'This requisition has no remaining quantity to allocate.';
      }
    } catch (error) {
      console.error('❌ Error fetching lines:', error);
      errorMessage.value = error.message;
    }
  }
);

function addLine() {
  form.lines.push(emptyLine());
}

function removeLine(index) {
  if (form.lines.length === 1) return;
  form.lines.splice(index, 1);
}

function updateLine({ index, field, value }) {
  form.lines[index][field] = value;
}

async function refreshLines() {
  console.log('🔄 Refresh Lines called with PR:', form.sourcePrId);
  if (!form.sourcePrId) {
    errorMessage.value = 'Please select a PR first.';
    return;
  }

  try {
    console.log('📡 Calling API for refresh with PR:', form.sourcePrId);
    const payload = await api.getRequisitionOpenLines(form.sourcePrId);
    console.log('✅ Refresh API Response:', payload);
    
    const openLines = payload.openLines || [];
    const requisitionNumber = payload.requisition?.prNumber || '';
    
    console.log('📊 Open lines count:', openLines.length);

    form.lines = openLines.length
      ? openLines.map((line) => ({
          selected: true,
          prNumber: requisitionNumber,
          prLineNo: line.lineNo,
          prLineId: line.id,
          itemCode: line.itemCode,
          itemName: line.itemName,
          qtyOpenForPo: line.qtyOpenForPo,
          qtyOrdered: line.qtyOpenForPo,
          uom: line.uom,
          unitPrice: line.estUnitPrice,
          siteCode: line.siteCode,
          requiredDate: toDateInput(line.requiredDate),
        }))
      : [emptyLine()];

    console.log('📋 Form lines updated:', form.lines);

    if (!openLines.length) {
      errorMessage.value = 'This requisition has no remaining quantity to allocate.';
    }
  } catch (error) {
    console.error('❌ Error refreshing lines:', error);
    errorMessage.value = error.message;
  }
}

// Mirrors the server rule so obvious breaches never leave the browser.
function validate() {
  if (!form.vendor.trim()) {
    return 'Vendor name is required.';
  }

  const selectedLines = form.lines
    .map((line, index) => ({ line, index }))
    .filter((entry) => entry.line.selected !== false);

  if (!selectedLines.length) {
    return 'Select at least one approved requisition line.';
  }

  for (const entry of selectedLines) {
    const { line, index } = entry;
    const label = `Line ${index + 1}`;

    if (!line.prLineId) {
      return `${label}: select an approved requisition line first.`;
    }

    if (!(line.qtyOrdered > 0)) {
      return `${label}: ordered quantity must be greater than 0.`;
    }

    if (Number.isFinite(line.qtyOpenForPo) && line.qtyOrdered > line.qtyOpenForPo) {
      return `${label} (${line.itemCode}): ordered ${line.qtyOrdered} exceeds remaining ${line.qtyOpenForPo}.`;
    }

    if (line.unitPrice < 0) {
      return `${label}: unit price cannot be negative.`;
    }
  }

  return '';
}

async function handleSubmit() {
  errorMessage.value = validate();
  if (errorMessage.value) return;

  const selectedLines = form.lines.filter((line) => line.selected !== false);

  isSaving.value = true;
  try {
    const created = await api.createPurchaseOrder({
      vendorName: form.vendor.trim(),
      neededByDate: form.neededByDate || null,
      currency: form.currency || 'IDR',
      paymentTerms: form.paymentTerms || '',
      notes: form.notes || '',
      lines: selectedLines.map((line) => ({
        prLineId: line.prLineId,
        itemCode: line.itemCode,
        itemName: line.itemName,
        qtyOrdered: line.qtyOrdered,
        uom: line.uom,
        unitPrice: line.unitPrice,
        siteCode: line.siteCode,
        requiredDate: line.requiredDate || null,
      })),
    });
    await router.push(`/purchase-orders/${created.id}`);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    isSaving.value = false;
  }
}
</script>
