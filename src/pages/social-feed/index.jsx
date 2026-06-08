import { useState, useEffect, useRef } from 'react'
import './social-feed.css'
import { SORT_OPTIONS, FEED_TABS, PAGE_SIZE, CURRENT_USER } from './constants'
import {
  loadPosts,
  savePosts,
  loadFollows,
  saveFollows,
  loadLikes,
  saveLikes,
  createPost,
  addPost,
  getFeedPosts,
  paginatePosts,
  isLiked,
  toggleLike,
  isFollowing,
  toggleFollow,
  createRepost,
  addComment,
} from './utils'
import PostComposer from './PostComposer'
import FeedCard from './FeedCard'
import PostDetail from './PostDetail'
import ImageLightbox from './ImageLightbox'

export default function SocialFeedPage() {
  const [posts, setPosts] = useState(() => loadPosts())
  const [follows, setFollows] = useState(() => loadFollows())
  const [likes, setLikes] = useState(() => loadLikes())

  const [activeTab, setActiveTab] = useState(FEED_TABS.ALL)
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.NEWEST)
  const [page, setPage] = useState(1)

  const [detailPost, setDetailPost] = useState(null)
  const [lightboxState, setLightboxState] = useState(null)

  const loadMoreRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    savePosts(posts)
  }, [posts])

  useEffect(() => {
    saveFollows(follows)
  }, [follows])

  useEffect(() => {
    saveLikes(likes)
  }, [likes])

  const filteredPosts = getFeedPosts(posts, {
    tab: activeTab,
    sortBy,
    followingIds: follows,
  })

  const pagination = paginatePosts(filteredPosts, page, PAGE_SIZE)
  const visiblePosts = pagination.items

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasMore) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [pagination.hasMore])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleSortChange = (sort) => {
    setSortBy(sort)
    setPage(1)
  }

  const handlePublish = ({ content, images }) => {
    const result = createPost({ content, images })
    if (!result.success) return
    setPosts((prev) => addPost(prev, result.post))
    setPage(1)
  }

  const handleLike = (postId) => {
    const result = toggleLike(posts, likes, postId)
    if (result.success) {
      setPosts(result.posts)
      setLikes(result.likes)
    }
  }

  const handleFollow = (userId) => {
    if (userId === CURRENT_USER.id) return
    const result = toggleFollow(follows, userId)
    if (result.success) {
      setFollows(result.follows)
    }
  }

  const handleRepost = (postId) => {
    const result = createRepost(posts, postId, '')
    if (result.success) {
      setPosts(result.posts)
      setPage(1)
    }
  }

  const handleAddComment = (postId, content, parentCommentId) => {
    const result = addComment(posts, postId, content, parentCommentId)
    if (result.success) {
      setPosts(result.posts)
    }
  }

  const handleOpenDetail = (post) => {
    setDetailPost(post)
  }

  const handleOpenRepostDetail = (postId) => {
    const post = posts.find((p) => p.id === postId)
    if (post) {
      setDetailPost(post)
    }
  }

  const handleImageClick = (images, startIndex) => {
    setLightboxState({ images, currentIndex: startIndex })
  }

  const handleLightboxClose = () => {
    setLightboxState(null)
  }

  const handleLightboxPrev = () => {
    if (!lightboxState) return
    setLightboxState((prev) => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
    }))
  }

  const handleLightboxNext = () => {
    if (!lightboxState) return
    setLightboxState((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.images.length - 1, prev.currentIndex + 1),
    }))
  }

  return (
    <div className="sf-page">
      <div className="sf-header">
        <div className="sf-tabs">
          <button
            type="button"
            className={`sf-tab ${activeTab === FEED_TABS.ALL ? 'sf-tab-active' : ''}`}
            onClick={() => handleTabChange(FEED_TABS.ALL)}
          >
            全部动态
          </button>
          <button
            type="button"
            className={`sf-tab ${activeTab === FEED_TABS.FOLLOWING ? 'sf-tab-active' : ''}`}
            onClick={() => handleTabChange(FEED_TABS.FOLLOWING)}
          >
            我的关注
          </button>
        </div>
        <div className="sf-sort-bar">
          <button
            type="button"
            className={`sf-sort-btn ${sortBy === SORT_OPTIONS.NEWEST ? 'sf-sort-active' : ''}`}
            onClick={() => handleSortChange(SORT_OPTIONS.NEWEST)}
          >
            最新
          </button>
          <button
            type="button"
            className={`sf-sort-btn ${sortBy === SORT_OPTIONS.HOTTEST ? 'sf-sort-active' : ''}`}
            onClick={() => handleSortChange(SORT_OPTIONS.HOTTEST)}
          >
            最热
          </button>
        </div>
      </div>

      <PostComposer onPublish={handlePublish} />

      <div className="sf-feed-list">
        {visiblePosts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            isLiked={isLiked(likes, post.id)}
            isFollowing={isFollowing(follows, post.userId)}
            onLike={handleLike}
            onFollow={handleFollow}
            onRepost={handleRepost}
            onAddComment={handleAddComment}
            onOpenDetail={handleOpenDetail}
            onImageClick={(index) => handleImageClick(post.images, index)}
            onOpenRepostDetail={handleOpenRepostDetail}
          />
        ))}

        {pagination.total === 0 && (
          <div className="sf-empty">
            {activeTab === FEED_TABS.FOLLOWING
              ? '还没有关注的人发布动态，去关注一些人吧~'
              : '暂无动态，快来发布第一条吧！'}
          </div>
        )}

        <div ref={loadMoreRef} className="sf-load-more">
          {pagination.hasMore ? (
            <span>加载中...</span>
          ) : pagination.total > 0 ? (
            <span>没有更多了</span>
          ) : null}
        </div>
      </div>

      {detailPost && (
        <PostDetail
          post={detailPost}
          allPosts={posts}
          onClose={() => setDetailPost(null)}
          onAddComment={handleAddComment}
          onLike={handleLike}
          onFollow={handleFollow}
          onRepost={handleRepost}
          onImageClick={(index) => handleImageClick(detailPost.images, index)}
          isLiked={isLiked(likes, detailPost.id)}
          isFollowing={isFollowing(follows, detailPost.userId)}
        />
      )}

      {lightboxState && (
        <ImageLightbox
          images={lightboxState.images}
          currentIndex={lightboxState.currentIndex}
          onClose={handleLightboxClose}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
        />
      )}
    </div>
  )
}
