

import React, { useState, useRef } from 'react';
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
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';import 'react-image-crop/dist/ReactCrop.css';

function getCroppedImg(image, crop) {
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
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}


function ImageCropperModal({ open, onClose, imageSrc, onCropComplete, aspect = 1 }) {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [zoom, setZoom] = useState(1);
    const imgRef = useRef(null);

    function onImageLoad(e) {
        const { width, height } = e.currentTarget;

        const crop = centerCrop(
          makeAspectCrop(
            {
              unit: '%',
              width: 100,            },
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

    const handleConfirmCrop = async () => {
        if (!completedCrop || !imgRef.current) return;
        const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
        onCropComplete(croppedImageBlob);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Crop your Image</DialogTitle>
                    <DialogDescription>
                        Drag to select the area you want to keep.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4 bg-muted/50 rounded-md overflow-hidden"> {}
                    {imageSrc && (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            minWidth={50}                            minHeight={50}
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Crop me"
                                onLoad={onImageLoad}
                                style={{
                                    transform: `scale(${zoom})`,
                                    maxHeight: '60vh',
                                    maxWidth: '100%',                                    objectFit: 'contain'
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
                    <Button onClick={handleConfirmCrop}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ImageCropperModal;