export function getImageUrl(image) {
  if (!image || image === 'null' || image === '') {
    return '/images/placeholder.jpg';
  }
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  return `/images/${image}`;
}
export const THB = new Intl.NumberFormat("th-TH",{ style:"currency", currency:"THB" });

export const normalizeImage = (url) => {
  if (!url) return "/images/placeholder.png";
  return url.replace("./", "/"); // map ./images/... -> /images/...
};
