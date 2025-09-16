import React from 'react';
import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <ApperIcon name="AlertTriangle" size={64} className="text-primary-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;