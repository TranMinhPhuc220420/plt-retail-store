import DemoChartTooltip from '@/components/chart/DemoDefaultTooltip';
import DemoSegmentedLine from '@/components/chart/DemoSegmentedLine';
import DemoMemo from '@/components/chart/DemoMemo';

const DashboardPage = () => {
  return (
    <div className="h-full mt-2 p-4 bg-gray-100 overflow-auto">
      <div className='grid gap-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='bg-white p-4 rounded shadow'>
            <h3 className='text-lg font-medium mb-2'>Default Tooltip Chart</h3>
            <DemoChartTooltip />
          </div>

          <div className='bg-white p-4 rounded shadow'>
            <h3 className='text-lg font-medium mb-2'>Segmented Line Chart</h3>
            <DemoSegmentedLine />
          </div>
        </div>

        <div className='bg-white p-4 rounded shadow'>
          <h3 className='text-lg font-medium mb-2'>Memoized Pie Chart</h3>
          <DemoMemo />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;