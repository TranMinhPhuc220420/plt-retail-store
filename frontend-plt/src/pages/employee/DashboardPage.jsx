import DemoChartTooltip from '@/components/chart/DemoDefaultTooltip';
import DemoSegmentedLine from '@/components/chart/DemoSegmentedLine';
import DemoMemo from '@/components/chart/DemoMemo';
import SalesAuthDemo from '@/components/demo/SalesAuthDemo';
import { useEffect } from 'react';
import { getAllProducts } from '@/request/product';

const DashboardEmployeePage = () => {

  const loadTest = () => {
    getAllProducts()
  }

  useEffect(() => {
    loadTest();
  }, []);

  return (
    <div>
      <SalesAuthDemo />
    </div>
  );
};

export default DashboardEmployeePage;