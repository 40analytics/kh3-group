'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Leads error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Failed to load leads
        </h2>
        <p className="text-gray-600 mb-6">
          Could not fetch leads data. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Try again
        </button>
      </div>
    </div>
  );
}
