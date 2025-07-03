/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./plugins/**/*.{js,ts,jsx,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Neutral palette from your design system
        neutral: {
          95: '#eceeee',  // --tt-palette--n95 (lightest)
          90: '#e3e7e8',  // --tt-palette--n90
          80: '#caced3',  // --tt-palette--n80
          70: '#aeb4bc',  // --tt-palette--n70
          60: '#929aa5',  // --tt-palette--n60
          50: '#76818e',  // --tt-palette--n50
          40: '#5e6773',  // --tt-palette--n40
          30: '#454e59',  // --tt-palette--n30
          20: '#2e343d',  // --tt-palette--n20
          10: '#15191e',  // --tt-palette--n10 (darkest)
        },
        // Blue palette (brand colors)
        blue: {
          95: '#e5efff',  // --tt-palette--b95 (lightest)
          90: '#dbe9ff',  // --tt-palette--b90
          80: '#b3d3fe',  // --tt-palette--b80
          70: '#89b9fb',  // --tt-palette--b70
          60: '#64a1f7',  // --tt-palette--b60
          50: '#3d89f5',  // --tt-palette--b50
          40: '#1e6de6',  // --tt-palette--b40 (Action Blue)
          30: '#1555b2',  // --tt-palette--b30 (Brand Primary)
          20: '#0d3778',  // --tt-palette--b20
          10: '#051d42',  // --tt-palette--b10 (darkest)
        },
        // Semantic colors from your design system
        primary: '#1555b2',    // Brand Primary (blue-30)
        action: '#1e6de6',     // Action Blue (blue-40)
        accent: '#ffcd08',     // Brand Accent (yellow-50)
        success: '#1da53f',    // Success (green-40)
        warning: '#eb6400',    // Warning (orange-40)
        danger: '#d31d23',     // Danger (red-40)
        info: '#0cbbbb',       // Info (cyan-40)
        // Additional color families from your design
        cyan: {
          95: '#e1f9f9',
          50: '#0cbbbb',
          10: '#002929',
        },
        green: {
          95: '#dffbe7',
          40: '#1da53f',
          10: '#06230d',
        },
        yellow: {
          95: '#fefad2',
          50: '#ffcd08',
          10: '#422b00',
        },
        orange: {
          95: '#ffeee0',
          40: '#eb6400',
          10: '#421a00',
        },
        red: {
          95: '#fdeded',
          40: '#d31d23',
          10: '#310c0d',
        },
        // Light theme colors (semantic)
        'surface-light': '#ffffff',
        'background-light': '#eceeee',
        'text-primary-light': '#15191e',
        'text-secondary-light': '#454e59',
        'border-light': '#caced3',
        // Dark theme colors (semantic)
        'surface-dark': '#2e343d',
        'background-dark': '#15191e',
        'text-primary-dark': '#e3e7e8',
        'text-secondary-dark': '#aeb4bc',
        'border-dark': '#5e6773',
      },
      fontFamily: {
        'sans': ['Nunito Sans', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
  darkMode: 'class', // Enable dark mode via class strategy
}