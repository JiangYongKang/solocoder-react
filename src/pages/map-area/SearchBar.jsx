import { useState, useRef, useEffect } from 'react';
import { searchPresets } from './mapUtils.js';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      setSuggestions(searchPresets(value));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item) => {
    setQuery(item.name);
    onSearch(item.name, item);
    setShowSuggestions(false);
  };

  return (
    <div className="map-search" ref={inputRef}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="搜索地点（餐厅、商店、景点...）"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          className="map-search-input"
        />
        <button type="submit" className="map-search-btn">搜索</button>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <div className="map-search-suggestions">
          {suggestions.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="map-search-suggestion"
              onClick={() => handleSuggestionClick(item)}
            >
              <span className="map-search-suggestion-name">{item.name}</span>
              <span className="map-search-suggestion-desc">{item.description}</span>
              <span className="map-search-suggestion-cat">{item.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
