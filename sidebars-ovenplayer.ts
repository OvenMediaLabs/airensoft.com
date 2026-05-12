import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// Generated from upstream SUMMARY.md by scripts/migrate-docs.py.
// Top-level categories mirror the `##` group headings; nested
// categories mirror the bulleted indentation.
const sidebars: SidebarsConfig = {
  ovenplayerSidebar: [
    {type: 'html', value: "<span class=\"sidebar-manual-title\">OvenPlayer</span>", defaultStyle: true},
    {type: 'doc', id: "intro", label: "Introduction"},
    {type: 'doc', id: "initialization", label: "Initialization"},
    {type: 'doc', id: "error-handling", label: "Error Handling"},
    {type: 'doc', id: "builds", label: "Builds"},
    {type: 'doc', id: "customize", label: "UI Customize"},
    {type: 'html', value: "<span class=\"sidebar-group-label\">API Reference</span>", defaultStyle: true},
    {type: 'doc', id: "api-reference/api", label: "API"},
    {type: 'doc', id: "api-reference/events", label: "Event"},
    {type: 'html', value: "<span class=\"sidebar-group-label\">Examples</span>", defaultStyle: true},
    {type: 'doc', id: "examples/playlist", label: "Playlist"},
    {type: 'doc', id: "examples/captions", label: "Captions"},
    {type: 'doc', id: "examples/ads", label: "Ads"},
    {type: 'doc', id: "examples/runs-on-webserver", label: "Run-on WebServer"}
  ],
};

export default sidebars;
