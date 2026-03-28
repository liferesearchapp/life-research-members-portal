import Link from "next/link";
import type { FC } from "react";
import PageRoutes from "../../routing/page-routes";
import Image from "next/image";
import logo from "../../../public/favicon.png";

const HomeLogo: FC = () => {
  return (
    <Link href={PageRoutes.home} className="logo" style={{ lineHeight: 0 }}>
      <Image src={logo} alt="logo" width={50} height={50} />
    </Link>
  );
};

export default HomeLogo;
