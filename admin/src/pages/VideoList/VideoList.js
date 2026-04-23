import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './VideoList.css';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVideo, setSelectedVideo] = useState(null);

  const fetchVideos = async () => {
    try {
      // ✅ FIXED: Use admin endpoint to show all videos (active + inactive)
      const res = await axios.get('/api/admin/videos');
      if (res.data.success) setVideos(res.data.videos);
      else toast.error('Failed to load videos');
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video permanently? This action cannot be undone.')) return;
    try {
      const res = await axios.delete(`/api/videos/${id}`);
      if (res.data.success) {
        toast.success('Video deleted');
        fetchVideos();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const toggleActive = async (id, currentActive) => {
    try {
      const res = await axios.put(`/api/videos/${id}`, { is_active: !currentActive });
      if (res.data.success) {
        toast.success(`Video ${!currentActive ? 'published' : 'made private'}`);
        fetchVideos();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="yt-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="yt-header">
        <h2>Channel content</h2>
        <Link to="/add-video" className="yt-create-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2zm3-7H3v12h14v-6.39l4 1.83V8.56l-4 1.83V6m2-2v16H1V4h18z"></path></svg>
          CREATE
        </Link>
      </div>

      <div className="yt-tabs">
        <div className="yt-tab active">Videos</div>
      </div>

      <div className="yt-table-container">
        <table className="yt-table">
          <thead>
            <tr>
              <th className="col-video">Video</th>
              <th className="col-visibility">Visibility</th>
              <th className="col-order">Display Order</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 && (
              <tr>
                <td colSpan="4" className="yt-empty-state">No videos uploaded yet.</td>
              </tr>
            )}
            {videos.map((video) => (
              <tr key={video.id} className="yt-row">
                <td className="col-video">
                  <div className="video-cell-content">
                    <div className="video-thumbnail">
                      <video
                        src={video.video_url}
                        className="mini-player"
                        onClick={() => setSelectedVideo(video)}
                      />                      <span className="duration-badge">HD</span>
                    </div>
                    <div className="video-details">
                      <h4 className="video-title" title={video.title}>{video.title}</h4>
                      <p className="video-desc" title={video.description}>
                        {video.description || 'Add description'}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="col-visibility">
                  <div className={`visibility-badge ${video.is_active ? 'public' : 'private'}`}>
                    {video.is_active ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg> Public</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" /></svg> Private</>
                    )}
                  </div>
                </td>

                <td className="col-order">
                  <span className="order-number">{video.display_order}</span>
                </td>

                <td className="col-actions">
                  <div className="action-buttons">
                    <button
                      onClick={() => toggleActive(video.id, video.is_active)}
                      className={`btn-icon ${video.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                      title={video.is_active ? "Make Private" : "Make Public"}
                    >
                      {video.is_active ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="btn-icon btn-delete"
                      title="Delete permanently"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div
            className="video-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setSelectedVideo(null)}
            >
              ✕
            </button>

            <video
              src={selectedVideo.video_url}
              controls
              autoPlay
              className="modal-video-player"
            />

            <h3 className="modal-title">{selectedVideo.title}</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;