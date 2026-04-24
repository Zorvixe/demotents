import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './VideoList.css';

const API_BASE_URL = 'https://api.demotents.com';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Add video modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  // Edit video modal states
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDisplayOrder, setEditDisplayOrder] = useState(0);
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editPreview, setEditPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Action Menu state
  const [activeDropdown, setActiveDropdown] = useState(null);

  const getVideoUrl = (relativeUrl) => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;
    const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.slice(1) : relativeUrl;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/videos`);
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

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (editPreview) URL.revokeObjectURL(editPreview);
    };
  }, [preview, editPreview]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const resetAddForm = () => {
    if (preview) URL.revokeObjectURL(preview);
    setTitle('');
    setDescription('');
    setDisplayOrder(0);
    setVideoFile(null);
    setThumbnailUrl('');
    setPreview(null);
  };

  const resetEditForm = () => {
    if (editPreview) URL.revokeObjectURL(editPreview);
    setEditingVideo(null);
    setEditTitle('');
    setEditDescription('');
    setEditDisplayOrder(0);
    setEditVideoFile(null);
    setEditThumbnailUrl('');
    setEditPreview(null);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (preview) URL.revokeObjectURL(preview);
      setVideoFile(file);
      setPreview(URL.createObjectURL(file));
      if (!title) {
        setTitle(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleEditVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (editPreview) URL.revokeObjectURL(editPreview);
      setEditVideoFile(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleAddVideoSubmit = async (e) => {
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

    setUploadLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/videos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Video uploaded successfully!');
        resetAddForm();
        setShowAddModal(false);
        fetchVideos();
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('description', editDescription);
    formData.append('display_order', editDisplayOrder);
    if (editThumbnailUrl) formData.append('thumbnail_url', editThumbnailUrl);
    if (editVideoFile) formData.append('video', editVideoFile);

    setEditLoading(true);
    try {
      const res = await axios.put(`${API_BASE_URL}/api/videos/${editingVideo.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Video updated successfully!');
        resetEditForm();
        fetchVideos();
      } else {
        toast.error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video permanently? This action cannot be undone.')) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/videos/${id}`);
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
      const res = await axios.put(`${API_BASE_URL}/api/videos/${id}`, { is_active: !currentActive });
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

  const openAddModal = () => {
    setEditingVideo(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    resetAddForm();
    setShowAddModal(false);
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || '');
    setEditDisplayOrder(video.display_order);
    setEditThumbnailUrl(video.thumbnail_url || '');
    setEditVideoFile(null);
    setEditPreview(null);
  };

  const closeEditModal = () => {
    resetEditForm();
  };

  const handleDropdownToggle = (videoId) => {
    setActiveDropdown(activeDropdown === videoId ? null : videoId);
  };

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="yt-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="yt-header">
        <h2>Channel content</h2>
        <button onClick={openAddModal} className="yt-create-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2zm3-7H3v12h14v-6.39l4 1.83V8.56l-4 1.83V6m2-2v16H1V4h18z"></path></svg>
          CREATE
        </button>
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
              <th className="col-actions"></th>
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
                    <div className="video-thumbnail" onClick={() => setSelectedVideo(video)} style={{ cursor: 'pointer' }}>
                      <video
                        src={getVideoUrl(video.video_url)}
                        className="mini-player"
                        muted
                        preload="metadata"
                        onError={(e) => {
                          console.error(`Failed to load video preview: ${video.video_url}`);
                          e.target.style.display = 'none';
                        }}
                      />
                      <span className="duration-badge">HD</span>
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
                  <div className="action-menu-container" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={`kebab-btn ${activeDropdown === video.id ? 'active' : ''}`}
                      onClick={() => handleDropdownToggle(video.id)}
                      title="Options"
                    >
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>

                    {activeDropdown === video.id && (
                      <div className="action-dropdown">
                        <button
                          onClick={() => { openEditModal(video); setActiveDropdown(null); }}
                          className="dropdown-item dropdown-edit"
                        >
                          Edit video details
                        </button>
                        <button
                          onClick={() => { toggleActive(video.id, video.is_active); setActiveDropdown(null); }}
                          className={`dropdown-item ${video.is_active ? 'dropdown-hide' : 'dropdown-publish'}`}
                        >
                          {video.is_active ? 'Make Private' : 'Publish Video'}
                        </button>
                        <button
                          onClick={() => { handleDelete(video.id); setActiveDropdown(null); }}
                          className="dropdown-item dropdown-delete"
                        >
                          Delete permanently
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Video Modal */}
      {selectedVideo && (
        <div className="video-modal-overlay" onClick={() => setSelectedVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedVideo(null)}>
              ✕
            </button>
            <video
              src={getVideoUrl(selectedVideo.video_url)}
              controls
              autoPlay
              className="modal-video-player"
              onError={(e) => {
                toast.error('Video failed to load. Please check the file.');
                console.error(`Modal video error: ${selectedVideo.video_url}`);
              }}
            />
            <h3 className="modal-title">{selectedVideo.title}</h3>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="add-modal-overlay" onClick={closeAddModal}>
          <div className="add-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="yt-upload-container">
              <div className="yt-upload-header">
                <h2>Video Upload</h2>
                <button className="modal-close-btn add-modal-close" onClick={closeAddModal}>✕</button>
              </div>
              <form onSubmit={handleAddVideoSubmit}>
                <div className="yt-upload-body">
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
                        <input type="file" accept="video/*" onChange={handleVideoChange} hidden required={!videoFile} />
                      </label>
                      <p className="file-name">{videoFile ? videoFile.name : 'MP4, WebM, or MOV'}</p>
                    </div>
                  </div>
                </div>
                <div className="yt-upload-footer">
                  <button type="button" onClick={closeAddModal} className="yt-btn-cancel">Cancel</button>
                  <button type="submit" disabled={uploadLoading} className="yt-btn-save">
                    {uploadLoading ? "Loading..." : 'SAVE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="add-modal-overlay" onClick={closeEditModal}>
          <div className="add-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="yt-upload-container">
              <div className="yt-upload-header">
                <h2>Edit Video</h2>
                <button className="modal-close-btn add-modal-close" onClick={closeEditModal}>✕</button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="yt-upload-body">
                  <div className="yt-upload-left">
                    <div className="yt-input-group">
                      <div className="yt-input-wrapper">
                        <label>Title (required)</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Add a title that describes your video"
                          required
                        />
                      </div>
                      <span className="char-count">{editTitle.length}/100</span>
                    </div>
                    <div className="yt-input-group">
                      <div className="yt-input-wrapper">
                        <label>Description</label>
                        <textarea
                          rows="5"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Tell viewers about your video"
                        ></textarea>
                      </div>
                      <span className="char-count">{editDescription.length}/5000</span>
                    </div>
                    <div className="yt-input-row">
                      <div className="yt-input-group half">
                        <div className="yt-input-wrapper">
                          <label>Display Order</label>
                          <input
                            type="number"
                            value={editDisplayOrder}
                            onChange={(e) => setEditDisplayOrder(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="yt-input-group half">
                        <div className="yt-input-wrapper">
                          <label>Thumbnail URL</label>
                          <input
                            type="text"
                            value={editThumbnailUrl}
                            onChange={(e) => setEditThumbnailUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="yt-upload-right">
                    <div className="video-preview-box">
                      {editPreview ? (
                        <video src={editPreview} controls className="preview-player" />
                      ) : editingVideo.video_url ? (
                        <video src={getVideoUrl(editingVideo.video_url)} controls className="preview-player" />
                      ) : (
                        <div className="empty-preview">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="#909090"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
                          <p>Current video</p>
                        </div>
                      )}
                    </div>
                    <div className="file-upload-wrapper">
                      <label className="yt-file-upload-btn">
                        REPLACE VIDEO (optional)
                        <input type="file" accept="video/*" onChange={handleEditVideoChange} hidden />
                      </label>
                      <p className="file-name">{editVideoFile ? editVideoFile.name : 'Leave empty to keep current video'}</p>
                    </div>
                  </div>
                </div>
                <div className="yt-upload-footer">
                  <button type="button" onClick={closeEditModal} className="yt-btn-cancel">Cancel</button>
                  <button type="submit" disabled={editLoading} className="yt-btn-save">
                    {editLoading ? "Updating..." : 'UPDATE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoList;