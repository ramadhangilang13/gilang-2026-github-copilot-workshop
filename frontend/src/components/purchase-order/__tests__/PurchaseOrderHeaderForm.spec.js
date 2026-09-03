import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PurchaseOrderHeaderForm from '../PurchaseOrderHeaderForm.vue';

const approvedRequisitions = [
  { id: 'pr-1', prNumber: 'PR-2026-0001', title: 'Monthly MRO replenishment' },
  { id: 'pr-2', prNumber: 'PR-2026-0004', title: 'Tooling replacement' },
];

function mountForm(props = {}) {
  return mount(PurchaseOrderHeaderForm, {
    props: { vendorName: '', sourcePrId: '', orderDate: '', ...props },
  });
}

describe('PurchaseOrderHeaderForm rendering', () => {
  it('renders the three header fields', () => {
    const wrapper = mountForm();

    expect(wrapper.find('[data-testid="po-vendor-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="po-source-pr-select"]').exists()).toBe(true);
    expect(wrapper.find('input[type="date"]').exists()).toBe(true);
  });

  it('renders only the placeholder option when no requisitions are supplied', () => {
    const wrapper = mountForm();

    const options = wrapper.findAll('option');
    expect(options).toHaveLength(1);
    expect(options[0].text()).toBe('Select approved PR...');
  });

  it('renders one option per approved requisition, labelled by number and title', () => {
    const wrapper = mountForm({ approvedRequisitions });

    const options = wrapper.findAll('option');
    expect(options).toHaveLength(3);
    expect(options[1].text()).toBe('PR-2026-0001 — Monthly MRO replenishment');
    expect(options[1].attributes('value')).toBe('pr-1');
  });

  it('reflects the vendorName prop into the input value', () => {
    const wrapper = mountForm({ vendorName: 'PT Sumber Teknik Abadi' });

    expect(wrapper.find('[data-testid="po-vendor-input"]').element.value).toBe(
      'PT Sumber Teknik Abadi'
    );
  });
});

describe('PurchaseOrderHeaderForm two-way binding', () => {
  it('emits update:vendorName when the vendor input changes', async () => {
    const wrapper = mountForm();

    await wrapper.find('[data-testid="po-vendor-input"]').setValue('PT Maju Jaya');

    expect(wrapper.emitted('update:vendorName')[0]).toEqual(['PT Maju Jaya']);
  });

  it('emits update:sourcePrId when a requisition is selected', async () => {
    const wrapper = mountForm({ approvedRequisitions });

    await wrapper.find('[data-testid="po-source-pr-select"]').setValue('pr-2');

    expect(wrapper.emitted('update:sourcePrId')[0]).toEqual(['pr-2']);
  });
});
