import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, FaceLandmarker, type HandLandmarkerResult, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';

interface VisionState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useVisionModels() {
  const [state, setState] = useState<VisionState>({
    isLoaded: false,
    isLoading: true,
    error: null,
  });

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeModels() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        if (!isMounted) return;

        const [handLandmarker, faceLandmarker] = await Promise.all([
          HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2,
          }),
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
          })
        ]);

        if (isMounted) {
          handLandmarkerRef.current = handLandmarker;
          faceLandmarkerRef.current = faceLandmarker;
          setState({ isLoaded: true, isLoading: false, error: null });
        }
      } catch (err) {
        console.error("Failed to load vision models:", err);
        if (isMounted) {
          setState({ 
            isLoaded: false, 
            isLoading: false, 
            error: err instanceof Error ? err.message : "Failed to load ML models" 
          });
        }
      }
    }

    initializeModels();

    return () => {
      isMounted = false;
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
    };
  }, []);

  const processVideoFrame = useCallback((videoElement: HTMLVideoElement, timestamp: number) => {
    if (!state.isLoaded || !handLandmarkerRef.current || !faceLandmarkerRef.current) {
      return { hands: null, faces: null };
    }

    try {
      const hands = handLandmarkerRef.current.detectForVideo(videoElement, timestamp);
      const faces = faceLandmarkerRef.current.detectForVideo(videoElement, timestamp);
      return { hands, faces };
    } catch (e) {
      console.error("Frame processing error:", e);
      return { hands: null, faces: null };
    }
  }, [state.isLoaded]);

  return { ...state, processVideoFrame };
}
