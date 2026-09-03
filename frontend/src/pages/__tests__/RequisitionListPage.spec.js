import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import RequisitionListPage from '../RequisitionListPage.vue';
import { api } from '../../api';

vi.mock('../../api', () => ({
  api: { listRequisitions: vi.fn() },
}));

const globalStubs = { RouterLink: { template: '<a><slot /></a>' } };

function mountPage() {
  return mount(RequisitionListPage, { global: { stubs: globalStubs } });
}

const sampleItems = [
  {
    id: 'pr-1',
    prNumber: 'PR-2026-0001',
    requesterName: 'Sari Lestari',
    departmentName: 'Maintenance',
    title: 'Monthly MRO replenishment',
    status: 'APPROVED',
    neededByDate: '2026-06-15',
  },
  {
    id: 'pr-2',
    prNumber: 'PR-2026-0002',
    requesterName: 'Budi Santoso',
    departmentName: 'Warehouse',
    title: 'Safety consumables',
    status: 'SUBMITTED',
    neededByDate: null,
  },
];

describe('RequisitionListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders one row per requisition returned by the API', async () => {
    api.listRequisitions.mockResolvedValue({ items: sampleItems });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(wrapper.text()).toContain('PR-2026-0001');
    expect(wrapper.text()).toContain('Sari Lestari');
  });

  it('renders the status badge with a lowercased status class', async () => {
    api.listRequisitions.mockResolvedValue({ items: sampleItems });

    const wrapper = mountPage();
    await flushPromises();

    const badges = wrapper.findAll('.status-badge');
    expect(badges[0].classes()).toContain('approved');
    expect(badges[1].classes()).toContain('submitted');
  });

  it('falls back to a dash when neededByDate is missing', async () => {
    api.listRequisitions.mockResolvedValue({ items: sampleItems });

    const wrapper = mountPage();
    await flushPromises();

    const secondRowCells = wrapper.findAll('tbody tr')[1].findAll('td');
    expect(secondRowCells[5].text()).toBe('-');
  });

  it('renders an empty table body when there are no requisitions', async () => {
    api.listRequisitions.mockResolvedValue({ items: [] });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.findAll('tbody tr')).toHaveLength(0);
    expect(wrapper.find('.error').exists()).toBe(false);
  });

  it('shows the error message and no rows when the API rejects', async () => {
    api.listRequisitions.mockRejectedValue(new Error('Request failed: 500'));

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.find('.error').text()).toBe('Request failed: 500');
    expect(wrapper.findAll('tbody tr')).toHaveLength(0);
  });
});
