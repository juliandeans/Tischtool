export const imageAlt = (label: string) => {
  return label.trim() || 'Hochgeladenes Projektbild';
};

export const imageTitleFromPath = (filePath: string) => {
  const fileName = filePath.split('/').pop() ?? filePath;
  return fileName.replace(/\.[^.]+$/, '');
};
