export const getBackgroundImageStyle = (url: string | null) => url ? { backgroundImage: `url(${url})` } : {};
export const getDynamicHeightStyle = (height: number) => ({ height: `${height}px` });