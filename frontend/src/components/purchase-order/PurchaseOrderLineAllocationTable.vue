<template>
  <div class="card-panel">
    <div class="card-panel-header">
      <p class="form-section-title" style="margin:0">PO Lines</p>
      <button type="button" class="btn btn-outline" @click="emit('add-line')">+ New Line</button>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:50px">Line</th>
          <th>Item Code</th>
          <th>Item Name</th>
          <th style="width:90px">Qty Open</th>
          <th style="width:90px">Qty Ordered</th>
          <th style="width:80px">UOM</th>
          <th>Unit Price</th>
          <th>Site</th>
          <th>Required Date</th>
          <th style="width:60px">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, index) in lines" :key="index" data-testid="po-line-row">
          <td>{{ index + 1 }}</td>
          <td>
            <input
              :value="line.itemCode"
              placeholder="Type..."
              @input="update(index, 'itemCode', $event.target.value)"
            />
          </td>
          <td>
            <input
              :value="line.itemName"
              placeholder="Type..."
              @input="update(index, 'itemName', $event.target.value)"
            />
          </td>
          <td class="muted-cell">{{ line.qtyOpenForPo }}</td>
          <td>
            <input
              :value="line.qtyOrdered"
              type="number"
              min="0.01"
              step="0.01"
              :class="{ 'input-invalid': isOverAllocated(line) }"
              data-testid="po-line-qty-input"
              @input="update(index, 'qtyOrdered', Number($event.target.value))"
            />
          </td>
          <td>
            <input :value="line.uom" placeholder="Type..." @input="update(index, 'uom', $event.target.value)" />
          </td>
          <td>
            <input
              :value="line.unitPrice"
              type="number"
              min="0"
              step="0.01"
              @input="update(index, 'unitPrice', Number($event.target.value))"
            />
          </td>
          <td>
            <input :value="line.siteCode" placeholder="Type..." @input="update(index, 'siteCode', $event.target.value)" />
          </td>
          <td>
            <input
              :value="line.requiredDate"
              type="date"
              @input="update(index, 'requiredDate', $event.target.value)"
            />
          </td>
          <td style="text-align:center">
            <button type="button" class="btn-danger-icon" title="Remove" @click="emit('remove-line', index)">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 1.5h5M2 3.5h12M3.5 3.5l.75 9.5a1.5 1.5 0 0 0 1.5 1.5h4.5a1.5 1.5 0 0 0 1.5-1.5l.75-9.5M6.5 6.5v4.5M9.5 6.5v4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="hasOverAllocation" class="error" data-testid="po-allocation-error">
      Ordered quantity cannot exceed the open quantity of the source PR line.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  lines: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['add-line', 'remove-line', 'update-line']);

// qtyOpenForPo is absent on manually added lines, so those are never flagged.
function isOverAllocated(line) {
  return Number.isFinite(line.qtyOpenForPo) && line.qtyOrdered > line.qtyOpenForPo;
}

const hasOverAllocation = computed(() => props.lines.some(isOverAllocated));

function update(index, field, value) {
  emit('update-line', { index, field, value });
}
</script>

<style scoped>
table input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-input);
  font-family: inherit;
  font-size: 13px;
}
table input:focus {
  border-color: var(--primary);
  outline: none;
}
table input.input-invalid {
  border-color: #c62828;
}
.muted-cell {
  color: var(--text-muted);
}
</style>
