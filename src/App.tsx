import { useEffect, useRef, useState } from 'react';
import { ThreePCDViewer } from './components/PCDViewer'; 
import './App.css';

const pcdFiles = [
  '/models/frame1.pcd',
  '/models/frame2.pcd',
  '/models/frame3.pcd',
];

export default function App() {
  const [frameIndex, setFrameIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // A ref to hold the instance of our viewer class
  const viewerRef = useRef<ThreePCDViewer | null>(null);

  // This effect runs only once to create and clean up the viewer instance
  useEffect(() => {
    if (containerRef.current) {
      // Create a new instance of our viewer and store it in the ref
      const viewer = new ThreePCDViewer(containerRef.current);
      viewerRef.current = viewer;

      // Trigger an initial resize after a short delay to ensure layout is stable
      setTimeout(() => viewer.handleResize(), 50);
    }
    
    // cleanup function to prevent memory leaks
    return () => {
      viewerRef.current?.cleanup();
    };
  }, []);

  // This effect runs whenever the frameIndex changes
  useEffect(() => {
    viewerRef.current?.loadPCD(pcdFiles[frameIndex]);
  }, [frameIndex]);

  return (
    <div className="App">
      <div className="viewer-container" ref={containerRef} />
      <div className="controls-container">
        <button
          onClick={() => setFrameIndex((prev) => Math.max(0, prev - 1))}
          disabled={frameIndex === 0}
        >
          Prev
        </button>
        <button
          onClick={() => setFrameIndex((prev) => Math.min(pcdFiles.length - 1, prev + 1))}
          disabled={frameIndex === pcdFiles.length - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}