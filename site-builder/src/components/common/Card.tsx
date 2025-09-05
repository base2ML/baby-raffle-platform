import React from 'react';
import classNames from 'classnames';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const shadowClasses = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow',
  lg: 'shadow-lg',
};

export default function Card({
  children,
  className,
  padding = 'md',
  shadow = 'sm',
  hover = false,
}: CardProps) {
  return (
    <div
      className={classNames(
        'bg-white rounded-lg border border-gray-200',
        paddingClasses[padding],
        shadowClasses[shadow],
        {
          'transition-shadow duration-200 hover:shadow-md': hover,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

// Card components for common layouts
export function CardHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={classNames('border-b border-gray-200 pb-4 mb-6', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <h3 className={classNames('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <p className={classNames('text-sm text-gray-600 mt-1', className)}>
      {children}
    </p>
  );
}

export function CardFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={classNames('border-t border-gray-200 pt-4 mt-6', className)}>
      {children}
    </div>
  );
}