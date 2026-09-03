import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PurchaseOrderDetailPage from '../PurchaseOrderDetailPage.vue';
import { api } from '../../api';

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRoute: () => ({ params: { id: 'po-1' } }),
}));

vi.mock('../../api', () => ({
  api: {
    getPurchaseOrder: vi.fn(),
    submitPurchaseOrder: vi.fn(),
  },
}));

function makePo(overrides = {}) {
  return {
    id: 'po-1',
    poNumber: 'PO-2026-0001',
    status: 'DRAFT',
    vendorName: 'PT Sumber Teknik Abadi',
    createdAt: '2026-05-01T10:00:00.000Z',
    lines: [
      {
        id: 'po-line-1',
        lineNo: 1,
        itemCode: 'BRG-6205',
        itemName: 'Bearing 6205',
        qtyOrdered: 12,
        qtyReceived: 5,
        qtyOpenForGr: 7,
        uom: 'PCS',
        unitPrice: 83000,
        siteCode: 'JKT-PLANT',
        allocations: [{ prLineId: 'pr-line-1', prNumber: 'PR-2026-0001', allocatedQty: 12 }],
      },
    ],
    ...overrides,
  };
}

async function mountPage() {
  const wrapper = mount(PurchaseOrderDetailPage);
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PurchaseOrderDetailPage rendering', () => {
  it('renders header fields and the PO number', async () => {
    api.getPurchaseOrder.mockResolvedValue(makePo());

    const wrapper = await mountPage();

    expect(api.getPurchaseOrder).toHaveBeenCalledWith('po-1');
    expect(wrapper.find('[data-testid="po-detail-number"]').text()).toContain('PO-2026-0001');
    expect(wrapper.find('[data-testid="po-detail-status"]').text()).toBe('DRAFT');
  });

  it('renders one row per line including the GR open quantity', async () => {
    api.getPurchaseOrder.mockResolvedValue(makePo());

    const wrapper = await mountPage();

    const rows = wrapper.findAll('[data-testid="po-detail-line-row"]');
    expect(rows).toHaveLength(1);
    expect(rows[0].text()).toContain('BRG-6205');
    expect(rows[0].findAll('td')[5].text()).toBe('7');
  });

  it('shows the source PR allocation for traceability', async () => {
    api.getPurchaseOrder.mockResolvedValue(makePo());

    const wrapper = await mountPage();

    expect(wrapper.find('.allocation').text()).toBe('PR-2026-0001 (12)');
  });

  it('falls back to a dash when a line has no allocation', async () => {
    const po = makePo();
    po.lines[0].allocations = [];
    api.getPurchaseOrder.mockResolvedValue(po);

    const wrapper = await mountPage();

    const cells = wrapper.findAll('[data-testid="po-detail-line-row"]')[0].findAll('td');
    expect(cells[9].text()).toBe('-');
  });

  it('shows the error message when loading fails', async () => {
    api.getPurchaseOrder.mockRejectedValue(new Error('Purchase order not found'));

    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="po-detail-error"]').text()).toBe('Purchase order not found');
    expect(wrapper.find('[data-testid="po-detail-status"]').exists()).toBe(false);
  });
});

describe('PurchaseOrderDetailPage submit action', () => {
  it('offers Submit only while the PO is DRAFT', async () => {
    api.getPurchaseOrder.mockResolvedValue(makePo({ status: 'SUBMITTED' }));

    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="po-submit-btn"]').exists()).toBe(false);
  });

  it('submits then reloads, moving the badge to SUBMITTED', async () => {
    api.getPurchaseOrder
      .mockResolvedValueOnce(makePo())
      .mockResolvedValueOnce(makePo({ status: 'SUBMITTED' }));
    api.submitPurchaseOrder.mockResolvedValue({});

    const wrapper = await mountPage();
    await wrapper.find('[data-testid="po-submit-btn"]').trigger('click');
    await flushPromises();

    expect(api.submitPurchaseOrder).toHaveBeenCalledWith('po-1');
    expect(wrapper.find('[data-testid="po-detail-status"]').text()).toBe('SUBMITTED');
    expect(wrapper.find('[data-testid="po-submit-btn"]').exists()).toBe(false);
  });

  it('keeps DRAFT and shows the message when submit is rejected', async () => {
    api.getPurchaseOrder.mockResolvedValue(makePo());
    api.submitPurchaseOrder.mockRejectedValue(
      new Error('Only DRAFT purchase order can be submitted')
    );

    const wrapper = await mountPage();
    await wrapper.find('[data-testid="po-submit-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="po-detail-error"]').text()).toBe(
      'Only DRAFT purchase order can be submitted'
    );
    expect(wrapper.find('[data-testid="po-detail-status"]').text()).toBe('DRAFT');
  });
});
