import dotenv from "dotenv";

// Only load .env files in development (NODE_ENV !== 'production')
// In production on Render, environment variables are set directly
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({
    path: [".env.local", ".env"],
    override: false,
  });
}
