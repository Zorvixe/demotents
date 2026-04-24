import React, { useState, useEffect, useRef } from 'react';
import './VideoGallery.css';

// Use same base URL as your API
const BASE_URL = 'https://api.demotents.com';

const VideoGallery = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const scrollRef = useRef(null);

  // Helper: full video URL
  const getVideoUrl = (relativeUrl) => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;
    return `${BASE_URL}/${cleanPath}`;
  };

  useEffect(() => {
    fetch(`${BASE_URL}/api/videos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVideos(data.videos);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Video fetch error:', err);
        setLoading(false);
      });
  }, []);

  const openModal = (video) => {
    setSelectedVideo(video);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedVideo(null);
    document.body.style.overflow = 'auto';
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="video-gallery-loading">Loading videos...</div>;
  if (videos.length === 0) return null;

  // Split videos: First 2 for the top row, the rest for the bottom scrollable row
  const topVideos = videos.slice(0, 2);
  const bottomVideos = videos.slice(2);

  // Reusable Video Card Renderer
  const renderVideoCard = (video, isLarge) => (
    <div
      key={video.id}
      className={`video-card ${isLarge ? 'large' : 'small'}`}
      onClick={() => openModal(video)}
    >
      <video
        src={getVideoUrl(video.video_url)}
        poster={video.thumbnail_url || undefined}
        className="video-thumb"
        muted
        preload="metadata"
        onError={(e) => {
          e.target.style.backgroundColor = '#1a1a1a';
        }}
      />
      
      {/* Dark Overlay for Text Visibility */}
      <div className="card-gradient-overlay"></div>

      {/* Text Info (Title & Desc mapping to Name & Details) */}
      <div className="card-info">
        <h3 className="student-name">{video.title}</h3>
        <p className="student-desc">{video.description}</p>
      </div>

      {/* Play Button */}
      <div className="play-button">
        <span>▶</span>
      </div>
    </div>
  );

  return (
    <div className="video-gallery-wrapper">
      <div className="gallery-header">
        <h2 className="video-gallery-title">
          Handpicked for You <span className="tooltip-icon">?</span>
        </h2>
      </div>

      {/* Top 2 Featured Videos */}
      <div className="featured-videos-grid">
        {topVideos.map((video) => renderVideoCard(video, true))}
      </div>

      {/* Remaining Videos (Scrollable Row) */}
      {bottomVideos.length > 0 && (
        <div className="scrollable-videos-container">
          <div className="video-scroll-track" ref={scrollRef}>
            {bottomVideos.map((video) => renderVideoCard(video, false))}
          </div>
          
          {/* Scroll Navigation Buttons */}
          <div className="scroll-navigation">
            <button className="nav-btn" onClick={scrollLeft}>&lt;</button>
            <button className="nav-btn" onClick={scrollRight}>&gt;</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedVideo && (
        <div className="video-modal" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closeModal}>
              &times;
            </span>
            <video
              src={getVideoUrl(selectedVideo.video_url)}
              controls
              autoPlay
              className="modal-video-player"
              onError={(e) => {
                alert('Sorry, this video could not be played.');
              }}
            />
            <div className="modal-info">
              <h3>{selectedVideo.title}</h3>
              <p>{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGallery;