import React from 'react';
import { useParams } from 'react-router-dom';
import SharedProfileView from '@/components/SharedProfileView';

const SharedProfile: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Invalid share link</p>
      </div>
    );
  }

  return <SharedProfileView token={token} />;
};

export default SharedProfile;
