import React from 'react';
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from 'lucide-react';
import { constructImageUrl } from '../utils/url';


const ImageViewerModal = ({ open, onClose, imageUrl, altText }) => {
    if (!imageUrl) return null;

    const fullUrl = constructImageUrl(imageUrl);

    const handleDownload = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            const filename = imageUrl.split('/').pop() || 'download.webp';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogOverlay className="bg-black/90 backdrop-blur-md" />
            <DialogContent
                className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-none shadow-none flex flex-col items-center justify-center outline-none"
                hideCloseButton={true}
            >
                {}
                <div className="absolute top-4 right-4 flex gap-2 z-50">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-sm"
                        onClick={handleDownload}
                        title="Download Image"
                    >
                        <Download className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-sm"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
                    <img
                        src={fullUrl}
                        alt={altText || 'View'}
                        className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm select-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageViewerModal;