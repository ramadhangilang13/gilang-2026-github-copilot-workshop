import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PurchaseOrderLineAllocationTable from '../PurchaseOrderLineAllocationTable.vue';

describe('PurchaseOrderLineAllocationTable - Empty Row Rendering', () => {
  it('should render a single empty row when lines array has one emptyLine', () => {
    const emptyLine = {
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

    const wrapper = mount(PurchaseOrderLineAllocationTable, {
      props: {
        lines: [emptyLine],
      },
    });

    // Check if table exists
    expect(wrapper.find('table').exists()).toBe(true);

    // Check if tbody exists
    const tbody = wrapper.find('tbody');
    expect(tbody.exists()).toBe(true);

    // Check if tr (row) exists
    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(1);
    console.log('Rows found:', rows.length);

    // Check if the row has cells
    const cells = rows[0].findAll('td');
    console.log('Cells in first row:', cells.length);
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should render multiple rows when lines array has multiple items', () => {
    const line1 = {
      selected: true,
      prNumber: 'PR-001',
      prLineNo: 1,
      prLineId: 'line-1',
      itemCode: 'ITEM-001',
      itemName: 'Item 1',
      qtyOpenForPo: 100,
      qtyOrdered: 50,
      uom: 'PCS',
      unitPrice: 1000,
      siteCode: 'SITE-A',
      requiredDate: '2024-01-15',
    };

    const line2 = {
      selected: true,
      prNumber: 'PR-001',
      prLineNo: 2,
      prLineId: 'line-2',
      itemCode: 'ITEM-002',
      itemName: 'Item 2',
      qtyOpenForPo: 50,
      qtyOrdered: 25,
      uom: 'KG',
      unitPrice: 2000,
      siteCode: 'SITE-B',
      requiredDate: '2024-01-20',
    };

    const wrapper = mount(PurchaseOrderLineAllocationTable, {
      props: {
        lines: [line1, line2],
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should display HTML structure correctly', () => {
    const emptyLine = {
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

    const wrapper = mount(PurchaseOrderLineAllocationTable, {
      props: {
        lines: [emptyLine],
      },
    });

    const html = wrapper.html();
    console.log('Component HTML:', html);

    // Verify table wrapper exists
    expect(html).toContain('table-wrapper');
    expect(html).toContain('table');
    expect(html).toContain('thead');
    expect(html).toContain('tbody');
  });
});
