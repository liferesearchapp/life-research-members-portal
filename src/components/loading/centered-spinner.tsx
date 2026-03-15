import type { FC } from "react";
import { Spin } from "antd";

const CenteredSpinner: FC = () => {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Spin size="large"></Spin>
    </div>
  );
};

export default CenteredSpinner;
