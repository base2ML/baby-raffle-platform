import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Eye, Edit3, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStepData } from '../../contexts/SiteBuilderContext';
import { apiClient, uploadHelpers } from '../../utils/api';
import { UploadedFile, SlideshowImage } from '../../types';
import Button from '../common/Button';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import ProgressBar from '../common/ProgressBar';

interface PhotoUploadStepData {
  uploaded_files: UploadedFile[];
  slideshow_images: SlideshowImage[];
}

export default function PhotoUploadStep() {
  const { data, updateData } = useStepData<PhotoUploadStepData>(2);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  const uploadedFiles = data?.uploaded_files || [];
  const slideshowImages = data?.slideshow_images || [];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Validate files
    const validation = uploadHelpers.validateMultipleImages(acceptedFiles);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Upload files
      const newFiles = await uploadHelpers.uploadMultipleFiles(
        acceptedFiles,
        setUploadProgress
      );

      // Update step data
      updateData({
        uploaded_files: [...uploadedFiles, ...newFiles],
      });

      toast.success(`Successfully uploaded ${newFiles.length} image(s)!`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadedFiles, updateData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    disabled: isUploading,
  });

  const handleDeleteFile = async (fileId: string) => {
    try {
      await apiClient.deleteFile(fileId);
      
      const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
      const updatedSlideshow = slideshowImages.filter(img => img.file_id !== fileId);
      
      updateData({
        uploaded_files: updatedFiles,
        slideshow_images: updatedSlideshow,
      });
      
      toast.success('Image deleted successfully');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const handleAddToSlideshow = async (file: UploadedFile) => {
    try {
      const slideshowImage = await apiClient.addToSlideshow({
        file_id: file.id,
        title: file.original_filename.split('.')[0],
        display_order: slideshowImages.length,
        is_active: true,
      });

      updateData({
        slideshow_images: [...slideshowImages, slideshowImage],
      });

      toast.success('Added to slideshow!');
    } catch (error) {
      toast.error('Failed to add to slideshow');
    }
  };

  const handleRemoveFromSlideshow = async (slideshowId: string) => {
    try {
      await apiClient.removeFromSlideshow(slideshowId);
      
      const updatedSlideshow = slideshowImages.filter(img => img.id !== slideshowId);
      updateData({
        slideshow_images: updatedSlideshow,
      });
      
      toast.success('Removed from slideshow');
    } catch (error) {
      toast.error('Failed to remove from slideshow');
    }
  };

  const isInSlideshow = (fileId: string) => {
    return slideshowImages.some(img => img.file_id === fileId);
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <div className="text-center py-6">
          <ImageIcon className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Your Photos
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Add photos that will be displayed in a slideshow on your baby raffle site. 
            These could be ultrasound images, nursery photos, or pictures of the expecting parents.
          </p>
        </div>
      </Card>

      {/* Upload Area */}
      <Card>
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          `}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="space-y-4">
              <LoadingSpinner size="lg" />
              <div>
                <p className="text-sm text-gray-600 mb-2">Uploading images...</p>
                <ProgressBar progress={uploadProgress} showPercentage />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop images here' : 'Upload Images'}
                </p>
                <p className="text-sm text-gray-600">
                  Drag and drop images here, or click to select files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Uploaded Images */}
      {uploadedFiles.length > 0 && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-4">
            Uploaded Images ({uploadedFiles.length})
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={file.url}
                    alt={file.original_filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                
                {/* Image Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFile(file)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {isInSlideshow(file.id) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const slideshowImage = slideshowImages.find(img => img.file_id === file.id);
                        if (slideshowImage) {
                          handleRemoveFromSlideshow(slideshowImage.id);
                        }
                      }}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddToSlideshow(file)}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Slideshow Indicator */}
                {isInSlideshow(file.id) && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Slideshow Preview */}
      {slideshowImages.length > 0 && (
        <Card>
          <h4 className="font-medium text-gray-900 mb-4">
            Slideshow Images ({slideshowImages.length})
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            These images will appear in your site's slideshow in this order:
          </p>
          
          <div className="space-y-3">
            {slideshowImages
              .sort((a, b) => a.display_order - b.display_order)
              .map((image, index) => (
                <div key={image.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={image.url}
                      alt={image.title || 'Slideshow image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {image.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Position {index + 1} in slideshow
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFromSlideshow(image.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Requirements */}
      <Card>
        <h4 className="font-medium text-gray-900 mb-3">📋 Photo Requirements:</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            At least 3-5 images recommended for a good slideshow
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            JPG, PNG, GIF, or WebP formats supported
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Maximum 10MB per image
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            Images will be automatically resized for optimal display
          </li>
        </ul>
      </Card>

      {/* Image Viewer Modal */}
      {selectedFile && (
        <ImageViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}

// Image Viewer Modal Component
function ImageViewer({ 
  file, 
  onClose 
}: { 
  file: UploadedFile; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="bg-white bg-opacity-90 hover:bg-opacity-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <img
          src={file.url}
          alt={file.original_filename}
          className="max-w-full max-h-[80vh] object-contain"
        />
        
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900">{file.original_filename}</h3>
          <p className="text-sm text-gray-500">
            {uploadHelpers.formatFileSize(file.size)} • {file.content_type}
          </p>
        </div>
      </div>
    </div>
  );
}