const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  getDashboard: async () => {
    const requisitions = await apiFetch('/api/requisitions');
    const purchaseOrders = await apiFetch('/api/purchase-orders');
    const goodsReceipts = await apiFetch('/api/goods-receipts');

    const prItems = requisitions.items || [];
    const poItems = purchaseOrders.items || [];
    const grItems = goodsReceipts.items || [];

    return {
      totalPr: prItems.filter((item) => item.status === 'APPROVED').length,
      draftPr: prItems.filter((item) => item.status === 'DRAFT').length,
      submittedPr: prItems.filter((item) => item.status === 'SUBMITTED').length,
      approvedPr: prItems.filter((item) => item.status === 'APPROVED').length,
      recentPr: prItems.slice(0, 3),
      recentPo: poItems.slice(0, 3),
      recentGr: grItems.slice(0, 2),
    };
  },
  listRequisitions: () => apiFetch('/api/requisitions'),
  createRequisition: (payload) =>
    apiFetch('/api/requisitions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getRequisition: (id) => apiFetch(`/api/requisitions/${id}`),
  submitRequisition: (id) =>
    apiFetch(`/api/requisitions/${id}/submit`, {
      method: 'POST',
    }),
  approveRequisition: (id) =>
    apiFetch(`/api/requisitions/${id}/approve`, {
      method: 'POST',
    }),
  getRequisitionOpenLines: (id) => apiFetch(`/api/requisitions/${id}/open-lines`),

  listPurchaseOrders: () => apiFetch('/api/purchase-orders'),
  createPurchaseOrder: (payload) =>
    apiFetch('/api/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPurchaseOrder: (id) => apiFetch(`/api/purchase-orders/${id}`),
  submitPurchaseOrder: (id) =>
    apiFetch(`/api/purchase-orders/${id}/submit`, {
      method: 'POST',
    }),
  getPurchaseOrderOpenLines: (id) => apiFetch(`/api/purchase-orders/${id}/open-lines`),

  listGoodsReceipts: () => apiFetch('/api/goods-receipts'),
};
