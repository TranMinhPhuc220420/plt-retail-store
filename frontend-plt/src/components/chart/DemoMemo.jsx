import { Pie } from '@ant-design/plots';
import { Button } from 'antd';
import { isEqual } from 'lodash';
import React, { memo, useState } from 'react';
import { createRoot } from 'react-dom';

const DemoPie = memo(
  ({ data, onReady }) => {
    var config = {
      data,
      angleField: 'value',
      colorField: 'type',
      label: {
        text: 'value',
        position: 'outside',
      },
      onReady,
    };
    return <Pie {...config} />;
  },
  (pre, next) => {
    return isEqual(pre?.data, next?.data);
  },
);

const DemoMemo = () => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState([
    {
      type: 'Danh mục 1',
      value: 27,
    },
    {
      type: 'Danh mục 2',
      value: 25,
    },
    {
      type: 'Danh mục 3',
      value: 18,
    },
    {
      type: 'Danh mục 4',
      value: 15,
    },
    {
      type: 'Danh mục 5',
      value: 10,
    },
    {
      type: 'Khác',
      value: 5,
    },
  ]);

  return (
    <div>
      <Button
        onClick={() => {
          setCount(count + 1);
        }}
      >
        Không render lại
      </Button>
      <Button
        style={{ margin: '0 10px' }}
        type="primary"
        onClick={() => {
          setData(data.map((d) => ({ ...d, value: Math.floor(Math.random() * 100) })));
        }}
      >
        Render lại
      </Button>
      <span>{count}</span>
      <DemoPie data={data} onReady={({ chart }) => {}} />
    </div>
  );
};

export default DemoMemo;
