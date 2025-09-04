export function GET({ params, url }) {
  const width = Number.parseInt(params.width, 10) || 40;
  const height = Number.parseInt(params.height, 10) || 40;

  const bg = url.searchParams.get('bg') || '#e5e7eb'; // gray-200
  const color = url.searchParams.get('color') || '#6b7280'; // gray-500
  const text = url.searchParams.get('text') || `${width}x${height}`;

  const fontSize = Math.max(10, Math.floor(Math.min(width, height) / 3));

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="50%" fill="${color}" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji" font-size="${fontSize}" dominant-baseline="middle" text-anchor="middle">${text}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}