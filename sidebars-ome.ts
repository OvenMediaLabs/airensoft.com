import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// Generated from upstream SUMMARY.md by scripts/migrate-docs.py.
// Top-level categories mirror the `##` group headings; nested
// categories mirror the bulleted indentation.
const sidebars: SidebarsConfig = {
  omeSidebar: [
    {type: 'html', value: "<span class=\"sidebar-manual-title\">OvenMediaEngine</span>", defaultStyle: true},
    {type: 'doc', id: "intro", label: "Introduction"},
    {
      type: 'category',
      label: "Quick Start",
      link: {type: 'doc', id: "quick-start/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "quick-start/test-player", label: "Online Demo"}
      ],
    },
    {
      type: 'category',
      label: "Getting Started",
      link: {type: 'doc', id: "getting-started/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "getting-started/getting-started-with-docker", label: "Getting Started with Docker"},
        {type: 'doc', id: "getting-started/getting-started-with-ome-docker-launcher", label: "Getting Started with OME Docker Launcher"}
      ],
    },
    {
      type: 'category',
      label: "Configuration",
      link: {type: 'doc', id: "configuration/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "configuration/tls-encryption", label: "TLS Encryption"},
        {type: 'doc', id: "configuration/ipv6", label: "IPv6"}
      ],
    },
    {
      type: 'category',
      label: "Live Source",
      link: {type: 'doc', id: "live-source/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "live-source/rtmp", label: "RTMP"},
        {type: 'doc', id: "live-source/webrtc", label: "WebRTC / WHIP"},
        {type: 'doc', id: "live-source/srt", label: "SRT"},
        {type: 'doc', id: "live-source/mpeg-2-ts-beta", label: "MPEG-2 TS"},
        {type: 'doc', id: "live-source/rtsp-pull", label: "RTSP Pull"},
        {type: 'doc', id: "live-source/scheduled-channel", label: "Scheduled Channel"},
        {type: 'doc', id: "live-source/multiplex-channel", label: "Multiplex Channel"}
      ],
    },
    {
      type: 'category',
      label: "ABR and Transcoding",
      link: {type: 'doc', id: "transcoding/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "transcoding/transcoding", label: "Transcoding"},
        {type: 'doc', id: "transcoding/abr", label: "ABR"},
        {type: 'doc', id: "transcoding/transcodewebhook", label: "TranscodeWebhook"},
        {type: 'doc', id: "transcoding/gpu-usage", label: "GPU Acceleration"}
      ],
    },
    {
      type: 'category',
      label: "Streaming",
      link: {type: 'doc', id: "streaming/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "streaming/webrtc-publishing", label: "WebRTC Streaming"},
        {type: 'doc', id: "streaming/low-latency-hls", label: "Low-Latency HLS"},
        {type: 'doc', id: "streaming/hls", label: "HLS"},
        {type: 'doc', id: "streaming/srt", label: "SRT"}
      ],
    },
    {type: 'doc', id: "crossdomains", label: "CrossDomains"},
    {
      type: 'category',
      label: "Access Control",
      link: {type: 'doc', id: "access-control/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "access-control/signedpolicy", label: "SignedPolicy"},
        {type: 'doc', id: "access-control/admission-webhooks", label: "AdmissionWebhooks"}
      ],
    },
    {type: 'doc', id: "origin-edge-clustering", label: "Clustering"},
    {
      type: 'category',
      label: "Subtitles",
      link: {type: 'doc', id: "subtitles/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "subtitles/realtime-speech-to-text", label: "Realtime Speech-to-Text"}
      ],
    },
    {type: 'doc', id: "thumbnail", label: "Thumbnail"},
    {type: 'doc', id: "recording", label: "Recording"},
    {type: 'doc', id: "push-publishing", label: "Push Publishing"},
    {
      type: 'category',
      label: "REST API",
      link: {type: 'doc', id: "rest-api/README"},
      collapsed: true,
      items: [
        {
          type: 'category',
          label: "v1",
          link: {type: 'doc', id: "rest-api/v1/README"},
          collapsed: true,
          items: [
            {
              type: 'category',
              label: "VirtualHost",
              link: {type: 'doc', id: "rest-api/v1/virtualhost/README"},
              collapsed: true,
              items: [
                {type: 'doc', id: "rest-api/v1/virtualhost/reload-certificate", label: "Reload Certificate"},
                {
                  type: 'category',
                  label: "Application",
                  link: {type: 'doc', id: "rest-api/v1/virtualhost/application/README"},
                  collapsed: true,
                  items: [
                    {type: 'doc', id: "rest-api/v1/virtualhost/application/output-profile", label: "Output Profile"},
                    {type: 'doc', id: "rest-api/v1/virtualhost/application/recording", label: "Record"},
                    {type: 'doc', id: "rest-api/v1/virtualhost/application/push", label: "Push"},
                    {
                      type: 'category',
                      label: "Stream",
                      link: {type: 'doc', id: "rest-api/v1/virtualhost/application/stream/README"},
                      collapsed: true,
                      items: [
                        {type: 'doc', id: "rest-api/v1/virtualhost/application/stream/send-event", label: "Send Event"},
                        {type: 'doc', id: "rest-api/v1/virtualhost/application/stream/send-event-1", label: "Send Subtitles"},
                        {type: 'doc', id: "rest-api/v1/virtualhost/application/stream/hls-dump", label: "HLS Dump"},
                        {type: 'doc', id: "rest-api/v1/virtualhost/application/stream/conclude-hls-live", label: "Conclude HLS Live"},
                        {type: 'doc', id: "rest-api/v1/virtualhost/application/stream/stt-control", label: "STT Control"}
                      ],
                    },
                    {type: 'doc', id: "rest-api/v1/virtualhost/application/scheduledchannel-api", label: "ScheduledChannel"},
                    {type: 'doc', id: "rest-api/v1/virtualhost/application/scheduledchannel-api-1", label: "MultiplexChannel"}
                  ],
                }
              ],
            },
            {
              type: 'category',
              label: "Statistics",
              link: {type: 'doc', id: "rest-api/v1/statistics/README"},
              collapsed: true,
              items: [
                {type: 'doc', id: "rest-api/v1/statistics/current", label: "Current"}
              ],
            },
            {
              type: 'category',
              label: "Managers",
              link: {type: 'doc', id: "rest-api/v1/managers/README"},
              collapsed: true,
              items: [
                {
                  type: 'category',
                  label: "API Server",
                  link: {type: 'doc', id: "rest-api/v1/managers/api-server/README"},
                  collapsed: true,
                  items: [
                    {type: 'doc', id: "rest-api/v1/managers/api-server/reload-certificate", label: "Reload Certificate"}
                  ],
                }
              ],
            }
          ],
        }
      ],
    },
    {type: 'doc', id: "alert", label: "Alert"},
    {type: 'doc', id: "performance-tuning", label: "Performance Tuning"},
    {type: 'doc', id: "logs-and-statistics", label: "Logs and Statistics"},
    {type: 'doc', id: "troubleshooting", label: "Troubleshooting"},
    {type: 'doc', id: "p2p-delivery", label: "P2P Delivery (Experiment)"}
  ],
};

export default sidebars;
