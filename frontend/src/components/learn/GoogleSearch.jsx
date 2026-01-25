// src/components/learn/GoogleSearch.jsx
import React, { useState } from 'react';

function GoogleSearch({ transcript, contentTitle }) {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleGoogleSearch = async () => {
    setIsSearching(true);

    try {
      // TODO: 백엔드 API 구현 필요
      // 임시로 Google 검색 URL 생성
      const searchQuery = encodeURIComponent(contentTitle || '강의 내용');
      const googleUrl = `https://www.google.com/search?q=${searchQuery}`;

      // 임시 결과
      const tempResults = [
        {
          title: 'AI가 음성 녹음을 분석하여 관련 내용 검색 후 참고 가능한 링크 표시',
          url: googleUrl,
          snippet: '검색 결과 미리보기...'
        }
      ];

      setSearchResults(tempResults);

    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="google-search-section">
      <div className="search-header">
        <h3>관련된 내용 찾아보기 쉽게 자동적으로 googling 해주는 곳</h3>
        <button
          className="search-button"
          onClick={handleGoogleSearch}
          disabled={isSearching}
        >
          {isSearching ? '검색 중...' : '🔍 검색하기'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          <p className="search-result-text">
            AI가 음성 녹음을 분석하여 관련 내용 검색 후 참고 가능한 링크 표시
          </p>
          {searchResults.map((result, index) => (
            <a
              key={index}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="search-result-item"
            >
              <h4>{result.title}</h4>
              <p className="result-snippet">{result.snippet}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default GoogleSearch;