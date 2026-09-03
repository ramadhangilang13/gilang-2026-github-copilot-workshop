import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PurchaseOrderLineAllocationTable from '../PurchaseOrderLineAllocationTable.vue';

function makeLine(overrides = {}) {
  return {
    selected: true,
    prNumber: 'PR-2026-0001',
    prLineNo: 1,
    prLineId: 'pr-line-1',
    itemCode: 'BRG-6205',
    itemName: 'Bearing 6205',
    qtyOpenForPo: 8,
    qtyOrdered: 5,
    uom: 'PCS',
    unitPrice: 83000,
    siteCode: 'JKT-PLANT',
    requiredDate: '',
    ...overrides,
  };
}

function mountTable(lines) {
  return mount(PurchaseOrderLineAllocationTable, { props: { lines } });
}

describe('PurchaseOrderLineAllocationTable rendering', () => {
  it('renders one row per line with PR number and PR line', () => {
    const wrapper = mountTable([makeLine(), makeLine({ itemCode: 'GLV-IND', prLineNo: 2 })]);

    const rows = wrapper.findAll('[data-testid="po-line-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].findAll('td')[1].text()).toBe('PR-2026-0001');
    expect(rows[1].findAll('td')[2].text()).toBe('2');
  });

  it('shows the open quantity as read-only text, not an input', () => {
    const wrapper = mountTable([makeLine({ qtyOpenForPo: 8 })]);

    const openCell = wrapper.find('.muted-cell');
    expect(openCell.text()).toBe('8');
    expect(openCell.find('input').exists()).toBe(false);
  });

  it('renders no rows when the lines prop is empty', () => {
    const wrapper = mountTable([]);

    expect(wrapper.findAll('[data-testid="po-line-row"]')).toHaveLength(0);
    expect(wrapper.find('[data-testid="po-allocation-error"]').exists()).toBe(false);
  });
});

describe('PurchaseOrderLineAllocationTable over-allocation feedback', () => {
  it('stays clean when ordered quantity is within the open quantity', () => {
    const wrapper = mountTable([makeLine({ qtyOpenForPo: 8, qtyOrdered: 8 })]);

    expect(wrapper.find('[data-testid="po-allocation-error"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="po-line-qty-input"]').classes()).not.toContain('input-invalid');
  });

  it('flags the input and shows the message when ordered exceeds open', () => {
    const wrapper = mountTable([makeLine({ qtyOpenForPo: 8, qtyOrdered: 9 })]);

    expect(wrapper.find('[data-testid="po-line-qty-input"]').classes()).toContain('input-invalid');
    expect(wrapper.find('[data-testid="po-allocation-error"]').exists()).toBe(true);
  });

  it('does not flag manually added lines that have no open quantity', () => {
    const wrapper = mountTable([makeLine({ qtyOpenForPo: null, qtyOrdered: 999 })]);

    expect(wrapper.find('[data-testid="po-allocation-error"]').exists()).toBe(false);
  });
});

describe('PurchaseOrderLineAllocationTable events', () => {
  it('emits refresh-lines when the refresh button is clicked', async () => {
    const wrapper = mountTable([makeLine()]);

    await wrapper.find('.btn-outline').trigger('click');

    expect(wrapper.emitted('refresh-lines')).toHaveLength(1);
  });

  it('emits remove-line with the row index', async () => {
    const wrapper = mountTable([makeLine(), makeLine()]);

    await wrapper.findAll('.btn-danger-icon')[1].trigger('click');

    expect(wrapper.emitted('remove-line')[0]).toEqual([1]);
  });

  it('emits update-line with index, field and numeric value', async () => {
    const wrapper = mountTable([makeLine()]);

    const qtyInput = wrapper.find('[data-testid="po-line-qty-input"]');
    await qtyInput.setValue('7');

    expect(wrapper.emitted('update-line')[0]).toEqual([
      { index: 0, field: 'qtyOrdered', value: 7 },
    ]);
  });

  it('emits update-line when a row selection checkbox is toggled', async () => {
    const wrapper = mountTable([makeLine()]);

    await wrapper.find('[data-testid="po-line-select-checkbox"]').setValue(false);

    expect(wrapper.emitted('update-line')[0]).toEqual([
      { index: 0, field: 'selected', value: false },
    ]);
  });
});
