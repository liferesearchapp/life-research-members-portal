import "@ant-design/v5-patch-for-react-19";
import { unstableSetRender as unstableSetRenderCjs } from "antd/lib/config-provider/UnstableContext";
import { createRoot, type Root } from "react-dom/client";

type RenderContainer = (Element | DocumentFragment) & {
  _reactRoot?: Root;
};

const setRender = (node: React.ReactNode, container: RenderContainer) => {
  container._reactRoot ||= createRoot(container);
  const root = container._reactRoot;

  root.render(node);

  return async () => {
    await Promise.resolve();
    root.unmount();
  };
};

unstableSetRenderCjs(setRender);
