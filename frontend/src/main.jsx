import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react' // 1. Import ClerkProvider
import './index.css'
import App from './App.jsx'

// 2. Get the Publishable Key from your Vite .env file
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// 3. Safety check to ensure the environment variable is loaded
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your frontend/.env file.");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 4. Wrap the App in ClerkProvider */}
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)