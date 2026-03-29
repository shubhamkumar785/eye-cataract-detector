import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCcw, ScanSearch, Trash2, UploadCloud } from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";


const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to preview the selected image."));
    reader.readAsDataURL(file);
  });


function UploadCard({ loading, onAnalyze, resetKey }) {
  const [mode, setMode] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [source, setSource] = useState("upload");
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl("");
    setSource("upload");
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setCameraStarting(false);
  }, []);

  const prepareFile = useCallback(async (file, nextSource) => {
    const preview = await readFileAsDataUrl(file);
    setSelectedFile(file);
    setPreviewUrl(preview);
    setSource(nextSource);
  }, []);

  useEffect(() => {
    clearSelection();
    stopCamera();
    setMode("upload");
  }, [clearSelection, resetKey, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles?.[0];

      if (!file) {
        toast.error("Please choose a JPG or PNG eye image.");
        return;
      }

      try {
        await prepareFile(file, "upload");
      } catch (error) {
        toast.error(error.message);
      }
    },
    [prepareFile],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    noClick: true,
    multiple: false,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
    },
  });

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("This browser does not support webcam capture.");
      return;
    }

    setCameraStarting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
    } catch (error) {
      toast.error("Unable to access the webcam. Check browser permissions and try again.");
    } finally {
      setCameraStarting(false);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera is not ready yet.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));

    if (!blob) {
      toast.error("Could not capture the webcam image.");
      return;
    }

    const file = new File([blob], `webcam-scan-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    try {
      await prepareFile(file, "webcam");
      stopCamera();
      toast.success("Webcam snapshot captured.");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      toast.error("Upload or capture an image before analysis.");
      return;
    }

    onAnalyze({
      file: selectedFile,
      previewUrl,
      source,
    });
  };

  return (
    <section className="section-shell" id="new-scan">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="hero-badge mb-3">Step 1: Upload or capture an eye image</p>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            New Cataract Scan
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Use a slit-lamp, fundus, or anterior segment image. The app sends it to the Flask
            model API and stores the prediction in report history automatically.
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
          {[
            { value: "upload", label: "Upload" },
            { value: "webcam", label: "Webcam" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setMode(option.value);
                if (option.value !== "webcam") {
                  stopCamera();
                }
              }}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                mode === option.value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {mode === "upload" ? (
            <div
              {...getRootProps()}
              className={`grid min-h-[280px] place-items-center rounded-[28px] border-2 border-dashed p-8 text-center transition ${
                isDragActive
                  ? "border-brand bg-brand/5"
                  : "border-slate-300 bg-white/60 dark:border-slate-700 dark:bg-slate-950/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="max-w-md">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-brand/10 text-brand">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Drag and drop an eye image
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Supported formats: PNG, JPG, JPEG. Keep images under 16MB for the Flask API
                  upload limit.
                </p>
                <button
                  type="button"
                  onClick={open}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5"
                >
                  <ImagePlus className="h-4 w-4" />
                  Choose Image
                </button>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[280px] gap-4 rounded-[28px] border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="grid flex-1 place-items-center overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 dark:border-slate-800">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full min-h-[220px] w-full object-cover"
                  />
                ) : (
                  <div className="max-w-sm px-6 text-center text-slate-300">
                    <Camera className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                    <p className="font-display text-lg font-bold text-white">Live Webcam Capture</p>
                    <p className="mt-3 text-sm text-slate-300">
                      Start the camera, center the eye image, and capture a still frame for
                      instant analysis.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={cameraStarting}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Camera className="h-4 w-4" />
                    {cameraStarting ? "Starting camera..." : "Start Webcam"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={captureFrame}
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
                    >
                      <ScanSearch className="h-4 w-4" />
                      Capture Snapshot
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Stop Camera
                    </button>
                  </>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Selected Input
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : "No image selected yet"}
                </p>
              </div>
              {selectedFile ? (
                <span className="stage-pill normal capitalize">
                  {source === "webcam" ? "webcam" : "upload"}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading || !selectedFile}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ScanSearch className="h-4 w-4" />
                {loading ? "Analyzing..." : "Analyze"}
              </button>

              <button
                type="button"
                onClick={() => {
                  clearSelection();
                  stopCamera();
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/60">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Preview
            </p>
            <h3 className="mt-2 font-display text-xl font-bold text-slate-900 dark:text-white">
              Image ready for AI screening
            </h3>
          </div>

          <div className="grid min-h-[320px] place-items-center overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected eye preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="px-6 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <ImagePlus className="h-6 w-6" />
                </div>
                <p className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Waiting for an image
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  The image preview appears here before analysis so you can catch framing issues
                  early.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


export default UploadCard;
