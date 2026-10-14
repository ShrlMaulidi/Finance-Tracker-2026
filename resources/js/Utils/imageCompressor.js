/**
 * Client-Side Image Compressor & Resizer Utility
 * 
 * Automatically downscales and compresses high-resolution camera photos (e.g., 5MB - 15MB)
 * into lightweight, high-quality images (~100KB - 300KB) in the browser before uploading.
 * 
 * This completely prevents Nginx "413 Request Entity Too Large" errors, saves server storage,
 * and makes uploads blazing fast on mobile networks.
 */

export async function compressImage(file, {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.85,
} = {}) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
        return file;
    }

    // Skip SVGs and Animated GIFs to prevent breaking them
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Scale down while maintaining aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                // Render image to canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Use WebP if supported, fallback to JPEG
                const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }

                        // Create a new lightweight File object with the original name
                        const extension = targetMime === 'image/png' ? '.png' : '.jpg';
                        const cleanName = file.name.replace(/\.[^/.]+$/, '') + extension;

                        const compressedFile = new File([blob], cleanName, {
                            type: targetMime,
                            lastModified: Date.now(),
                        });

                        resolve(compressedFile);
                    },
                    targetMime,
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}
