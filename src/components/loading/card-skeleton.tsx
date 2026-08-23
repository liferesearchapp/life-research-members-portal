import type { FC } from "react";
import { Card, Skeleton } from "antd";

const CardSkeleton: FC = () => {
  return <Card loading title={<Skeleton paragraph={false} active style={{ margin: 0 }} />} />;
};

export default CardSkeleton;
