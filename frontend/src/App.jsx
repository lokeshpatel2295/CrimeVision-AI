import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = 'https://crimevision-ai-1.onrender.com'

function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  /*
   * Create image preview whenever a new file is selected.
   * Revoke the previous object URL to avoid memory leaks.
   */
  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  /*
   * Validate and accept an evidence image (used by file picker and drag & drop).
   */
  const selectFile = (selectedFile) => {
    if (!selectedFile) {
      return
    }

    // Only allow image files
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      setFile(null)
      setResult(null)
      return
    }

    setFile(selectedFile)
    setResult(null)
    setError('')
  }

  /*
   * Handle evidence image selection.
   */
  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0])
  }

  /*
   * Handle drag & drop of an evidence image.
   */
  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)

    if (uploading) {
      return
    }

    selectFile(event.dataTransfer.files?.[0])
  }

  /*
   * Upload image and request analysis.
   */
  const handleUpload = async () => {
    if (!file) {
      setError('Please select an evidence image first.')
      return
    }

    setUploading(true)
    setError('')
    setResult(null)

    try {
      // ==========================================
      // STEP 1: Upload evidence
      // ==========================================

      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch(
        `${API_BASE_URL}/api/evidence/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      let uploadData = {}

      try {
        uploadData = await uploadResponse.json()
      } catch {
        uploadData = {}
      }

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message || 'Evidence upload failed.'
        )
      }

      if (!uploadData.filename) {
        throw new Error(
          'Upload completed, but the backend did not return a filename.'
        )
      }

      // ==========================================
      // STEP 2: Analyze uploaded evidence
      // ==========================================

      const analysisResponse = await fetch(
        `${API_BASE_URL}/api/analysis/${encodeURIComponent(
          uploadData.filename
        )}`
      )

      let analysisData = {}

      try {
        analysisData = await analysisResponse.json()
      } catch {
        analysisData = {}
      }

      if (!analysisResponse.ok) {
        throw new Error(
          analysisData.message || 'Evidence analysis failed.'
        )
      }

      // Backend may return { status: "error", message: "..." }
      if (analysisData.status === 'error') {
        throw new Error(
          analysisData.message || 'Evidence analysis failed.'
        )
      }

      setResult(analysisData)
    } catch (err) {
      console.error('CrimeVision-AI error:', err)

      setError(
        err.message ||
          'Could not connect to the CrimeVision-AI backend. Make sure Flask is running on port 5000.'
      )
    } finally {
      setUploading(false)
    }
  }

  /*
   * Extract analysis sections safely.
   */
  const analysis = result?.analysis
  const quality = analysis?.quality
  const exif = analysis?.exif

  const brightnessPercent =
    quality?.brightness != null
      ? Math.min(100, Math.max(0, (quality.brightness / 255) * 100))
      : 0

  const fileInfo = [
    ['Filename', analysis?.filename || file?.name || 'N/A'],
    ['Format', analysis?.format || 'N/A'],
    [
      'File size',
      analysis?.file_size_kb != null ? `${analysis.file_size_kb} KB` : 'N/A',
    ],
    [
      'Dimensions',
      analysis?.width != null && analysis?.height != null
        ? `${analysis.width} × ${analysis.height} px`
        : 'N/A',
    ],
    ['Color mode', analysis?.color_mode || 'N/A'],
    ['Aspect ratio', analysis?.aspect_ratio ?? 'N/A'],
  ]

  const exifInfo = exif
    ? [
        ['Camera make', exif.camera_make || 'Not available'],
        ['Camera model', exif.camera_model || 'Not available'],
        ['Date taken', exif.date_taken || 'Not available'],
        ['Software', exif.software || 'Not available'],
      ]
    : []

  return (
    <div className="app">
      {/* ===================== TOP BAR ===================== */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i></i>
            <i></i>
          </span>
          <div className="brand-text">
            <strong>CrimeVision-AI</strong>
            <span>Evidence Intelligence System</span>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          System online
        </div>
      </header>

      <main>
        {/* ===================== INTAKE ===================== */}
        <section className="intake">
          <div className="intake-copy">
            <h1>
              Analyze evidence.
              <br />
              Reveal the details.
            </h1>

            <p className="lede">
              Upload a crime-scene image and CrimeVision-AI reads its file
              data, camera metadata, brightness and sharpness in seconds.
            </p>

            <dl className="reads">
              <div>
                <dt>File details</dt>
                <dd>Format, size, dimensions, color mode</dd>
              </div>
              <div>
                <dt>Image quality</dt>
                <dd>Brightness and sharpness measurements</dd>
              </div>
              <div>
                <dt>EXIF metadata</dt>
                <dd>Camera, date taken and editing software</dd>
              </div>
            </dl>
          </div>

          {/* Light table: drop zone + preview */}
          <div className="intake-panel">
            <label
              className={
                'lighttable' +
                (dragging ? ' is-dragging' : '') +
                (uploading ? ' is-scanning' : '') +
                (previewUrl ? ' has-image' : '')
              }
              onDragOver={(e) => {
                e.preventDefault()
                if (!uploading) setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />

              <span className="ruler ruler-x" aria-hidden="true"></span>
              <span className="ruler ruler-y" aria-hidden="true"></span>
              <span className="corner c-tl" aria-hidden="true"></span>
              <span className="corner c-tr" aria-hidden="true"></span>
              <span className="corner c-bl" aria-hidden="true"></span>
              <span className="corner c-br" aria-hidden="true"></span>

              {previewUrl ? (
                <img src={previewUrl} alt="Selected evidence" />
              ) : (
                <span className="drop-hint">
                  <span className="drop-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="28" height="28">
                      <path
                        d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <strong>Drop an evidence image here</strong>
                  <span>or click to browse your files</span>
                </span>
              )}

              {uploading && <span className="scanline" aria-hidden="true"></span>}
            </label>

            <div className="intake-actions">
              <div className="file-chip" title={file?.name || ''}>
                {file ? (
                  <>
                    <span>Selected</span>
                    <strong>{file.name}</strong>
                  </>
                ) : (
                  <span>No image selected</span>
                )}
              </div>

              <button
                className="analyze-button"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? 'Analyzing…' : 'Analyze evidence'}
              </button>
            </div>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* ===================== REPORT ===================== */}
        {result && analysis && (
          <section className="report">
            <div className="report-head">
              <div>
                <h2>Evidence report</h2>
                <p>Automated technical analysis of the uploaded image.</p>
              </div>

              <div className="analysis-status">
                <span className="success-check" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <strong>Analysis successful</strong>
                  <span>Evidence image processed.</span>
                </div>
              </div>
            </div>

            {/* Exhibit + file info */}
            <div className="exhibit">
              <figure className="exhibit-image">
                <span className="tag" aria-hidden="true">
                  A
                </span>
                <div className="preview-box">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Uploaded evidence" />
                  ) : (
                    <p>Preview unavailable</p>
                  )}
                </div>
                <figcaption>Evidence preview</figcaption>
              </figure>

              <div className="exhibit-data">
                <h3>File information</h3>
                <dl className="data-table">
                  {fileInfo.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Image properties */}
            <div className="block">
              <h3>Image properties</h3>
              <div className="figures">
                <div className="figure">
                  <strong>
                    {analysis.width ?? 'N/A'}
                    <small> px</small>
                  </strong>
                  <span>Width</span>
                </div>
                <div className="figure">
                  <strong>
                    {analysis.height ?? 'N/A'}
                    <small> px</small>
                  </strong>
                  <span>Height</span>
                </div>
                <div className="figure">
                  <strong>{analysis.aspect_ratio ?? 'N/A'}</strong>
                  <span>Aspect ratio</span>
                </div>
                <div className="figure">
                  <strong>{analysis.color_mode || 'N/A'}</strong>
                  <span>Color mode</span>
                </div>
              </div>
            </div>

            {/* Quality */}
            {quality && (
              <div className="block">
                <h3>Image quality</h3>
                <div className="quality">
                  <div className="quality-item">
                    <div className="quality-top">
                      <span>Brightness</span>
                      <strong>{quality.brightness ?? 'N/A'}</strong>
                    </div>
                    <div
                      className="gauge"
                      role="img"
                      aria-label={`Brightness ${quality.brightness} out of 255`}
                    >
                      <span style={{ width: `${brightnessPercent}%` }}></span>
                    </div>
                    <small>Average brightness, scale 0 (dark) to 255 (bright)</small>
                  </div>

                  <div className="quality-item">
                    <div className="quality-top">
                      <span>Sharpness</span>
                      <strong>{quality.sharpness ?? 'N/A'}</strong>
                    </div>
                    <small>
                      Edge detail measurement. Higher values mean a sharper
                      image.
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* EXIF */}
            {exif && (
              <div className="block">
                <h3>EXIF metadata</h3>
                <dl className="data-table data-table-wide">
                  {exifInfo.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>
        )}
      </main>

      <footer>
        <strong>CrimeVision-AI</strong>
        <span>AI-assisted digital evidence analysis</span>
      </footer>
    </div>
  )
}

export default App