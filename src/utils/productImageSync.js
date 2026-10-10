import { zipSync, unzipSync, strToU8 } from 'fflate';

/**
 * Sanitizes a string for use as a valid filename across Windows/Mac/Linux.
 */
export function sanitizeFilename(name) {
  if (!name) return 'product_image';
  return String(name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '') || 'product_image';
}

/**
 * Extracts the file extension from a URL or filename.
 */
export function getImageExtension(url, fallback = 'jpg') {
  if (!url || typeof url !== 'string') return fallback;
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const match = cleanUrl.match(/\.(jpe?g|png|webp|gif|svg|avif|mp4)$/i);
    if (match) return match[1].toLowerCase().replace('jpeg', 'jpg');
  } catch {
    // ignore
  }
  return fallback;
}

/**
 * Maps extension to MIME type.
 */
export function getMimeTypeFromExt(ext) {
  const map = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    avif: 'image/avif',
    mp4: 'video/mp4',
  };
  return map[(ext || '').toLowerCase()] || 'image/jpeg';
}

/**
 * Loads an image from a URL as a Uint8Array, with HTML5 Canvas fallback for CORS.
 */
export async function fetchImageAsUint8Array(url) {
  if (!url) throw new Error('No URL provided');

  if (url.startsWith('data:')) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  }

  // Direct fetch attempt
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }
  } catch {
    // Fall back to Canvas
  }

  // Canvas fallback
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 400;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject(new Error('Canvas toBlob failed'));
            const buf = await blob.arrayBuffer();
            resolve(new Uint8Array(buf));
          },
          'image/jpeg',
          0.92
        );
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image from: ${url}`));
    img.src = url;
  });
}

/**
 * Downloads a single product's image directly with the product name.
 */
export async function downloadSingleImage(product) {
  const imgUrl = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
  if (!imgUrl) throw new Error('Product has no image to download');

  const ext = getImageExtension(imgUrl);
  const filename = `${sanitizeFilename(product.productname)}.${ext}`;
  const u8 = await fetchImageAsUint8Array(imgUrl);
  const blob = new Blob([u8], { type: getMimeTypeFromExt(ext) });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

/**
 * Generates a ZIP archive containing all images named after product names and triggers download.
 */
export async function generateProductImageZip(products, options = {}, onProgress) {
  const {
    filenameFormat = 'name', // 'name' | 'serial_name' | 'serial'
    includeCsv = true,
  } = options;

  const productsWithImages = products.filter(
    (p) => Array.isArray(p.images) && p.images.length > 0
  );

  if (productsWithImages.length === 0) {
    throw new Error('No products have images to download');
  }

  const usedNames = new Set();
  const zipEntries = {};
  const csvRows = [
    ['Serial Number', 'Product Name', 'Category', 'Price (Rs)', 'Direct Price (Rs)', 'Image Filename'],
  ];

  let totalImages = 0;
  productsWithImages.forEach((p) => {
    totalImages += p.images.length;
  });

  let processedCount = 0;
  if (onProgress) onProgress({ current: 0, total: totalImages, status: 'Starting download...' });

  const concurrency = 4;
  const imageQueue = [];

  for (const product of productsWithImages) {
    product.images.forEach((url, imgIdx) => {
      imageQueue.push({ product, url, imgIdx, multi: product.images.length > 1 });
    });
  }

  for (let i = 0; i < imageQueue.length; i += concurrency) {
    const chunk = imageQueue.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async ({ product, url, imgIdx, multi }) => {
        try {
          const ext = getImageExtension(url);
          const safeName = sanitizeFilename(product.productname);
          const serial = sanitizeFilename(product.serial_number);

          let base = '';
          if (filenameFormat === 'serial_name') {
            base = `${serial} - ${safeName}`;
          } else if (filenameFormat === 'serial') {
            base = serial;
          } else {
            base = safeName;
          }

          if (multi) {
            base = `${base}_${imgIdx + 1}`;
          }

          let finalFilename = `${base}.${ext}`;
          let counter = 1;
          while (usedNames.has(finalFilename.toLowerCase())) {
            finalFilename = `${base} (${counter}).${ext}`;
            counter++;
          }
          usedNames.add(finalFilename.toLowerCase());

          const u8 = await fetchImageAsUint8Array(url);
          zipEntries[finalFilename] = u8;

          csvRows.push([
            `"${(product.serial_number || '').replace(/"/g, '""')}"`,
            `"${(product.productname || '').replace(/"/g, '""')}"`,
            `"${(product.product_type || '').replace(/"/g, '""')}"`,
            `"${product.price || ''}"`,
            `"${product.dprice || ''}"`,
            `"${finalFilename.replace(/"/g, '""')}"`,
          ]);
        } catch (err) {
          console.warn(`Failed to fetch image for ${product.productname}:`, err);
        } finally {
          processedCount++;
          if (onProgress) {
            onProgress({
              current: processedCount,
              total: totalImages,
              status: `Fetching image ${processedCount} of ${totalImages}...`,
            });
          }
        }
      })
    );
  }

  if (Object.keys(zipEntries).length === 0) {
    throw new Error('Failed to load any images for download');
  }

  if (includeCsv) {
    const csvContent = csvRows.map((r) => r.join(',')).join('\r\n');
    zipEntries['manifest.csv'] = strToU8(csvContent);
  }

  if (onProgress) onProgress({ current: totalImages, total: totalImages, status: 'Compressing ZIP archive...' });

  const zippedBytes = zipSync(zipEntries, { level: 6 });
  const blob = new Blob([zippedBytes], { type: 'application/zip' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `FWC_Product_Images_${dateStr}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

  return { totalExported: Object.keys(zipEntries).length };
}

/**
 * Extracts image files from an uploaded .zip archive into an array of File objects.
 */
export async function extractImagesFromZip(zipFile) {
  const arrayBuffer = await zipFile.arrayBuffer();
  const unzipped = unzipSync(new Uint8Array(arrayBuffer));
  const files = [];

  for (const [relativePath, data] of Object.entries(unzipped)) {
    const filename = relativePath.split('/').pop();
    if (!filename || filename.startsWith('.') || relativePath.includes('__MACOSX/')) {
      continue;
    }

    const extMatch = filename.match(/\.(jpe?g|png|webp|gif|mp4)$/i);
    if (!extMatch) continue;

    const ext = extMatch[1].toLowerCase().replace('jpeg', 'jpg');
    const mimeType = getMimeTypeFromExt(ext);
    const file = new File([data], filename, { type: mimeType });
    files.push(file);
  }

  return files;
}

/**
 * Normalizes text for strict alphanumeric matching.
 * Converts to lowercase and removes all non-alphanumeric characters.
 */
export function normalizeKey(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Escapes regex special characters in a string.
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches a list of image files to products by filename or serial number.
 */
export function matchImagesToProducts(fileList, productsList) {
  const matches = [];

  // Maps for exact and normalized matches
  const byExactName = new Map();
  const byNormName = new Map();
  const byExactSerial = new Map();
  const byNormSerial = new Map();

  productsList.forEach((p) => {
    if (p.productname) {
      const pNameLower = p.productname.toLowerCase().trim();
      const pNameNorm = normalizeKey(p.productname);
      if (!byExactName.has(pNameLower)) byExactName.set(pNameLower, p);
      if (!byNormName.has(pNameNorm)) byNormName.set(pNameNorm, p);
    }
    if (p.serial_number) {
      const snLower = String(p.serial_number).toLowerCase().trim();
      const snNorm = normalizeKey(p.serial_number);
      if (!byExactSerial.has(snLower)) byExactSerial.set(snLower, p);
      if (!byNormSerial.has(snNorm)) byNormSerial.set(snNorm, p);
    }
  });

  fileList.forEach((file) => {
    const filename = file.name;
    // Strip file extension
    const baseName = filename.replace(/\.[^/.]+$/, '').trim();
    // Strip trailing image index like _1, _2, -1, -2, (1), (2)
    const strippedSuffix = baseName.replace(/([_-]\d+|\s*\(\d+\))$/, '').trim();

    const baseNameLower = baseName.toLowerCase();
    const strippedLower = strippedSuffix.toLowerCase();
    const baseNameNorm = normalizeKey(baseName);
    const strippedNorm = normalizeKey(strippedSuffix);

    let matchedProduct = null;
    let matchReason = '';

    // 1. Exact string match (case-insensitive) on product name
    if (byExactName.has(baseNameLower)) {
      matchedProduct = byExactName.get(baseNameLower);
      matchReason = 'Exact Name';
    } else if (byExactName.has(strippedLower)) {
      matchedProduct = byExactName.get(strippedLower);
      matchReason = 'Product Name';
    }

    // 2. Normalized alphanumeric match on product name (ignores punctuation, dashes, spaces)
    if (!matchedProduct && baseNameNorm.length >= 2) {
      if (byNormName.has(baseNameNorm)) {
        matchedProduct = byNormName.get(baseNameNorm);
        matchReason = 'Product Name';
      } else if (byNormName.has(strippedNorm)) {
        matchedProduct = byNormName.get(strippedNorm);
        matchReason = 'Product Name';
      }
    }

    // 3. Serial Number Exact Match (e.g. "001.jpg" or "1.5FTTS.jpg")
    if (!matchedProduct) {
      if (byExactSerial.has(baseNameLower)) {
        matchedProduct = byExactSerial.get(baseNameLower);
        matchReason = 'Serial Number';
      } else if (byExactSerial.has(strippedLower)) {
        matchedProduct = byExactSerial.get(strippedLower);
        matchReason = 'Serial Number';
      } else if (baseNameNorm.length >= 2 && byNormSerial.has(baseNameNorm)) {
        matchedProduct = byNormSerial.get(baseNameNorm);
        matchReason = 'Serial Number';
      } else if (strippedNorm.length >= 2 && byNormSerial.has(strippedNorm)) {
        matchedProduct = byNormSerial.get(strippedNorm);
        matchReason = 'Serial Number';
      }
    }

    // 4. "Serial - Name" composite format (e.g. "1.5FTTS - 1.5ft Twinkling Star.jpg")
    if (!matchedProduct) {
      for (const p of productsList) {
        if (!p.serial_number || !p.productname) continue;
        const snEscaped = escapeRegex(String(p.serial_number).trim());
        const compositeRegex = new RegExp(`^${snEscaped}\\s*[-_]\\s*(.*)$`, 'i');
        const match = baseName.match(compositeRegex);
        if (match) {
          const rest = match[1].trim();
          if (normalizeKey(rest) === normalizeKey(p.productname)) {
            matchedProduct = p;
            matchReason = 'Serial + Name';
            break;
          }
        }
      }
    }

    // We do NOT use loose partial substring guessing to avoid wrong auto-matches.
    // Unmatched items are marked as unmatched so the user can easily select the target product.
    matches.push({
      id: Math.random().toString(36).substring(2, 9),
      file,
      filename,
      previewUrl: URL.createObjectURL(file),
      matchedProduct,
      matchReason: matchReason || 'Unmatched',
      status: matchedProduct ? 'matched' : 'unmatched',
    });
  });

  return matches;
}


/**
 * Uploads new images for a product to the backend.
 */
export async function uploadSingleProductImage(product, files, mode = 'replace', apiBaseUrl) {
  const tableName = product.product_type.toLowerCase().replace(/\s+/g, '_');
  const formData = new FormData();
  formData.append('mode', mode);
  files.forEach((f) => formData.append('images', f));

  // Try dedicated images endpoint first
  try {
    const res = await fetch(`${apiBaseUrl}/api/products/${tableName}/${product.id}/images`, {
      method: 'PUT',
      body: formData,
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to general update endpoint
  const fullFormData = new FormData();
  fullFormData.append('productname', product.productname);
  fullFormData.append('serial_number', product.serial_number);
  fullFormData.append('price', product.price);
  fullFormData.append('dprice', product.dprice || '0');
  fullFormData.append('per', product.per || 'pieces');
  fullFormData.append('discount', product.discount || '0');
  fullFormData.append('description', product.description || '');
  fullFormData.append('product_type', product.product_type);
  fullFormData.append('box_count', product.box_count || 1);
  if (product.status) fullFormData.append('status', product.status);

  if (mode === 'append') {
    const cleanExisting = (product.images || [])
      .map((img) => (typeof img === 'string' ? img : img?.path || img?.url || img?.secure_url || ''))
      .filter(Boolean);
    fullFormData.append('existingImages', JSON.stringify(cleanExisting));
  } else {
    fullFormData.append('existingImages', JSON.stringify([]));
  }
  files.forEach((f) => fullFormData.append('images', f));


  const fallbackRes = await fetch(`${apiBaseUrl}/api/products/${tableName}/${product.id}`, {
    method: 'PUT',
    body: fullFormData,
  });

  const data = await fallbackRes.json();
  if (!fallbackRes.ok) {
    throw new Error(data.message || 'Failed to update product images');
  }
  return data;
}
