<template>
  <div class="card-panel">
    <div class="card-panel-header">
      <p class="form-section-title" style="margin:0">Approved PR Lines</p>
      <button type="button" class="btn btn-outline btn-refresh" @click="emit('refresh-lines')">Refresh Open Lines</button>
    </div>

    <div v-if="lines && lines.length === 0" class="empty-state">
      <p>No purchase requisition lines. Please select a PR above.</p>
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th style="width:64px">Select</th>
            <th style="width:100px">PR No</th>
            <th style="width:70px">PR Line</th>
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
            <td>
              <input
                type="checkbox"
                class="line-select"
                :checked="line.selected !== false"
                data-testid="po-line-select-checkbox"
                @change="update(index, 'selected', $event.target.checked)"
              />
            </td>
            <td>{{ line.prNumber || '-' }}</td>
            <td>{{ line.prLineNo || '-' }}</td>
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
            <td class="muted-cell">{{ line.qtyOpenForPo !== null ? line.qtyOpenForPo : '-' }}</td>
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
              <button type="button" class="btn-danger-icon" title="Remove" data-testid="po-line-remove-btn" @click="emit('remove-line', index)">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 1.5h5M2 3.5h12M3.5 3.5l.75 9.5a1.5 1.5 0 0 0 1.5 1.5h4.5a1.5 1.5 0 0 0 1.5-1.5l.75-9.5M6.5 6.5v4.5M9.5 6.5v4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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

const emit = defineEmits(['add-line', 'remove-line', 'update-line', 'refresh-lines']);

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
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background-color: #fafafa;
  margin-top: 8px;
}

.empty-state p {
  margin: 0;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid var(--border);
  margin-top: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--white);
}

thead {
  background: var(--table-header);
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  padding: 12px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  min-height: 45px;
  vertical-align: middle;
}

tbody tr:hover {
  background-color: #f9f9f9;
}

tbody tr:last-child td {
  border-bottom: none;
}

table input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 5px;
  font-family: inherit;
  font-size: 13px;
  background: var(--white);
  color: var(--text);
  box-sizing: border-box;
}

table input:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 64, 129, 0.1);
}

table input.input-invalid {
  border-color: #c62828;
}

.line-select {
  width: 16px;
  height: 16px;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.muted-cell {
  color: var(--text-muted);
  text-align: center;
}

.btn-refresh {
  border: 1px solid var(--primary);
  color: var(--primary);
  background: transparent;
  padding: 8px 16px;
}

.btn-refresh:hover {
  background: rgba(255, 64, 129, 0.08);
}

.btn-danger-icon {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #c62828;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.btn-danger-icon:hover {
  opacity: 0.7;
}
</style>
