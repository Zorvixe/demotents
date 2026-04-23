import React, { useState, useEffect, useRef } from 'react';
import './VideoGallery.css';

const BASE_URL = 'https://api.demotents.com';

const VideoGallery = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/videos`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setVideos(data.videos);
        setLoading(false);
      })
      .catch(err => {
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

  if (loading) return <div className="video-gallery-loading">Loading reels...</div>;
  if (videos.length === 0) return null;

  return (
    <div className="video-gallery-wrapper">
      <h2 className="video-gallery-title">Latest Reels & Videos</h2>
      <div className="video-scroll-container" ref={scrollRef}>
        {videos.map(video => (
          <div key={video.id} className="video-card-horizontal" onClick={() => openModal(video)}>
            <video
              src={video.video_url}
              poster={video.thumbnail_url || undefined}
              className="video-thumb"
              muted
              preload="metadata"
            />
            <div className="video-card-overlay">
              <span className="play-icon">▶</span>
            </div>
            <div className="video-card-caption">
              <h4>{video.title}</h4>
              <p>{video.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedVideo && (
        <div className="video-modal" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={closeModal}>&times;</span>
            <video
              src={selectedVideo.video_url}
              controls
              autoPlay
              className="modal-video-player"
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