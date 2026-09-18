# Smart Wardrobe & AI Stylist 👗✨

An interactive digital wardrobe management and virtual styling platform powered by Google Gemini. Upload your real clothes, create or upload a custom digital avatar, try on outfits virtually, and interact in real time with an AI Voice Stylist.

---

## 🌐 Live Application

Experience the live application in your browser:

👉 **[Launch Live Demo](https://ais-pre-g5iecsxz5ruogamerq2abt-304205435735.asia-east1.run.app)**

* **Production URL:** `https://ais-pre-g5iecsxz5ruogamerq2abt-304205435735.asia-east1.run.app`


---

## ✨ Key Features

### 1. 🪞 Virtual Mirror & Layering Canvas
- **Layered Fitting:** Select items from Tops, Bottoms, Shoes, Outerwear, and Accessories to see an instant layered preview.
- **Accurate Anatomical Positioning:** Each garment is scaled, positioned, and layered according to natural fashion hierarchy.
- **Visual Outfit Stack:** Real-time visual sidebar displays all selected items currently active in your look.

### 2. 🪄 Magic Fit Realistic Try-On
- **Photorealistic AI Virtual Try-On:** Powered by `gemini-2.5-flash-image`.
- **Identity Preservation:** Preserves the avatar's face, hair, and body silhouette while draping the selected clothes naturally with realistic fabrics, textures, and studio lighting.

### 3. ✂️ AI Garment Extraction & Background Removal
- **Seamless Uploads:** Upload photos of your clothes, accessories, or shoes from your phone or camera.
- **Auto-Segmentation:** Gemini automatically detects the clothing item, removes backgrounds, hands, hangers, and mannequins, isolating the piece for your digital wardrobe.

### 4. 👤 AI Avatar Studio & Custom Uploads
- **AI Avatar Creator:** Generate a photorealistic 3D digital fashion avatar using descriptive text prompts (e.g., hair style, build, ethnicity).
- **Personal Photo Support:** Upload your own full-body portrait to use as your personal styling mannequin.

### 5. 🎙️ Real-Time Voice Stylist (Gemini Multimodal Live API)
- **Bidirectional Voice Chat:** Conversational AI fashion consultant powered by the Gemini Multimodal Live API.
- **Wardrobe-Aware:** The assistant has instant context of every item in your closet and suggests outfit combinations, color coordination, and occasion recommendations.
- **Low-Latency Audio:** Streams live microphone audio and receives immediate spoken voice responses.

### 6. 📁 Wardrobe Organization & Saved Looks
- **Categorization:** Organize clothing items into Tops, Bottoms, Shoes, Accessories, and Outerwear.
- **Favorite Looks:** Save outfit combinations with custom names for quick one-click recall.
- **Local Persistence:** All wardrobe items, avatar settings, and saved looks persist across browser sessions.

---

## 🚀 How to Use the App

1. **Set Up Your Avatar:**
   - Click **AI Creator** in the sidebar to generate a custom digital avatar by typing a short description, or click **Upload** to upload your own picture.
2. **Add Clothes to Your Wardrobe:**
   - Choose a category (e.g., *Tops*, *Bottoms*, *Outerwear*).
   - Click **+ Add** to upload pictures of your clothing. Gemini will automatically extract the clean garment.
3. **Style an Outfit:**
   - Click garments in your wardrobe to select or deselect them.
   - Preview the look live on the Virtual Mirror canvas.
4. **Generate a Realistic Try-On:**
   - Click **Generate Realistic Fit** to have Gemini render a photorealistic studio image of your avatar wearing the exact combination.
5. **Save Your Look:**
   - Click **Favorite Look**, give your combination a name, and save it for future reference.
6. **Consult the AI Voice Stylist:**
   - Click the **Voice Stylist** button in the bottom right corner.
   - Ask questions like: *"What should I wear for a business casual lunch today?"* or *"Does my denim jacket match these shoes?"*

---

## 🛠️ Tech Stack

- **Frontend Framework:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **AI Models & SDK:**
  - `@google/genai` (Google Gen AI SDK)
  - `gemini-2.5-flash-image` (Garment extraction and photorealistic virtual try-on)
  - Gemini Multimodal Live API (Real-time bidirectional voice assistant)
- **Audio Processing:** Web Audio API with PCM audio streaming

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ installed on your machine
- A [Google Gemini API Key](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd smart-wardrobe-ai-stylist
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```
├── App.tsx                   # Main application layout, state management, and try-on orchestration
├── components/
│   ├── AvatarCanvas.tsx      # Virtual mirror canvas with anatomical clothing layer positioning
│   ├── AvatarCreator.tsx     # Modal for generating custom 3D avatars via Gemini
│   ├── VoiceAssistant.tsx    # Live voice assistant UI and audio interaction management
│   └── WardrobeGrid.tsx      # Grid of wardrobe items with category filtering and item selection
├── services/
│   └── live-api.ts           # Gemini Multimodal Live API connection and audio encoding/decoding
├── types.ts                  # TypeScript interfaces and enum definitions
├── index.html                # HTML entry point
├── index.tsx                 # React DOM mount point
└── vite.config.ts            # Vite build configuration and environment variable definition
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

