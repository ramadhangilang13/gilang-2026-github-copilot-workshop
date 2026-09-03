import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import PurchaseOrderCreatePage from '../PurchaseOrderCreatePage.vue';
import PurchaseOrderHeaderForm from '../../components/purchase-order/PurchaseOrderHeaderForm.vue';
import PurchaseOrderLineAllocationTable from '../../components/purchase-order/PurchaseOrderLineAllocationTable.vue';
import { api } from '../../api';

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot /></a>' },
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('../../api', () => ({
  api: {
    listRequisitions: vi.fn(),
    getRequisitionOpenLines: vi.fn(),
    createPurchaseOrder: vi.fn(),
  },
}));

const approvedPr = { id: 'pr-1', prNumber: 'PR-2026-0001', title: 'Monthly MRO', status: 'APPROVED' };

const openLine = {
  id: 'pr-line-1',
  itemCode: 'BRG-6205',
  itemName: 'Bearing 6205',
  qtyOpenForPo: 8,
  uom: 'PCS',
  estUnitPrice: 85000,
  siteCode: 'JKT-PLANT',
  requiredDate: '2026-06-15T00:00:00.000Z',
};

/** Mount, select the approved PR, and wait for its open lines to load. */
async function mountWithSelectedPr() {
  const wrapper = mount(PurchaseOrderCreatePage);
  await flushPromises();
  wrapper.findComponent(PurchaseOrderHeaderForm).vm.$emit('update:sourcePrId', 'pr-1');
  await flushPromises();
  return wrapper;
}

async function setVendor(wrapper, name) {
  wrapper.findComponent(PurchaseOrderHeaderForm).vm.$emit('update:vendor', name);
  await flushPromises();
}

async function submitForm(wrapper) {
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

function errorText(wrapper) {
  return wrapper.find('[data-testid="po-error"]').text();
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listRequisitions.mockResolvedValue({
    items: [approvedPr, { id: 'pr-2', prNumber: 'PR-2026-0002', status: 'SUBMITTED' }],
  });
  api.getRequisitionOpenLines.mockResolvedValue({ openLines: [openLine] });
});

describe('PurchaseOrderCreatePage loading', () => {
  it('offers only APPROVED requisitions as allocation sources', async () => {
    const wrapper = mount(PurchaseOrderCreatePage);
    await flushPromises();

    const options = wrapper.findComponent(PurchaseOrderHeaderForm).props('approvedRequisitions');
    expect(options).toHaveLength(1);
    expect(options[0].id).toBe('pr-1');
  });

  it('loads open lines and defaults ordered qty to the remaining qty', async () => {
    const wrapper = await mountWithSelectedPr();

    expect(api.getRequisitionOpenLines).toHaveBeenCalledWith('pr-1');
    expect(wrapper.findComponent(PurchaseOrderLineAllocationTable).props('lines')[0]).toMatchObject({
      prLineId: 'pr-line-1',
      qtyOpenForPo: 8,
      qtyOrdered: 8,
      unitPrice: 85000,
      requiredDate: '2026-06-15',
    });
  });

  it('warns when the selected PR has nothing left to allocate', async () => {
    api.getRequisitionOpenLines.mockResolvedValue({ openLines: [] });

    const wrapper = await mountWithSelectedPr();

    expect(errorText(wrapper)).toContain('no remaining quantity');
  });
});

describe('PurchaseOrderCreatePage over-allocation guard', () => {
  it('blocks submission and never calls the API when ordered exceeds remaining', async () => {
    const wrapper = await mountWithSelectedPr();
    await setVendor(wrapper, 'PT Sumber Teknik');
    wrapper
      .findComponent(PurchaseOrderLineAllocationTable)
      .vm.$emit('update-line', { index: 0, field: 'qtyOrdered', value: 9 });
    await flushPromises();

    await submitForm(wrapper);

    expect(api.createPurchaseOrder).not.toHaveBeenCalled();
    expect(errorText(wrapper)).toBe('Line 1 (BRG-6205): ordered 9 exceeds remaining 8.');
  });

  it('requires a vendor name', async () => {
    const wrapper = await mountWithSelectedPr();

    await submitForm(wrapper);

    expect(api.createPurchaseOrder).not.toHaveBeenCalled();
    expect(errorText(wrapper)).toBe('Vendor name is required.');
  });

  it('rejects a manually added line that has no source PR line', async () => {
    const wrapper = await mountWithSelectedPr();
    await setVendor(wrapper, 'PT Sumber Teknik');
    wrapper.findComponent(PurchaseOrderLineAllocationTable).vm.$emit('add-line');
    await flushPromises();

    await submitForm(wrapper);

    expect(api.createPurchaseOrder).not.toHaveBeenCalled();
    expect(errorText(wrapper)).toContain('Line 2');
  });
});

describe('PurchaseOrderCreatePage submission', () => {
  it('sends a trimmed vendor and a prLineId on every line, then redirects to the detail page', async () => {
    api.createPurchaseOrder.mockResolvedValue({ id: 'po-1', poNumber: 'PO-2026-0002' });

    const wrapper = await mountWithSelectedPr();
    await setVendor(wrapper, '  PT Sumber Teknik  ');
    await submitForm(wrapper);

    expect(api.createPurchaseOrder).toHaveBeenCalledWith({
      vendorName: 'PT Sumber Teknik',
      neededByDate: null,
      currency: 'IDR',
      paymentTerms: '',
      notes: '',
      lines: [
        {
          prLineId: 'pr-line-1',
          itemCode: 'BRG-6205',
          itemName: 'Bearing 6205',
          qtyOrdered: 8,
          uom: 'PCS',
          unitPrice: 85000,
          siteCode: 'JKT-PLANT',
          requiredDate: '2026-06-15',
        },
      ],
    });
    expect(pushMock).toHaveBeenCalledWith('/purchase-orders/po-1');
  });

  it('surfaces the server 422 message and stays on the form', async () => {
    api.createPurchaseOrder.mockRejectedValue(
      new Error('lines[0]: allocation qty 8 exceeds remaining 3')
    );

    const wrapper = await mountWithSelectedPr();
    await setVendor(wrapper, 'PT Sumber Teknik');
    await submitForm(wrapper);

    expect(errorText(wrapper)).toBe('lines[0]: allocation qty 8 exceeds remaining 3');
    expect(pushMock).not.toHaveBeenCalled();
    expect(wrapper.find('form').exists()).toBe(true);
  });
});
