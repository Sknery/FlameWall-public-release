import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
// Temporarily disable animated GIF cropping to fix frontend startup
// TODO: Fix gif.js and gifuct-js imports for Vite
// import GIF from 'gif.js/dist/gif.js';
// import { parseGIF, decompressFrames } from 'gifuct-js';

async function cropAnimatedGif(file, crop, imageWidth, imageHeight) {
  // Temporarily disabled - return original file
  // TODO: Fix gif.js and gifuct-js imports for Vite compatibility
  // For now, animated GIFs will be uploaded without cropping
  console.warn('Animated GIF cropping is temporarily disabled. Uploading original file.');
  return Promise.resolve(file);
  
  /* Original implementation - disabled due to import issues
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const gifData = new Uint8Array(arrayBuffer);
        
        // Parse GIF
        const gif = parseGIF(gifData);
        const frames = decompressFrames(gif, true);
        
        // Crop coordinates are in percentage (unit: '%')
        // Convert to pixels based on actual GIF dimensions
        const cropX = Math.round((crop.x / 100) * gif.lsd.width);
        const cropY = Math.round((crop.y / 100) * gif.lsd.height);
        const cropWidth = Math.round((crop.width / 100) * gif.lsd.width);
        const cropHeight = Math.round((crop.height / 100) * gif.lsd.height);
        
        // Ensure crop coordinates are within bounds
        const finalCropX = Math.max(0, Math.min(cropX, gif.lsd.width - 1));
        const finalCropY = Math.max(0, Math.min(cropY, gif.lsd.height - 1));
        const finalCropWidth = Math.max(1, Math.min(cropWidth, gif.lsd.width - finalCropX));
        const finalCropHeight = Math.max(1, Math.min(cropHeight, gif.lsd.height - finalCropY));
        
        // Create GIF encoder
        const gifEncoder = new GIF({
          workers: 2,
          quality: 10,
          width: finalCropWidth,
          height: finalCropHeight,
        });
        
        // Create a full-size canvas to composite frames
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = gif.lsd.width;
        fullCanvas.height = gif.lsd.height;
        const fullCtx = fullCanvas.getContext('2d');
        
        // Get background color from GIF (or use transparent)
        const bgColor = gif.lsd.colors ? 
          `rgb(${gif.lsd.colors[gif.lsd.bgColorIndex]?.join(',') || '0,0,0'})` : 
          '#000000';
        fullCtx.fillStyle = bgColor;
        fullCtx.fillRect(0, 0, fullCanvas.width, fullCanvas.height);
        
        // Process each frame
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          
          // Handle frame disposal
          if (i > 0) {
            const prevFrame = frames[i - 1];
            if (prevFrame.disposalType === 2) {
              // Clear previous frame area and restore background
              fullCtx.clearRect(
                prevFrame.left,
                prevFrame.top,
                prevFrame.width,
                prevFrame.height
              );
              fullCtx.fillStyle = bgColor;
              fullCtx.fillRect(
                prevFrame.left,
                prevFrame.top,
                prevFrame.width,
                prevFrame.height
              );
            } else if (prevFrame.disposalType === 3) {
              // Restore to previous - we'll handle this by keeping the canvas state
              // For simplicity, we'll just continue (this is complex to implement correctly)
            }
          }
          
          // Draw frame to full canvas
          // frame.patch is RGBA data
          const frameImageData = fullCtx.createImageData(frame.width, frame.height);
          frameImageData.data.set(frame.patch);
          fullCtx.putImageData(frameImageData, frame.left, frame.top);
          
          // Crop the frame from full canvas
          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = finalCropWidth;
          croppedCanvas.height = finalCropHeight;
          const croppedCtx = croppedCanvas.getContext('2d');
          
          croppedCtx.drawImage(
            fullCanvas,
            finalCropX, finalCropY, finalCropWidth, finalCropHeight,
            0, 0, finalCropWidth, finalCropHeight
          );
          
          // Get delay in milliseconds (convert from centiseconds, default to 100ms)
          const delay = frame.delay !== undefined && frame.delay !== null ? frame.delay * 10 : 100;
          
          // Add frame to GIF encoder
          gifEncoder.addFrame(croppedCtx, { delay: Math.max(20, delay) }); // Minimum 20ms delay
        }
        
        // Render GIF
        gifEncoder.on('finished', (blob) => {
          resolve(blob);
        });
        
        // gifEncoder.render();
      } catch (error) {
        console.error('Error cropping animated GIF:', error);
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
  */
}

function getCroppedImg(image, crop, originalMimeType = 'image/png', originalFile = null) {
  // Note: Canvas will convert GIF/AVIF to PNG, which may destroy animation
  // But we allow this to enable cropping functionality
  // GIF is handled separately in handleConfirmCrop to preserve animation
  
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0, 0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    // Determine the output format based on original MIME type
    let outputMimeType = originalMimeType;
    let quality = undefined;

    // Map MIME types to canvas-supported formats
    // Canvas supports: image/png, image/jpeg, image/webp
    // For formats not supported by canvas, we'll use PNG as fallback
    if (originalMimeType === 'image/jpeg' || originalMimeType === 'image/jpg') {
      outputMimeType = 'image/jpeg';
      quality = 0.92;
    } else if (originalMimeType === 'image/webp') {
      outputMimeType = 'image/webp';
      quality = 0.92;
    } else if (originalMimeType === 'image/png') {
      outputMimeType = 'image/png';
    } else {
      // For GIF, AVIF, and other formats, we'll use PNG as fallback
      // since canvas doesn't support them directly
      // BUT: This should not be reached for animated formats due to check above
      outputMimeType = 'image/png';
    }

    canvas.toBlob((blob) => {
      resolve(blob);
    }, outputMimeType, quality);
  });
}

function ShopImageCropperModal({ open, onClose, imageSrc, originalFile, onCropComplete, aspect = 1 }) {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [isCropping, setIsCropping] = useState(false);
    const imgRef = useRef(null);
    const { authToken } = useAuth();

    // Debug logging
    useEffect(() => {
        console.log('ShopImageCropperModal - open:', open, 'imageSrc:', imageSrc ? 'present' : 'null', 'originalFile:', originalFile?.name);
    }, [open, imageSrc, originalFile]);

    function onImageLoad(e) {
        console.log('Image loaded in cropper, dimensions:', e.currentTarget.width, 'x', e.currentTarget.height);
        const { width, height } = e.currentTarget;

        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 100,
            },
            aspect,
            width,
            height
          ),
          width,
          height
        );

        setCrop(crop);
        setCompletedCrop(crop);
        return false;
    }

    function onImageError(e) {
        console.error('Error loading image in cropper:', e);
        toast.error('Failed to load image. The file format may not be supported.');
    }

    const handleConfirmCrop = async () => {
        if (!completedCrop || !imgRef.current || !originalFile) return;
        
        setIsCropping(true);
        
        try {
          // Check file types
          const isGif = originalFile.type === 'image/gif' || 
                        originalFile.name.toLowerCase().endsWith('.gif');
          const isAvif = originalFile.type === 'image/avif' || 
                          originalFile.name.toLowerCase().endsWith('.avif');
          const isAnimated = isGif || isAvif;
          
          let croppedImageBlob;
          
          if (isAnimated) {
            // For animated formats (GIF/AVIF), use server-side cropping with sharp
            // This preserves animation while allowing cropping
            try {
              const formData = new FormData();
              formData.append('file', originalFile);
              formData.append('x', completedCrop.x.toString());
              formData.append('y', completedCrop.y.toString());
              formData.append('width', completedCrop.width.toString());
              formData.append('height', completedCrop.height.toString());
              formData.append('imageWidth', (imgRef.current.naturalWidth || imgRef.current.width).toString());
              formData.append('imageHeight', (imgRef.current.naturalHeight || imgRef.current.height).toString());
              
              console.log('Sending crop request:', {
                x: completedCrop.x,
                y: completedCrop.y,
                width: completedCrop.width,
                height: completedCrop.height,
                imageWidth: imgRef.current.naturalWidth || imgRef.current.width,
                imageHeight: imgRef.current.naturalHeight || imgRef.current.height
              });
              
              const response = await axios.post('/api/media/crop-image', formData, {
                headers: {
                  // Don't set Content-Type - let axios set it automatically with boundary
                  Authorization: `Bearer ${authToken}`
                }
              });
              
              // Fetch the cropped image from the server
              const croppedImageUrl = response.data.url;
              const imageResponse = await fetch(croppedImageUrl);
              const imageBlob = await imageResponse.blob();
              
              // Determine file extension from URL (server may convert AVIF to PNG/GIF)
              const urlExtension = croppedImageUrl.split('.').pop().split('?')[0];
              // Use blob type if available, otherwise fall back to original type
              const blobType = imageBlob.type || originalFile.type;
              // Use extension from URL (which reflects actual format), or fall back to original
              const fileExtension = urlExtension || originalFile.name.split('.').pop();
              const fileName = `cropped.${fileExtension}`;
              croppedImageBlob = new File([imageBlob], fileName, { 
                type: blobType 
              });
              
              // Check if server returned a warning (e.g., AVIF cropping not supported)
              if (response.data.warning) {
                // For AVIF, file wasn't cropped, so show appropriate message
                if (response.data.warning.includes('AVIF cropping is not supported')) {
                  toast.info('AVIF file preserved (cropping not supported for animated AVIF)', { duration: 4000 });
                  toast.warning(response.data.warning, { duration: 6000 });
                } else {
                  toast.success('Image cropped successfully!', { duration: 3000 });
                  toast.warning(response.data.warning, { duration: 5000 });
                }
              } else {
                toast.success('Image cropped successfully with animation preserved!');
              }
            } catch (serverError) {
              console.error('Server-side cropping error:', serverError);
              toast.error('Server-side cropping failed. Using original file.');
              croppedImageBlob = originalFile;
            }
          } else {
            // For all other formats (JPEG, PNG, WebP), use canvas cropping
            const originalMimeType = originalFile.type || 'image/png';
            croppedImageBlob = await getCroppedImg(
              imgRef.current, 
              completedCrop, 
              originalMimeType, 
              originalFile
            );
          }
          
          // Preserve original filename extension if possible
          if (originalFile && croppedImageBlob) {
            const fileExtension = originalFile.name.split('.').pop();
            const fileName = `cropped.${fileExtension}`;
            const file = new File([croppedImageBlob], fileName, { 
              type: croppedImageBlob.type || originalFile.type
            });
            onCropComplete(file);
          } else {
            onCropComplete(croppedImageBlob);
          }
        } catch (error) {
          console.error('Error cropping image:', error);
          toast.error('Error cropping image. Using original file.');
          onCropComplete(originalFile);
        } finally {
          setIsCropping(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Crop your Image</DialogTitle>
                    <DialogDescription>
                        Drag to select the area you want to keep. Original format will be preserved.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4 bg-muted/50 rounded-md overflow-hidden">
                    {imageSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            minWidth={50}
                            minHeight={50}
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Crop me"
                                onLoad={onImageLoad}
                                onError={onImageError}
                                style={{
                                    transform: `scale(${zoom})`,
                                    maxHeight: '60vh',
                                    maxWidth: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </ReactCrop>
                    )}
                </div>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="zoom" className="text-right">
                            Zoom
                        </Label>
                        <Slider
                            id="zoom"
                            defaultValue={[1]}
                            value={[zoom]}
                            onValueChange={(value) => setZoom(value[0])}
                            max={3}
                            step={0.1}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirmCrop} disabled={isCropping}>
                        {isCropping ? 'Cropping...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ShopImageCropperModal;

