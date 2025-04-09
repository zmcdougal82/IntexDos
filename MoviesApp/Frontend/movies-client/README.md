# Movies App

A modern web application for browsing, rating, and reviewing movies and TV shows.

## Features

- Browse and search for movies and TV shows
- View detailed information about movies including cast, crew, and genres
- Rate and review movies and TV shows
- User authentication and profile management
- AI-powered review summarization using Hugging Face models
- Responsive design for both desktop and mobile devices

## Technologies Used

- React 19
- TypeScript
- Vite
- Axios for API requests
- React Router for navigation
- Hugging Face Inference API for AI review summarization

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:
```
cd MoviesApp/Frontend/movies-client
```
3. Install dependencies:
```
npm install
```
4. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Replace placeholder values with your actual API keys

### Running the app

```
npm run dev
```

The app will be available at http://localhost:5173 (or another port if 5173 is in use).

## Hugging Face Integration

This app uses Hugging Face's Inference API to provide AI-generated summaries of user reviews. To use this feature:

1. Sign up for a free account at [Hugging Face](https://huggingface.co/join)
2. Generate an API token at [Hugging Face Settings](https://huggingface.co/settings/tokens)
3. Add the token to your `.env.local` file:
```
VITE_HUGGINGFACE_API_KEY=your_api_key_here
```

The review summarization feature uses the `facebook/bart-large-cnn` model by default, but you can configure different models by adjusting the parameters in the `huggingfaceApi.ts` file.

## Building for production

```
npm run build
```

This will create a production-ready build in the `dist` directory.


