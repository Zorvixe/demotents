import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './VideoList.css';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/api/videos');
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

  const handleDelete = async (id, videoUrl) => {
    if (!window.confirm('Delete this video permanently?')) return;
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
        toast.success(`Video ${!currentActive ? 'activated' : 'deactivated'}`);
        fetchVideos();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) return <div className="loader">Loading videos...</div>;

  return (
    <div className="video-list-container">
      <ToastContainer />
      <h2>Manage Videos / Reels</h2>
      <Link to="/add-video" className="upload-new-btn">+ Upload New Video</Link>
      <div className="video-grid">
        {videos.length === 0 && <p>No videos uploaded yet.</p>}
        {videos.map((video) => (
          <div key={video.id} className="video-card">
            <video src={video.video_url} controls width="100%" height="180" />
            <div className="video-info">
              <h3>{video.title}</h3>
              <p>{video.description}</p>
              <p className="order">Order: {video.display_order}</p>
              <div className="video-actions">
                <button onClick={() => toggleActive(video.id, video.is_active)} className={video.is_active ? 'deactivate' : 'activate'}>
                  {video.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(video.id)} className="delete">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoList;