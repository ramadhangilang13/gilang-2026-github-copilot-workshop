import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PurchaseOrderListPage from '../PurchaseOrderListPage.vue';
import { api } from '../../api';

vi.mock('../../api', () => ({
  api: { listPurchaseOrders: vi.fn() },
}));

const globalStubs = { RouterLink: { template: '<a><slot /></a>' } };

const sampleItems = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-0001',
    vendorName: 'PT Sumber Teknik Abadi',
    status: 'SUBMITTED',
    createdAt: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'po-2',
    poNumber: 'PO-2026-0002',
    vendorName: 'PT Maju Jaya',
    status: 'DRAFT',
    createdAt: null,
  },
];

async function mountPage() {
  const wrapper = mount(PurchaseOrderListPage, { global: { stubs: globalStubs } });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PurchaseOrderListPage', () => {
  it('renders one row per purchase order', async () => {
    api.listPurchaseOrders.mockResolvedValue({ items: sampleItems });

    const wrapper = await mountPage();

    expect(wrapper.findAll('[data-testid="po-list-row"]')).toHaveLength(2);
    expect(wrapper.text()).toContain('PO-2026-0001');
    expect(wrapper.text()).toContain('PT Sumber Teknik Abadi');
  });

  it('renders the status badge with a lowercased status class', async () => {
    api.listPurchaseOrders.mockResolvedValue({ items: sampleItems });

    const wrapper = await mountPage();

    const badges = wrapper.findAll('.status-badge');
    expect(badges[0].classes()).toContain('submitted');
    expect(badges[1].classes()).toContain('draft');
  });

  it('trims the timestamp to a date and falls back to a dash', async () => {
    api.listPurchaseOrders.mockResolvedValue({ items: sampleItems });

    const wrapper = await mountPage();

    const rows = wrapper.findAll('[data-testid="po-list-row"]');
    expect(rows[0].findAll('td')[3].text()).toBe('2026-05-01');
    expect(rows[1].findAll('td')[3].text()).toBe('-');
  });

  it('shows an empty-state message when there are no purchase orders', async () => {
    api.listPurchaseOrders.mockResolvedValue({ items: [] });

    const wrapper = await mountPage();

    expect(wrapper.findAll('[data-testid="po-list-row"]')).toHaveLength(0);
    expect(wrapper.text()).toContain('No purchase orders yet.');
  });

  it('shows the error message and no rows when the API rejects', async () => {
    api.listPurchaseOrders.mockRejectedValue(new Error('Request failed: 500'));

    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="po-list-error"]').text()).toBe('Request failed: 500');
    expect(wrapper.findAll('[data-testid="po-list-row"]')).toHaveLength(0);
  });
});
