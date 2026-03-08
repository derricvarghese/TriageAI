## Packages
react-webcam | For accessing the device camera easily in React
@mediapipe/tasks-vision | For hand and face detection models
framer-motion | For smooth UI transitions and animations
date-fns | For formatting triage session dates
lucide-react | (Already in stack) For beautiful icons

## Notes
The application attempts to load MediaPipe WASM and model assets from Google's official CDNs to avoid requiring local model files.
Ensure the browser allows camera access.
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}
