import React from 'react';
import { useParams } from 'react-router';
import CostAnalysisDashboard from '@/components/CostAnalysis/CostAnalysisDashboard';
import useStoreApp from '@/store/app';

const CostAnalysisPage = () => {
  const { storeCode } = useParams();
  const { storeActive } = useStoreApp();

  return (
    <CostAnalysisDashboard 
      storeId={storeActive?._id}
      storeCode={storeCode}
    />
  );
};

export default CostAnalysisPage;
