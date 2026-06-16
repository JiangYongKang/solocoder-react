import { useState } from 'react'
import {
  loadCoins,
  saveCoins,
  loadInventory,
  saveInventory,
  buyItem,
  ITEM_INFO,
} from './quizCore'

export default function ItemShop() {
  const [coins, setCoins] = useState(() => loadCoins())
  const [inventory, setInventory] = useState(() => loadInventory())
  const [message, setMessage] = useState('')

  const handleBuy = (itemType) => {
    const result = buyItem(coins, inventory, itemType)
    if (result.success) {
      setCoins(result.coins)
      setInventory(result.inventory)
      saveCoins(result.coins)
      saveInventory(result.inventory)
      setMessage(`成功购买 ${ITEM_INFO[itemType].name}！`)
      setTimeout(() => setMessage(''), 2000)
    } else {
      setMessage(result.message || '购买失败')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  return (
    <div className="quiz-item-shop">
      <div className="quiz-shop-header">
        <h2>道具商店</h2>
        <div className="quiz-coin-display">
          <span className="coin-icon">🪙</span>
          <span className="coin-amount">{coins}</span>
        </div>
      </div>

      {message && <div className="quiz-shop-message">{message}</div>}

      <div className="quiz-shop-grid">
        {Object.entries(ITEM_INFO).map(([key, info]) => (
          <div key={key} className="quiz-shop-item">
            <div className="quiz-shop-item-icon">{info.icon}</div>
            <div className="quiz-shop-item-name">{info.name}</div>
            <div className="quiz-shop-item-desc">{info.description}</div>
            <div className="quiz-shop-item-owned">
              已拥有：{inventory[key] || 0} 个
            </div>
            <button
              className="quiz-btn quiz-btn-primary quiz-shop-item-buy"
              onClick={() => handleBuy(key)}
              disabled={coins < info.cost}
            >
              🪙 {info.cost}
            </button>
          </div>
        ))}
      </div>

      <div className="quiz-shop-tip">
        💡 提示：每答对一题获得 5 金币，满分额外奖励 20 金币
      </div>
    </div>
  )
}
