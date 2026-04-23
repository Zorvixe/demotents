import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AddVideo.css';

const AddVideo = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('display_order', displayOrder);
    if (thumbnailUrl) formData.append('thumbnail_url', thumbnailUrl);
    formData.append('video', videoFile);

    setLoading(true);
    try {
      const res = await axios.post('/api/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Video uploaded successfully!');
        setTitle('');
        setDescription('');
        setDisplayOrder(0);
        setVideoFile(null);
        setThumbnailUrl('');
        setPreview(null);
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-video-container">
      <ToastContainer />
      <h2>Upload New Video / Reel</h2>
      <form onSubmit={handleSubmit} className="add-video-form">
        <div className="form-group">
          <label>Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>
        <div className="form-group">
          <label>Display Order (lower = earlier)</label>
          <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value))} />
        </div>
        <div className="form-group">
          <label>Thumbnail URL (optional) – external image URL</label>
          <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://example.com/thumb.jpg" />
        </div>
        <div className="form-group">
          <label>Video File * (MP4, WebM, MOV)</label>
          <input type="file" accept="video/*" onChange={handleVideoChange} required />
        </div>
        {preview && (
          <div className="video-preview">
            <video src={preview} controls width="300" />
          </div>
        )}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
};

export default AddVideo;