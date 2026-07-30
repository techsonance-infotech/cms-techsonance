'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Loader2,
  Crop,
  Layers,
} from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { toast } from 'sonner';

export type FileUploadResult = {
  url: string;
  id: string;
  name: string;
  type: string;
  size: number;
  kind: string;
  publicId: string;
  secureUrl: string;
};

interface FileUploaderProps {
  value?: string | string[]; // Can be URL/File ID or array of them
  onChange?: (value: any) => void;
  onUploadSuccess?: (result: FileUploadResult | FileUploadResult[]) => void;
  kind: 'avatar' | 'logo' | 'payroll' | 'expense' | 'project' | 'leave_document' | 'employee_document' | 'resume' | 'contract' | 'general';
  moduleName?: string;
  entityType?: string;
  entityId?: string;
  accessLevel?: 'public' | 'restricted';
  multiple?: boolean;
  maxSize?: number; // Override default max size in bytes
  enableCrop?: boolean; // For avatars/logos
  cropAspect?: number; // Aspect ratio e.g. 1 for 1:1, 16/9 etc.
  className?: string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  controller: AbortController | null;
  error?: string;
  result?: FileUploadResult;
}

export function FileUploader({
  value,
  onChange,
  onUploadSuccess,
  kind,
  moduleName = kind,
  entityType = 'general',
  entityId = 'draft',
  accessLevel,
  multiple = false,
  maxSize,
  enableCrop = kind === 'avatar' || kind === 'logo',
  cropAspect = 1,
  className = '',
}: FileUploaderProps) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Set default max size based on kind if not provided
  const getMaxLimit = () => {
    if (maxSize) return maxSize;
    switch (kind) {
      case 'avatar':
      case 'logo':
        return 1 * 1024 * 1024; // Images: 1 MB max
      default:
        return 2 * 1024 * 1024; // Documents: 2 MB max
    }
  };

  // Helper to format file sizes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Cancel an active upload
  const cancelUpload = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.controller) {
            item.controller.abort();
          }
          return { ...item, status: 'failed', error: 'Upload cancelled by user' };
        }
        return item;
      })
    );
  }, []);

  // Upload file execution
  const executeUpload = useCallback(async (queueItem: UploadQueueItem) => {
    const controller = new AbortController();
    
    setQueue((prev) =>
      prev.map((item) =>
        item.id === queueItem.id
          ? { ...item, status: 'uploading', progress: 5, controller }
          : item
      )
    );

    const token = localStorage.getItem('session_token');
    const formData = new FormData();
    formData.append('file', queueItem.file);
    formData.append('kind', kind);
    formData.append('moduleName', moduleName);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    if (accessLevel) {
      formData.append('accessLevel', accessLevel);
    }

    try {
      const headers: Record<string, string> = {};
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // XHR-like progress hook using fetch and fake progressive intervals for simplicity
      const progressInterval = setInterval(() => {
        setQueue((prev) =>
          prev.map((item) => {
            if (item.id === queueItem.id && item.status === 'uploading' && item.progress < 90) {
              return { ...item, progress: item.progress + 15 };
            }
            return item;
          })
        );
      }, 400);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const result = await response.json();
      const uploadData: FileUploadResult = result.data;

      setQueue((prev) =>
        prev.map((item) =>
          item.id === queueItem.id
            ? { ...item, status: 'completed', progress: 100, result: uploadData }
            : item
          )
      );

      toast.success(`${queueItem.file.name} uploaded successfully!`);

      // Trigger callbacks
      if (onUploadSuccess) {
        onUploadSuccess(uploadData);
      }

      if (onChange) {
        if (multiple) {
          const currentValues = Array.isArray(value) ? value : value ? [value] : [];
          onChange([...currentValues, uploadData.url]);
        } else {
          onChange(uploadData.url);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Handled in cancelUpload
      }
      console.error('File upload error:', err);
      setQueue((prev) =>
        prev.map((item) =>
          item.id === queueItem.id
            ? { ...item, status: 'failed', progress: 0, error: err.message || 'Upload failed' }
            : item
        )
      );
      toast.error(`Failed to upload ${queueItem.file.name}: ${err.message}`);
    }
  }, [kind, moduleName, entityType, entityId, accessLevel, multiple, value, onChange, onUploadSuccess]);

  // Retry failed upload
  const retryUpload = useCallback((id: string) => {
    const item = queue.find((q) => q.id === id);
    if (item) {
      executeUpload(item);
    }
  }, [queue, executeUpload]);

  // Handle files dropped/selected
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems: UploadQueueItem[] = acceptedFiles.map((file) => {
      const fileNameLower = file.name.toLowerCase();
      const mimeType = file.type;
      
      const isImage = mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/jpg' || 
                      fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg') || fileNameLower.endsWith('.png');
                      
      const isPdf = mimeType === 'application/pdf' || fileNameLower.endsWith('.pdf');
      
      const isDocx = mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileNameLower.endsWith('.docx');
      
      if (!isImage && !isPdf && !isDocx) {
        return {
          id: Math.random().toString(36).substring(7),
          file,
          progress: 0,
          status: 'failed',
          controller: null,
          error: 'Only PDF, DOCX, and images (JPG, JPEG, PNG) are accepted.',
        };
      }
      
      const fileLimit = isImage ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
      if (file.size > fileLimit) {
        return {
          id: Math.random().toString(36).substring(7),
          file,
          progress: 0,
          status: 'failed',
          controller: null,
          error: `File size exceeds the limit of ${isImage ? '1 MB' : '2 MB'}`,
        };
      }

      return {
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending',
        controller: null,
      };
    });

    if (enableCrop && newItems.length > 0 && newItems[0].status === 'pending') {
      // Trigger image crop modal first
      const fileToCrop = newItems[0].file;
      setCropFile(fileToCrop);
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setZoom(1);
        setCropOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(fileToCrop);
    } else {
      // Add to upload queue instantly
      setQueue((prev) => multiple ? [...prev, ...newItems] : newItems);
      newItems.forEach((item) => {
        if (item.status === 'pending') {
          executeUpload(item);
        }
      });
    }
  }, [multiple, enableCrop, executeUpload, kind]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: kind === 'avatar' || kind === 'logo'
      ? { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] }
      : {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'application/pdf': ['.pdf'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
  });

  // Handle image crop logic using canvas
  const handleCropSave = async () => {
    if (!cropFile || !imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a fixed size for profile pictures (e.g. 500x500)
    const targetSize = 500;
    canvas.width = targetSize;
    canvas.height = targetSize;

    // Crop mathematics based on zoom, offsets, and image dimensions
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Center coordinates
    const size = Math.min(img.width, img.height);
    const cropSize = size / zoom;

    // Center starting point + drag offsets
    const sourceX = (img.width - cropSize) / 2 - (cropOffset.x / zoom);
    const sourceY = (img.height - cropSize) / 2 - (cropOffset.y / zoom);

    ctx.drawImage(
      img,
      Math.max(0, sourceX * scaleX),
      Math.max(0, sourceY * scaleY),
      Math.min(img.naturalWidth, cropSize * scaleX),
      Math.min(img.naturalHeight, cropSize * scaleY),
      0,
      0,
      targetSize,
      targetSize
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Image cropping failed');
          return;
        }

        const croppedFile = new File([blob], cropFile.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        // Add to queue and trigger upload
        const newItem: UploadQueueItem = {
          id: Math.random().toString(36).substring(7),
          file: croppedFile,
          progress: 0,
          status: 'pending',
          controller: null,
        };

        setQueue(multiple ? (prev) => [...prev, newItem] : [newItem]);
        setCropFile(null);
        setCropImageSrc('');
        executeUpload(newItem);
      },
      'image/jpeg',
      0.9
    );
  };

  // Image Drag logic inside crop modal
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingCrop(true);
    dragStart.current = { x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop) return;
    setCropOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDraggingCrop(false);
  };

  // Remove file from display
  const removeValue = (indexToRemove: number) => {
    if (onChange) {
      if (multiple && Array.isArray(value)) {
        const filtered = value.filter((_, idx) => idx !== indexToRemove);
        onChange(filtered);
      } else {
        onChange(undefined);
      }
    }
  };

  // Clean queue on unmount
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => {
        if (item.controller) {
          item.controller.abort();
        }
      });
    };
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[160px]
          ${isDragActive
            ? 'border-primary bg-primary/5 scale-[0.99] shadow-lg shadow-primary/10'
            : 'border-muted hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.005]'
          }`}
      >
        <input {...getInputProps()} />
        <div className="p-4 bg-primary/10 rounded-full text-primary mb-4 animate-bounce">
          <UploadCloud className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {isDragActive ? 'Drop your files here' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">
          Supports files up to {formatBytes(getMaxLimit())}
        </p>
      </div>

      {/* Upload Queue Section */}
      {queue.length > 0 && (
        <div className="mt-6 space-y-3.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Uploading queue
          </h4>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.id}
                className="bg-card/50 backdrop-blur-md border border-muted/50 rounded-xl p-3 flex.col space-y-2 shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.file.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                        {item.file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {formatBytes(item.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.status === 'uploading' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-full"
                        onClick={() => cancelUpload(item.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {item.status === 'failed' && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-primary hover:bg-primary/10 rounded-full"
                          onClick={() => retryUpload(item.id)}
                          title="Retry"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <span title={item.error}>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </span>
                      </>
                    )}
                    {item.status === 'completed' && (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    )}
                  </div>
                </div>

                {item.status === 'uploading' && (
                  <div className="space-y-1">
                    <Progress value={item.progress} className="h-1 bg-muted" />
                    <div className="flex justify-between text-[8px] font-mono text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{item.progress}%</span>
                    </div>
                  </div>
                )}
                {item.status === 'failed' && (
                  <p className="text-[9px] text-destructive font-medium bg-destructive/5 px-2 py-0.5 rounded border border-destructive/10">
                    {item.error || 'Upload failed'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Files Preview List */}
      {value && kind !== 'avatar' && (
        <div className="mt-6 space-y-3.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Selected Assets
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {multiple && Array.isArray(value) ? (
              value.map((val, idx) => (
                <div
                  key={idx}
                  className="relative group border border-muted/80 hover:border-primary/50 bg-card rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm transition-all"
                >
                  <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                    {val.includes('avatar') || val.includes('logo') ? (
                      <img src={val} alt="Asset" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-foreground truncate">
                      File ID/URL
                    </p>
                    <p className="text-[8px] text-muted-foreground font-mono truncate">
                      {val}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0 shadow-md"
                    onClick={() => removeValue(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            ) : (
              !multiple && typeof value === 'string' && (
                <div className="relative group border border-muted/80 hover:border-primary/50 bg-card rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm transition-all col-span-2">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0 overflow-hidden">
                    {value.includes('avatar') || value.includes('logo') || value.includes('image') || kind === 'logo' ? (
                      <img src={value} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      File Link
                    </p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate">
                      {value}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-1.5 -right-1.5 h-5.5 w-5.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity p-0 shadow-md"
                    onClick={() => removeValue(0)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Image Crop Dialog/Overlay */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-muted rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-muted flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Crop className="h-4.5 w-4.5 text-primary" /> Adjust Profile Image
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
                onClick={() => {
                  setCropImageSrc('');
                  setCropFile(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Cropping Canvas Viewport */}
            <div
              ref={containerRef}
              className="relative aspect-square bg-slate-950 flex items-center justify-center overflow-hidden cursor-move select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={cropImageSrc}
                alt="Crop Area"
                style={{
                  transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${zoom})`,
                  transition: isDraggingCrop ? 'none' : 'transform 0.15s ease-out',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                draggable={false}
              />
              {/* Circular mask for profile/avatar, square for general logo */}
              <div
                className={`absolute inset-0 pointer-events-none border-[3px] border-primary/45 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]
                  ${kind === 'avatar' ? 'rounded-full scale-[0.75] aspect-square' : 'scale-[0.8] aspect-square'}`}
              />
            </div>

            <div className="p-4 space-y-4 border-t border-muted bg-card/90">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCropImageSrc('');
                    setCropFile(null);
                  }}
                  className="rounded-lg text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCropSave}
                  className="rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Crop className="h-3.5 w-3.5" /> Crop & Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
