import React, { useState, useRef } from "react";
import {
  Upload,
  Play,
  Clock,
  Image,
  FileVideo,
  CheckCircle,
  Loader2,
} from "lucide-react";
import "./App.css";

// Building Meme Libraries
// Number of memes per category
const MEME_COUNT = 100;

const categories = [
  {
    name: "Sorrow",
    type: "sorrow",
    desc: "Sad or disappointed reactions",
    color: "sad",
  },
  {
    name: "Anger",
    type: "anger",
    desc: "Angry or frustrated reactions",
    color: "angry",
  },
  {
    name: "Happiness",
    type: "happiness",
    desc: "Happy or excited reactions",
    color: "happy",
  },
  {
    name: "Surprise",
    type: "surprise",
    desc: "Shocked or surprised reactions",
    color: "confused",
  },
  {
    name: "Hate",
    type: "hate",
    desc: "Negative or hateful reactions",
    color: "content",
  },
  {
    name: "Love",
    type: "love",
    desc: "Loving or affectionate reactions",
    color: "content",
  },
];

// Build library object like { anger: ["anger_1.jpg", ..., "anger_100.jpg"], ... }
const memeLibrary = categories.reduce((acc, cat) => {
  acc[cat.type] = Array.from(
    { length: MEME_COUNT },
    (_, i) => `${cat.type}_${i + 1}.jpg`
  );
  return acc;
}, {});

//

function getRandomMeme(category) {
  const memes = memeLibrary[category] || [];
  if (memes.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * memes.length);
  return `/memes/${category}/${memes[randomIndex]}`;
}

// Format file size into KB, MB, GB, etc.
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format seconds into mm:ss
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const VideoMemeAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const videoRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Check file size (2GB limit)
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      alert("File size exceeds 2GB limit. Please choose a smaller video file.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify({ mode: 1 })], { type: "application/json" })
    );
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://140.112.107.149:9090/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Raw backend response:", data);

        const transformedData = {
          file_name: data.file_name,
          analyze_time: data.analyze_time,
          analyze_mode: data.analyze_mode,
          suggestions: (data.suggestions || []).map((suggestion) => ({
            timestamp: suggestion.start,
            end_timestamp: suggestion.end,
            meme_category: suggestion.meme_type_desc,
            meme_file: getRandomMeme(suggestion.meme_type_desc),
            description: getCategoryDescription(suggestion.meme_type_desc),
            confidence: Math.random() * 0.3 + 0.7,
          })),
        };

        setResults(transformedData);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Upload failed:", errorData);
        if (errorData.error && errorData.error.includes("Payload error")) {
          alert(
            "File is too large (max 2GB). Please choose a smaller video file."
          );
        } else {
          alert("Upload failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const jumpToTimestamp = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
    }
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      sorrow: "a sad or disappointed reaction",
      anger: "an angry or frustrated reaction",
      joy: "a happy or excited reaction",
      surprise: "a shocked or surprised reaction",
      fear: "a scared or anxious reaction",
      neutral: "a neutral or thinking reaction",
    };
    return descriptions[category] || descriptions["neutral"];
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="main-title">Streameme</h1>

        {/* Upload Section */}
        <div className="upload-section">
          <div className="file-upload-area">
            <label className="file-upload-label">
              <div className="file-upload-content">
                <Upload className="upload-icon" />
                <p className="upload-text">
                  <span className="upload-text-bold">Click to upload</span> or
                  drag and drop
                </p>
                <p className="upload-subtext">MP4, AVI, MOV files supported</p>
              </div>
              <input
                type="file"
                className="file-input"
                accept="video/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="file-info">
              <div className="file-details">
                <FileVideo className="file-icon" />
                <div className="file-info-text">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`upload-button ${isUploading ? "uploading" : ""}`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="button-icon spinning" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="button-icon" />
                    Analyze Video
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Processing Complete */}
        {results && (
          <div className="success-message">
            <div className="success-content">
              <CheckCircle className="success-icon" />
              <span className="success-text">
                Processing completed! Found {results.suggestions.length} meme
                suggestions.
              </span>
            </div>
          </div>
        )}

        <div className="content-grid">
          {/* Video Player */}
          <div className="video-section">
            {videoUrl && (
              <div className="video-player-container">
                <h2 className="section-title">
                  <Play className="section-icon" />
                  Video Player
                </h2>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="video-player"
                >
                  Your browser does not support video playback.
                </video>
              </div>
            )}

            {/* AI Suggestions Timeline */}
            {results && (
              <div className="suggestions-container">
                <h2 className="section-title">
                  <Clock className="section-icon" />
                  AI Suggestions
                </h2>
                <div className="suggestions-list">
                  {results.suggestions.length > 0 ? (
                    [...results.suggestions]
                      .sort((a, b) => a.timestamp - b.timestamp) // ✅ chronological order
                      .map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => jumpToTimestamp(suggestion.timestamp)}
                          className="suggestion-item"
                        >
                          <div className="suggestion-content">
                            <div className="suggestion-left">
                              <div className="timestamp-badge">
                                {formatTime(suggestion.timestamp)} –{" "}
                                {formatTime(suggestion.end_timestamp)}
                              </div>
                              <div className="suggestion-details">
                                <div className="meme-name">
                                  {suggestion.meme_category} 
                                </div>
                                <div className="meme-description">
                                  Category: {suggestion.meme_category} –{" "}
                                  {suggestion.description}
                                </div>
                              </div>
                            </div>
                            <div className="suggestion-right">
                              <img
                                alt="suggested meme"
                                src={`${suggestion.meme_file}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p>No suggestions found.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Meme Library */}
          <div className="sidebar">
            <div className="meme-library">
              <h2 className="section-title">
                <Image className="section-icon" />
                Meme Library
              </h2>
              <div className="meme-list">
                {categories.map((cat, index) => (
                  <div key={index} className="meme-item">
                    <div className="meme-item-content">
                      <div className="meme-info">
                        <div className="meme-item-name">{cat.name}</div>
                        <div className="meme-item-desc">{cat.desc}</div>
                      </div>
                      <div className={`meme-type-badge ${cat.color}`}>
                        {cat.type}
                      </div>
                    </div>

                    {/* Thumbnail browser for each category */}
                    <div className="meme-thumbnails">
                      {memeLibrary[cat.type].slice(0, 15).map((file, idx) => (
                        <img
                          key={idx}
                          src={`/memes/${cat.type}/${file}`}
                          alt={file}
                          className="meme-thumbnail"
                        />
                      ))}
                      <span>+{memeLibrary[cat.type].length - 15} more</span>
                    </div>
                  </div>
                ))}
              </div>

              {results && (
                <div className="analysis-info">
                  <h3 className="analysis-title">Analysis Complete</h3>
                  <div className="analysis-details">
                    <div>File: {results.file_name}</div>
                    <div>Suggestions: {results.suggestions.length}</div>
                    <div>Mode: {results.analyze_mode}</div>
                    <div>
                      Analyzed:{" "}
                      {new Date(results.analyze_time).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoMemeAnalyzer;
