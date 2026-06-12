export default function Pagination({ total, currentPage, totalPage, pageSize: _pageSize, onPageChange }) {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(totalPage, start + maxVisible - 1)
  start = Math.max(1, end - maxVisible + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="rm-pagination">
      <div className="rm-pagination-info">
        共 <strong>{total}</strong> 条记录，第 <strong>{currentPage}</strong> / {totalPage} 页
      </div>
      <div className="rm-pagination-controls">
        <button
          className="rm-page-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
        >
          首页
        </button>
        <button
          className="rm-page-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          上一页
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`rm-page-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="rm-page-btn"
          disabled={currentPage === totalPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一页
        </button>
        <button
          className="rm-page-btn"
          disabled={currentPage === totalPage}
          onClick={() => onPageChange(totalPage)}
        >
          末页
        </button>
      </div>
    </div>
  )
}
