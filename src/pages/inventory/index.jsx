import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './inventory.css';
import {
  loadWarehouses,
  saveWarehouses,
  loadSkus,
  saveSkus,
  loadBatches,
  saveBatches,
  loadDocuments,
  saveDocuments,
  loadTransfers,
  saveTransfers,
  loadStocktakes,
  saveStocktakes,
  loadFlowLogs,
  saveFlowLogs,
} from './storage.js';
import {
  getSkuTotalStock,
  getSkuStockInWarehouse,
  getStockStatus,
  getWarningSkus,
  getStatistics,
  filterSkus,
  paginateList,
  getSkuBatches,
  getBatchStatus,
  createInboundBatch,
  createOutboundDocument,
  createTransfer,
  createStocktake,
  applyStocktake,
  createFlowLog,
  formatDateTime,
} from './utils.js';
import {
  STOCK_STATUS,
  STOCK_STATUS_LABELS,
  BATCH_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  PAGE_SIZE,
  FLOW_LOG_TYPES,
} from './constants.js';
import InboundModal from './InboundModal.jsx';
import OutboundModal from './OutboundModal.jsx';
import TransferModal from './TransferModal.jsx';
import StocktakeModal from './StocktakeModal.jsx';
import SkuFlowLogs from './SkuFlowLogs.jsx';
import StockChart from './StockChart.jsx';

const TABS = [
  { key: 'dashboard', label: '仪表盘' },
  { key: 'skus', label: 'SKU库存' },
  { key: 'documents', label: '出入库单据' },
  { key: 'transfers', label: '仓库调拨' },
  { key: 'stocktakes', label: '盘点记录' },
];

export default function InventoryPage() {
  const navigate = useNavigate();

  const [warehouses] = useState(() => loadWarehouses());
  const [skus] = useState(() => loadSkus());
  const [batches, setBatches] = useState(() => loadBatches());
  const [documents, setDocuments] = useState(() => loadDocuments());
  const [transfers, setTransfers] = useState(() => loadTransfers());
  const [stocktakes, setStocktakes] = useState(() => loadStocktakes());
  const [flowLogs, setFlowLogs] = useState(() => loadFlowLogs());

  const [activeTab, setActiveTab] = useState('dashboard');
  const [keyword, setKeyword] = useState('');
  const [showWarningOnly, setShowWarningOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedSku, setSelectedSku] = useState(null);

  const [inboundOpen, setInboundOpen] = useState(false);
  const [outboundOpen, setOutboundOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [stocktakeOpen, setStocktakeOpen] = useState(false);
  const [flowLogsOpen, setFlowLogsOpen] = useState(false);

  useEffect(() => saveWarehouses(warehouses), [warehouses]);
  useEffect(() => saveSkus(skus), [skus]);
  useEffect(() => saveBatches(batches), [batches]);
  useEffect(() => saveDocuments(documents), [documents]);
  useEffect(() => saveTransfers(transfers), [transfers]);
  useEffect(() => saveStocktakes(stocktakes), [stocktakes]);
  useEffect(() => saveFlowLogs(flowLogs), [flowLogs]);

  const statistics = useMemo(
    () => getStatistics(batches, flowLogs, skus),
    [batches, flowLogs, skus]
  );

  const warningSkus = useMemo(
    () => getWarningSkus(skus, batches),
    [skus, batches]
  );

  const filteredSkus = useMemo(() => {
    return filterSkus(skus, keyword, showWarningOnly, batches);
  }, [skus, keyword, showWarningOnly, batches]);

  const pagination = useMemo(
    () => paginateList(filteredSkus, page, PAGE_SIZE),
    [filteredSkus, page]
  );

  const handleInbound = (data) => {
    const result = createInboundBatch(batches, data);
    if (!result.success) {
      alert(result.error);
      return false;
    }
    setBatches(result.updatedBatches);
    setDocuments((prev) => [result.document, ...prev]);

    const warehouseStock = getSkuStockInWarehouse(result.updatedBatches, data.skuId, data.warehouseId);
    const log = createFlowLog({
      skuId: data.skuId,
      warehouseId: data.warehouseId,
      type: FLOW_LOG_TYPES.INBOUND,
      quantityChange: data.quantity,
      balanceAfter: warehouseStock,
      refId: result.document.id,
      refType: 'document',
      batchNo: data.batchNo,
      remark: data.remark || '入库',
      operator: data.operator || '系统',
    });
    setFlowLogs((prev) => [log, ...prev]);

    return true;
  };

  const handleOutbound = (data) => {
    const result = createOutboundDocument(batches, data);
    if (!result.success) {
      alert(result.error);
      return false;
    }
    setBatches(result.updatedBatches);
    setDocuments((prev) => [result.document, ...prev]);

    const warehouseStock = getSkuStockInWarehouse(result.updatedBatches, data.skuId, data.warehouseId);
    const log = createFlowLog({
      skuId: data.skuId,
      warehouseId: data.warehouseId,
      type: FLOW_LOG_TYPES.OUTBOUND,
      quantityChange: -data.quantity,
      balanceAfter: warehouseStock,
      refId: result.document.id,
      refType: 'document',
      remark: data.remark || '出库',
      operator: data.operator || '系统',
    });
    setFlowLogs((prev) => [log, ...prev]);

    return true;
  };

  const handleTransfer = (data) => {
    const result = createTransfer(batches, data);
    if (!result.success) {
      alert(result.error);
      return false;
    }
    setBatches(result.updatedBatches);
    setTransfers((prev) => [result.transfer, ...prev]);

    const sourceStock = getSkuStockInWarehouse(result.updatedBatches, data.skuId, data.sourceWarehouseId);
    const targetStock = getSkuStockInWarehouse(result.updatedBatches, data.skuId, data.targetWarehouseId);

    const outLog = createFlowLog({
      skuId: data.skuId,
      warehouseId: data.sourceWarehouseId,
      type: FLOW_LOG_TYPES.TRANSFER_OUT,
      quantityChange: -data.quantity,
      balanceAfter: sourceStock,
      refId: result.transfer.id,
      refType: 'transfer',
      remark: `调拨至${warehouses.find((w) => w.id === data.targetWarehouseId)?.name || ''}`,
      operator: data.operator || '系统',
    });

    const inLog = createFlowLog({
      skuId: data.skuId,
      warehouseId: data.targetWarehouseId,
      type: FLOW_LOG_TYPES.TRANSFER_IN,
      quantityChange: data.quantity,
      balanceAfter: targetStock,
      refId: result.transfer.id,
      refType: 'transfer',
      remark: `从${warehouses.find((w) => w.id === data.sourceWarehouseId)?.name || ''}调拨`,
      operator: data.operator || '系统',
    });

    setFlowLogs((prev) => [inLog, outLog, ...prev]);
    return true;
  };

  const handleStocktake = (warehouseId, stocktakeItems, operator) => {
    const { stocktake, differences } = createStocktake(warehouseId, stocktakeItems, operator);

    if (differences.length > 0) {
      const applyResult = applyStocktake(batches, warehouseId, differences);
      if (applyResult.success) {
        setBatches(applyResult.updatedBatches);
        setFlowLogs((prev) => [...applyResult.flowLogs, ...prev]);
      }
    }

    setStocktakes((prev) => [stocktake, ...prev]);
    return true;
  };

  const handleViewFlowLogs = (sku) => {
    setSelectedSku(sku);
    setFlowLogsOpen(true);
  };

  const getWarehouseName = (id) => warehouses.find((w) => w.id === id)?.name || id;
  const getSkuName = (id) => skus.find((s) => s.id === id)?.name || id;

  function renderDashboard() {
    return (
      <div>
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-card-title">总SKU数</div>
            <div className="stat-card-value">{statistics.totalSkus}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">总库存量</div>
            <div className="stat-card-value">{statistics.totalStock}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">本月入库</div>
            <div className="stat-card-value positive">+{statistics.monthInbound}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">本月出库</div>
            <div className="stat-card-value negative">-{statistics.monthOutbound}</div>
          </div>
        </div>

        <StockChart
          flowLogs={flowLogs}
          skus={skus}
          warehouses={warehouses}
          batches={batches}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="chart-container">
            <h3 className="chart-title">库存预警</h3>
            {warningSkus.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <p>暂无库存预警</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU名称</th>
                    <th>当前库存</th>
                    <th>安全库存</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {warningSkus.slice(0, 5).map((sku) => {
                    const total = getSkuTotalStock(batches, sku.id);
                    const status = getStockStatus(total, sku.safetyStock);
                    return (
                      <tr key={sku.id}>
                        <td>{sku.name}</td>
                        <td>{total}</td>
                        <td>{sku.safetyStock}</td>
                        <td>
                          <span className={`stock-tag ${status}`}>
                            {STOCK_STATUS_LABELS[status]}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="chart-container">
            <h3 className="chart-title">最近单据</h3>
            {documents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <p>暂无单据记录</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>单号</th>
                    <th>类型</th>
                    <th>SKU</th>
                    <th>数量</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc.id}>
                      <td style={{ fontSize: 12 }}>{doc.id}</td>
                      <td>
                        <span className={`doc-badge ${doc.type}`}>
                          {DOCUMENT_TYPE_LABELS[doc.type]}
                        </span>
                      </td>
                      <td>{getSkuName(doc.skuId)}</td>
                      <td>{doc.quantity}</td>
                      <td style={{ fontSize: 12 }}>{formatDateTime(doc.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSkuList() {
    return (
      <div>
        <div className="toolbar">
          <div className="toolbar-left">
            <input
              className="form-input search-input"
              type="text"
              placeholder="搜索SKU名称/编码/分类..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={showWarningOnly}
                onChange={(e) => {
                  setShowWarningOnly(e.target.checked);
                  setPage(1);
                }}
              />
              仅显示预警
            </label>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={() => setInboundOpen(true)}>
              + 入库
            </button>
            <button className="btn btn-warning" onClick={() => setOutboundOpen(true)}>
              - 出库
            </button>
            <button className="btn" onClick={() => setTransferOpen(true)}>
              调拨
            </button>
            <button className="btn" onClick={() => setStocktakeOpen(true)}>
              盘点
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>SKU编码</th>
              <th>SKU名称</th>
              <th>分类</th>
              <th>总库存</th>
              <th>安全库存</th>
              <th>库存状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((sku) => {
              const total = getSkuTotalStock(batches, sku.id);
              const status = getStockStatus(total, sku.safetyStock);
              const rowClass = status === STOCK_STATUS.DANGER ? 'row-danger' : status === STOCK_STATUS.WARNING ? 'row-warning' : '';
              return (
                <tr key={sku.id} className={rowClass}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{sku.code}</td>
                  <td>{sku.name}</td>
                  <td>{sku.category || '-'}</td>
                  <td>{total} {sku.unit}</td>
                  <td>{sku.safetyStock}</td>
                  <td>
                    <span className={`stock-tag ${status}`}>
                      {STOCK_STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-link"
                        onClick={() => handleViewFlowLogs(sku)}
                      >
                        流水
                      </button>
                      <SkuBatchesButton sku={sku} batches={batches} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredSkus.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>暂无SKU数据</p>
          </div>
        )}

        <div className="pagination">
          <div className="pagination-info">
            共 {pagination.total} 条，每页 {pagination.pageSize} 条
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => setPage(pagination.currentPage - 1)}
            >
              上一页
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${p === pagination.currentPage ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setPage(pagination.currentPage + 1)}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    );
  }

  function SkuBatchesButton({ sku, batches }) {
    const [show, setShow] = useState(false);
    const skuBatches = getSkuBatches(batches, sku.id);

    return (
      <>
        <button className="btn-link" onClick={() => setShow(true)}>
          批次
        </button>
        {show && (
          <div className="modal-overlay" onClick={() => setShow(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{sku.name} - 批次列表</h3>
                <button className="modal-close" onClick={() => setShow(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {skuBatches.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <p>暂无批次数据</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>批次号</th>
                        <th>仓库</th>
                        <th>数量</th>
                        <th>生产日期</th>
                        <th>有效期</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skuBatches.map((batch) => {
                        const status = getBatchStatus(batch);
                        return (
                          <tr key={batch.id}>
                            <td style={{ fontSize: 12 }}>{batch.batchNo}</td>
                            <td>{getWarehouseName(batch.warehouseId)}</td>
                            <td>{batch.quantity}</td>
                            <td>{batch.productionDate || '-'}</td>
                            <td>{batch.expiryDate || '-'}</td>
                            <td>
                              <span className={`batch-tag ${status}`}>
                                {BATCH_STATUS_LABELS[status]}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn" onClick={() => setShow(false)}>
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  function renderDocuments() {
    const sortedDocs = [...documents].sort((a, b) => b.createdAt - a.createdAt);
    return (
      <div>
        <div className="toolbar">
          <div className="toolbar-left">
            <h2 className="section-title">出入库单据</h2>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={() => setInboundOpen(true)}>
              + 入库单
            </button>
            <button className="btn btn-warning" onClick={() => setOutboundOpen(true)}>
              - 出库单
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>单号</th>
              <th>类型</th>
              <th>仓库</th>
              <th>SKU</th>
              <th>数量</th>
              <th>批次号</th>
              <th>操作人</th>
              <th>时间</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {sortedDocs.map((doc) => (
              <tr key={doc.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{doc.id}</td>
                <td>
                  <span className={`doc-badge ${doc.type}`}>
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                </td>
                <td>{getWarehouseName(doc.warehouseId)}</td>
                <td>{getSkuName(doc.skuId)}</td>
                <td>{doc.quantity}</td>
                <td style={{ fontSize: 12 }}>{doc.batchNo || '-'}</td>
                <td>{doc.operator || '-'}</td>
                <td style={{ fontSize: 12 }}>{formatDateTime(doc.createdAt)}</td>
                <td style={{ fontSize: 12, color: '#666' }}>{doc.remark || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <p>暂无单据记录</p>
          </div>
        )}
      </div>
    );
  }

  function renderTransfers() {
    const sortedTransfers = [...transfers].sort((a, b) => b.createdAt - a.createdAt);
    return (
      <div>
        <div className="toolbar">
          <div className="toolbar-left">
            <h2 className="section-title">仓库调拨</h2>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={() => setTransferOpen(true)}>
              + 新建调拨
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>调拨单号</th>
              <th>源仓库</th>
              <th>目标仓库</th>
              <th>SKU</th>
              <th>数量</th>
              <th>操作人</th>
              <th>时间</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransfers.map((tf) => (
              <tr key={tf.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{tf.id}</td>
                <td>{getWarehouseName(tf.sourceWarehouseId)}</td>
                <td>{getWarehouseName(tf.targetWarehouseId)}</td>
                <td>{getSkuName(tf.skuId)}</td>
                <td>{tf.quantity}</td>
                <td>{tf.operator || '-'}</td>
                <td style={{ fontSize: 12 }}>{formatDateTime(tf.createdAt)}</td>
                <td style={{ fontSize: 12, color: '#666' }}>{tf.remark || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transfers.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔄</div>
            <p>暂无调拨记录</p>
          </div>
        )}
      </div>
    );
  }

  function renderStocktakes() {
    const sortedStocktakes = [...stocktakes].sort((a, b) => b.createdAt - a.createdAt);
    return (
      <div>
        <div className="toolbar">
          <div className="toolbar-left">
            <h2 className="section-title">盘点记录</h2>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={() => setStocktakeOpen(true)}>
              + 新建盘点
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>盘点单号</th>
              <th>仓库</th>
              <th>盘点项数</th>
              <th>差异数</th>
              <th>操作人</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            {sortedStocktakes.map((stk) => (
              <tr key={stk.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{stk.id}</td>
                <td>{getWarehouseName(stk.warehouseId)}</td>
                <td>{stk.totalItems}</td>
                <td>
                  <span className={stk.diffCount > 0 ? 'diff-negative' : ''}>
                    {stk.diffCount}
                  </span>
                </td>
                <td>{stk.operator || '-'}</td>
                <td style={{ fontSize: 12 }}>{formatDateTime(stk.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stocktakes.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>暂无盘点记录</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div className="inventory-header-left">
          <button className="btn-link back-link" onClick={() => navigate('/')}>
            ← 返回首页
          </button>
          <h1 className="page-title">仓库库存管理</h1>
        </div>
      </div>

      <div className="inventory-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="inventory-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'skus' && renderSkuList()}
        {activeTab === 'documents' && renderDocuments()}
        {activeTab === 'transfers' && renderTransfers()}
        {activeTab === 'stocktakes' && renderStocktakes()}
      </div>

      <InboundModal
        isOpen={inboundOpen}
        onClose={() => setInboundOpen(false)}
        warehouses={warehouses}
        skus={skus}
        onSubmit={handleInbound}
      />

      <OutboundModal
        isOpen={outboundOpen}
        onClose={() => setOutboundOpen(false)}
        warehouses={warehouses}
        skus={skus}
        batches={batches}
        onSubmit={handleOutbound}
      />

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        warehouses={warehouses}
        skus={skus}
        batches={batches}
        onSubmit={handleTransfer}
      />

      <StocktakeModal
        isOpen={stocktakeOpen}
        onClose={() => setStocktakeOpen(false)}
        warehouses={warehouses}
        skus={skus}
        batches={batches}
        onSubmit={handleStocktake}
      />

      {flowLogsOpen && selectedSku && (
        <SkuFlowLogs
          isOpen={flowLogsOpen}
          onClose={() => {
            setFlowLogsOpen(false);
            setSelectedSku(null);
          }}
          sku={selectedSku}
          flowLogs={flowLogs}
          warehouses={warehouses}
          batches={batches}
        />
      )}
    </div>
  );
}
