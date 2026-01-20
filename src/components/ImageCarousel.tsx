import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  autoPlayInterval?: number;
}

export default function ImageCarousel({ images, autoPlayInterval = 4000 }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (autoPlayInterval <= 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlayInterval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const getImagePosition = (index: number) => {
    const diff = index - currentIndex;
    const normalizedDiff = diff > images.length / 2
      ? diff - images.length
      : diff < -images.length / 2
      ? diff + images.length
      : diff;

    return normalizedDiff;
  };

  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden py-6">
      <div className="relative w-full h-64 flex items-center justify-center">
        {images.map((image, index) => {
          const position = getImagePosition(index);
          const isCenter = position === 0;
          const isVisible = Math.abs(position) <= 2;

          if (!isVisible) return null;

          return (
            <div
              key={index}
              className="absolute transition-all duration-700 ease-out cursor-pointer"
              style={{
                transform: `translateX(${position * 240}px) scale(${isCenter ? 1.2 : 0.7})`,
                zIndex: isCenter ? 20 : 10 - Math.abs(position),
                opacity: isCenter ? 1 : 0.4,
              }}
              onClick={() => setCurrentIndex(index)}
            >
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="w-80 h-60 object-cover rounded-xl shadow-2xl"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Image précédente"
      >
        <ChevronLeft className="w-5 h-5 text-gray-800" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Image suivante"
      >
        <ChevronRight className="w-5 h-5 text-gray-800" />
      </button>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Aller à l'image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
