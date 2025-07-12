import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form"

// I18n
import { useTranslation } from "react-i18next";

// Antd design
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";

// Firebase
import { updateEmployee } from "@/database";

import { EMPLOYEE_LEVEL, BRANCH_LIST, POSITION_LIST } from "@/constant";

const EditEmployee = ({ employeeId, employeeEdit, onOK, onFail, onCancel }) => {
  // i18n
  const { t } = useTranslation();

  // State
  const [isLoading, setIsLoading] = useState(false);

  // Form
  const { register, handleSubmit, resetField, formState: { errors }, } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    // Convert string to number
    data.salary = parseFloat(data.salary);
    data.branch = parseInt(data.branch);
    data.position = parseInt(data.position);
    data.level = parseInt(data.level);

    // Add employee to database
    let isSuccess = await updateEmployee(employeeId, data);

    if (isSuccess) {
      resetField("name");
      resetField("position");
      resetField("branch");
      resetField("level");
      resetField("salary");

      onOK();
    }
    else {
      onFail();
    }

    setIsLoading(false);
  };

  const handlerCancel = () => {
    resetField("name");
    resetField("position");
    resetField("branch");
    resetField("level");
    resetField("salary");

    onCancel();
  };

  // Set default values for the form fields
  useEffect(() => {
    if (employeeEdit) {
      resetField("name", { defaultValue: employeeEdit.name });
      resetField("position", { defaultValue: employeeEdit.position });
      resetField("branch", { defaultValue: employeeEdit.branch });
      resetField("level", { defaultValue: employeeEdit.level });
      resetField("salary", { defaultValue: employeeEdit.salary });
    }
    console.log(employeeEdit);

  }, [employeeEdit, resetField]);

  return (
    <div>

      <form>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white">
          <div className="">
            <label className="block mb-2">{t('LABEL_NAME')}</label>
            <input
              type="text"
              {...register("name", { required: true })}
              className={`border rounded-md p-2 w-full ${errors.name ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.name && <span className="text-red-500">{t('MSG_ERROR_REQUIRED')}</span>}
          </div>

          <div className="">
            <label className="block mb-2">{t('LABEL_BRANCH')}</label>
            <select
              {...register("branch", { required: true })}
              className={`border rounded-md p-2 w-full ${errors.branch ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select branch</option>
              {BRANCH_LIST.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            {errors.branch && <span className="text-red-500">{t('MSG_ERROR_REQUIRED')}</span>}
          </div>

          <div className="">
            <label className="block mb-2">{t('LABEL_POSITION')}</label>
            <select
              {...register("position", { required: true })}
              className={`border rounded-md p-2 w-full ${errors.position ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select position</option>
              {POSITION_LIST.map((position) => (
                <option key={position.id} value={position.id}>{position.name}</option>
              ))}
            </select>
            {errors.position && <span className="text-red-500">{t('MSG_ERROR_REQUIRED')}</span>}
          </div>

          <div className="">
            <label className="block mb-2">{t('LABEL_LEVEL')}</label>
            <select
              {...register("level", { required: true })}
              className={`border rounded-md p-2 w-full ${errors.level ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Select level</option>
              {Object.keys(EMPLOYEE_LEVEL).map((key) => (
                <option key={key} value={key}>{EMPLOYEE_LEVEL[key]}</option>
              ))}
            </select>
            {errors.level && <span className="text-red-500">{t('MSG_ERROR_REQUIRED')}</span>}
          </div>

          <div className="">
            <label className="block mb-2">{t('LABEL_SALARY')}</label>
            <input
              type="number"
              {...register("salary", { required: true })}
              className={`border rounded-md p-2 w-full ${errors.salary ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.salary && <span className="text-red-500">{t('MSG_ERROR_REQUIRED')}</span>}
          </div>
        </div>

        <div className="flex justify-end px-4">
          <Button type="default" danger className="mr-2" onClick={handlerCancel} disabled={isLoading} icon={<CloseOutlined />}>
            {t('TXT_CANCEL')}
          </Button>
          <Button type="primary" onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={isLoading} icon={<SaveOutlined />}>
            {t('TXT_SAVE')}
          </Button>
        </div>

      </form>


    </div>
  );
}

export default EditEmployee;