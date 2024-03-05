import colors from "tailwindcss/colors"
import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: colors.blue[500],
			},
		},
	},
	plugins: [animate],
}
