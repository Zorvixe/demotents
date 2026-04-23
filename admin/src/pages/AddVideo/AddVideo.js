import React, { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';
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
      // Auto-fill title with filename if empty
      if (!title) {
        setTitle(file.name.split('.').slice(0, -1).join('.'));
      }
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
    <div className="yt-upload-page">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="yt-upload-container">
        <div className="yt-upload-header">
          <h2>Video Upload</h2>
        </div>

        <form onSubmit={handleSubmit} className="yt-upload-body">
          <div className="yt-upload-left">
            <div className="yt-input-group">
              <div className="yt-input-wrapper">
                <label>Title (required)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Add a title that describes your video"
                  required
                />
              </div>
              <span className="char-count">{title.length}/100</span>
            </div>

            <div className="yt-input-group">
              <div className="yt-input-wrapper">
                <label>Description</label>
                <textarea
                  rows="5"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your video"
                ></textarea>
              </div>
              <span className="char-count">{description.length}/5000</span>
            </div>

            <div className="yt-input-row">
              <div className="yt-input-group half">
                <div className="yt-input-wrapper">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="yt-input-group half">
                <div className="yt-input-wrapper">
                  <label>Thumbnail URL</label>
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="yt-upload-right">
            <div className="video-preview-box">
              {preview ? (
                <video src={preview} controls className="preview-player" />
              ) : (
                <div className="empty-preview">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#909090"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
                  <p>No video selected</p>
                </div>
              )}
            </div>

            <div className="file-upload-wrapper">
              <label className="yt-file-upload-btn">
                SELECT FILE
                <input type="file" accept="video/*" onChange={handleVideoChange} hidden required={!preview} />
              </label>
              <p className="file-name">{videoFile ? videoFile.name : 'MP4, WebM, or MOV'}</p>
            </div>
          </div>
        </form>

        <div className="yt-upload-footer">
          <Link to="/" className="yt-btn-cancel">Cancel</Link>
          <button onClick={handleSubmit} disabled={loading} className="yt-btn-save">
            {loading ? <div className="loader-container"><div className="spinner"></div></div> : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVideo;