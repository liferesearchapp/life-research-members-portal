/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Ant Design v4 and its rc-* dependencies ship /es/ (ESM) builds that
  // Node.js cannot require() directly. transpilePackages tells Next.js to
  // run them through SWC so the server bundle gets valid CJS.
  transpilePackages: [
    "antd",
    "rc-util",
    "rc-pagination",
    "rc-picker",
    "rc-field-form",
    "rc-input",
    "rc-table",
    "rc-select",
    "rc-tree",
    "rc-tree-select",
    "rc-virtual-list",
    "rc-upload",
    "rc-dropdown",
    "rc-menu",
    "rc-motion",
    "rc-trigger",
    "rc-align",
    "rc-cascader",
    "rc-checkbox",
    "rc-collapse",
    "rc-dialog",
    "rc-drawer",
    "rc-image",
    "rc-input-number",
    "rc-mentions",
    "rc-notification",
    "rc-overflow",
    "rc-progress",
    "rc-rate",
    "rc-resize-observer",
    "rc-segmented",
    "rc-slider",
    "rc-steps",
    "rc-switch",
    "rc-tabs",
    "rc-textarea",
    "rc-tooltip",
    "@ant-design/icons",
    "@ant-design/icons-svg",
    "@ant-design/colors",
  ],
  eslint: {
    // ESLint is run separately via `npm run lint`; skip it during `next build`
    // because eslint-config-next 15 misresolves rule paths with a src/ layout.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
