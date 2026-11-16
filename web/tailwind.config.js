export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        // Warm neutrals, olive actions. Status hues are used for text, icons and thin strokes (≥ 4.5:1 on their soft fills).
        canvas: '#F7F6F2',
        surface: '#FFFFFF',
        sunken: '#F1EEEA',
        ink: { DEFAULT: '#2B2A20', muted: '#5F5D52', subtle: '#74705F' },
        line: { DEFAULT: '#ECE8DF', strong: '#D9D4C7' },
        brand: { DEFAULT: '#5B6B2F', hover: '#4A5826', soft: '#EEF1E4', muted: '#D8DFC4' },
        // Accent icons sit in the same warm-neutral family as the rest of the UI.
        brass: { DEFAULT: '#8A8670', soft: '#F1EEEA', text: '#5F5D52' },
        success: { DEFAULT: '#2F6B3A', soft: '#E8F2E6' },
        info: { DEFAULT: '#2F5A85', soft: '#E7EFF7' },
        attention: { DEFAULT: '#7A5A0F', soft: '#FBF1D9' },
        warning: { DEFAULT: '#A5560F', soft: '#FCEBDB' },
        critical: { DEFAULT: '#B42318', soft: '#FDECEA' },
        heat: { 0: '#B7EBC6', 1: '#FBE38E', 2: '#FDBF85', 3: '#F9A3A3', 4: '#B42323' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(46,45,38,0.04), 0 1px 6px rgba(46,45,38,0.03)',
        pop: '0 16px 40px -12px rgba(43,42,32,0.24), 0 2px 6px rgba(43,42,32,0.07)',
      },
    },
  },
};
