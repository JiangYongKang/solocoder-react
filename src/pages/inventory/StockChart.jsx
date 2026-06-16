import { useState, useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { buildStockHistory, buildStockHistoryByWarehouse, buildStockHistoryBySku } from './utils.js';
import { CHART_DAYS } from './constants.js';

export default function StockChart({ flowLogs, skus, warehouses, batches }) {
  const [viewType, setViewType] = useState('total');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedSku, setSelectedSku] = useState('all');

  const chartData = useMemo(() => {
    if (viewType === 'total') {
      const history = buildStockHistory(flowLogs, batches, CHART_DAYS);
      return history.map((item) => ({
        date: item.date.slice(5),
        库存总量: item.totalStock,
        入库量: item.inbound,
        出库量: item.outbound,
      }));
    }

    if (viewType === 'warehouse') {
      if (selectedWarehouse === 'all') {
        const history = buildStockHistory(flowLogs, batches, CHART_DAYS);
        return history.map((item) => ({
          date: item.date.slice(5),
          库存总量: item.totalStock,
        }));
      }
      const whHistory = buildStockHistoryByWarehouse(flowLogs, selectedWarehouse, batches, CHART_DAYS);
      return whHistory.map((item) => ({
        date: item.date.slice(5),
        仓库库存: item.totalStock,
      }));
    }

    if (viewType === 'sku') {
      if (selectedSku === 'all') {
        const history = buildStockHistory(flowLogs, batches, CHART_DAYS);
        return history.map((item) => ({
          date: item.date.slice(5),
          库存总量: item.totalStock,
        }));
      }
      const skuHistory = buildStockHistoryBySku(flowLogs, selectedSku, batches, CHART_DAYS);
      return skuHistory.map((item) => ({
        date: item.date.slice(5),
        SKU库存: item.totalStock,
      }));
    }

    return [];
  }, [viewType, selectedWarehouse, selectedSku, flowLogs, batches]);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">库存趋势 ({CHART_DAYS}天)</h3>
        <div className="chart-controls">
          <select
            className="form-select"
            value={viewType}
            onChange={(e) => {
              setViewType(e.target.value);
              setSelectedWarehouse('all');
              setSelectedSku('all');
            }}
            style={{ padding: '6px 10px', fontSize: 13, border: '1px solid #d9d9d9', borderRadius: 4 }}
          >
            <option value="total">总览</option>
            <option value="warehouse">按仓库</option>
            <option value="sku">按SKU</option>
          </select>

          {viewType === 'warehouse' && (
            <select
              className="form-select"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 13, border: '1px solid #d9d9d9', borderRadius: 4 }}
            >
              <option value="all">全部仓库</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          )}

          {viewType === 'sku' && (
            <select
              className="form-select"
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 13, border: '1px solid #d9d9d9', borderRadius: 4 }}
            >
              <option value="all">全部SKU</option>
              {skus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#ccc" />
            <YAxis tick={{ fontSize: 12 }} stroke="#ccc" />
            <Tooltip
              contentStyle={{
                borderRadius: 4,
                border: '1px solid #e8e8e8',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            {viewType === 'total' && (
              <>
                <Area
                  type="monotone"
                  dataKey="库存总量"
                  stroke="#1890ff"
                  fill="url(#colorStock)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="入库量"
                  stroke="#52c41a"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="出库量"
                  stroke="#ff4d4f"
                  strokeWidth={2}
                  dot={false}
                />
              </>
            )}
            {viewType === 'warehouse' && (
              <Area
                type="monotone"
                dataKey={selectedWarehouse === 'all' ? '库存总量' : '仓库库存'}
                stroke="#1890ff"
                fill="url(#colorStock)"
                strokeWidth={2}
              />
            )}
            {viewType === 'sku' && (
              <Area
                type="monotone"
                dataKey={selectedSku === 'all' ? '库存总量' : 'SKU库存'}
                stroke="#722ed1"
                fillOpacity={0.3}
                fill="#722ed1"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
