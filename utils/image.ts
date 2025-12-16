
export const resizeImage = (file: File, maxDim = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.imageSmoothingEnabled = true;
           ctx.imageSmoothingQuality = 'high';
           ctx.drawImage(img, 0, 0, width, height);
           // Compress to JPEG with specified quality
           resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
           resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string); // Fallback
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
