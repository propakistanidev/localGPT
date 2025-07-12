/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-bg': '#343541',
        'chat-input': '#40414f',
        'chat-text': '#ececf1',
        'chat-border': '#4d4d4f',
        'chat-hover': '#2a2b32',
        'user-msg': '#005c98',
        'assistant-msg': '#444654',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
