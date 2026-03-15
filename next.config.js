/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // antd v5 and its rc-* dependencies still require SWC transpilation for SSR
  // because rc-* packages resolve to their ESM builds in some import contexts.
  transpilePackages: [
    "antd",
    "@ant-design/cssinjs",
    "@ant-design/icons",
    "@ant-design/icons-svg",
    "@ant-design/colors",
    "rc-cascader",
    "rc-checkbox",
    "rc-collapse",
    "rc-dialog",
    "rc-drawer",
    "rc-dropdown",
    "rc-field-form",
    "rc-image",
    "rc-input",
    "rc-input-number",
    "rc-mentions",
    "rc-menu",
    "rc-motion",
    "rc-notification",
    "rc-overflow",
    "rc-pagination",
    "rc-picker",
    "rc-progress",
    "rc-rate",
    "rc-resize-observer",
    "rc-segmented",
    "rc-select",
    "rc-slider",
    "rc-steps",
    "rc-switch",
    "rc-table",
    "rc-tabs",
    "rc-textarea",
    "rc-tooltip",
    "rc-tree",
    "rc-tree-select",
    "rc-upload",
    "rc-util",
    "rc-virtual-list",
  ],
  eslint: {
    // ESLint is run separately via `npm run lint`; skip it during `next build`
    // because eslint-config-next 15 misresolves rule paths with a src/ layout.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
