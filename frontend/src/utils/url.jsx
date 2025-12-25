



export const constructImageUrl = (relativePath) => {
  if (!relativePath) {
    return null;
  }
  if (relativePath.startsWith('blob:')) {
    return relativePath;
  }

  return relativePath;
};