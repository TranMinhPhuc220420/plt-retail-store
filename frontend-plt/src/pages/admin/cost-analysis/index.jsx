import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import CostAnalysisDashboard from '@/components/CostAnalysis/CostAnalysisDashboard';
import useStoreApp from '@/store/app';

import { getAccessToken } from '@/request/auth';

const CostAnalysisPage = () => {
  const { storeCode } = useParams();
  const { storeActive } = useStoreApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const fetchAccessToken = async () => {
      try {
        const tokenData = await getAccessToken();
        setAccessToken(tokenData.accessToken);
      } catch (err) {
        setError('Failed to fetch access token');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccessToken();
  }, [storeCode]);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }
  if (!storeActive) {
    return <div>No active store found</div>;
  }

  return (
    <CostAnalysisDashboard
      loading={loading}
      error={error}
      accessToken={accessToken}
      storeId={storeActive?._id}
      storeCode={storeCode}
    />
  );
};

export default CostAnalysisPage;
