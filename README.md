<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/78f58a64-8f93-4741-b666-8d29cc1b29f4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app in development mode:
   `npm run dev`

## Production Build

To create an optimized production build:

1. Run `npm run build`
2. The output will be in the `dist/` directory.
3. Ensure your production environment has the `VITE_GEMINI_API_KEY` variable set securely.

**Note:** When deploying, ensure the `VITE_` prefix is used for environment variables to be accessible in the client-side code.
