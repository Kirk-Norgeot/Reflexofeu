import { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Erreur lors de l\'accès à la caméra:', err);
      setError('Impossible d\'accéder à la caméra. Veuillez vérifier les autorisations.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const switchCamera = () => {
    setCapturedImage(null);
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ height: '100dvh' }}>
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white shrink-0">
        <h3 className="text-lg font-bold">Prendre une photo</h3>
        <button
          onClick={onCancel}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
            <div className="bg-red-500 text-white p-4 rounded-lg max-w-md text-center">
              <p>{error}</p>
              <button
                onClick={onCancel}
                className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {!error && !capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Photo capturée"
            className="w-full h-full object-contain"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-4 bg-gray-900 shrink-0 safe-area-bottom">
        {!capturedImage ? (
          <div className="flex items-center justify-center gap-4 pb-safe">
            <button
              onClick={switchCamera}
              className="p-4 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors active:scale-95"
              aria-label="Changer de caméra"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <button
              onClick={capturePhoto}
              disabled={!!error}
              className="p-6 bg-white text-gray-900 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
              aria-label="Prendre une photo"
            >
              <Camera className="w-8 h-8" />
            </button>
            <div className="w-16" />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 pb-safe max-w-md mx-auto">
            <button
              onClick={retake}
              className="flex-1 btn btn-secondary flex items-center justify-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Reprendre
            </button>
            <button
              onClick={confirmCapture}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-5 h-5" />
              Confirmer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
