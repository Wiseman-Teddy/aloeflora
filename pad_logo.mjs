import sharp from 'sharp';

async function padLogo() {
  try {
    const inputPath = 'public/logo.jpeg';
    const metadata = await sharp(inputPath).metadata();
    
    // Determine the max dimension to make a square
    const size = Math.max(metadata.width, metadata.height);
    
    // Create a square image with a white background containing the logo
    await sharp(inputPath)
      .resize({
        width: size,
        height: size,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White padding
      })
      .toFile('public/logo_square.jpeg');
      
    // Create a 1200x630 (1.91:1) OG image specifically for Facebook/Twitter links
    await sharp(inputPath)
      .resize({
        width: 1200,
        height: 630,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // White padding
      })
      .toFile('public/og-image.jpeg');
      
    console.log('Images successfully padded and generated.');
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

padLogo();
