import type { Config } from 'tailwindcss';
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'], theme: { extend: { colors: { ink: '#25201d', clay: '#c8593c', sand: '#f8f2e9', moss: '#526249' }, fontFamily: { display: ['Georgia', 'serif'] } } }, plugins: [] };
export default config;
