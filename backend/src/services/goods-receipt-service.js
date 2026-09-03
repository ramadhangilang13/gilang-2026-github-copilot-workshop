// ── Mappers ──────────────────────────────────────────────

function mapHeader(row) {
  return {
    id: row.id,
    grNumber: row.gr_number,
    poId: row.po_id,
    status: row.status,
    receiptDate: row.receipt_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLine(row) {
  return {
    id: row.id,
    lineNo: row.line_no,
    qtyReceived: Number(row.qty_received),
    actualSiteCode: row.actual_site_code,
  };
}

// ── Queries ──────────────────────────────────────────────

export async function listGoodsReceipts(db) {
  const { rows } = await db.query(
    `SELECT gr.id, gr.gr_number, gr.po_id, gr.status, gr.receipt_date, gr.notes, gr.created_at, gr.updated_at,
            po.po_number, po.vendor_name
     FROM goods_receipts gr
     LEFT JOIN purchase_orders po ON gr.po_id = po.id
     ORDER BY gr.created_at DESC`
  );

  return rows.map(row => ({
    ...mapHeader(row),
    poNumber: row.po_number,
    vendorName: row.vendor_name,
  }));
}

export async function getGoodsReceiptById(db, id) {
  const headerResult = await db.query(
    `SELECT gr.*, po.po_number, po.vendor_name
     FROM goods_receipts gr
     LEFT JOIN purchase_orders po ON gr.po_id = po.id
     WHERE gr.id = $1`,
    [id]
  );

  if (headerResult.rowCount === 0) {
    return null;
  }

  const header = headerResult.rows[0];
  const linesResult = await db.query(
    `SELECT * FROM gr_lines WHERE gr_id = $1 ORDER BY line_no ASC`,
    [id]
  );

  return {
    ...mapHeader(header),
    poNumber: header.po_number,
    vendorName: header.vendor_name,
    lines: linesResult.rows.map(mapLine),
  };
}
