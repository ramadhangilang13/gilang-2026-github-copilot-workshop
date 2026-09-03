import {
  listGoodsReceipts,
  getGoodsReceiptById,
} from '../services/goods-receipt-service.js';

export default async function goodsReceiptRoutes(fastify) {
  fastify.get('/api/goods-receipts', async (request, reply) => {
    const items = await listGoodsReceipts(fastify.db);
    return { items };
  });

  fastify.get('/api/goods-receipts/:id', async (request, reply) => {
    const goodsReceipt = await getGoodsReceiptById(fastify.db, request.params.id);

    if (!goodsReceipt) {
      reply.code(404);
      return { message: 'Goods receipt not found' };
    }

    return goodsReceipt;
  });
}
