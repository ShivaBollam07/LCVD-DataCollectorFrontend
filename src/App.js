import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const App = () => {
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [categories] = useState([
    'good tomato leaf',
    'diseased tomato leaf',
    'good chilli leaf',
    'diseased chilli leaf',
    'good groundnut leaf',
    'diseased groundnut leaf',
  ]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Memoized fetch function with error handling
  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5002/uploads', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();

      // Safely transform image data
      const formattedData = data.map((image) => {
        try {
          return {
            ...image,
            content: image.content && image.contentType 
              ? `data:${image.contentType};base64,${btoa(
                  String.fromCharCode(...new Uint8Array(image.content.data))
                )}` 
              : null
          };
        } catch (transformError) {
          console.error('Image transform error:', transformError);
          return null;
        }
      }).filter(image => image !== null);

      setImages(formattedData);
      setMessage('');
    } catch (err) {
      console.error('Fetch images error:', err);
      setMessage(`Failed to fetch images: ${err.message}`);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array to prevent unnecessary re-creations

  // Effect to fetch images on component mount
  useEffect(() => {
    fetchImages();
  }, [fetchImages]); // Empty dependency array ensures this runs only once on mount

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file || !category) {
      setMessage('Please select an image and a category');
      return;
    }

    setIsLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);

    try {
      const response = await fetch('http://localhost:5002/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Image uploaded successfully!');
        setFile(null);
        setPreviewImage(null);
        setCategory('');
        
        // Refetch images after successful upload
        await fetchImages();
      } else {
        setMessage(result.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Plant Leaf Image Upload</h1>

      <form onSubmit={handleUpload} className="upload-container">
        <div className="file-input-container">
          <label className="file-input-label">
            Choose File
            <input
              type="file"
              className="file-input"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {previewImage && (
          <div className="preview-container">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="preview-image" 
            />
          </div>
        )}

        <div className="category-select">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          className="upload-button" 
          disabled={!file || !category || isLoading}
        >
          Upload Image
        </button>

        {message && <div className="status-message">{message}</div>}
      </form>

      <div className="image-gallery">
        {isLoading ? (
          <p className="loading-message">Loading images...</p>
        ) : images.length === 0 ? (
          <p className="no-images">No images uploaded yet</p>
        ) : (
          images.map((image, index) => (
            <div key={image._id || index} className="image-card">
              <img
                src={image.content}
                alt={image.filename}
                className="uploaded-image"
              />
              <div className="image-info">
                <p><strong>Filename:</strong> {image.filename}</p>
                <p><strong>Category:</strong> {image.category}</p>
                <p><strong>Uploaded On:</strong> {new Date(image.uploadDate).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default App;
