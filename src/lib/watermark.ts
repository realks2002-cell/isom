import sharp from 'sharp';

export async function addWatermark(imageBase64: string): Promise<string> {
  const buffer = Buffer.from(imageBase64, 'base64');
  const { width = 800, height = 600 } = await sharp(buffer).metadata();

  const fontSize = Math.max(24, Math.round(width / 20));
  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <style>.wm { fill: rgba(255,255,255,0.4); font-size: ${fontSize}px; font-family: Arial, sans-serif; font-weight: bold; }</style>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="wm" transform="rotate(-30, ${width / 2}, ${height / 2})">ISOPLAN 3D</text>
    <text x="50%" y="${height / 2 + fontSize * 1.5}" text-anchor="middle" dominant-baseline="middle" style="fill: rgba(255,255,255,0.3); font-size: ${Math.round(fontSize * 0.5)}px; font-family: Arial, sans-serif;" transform="rotate(-30, ${width / 2}, ${height / 2})">Upgrade to remove watermark</text>
  </svg>`);

  const result = await sharp(buffer)
    .composite([{ input: svg, gravity: 'center' }])
    .png()
    .toBuffer();

  return result.toString('base64');
}
