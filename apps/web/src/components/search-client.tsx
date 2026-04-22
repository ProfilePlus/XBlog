"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { searchArticles } from "@/lib/public-api";
import type { ArticleSummary } from "@xblog/contracts";

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        try {
          const articles = await searchArticles(query);
          setResults(articles);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input-field"
          placeholder="Search for ideas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {isSearching && (
          <div style={{ position: "absolute", right: 0, bottom: "20px", fontSize: "0.875rem", color: "var(--color-textdim)", opacity: 0.6 }}>
            Searching...
          </div>
        )}
      </div>

      <div className="search-results-container">
        {results.length > 0 ? (
          <div className="search-results-list" key={query}>
            {results.map((article) => (
              <Link key={article.id} href={`/articles/${article.slug}`} className="search-result-item">
                <h2 className="search-result-title">{article.title}</h2>
                <div className="search-result-meta">
                  <span>{article.categoryName}</span>
                  <span className="footer-separator" style={{ opacity: 0.3 }}>•</span>
                  <span>{article.publishedAt}</span>
                  <span className="footer-separator" style={{ opacity: 0.3 }}>•</span>
                  <span>{article.readingTime}</span>
                </div>
                <p className="search-result-excerpt">{article.excerpt}</p>
              </Link>
            ))}
          </div>
        ) : query.trim() && !isSearching ? (
          <div className="search-empty-state">
            No fragments found matching your thought.
          </div>
        ) : !query.trim() ? (
          <div className="search-empty-state" style={{ opacity: 0.3 }}>
            Type to uncover the archive.
          </div>
        ) : null}
      </div>
    </div>
  );
}
