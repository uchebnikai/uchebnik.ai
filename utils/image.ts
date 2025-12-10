
export const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 800; // Reduced from 1280 to 800 to ensure API accepts the payload

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
           ctx.drawImage(img, 0, 0, width, height);
           // Compress to JPEG 0.6 for smaller base64 string
           resolve(canvas.toDataURL('image/jpeg', 0.6));
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
