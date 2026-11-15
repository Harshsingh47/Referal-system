import QRCode from 'qrcode';

/**
 * Generate a high quality PNG Data URL for a referral URL
 * @param {string} referralUrl - Full URL to encode
 * @returns {Promise<string>} Base64 Data URL
 */
export const generateQRCodeDataUrl = async (referralUrl) => {
  try {
    const dataUrl = await QRCode.toDataURL(referralUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff'  // Pure White
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR Code generation failed');
  }
};
