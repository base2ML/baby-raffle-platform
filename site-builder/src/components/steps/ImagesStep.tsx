import React from 'react';
import { PhotoUploadStep } from './PhotoUploadStep';

interface ImagesStepProps {
  onNext: () => void;
  onBack: () => void;
}

const ImagesStep: React.FC<ImagesStepProps> = ({ onNext, onBack }) => {
  return <PhotoUploadStep onNext={onNext} onBack={onBack} />;
};

export default ImagesStep;