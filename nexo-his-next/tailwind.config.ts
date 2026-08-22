import type { Config } from 'tailwindcss';
export default { darkMode: 'class', content: ['./src/**/*.{ts,tsx}'], theme: { extend: { colors: { brand: { 50:'#effcf9',500:'#159a8c',700:'#0f6f67',950:'#092f2d' } } } }, plugins: [] } satisfies Config;
