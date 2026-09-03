import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PurchaseOrderHeaderForm from '../PurchaseOrderHeaderForm.vue';

const approvedRequisitions = [
  { id: 'pr-1', prNumber: 'PR-2026-0001', title: 'Monthly MRO replenishment' },
  { id: 'pr-2', prNumber: 'PR-2026-0004', title: 'Tooling replacement' },
];

function mountForm(props = {}) {
  return mount(PurchaseOrderHeaderForm, {
    props: {
      vendor: '',
      neededByDate: '',
      currency: 'IDR',
      paymentTerms: '',
      notes: '',
      sourcePrId: '',
      approvedRequisitions,
      ...props,
    },
  });
}

describe('PurchaseOrderHeaderForm rendering', () => {
  it('renders all PO header fields', () => {
    const wrapper = mountForm();

    expect(wrapper.find('[data-testid="po-vendor-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="po-needed-by-date-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="po-currency-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="po-payment-terms-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="po-notes-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="po-source-pr-select"]').exists()).toBe(true);
  });

  it('renders only the placeholder option when no requisitions are supplied', () => {
    const wrapper = mountForm({ approvedRequisitions: [] });

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

  it('reflects the vendor prop into the input value', () => {
    const wrapper = mountForm({ vendor: 'PT Sumber Teknik Abadi' });

    expect(wrapper.find('[data-testid="po-vendor-input"]').element.value).toBe(
      'PT Sumber Teknik Abadi'
    );
  });
});

describe('PurchaseOrderHeaderForm two-way binding', () => {
  it('emits update:vendor when the vendor input changes', async () => {
    const wrapper = mountForm();

    await wrapper.find('[data-testid="po-vendor-input"]').setValue('PT Maju Jaya');

    expect(wrapper.emitted('update:vendor')[0]).toEqual(['PT Maju Jaya']);
  });

  it('emits update:neededByDate when the date input changes', async () => {
    const wrapper = mountForm();

    await wrapper.find('[data-testid="po-needed-by-date-input"]').setValue('2026-09-15');

    expect(wrapper.emitted('update:neededByDate')[0]).toEqual(['2026-09-15']);
  });

  it('emits update:currency when the currency input changes', async () => {
    const wrapper = mountForm();

    await wrapper.find('[data-testid="po-currency-input"]').setValue('USD');

    expect(wrapper.emitted('update:currency')[0]).toEqual(['USD']);
  });

  it('emits update:paymentTerms when the payment terms input changes', async () => {
    const wrapper = mountForm();

    await wrapper.find('[data-testid="po-payment-terms-input"]').setValue('Net 30');

    expect(wrapper.emitted('update:paymentTerms')[0]).toEqual(['Net 30']);
  });

  it('emits update:notes when the notes textarea changes', async () => {
    const wrapper = mountForm();

    await wrapper.find('[data-testid="po-notes-input"]').setValue('Some notes here');

    expect(wrapper.emitted('update:notes')[0]).toEqual(['Some notes here']);
  });

  it('emits update:sourcePrId when a requisition is selected', async () => {
    const wrapper = mountForm({ approvedRequisitions });

    await wrapper.find('[data-testid="po-source-pr-select"]').setValue('pr-2');

    expect(wrapper.emitted('update:sourcePrId')[0]).toEqual(['pr-2']);
  });
});
