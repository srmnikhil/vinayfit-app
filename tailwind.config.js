/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all files that contain Nativewind classes.
    content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontFamily: {
                'inter-bold': ['Inter-Bold'],
                'inter-regular': ['Inter-Regular'],
                'inter-semibold': ['Inter-SemiBold'],
                'inter-medium': ['Inter-Medium'],
            },
            colors: {
                appBackground: "#0F1115",    // Main screen background
                cardBackground: "#12151B",   // Card/panel backgrounds
                textPrimary: "#E9ECF1",      // Regular text
                textSecondary: "#7B8493",    // Headings, secondary text
                textTertiary: "#A2ACBA",      // Disabled text, icons
                cardBorder: "rgba(255,255,255,0.08)", // Card borders
                accent: "#2F6BFF",            // Buttons, icons, highlights
            }
        },
    },
    plugins: [],
}