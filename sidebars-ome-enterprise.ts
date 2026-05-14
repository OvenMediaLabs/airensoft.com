import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// Generated from upstream SUMMARY.md by scripts/migrate-docs.py.
// Top-level categories mirror the `##` group headings; nested
// categories mirror the bulleted indentation.
const sidebars: SidebarsConfig = {
  omeEnterpriseSidebar: [
    {type: 'html', value: "<span class=\"sidebar-manual-title\">OvenMediaEngine Enterprise</span>", defaultStyle: true},
    {type: 'html', value: "<span class=\"sidebar-group-label\">ABOUT</span>", defaultStyle: true},
    {type: 'doc', id: "intro", label: "Introduction"},
    {
      type: 'category',
      label: "Release Notes",
      link: {type: 'doc', id: "about/release-notes/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "about/release-notes/0.20.6", label: "0.20.6"},
        {type: 'doc', id: "about/release-notes/0.20.5", label: "0.20.5"},
        {type: 'doc', id: "about/release-notes/0.20.4", label: "0.20.4"},
        {type: 'doc', id: "about/release-notes/0.20.3", label: "0.20.3"},
        {type: 'doc', id: "about/release-notes/0.20.2", label: "0.20.2"},
        {type: 'doc', id: "about/release-notes/0.20.1", label: "0.20.1"},
        {type: 'doc', id: "about/release-notes/0.20.0", label: "0.20.0"},
        {type: 'doc', id: "about/release-notes/0.19.2", label: "0.19.2"},
        {type: 'doc', id: "about/release-notes/0.19.1", label: "0.19.1"},
        {type: 'doc', id: "about/release-notes/0.19.0", label: "0.19.0"},
        {type: 'doc', id: "about/release-notes/0.18.3", label: "0.18.3"},
        {type: 'doc', id: "about/release-notes/0.18.2", label: "0.18.2"},
        {type: 'doc', id: "about/release-notes/0.18.1", label: "0.18.1"},
        {type: 'doc', id: "about/release-notes/0.18.0", label: "0.18.0"},
        {type: 'doc', id: "about/release-notes/0.17.3", label: "0.17.3"},
        {type: 'doc', id: "about/release-notes/0.17.2", label: "0.17.2"},
        {type: 'doc', id: "about/release-notes/0.17.1", label: "0.17.1"},
        {type: 'doc', id: "about/release-notes/0.17.0", label: "0.17.0"},
        {type: 'doc', id: "about/release-notes/0.16.8", label: "0.16.8"},
        {type: 'doc', id: "about/release-notes/0.16.7", label: "0.16.7"},
        {type: 'doc', id: "about/release-notes/0.16.6", label: "0.16.6"},
        {type: 'doc', id: "about/release-notes/0.16.5", label: "0.16.5"},
        {type: 'doc', id: "about/release-notes/0.16.4", label: "0.16.4"}
      ],
    },
    {type: 'html', value: "<span class=\"sidebar-group-label\">Pre-Built Package Installation</span>", defaultStyle: true},
    {
      type: 'category',
      label: "Getting Started",
      link: {type: 'doc', id: "pre-built-package-installation/getting-started/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "pre-built-package-installation/getting-started/getting-started-with-linux", label: "Getting Started with Linux"},
        {type: 'doc', id: "pre-built-package-installation/getting-started/getting-started-with-docker", label: "Getting Started with Docker"}
      ],
    },
    {
      type: 'category',
      label: "Configuration Structure",
      link: {type: 'doc', id: "pre-built-package-installation/configuration-structure/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "pre-built-package-installation/configuration-structure/tls-encryption", label: "TLS Encryption"},
        {type: 'doc', id: "pre-built-package-installation/configuration-structure/ipv6", label: "IPv6"}
      ],
    },
    {type: 'html', value: "<span class=\"sidebar-group-label\">Enterprise Only</span>", defaultStyle: true},
    {
      type: 'category',
      label: "AWS Marketplace",
      link: {type: 'doc', id: "exclusive/aws-marketplace/README"},
      collapsed: true,
      items: [
        {
          type: 'category',
          label: "Getting Started on AWS",
          link: {type: 'doc', id: "exclusive/aws-marketplace/getting-started-on-aws/README"},
          collapsed: true,
          items: [
            {type: 'doc', id: "exclusive/aws-marketplace/getting-started-on-aws/inbound-security-group-rules", label: "Inbound Security Group Rules"},
            {type: 'doc', id: "exclusive/aws-marketplace/getting-started-on-aws/automatic-log-cleanup", label: "Automatic Log Cleanup"}
          ],
        },
        {
          type: 'category',
          label: "Publish Streams",
          link: {type: 'doc', id: "exclusive/aws-marketplace/publish-streams/README"},
          collapsed: true,
          items: [
            {type: 'doc', id: "exclusive/aws-marketplace/publish-streams/publish-overview", label: "Publish Overview"},
            {type: 'doc', id: "exclusive/aws-marketplace/publish-streams/publish-via-rtsp-pull-cctv", label: "Publish via RTSP Pull (CCTV)"},
            {type: 'doc', id: "exclusive/aws-marketplace/publish-streams/publish-via-webrtc-whip", label: "Publish via WebRTC/WHIP"},
            {type: 'doc', id: "exclusive/aws-marketplace/publish-streams/publish-via-srt", label: "Publish via SRT"},
            {type: 'doc', id: "exclusive/aws-marketplace/publish-streams/publish-via-rtmp-e-rtmp", label: "Publish via RTMP/E-RTMP"}
          ],
        },
        {type: 'doc', id: "exclusive/aws-marketplace/event-monitoring-on-aws", label: "Event Monitoring on AWS"},
        {
          type: 'category',
          label: "SSL Configuration on AWS",
          link: {type: 'doc', id: "exclusive/aws-marketplace/ssl-configuration-on-aws/README"},
          collapsed: true,
          items: [
            {type: 'doc', id: "exclusive/aws-marketplace/ssl-configuration-on-aws/custom-ssl-certificate-file-guide", label: "Custom SSL Certificate File Guide"}
          ],
        },
        {
          type: 'category',
          label: "Troubleshooting on AWS",
          link: {type: 'doc', id: "exclusive/aws-marketplace/troubleshooting-on-aws/README"},
          collapsed: true,
          items: [
            {type: 'doc', id: "exclusive/aws-marketplace/troubleshooting-on-aws/license-error-resolution", label: "License Error Resolution"},
            {type: 'doc', id: "exclusive/aws-marketplace/troubleshooting-on-aws/recover-https-ssl-access", label: "Recover HTTPS (SSL) Access"},
            {type: 'doc', id: "exclusive/aws-marketplace/troubleshooting-on-aws/support-request-process", label: "Support Request Process"}
          ],
        }
      ],
    },
    {
      type: 'category',
      label: "Web Console",
      link: {type: 'doc', id: "exclusive/web-console/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "exclusive/web-console/getting-started-with-web-console", label: "Getting Started with Web Console"},
        {
          type: 'category',
          label: "Web Console Overview",
          link: {type: 'doc', id: "exclusive/web-console/web-console-overview/README"},
          collapsed: true,
          items: [
            {type: 'doc', id: "exclusive/web-console/web-console-overview/sign-in", label: "Sign In"},
            {type: 'doc', id: "exclusive/web-console/web-console-overview/change-password", label: "Change Password"},
            {type: 'doc', id: "exclusive/web-console/web-console-overview/web-console-home", label: "Web Console Home"},
            {
              type: 'category',
              label: "Stream List",
              link: {type: 'doc', id: "exclusive/web-console/web-console-overview/stream-list/README"},
              collapsed: true,
              items: [
                {type: 'doc', id: "exclusive/web-console/web-console-overview/stream-list/managed-and-instant-streams", label: "Managed and Instant Streams"},
                {type: 'doc', id: "exclusive/web-console/web-console-overview/stream-list/scheduled-channels", label: "Scheduled Channels"},
                {type: 'doc', id: "exclusive/web-console/web-console-overview/stream-list/multiplex-channels", label: "Multiplex Channels"}
              ],
            },
            {
              type: 'category',
              label: "Event Monitoring",
              link: {type: 'doc', id: "exclusive/web-console/web-console-overview/event-monitoring/README"},
              collapsed: true,
              items: [
                {type: 'doc', id: "exclusive/web-console/web-console-overview/event-monitoring/configuration", label: "Configuration"},
                {type: 'doc', id: "exclusive/web-console/web-console-overview/event-monitoring/event-specification", label: "Event Specification"}
              ],
            },
            {type: 'doc', id: "exclusive/web-console/web-console-overview/web-console-publishing", label: "Web Console Publishing"},
            {type: 'doc', id: "exclusive/web-console/web-console-overview/logs", label: "Logs"},
            {type: 'doc', id: "exclusive/web-console/web-console-overview/configuration-files", label: "Configuration Files"},
            {type: 'doc', id: "exclusive/web-console/web-console-overview/quick-abr-setup", label: "Quick ABR Setup"},
            {type: 'doc', id: "exclusive/web-console/web-console-overview/restart", label: "Restart"}
          ],
        },
        {
          type: 'category',
          label: "Web Console Settings",
          link: {type: 'doc', id: "exclusive/web-console/web-console-settings/README"},
          collapsed: true,
          items: [
            {type: 'doc', id: "exclusive/web-console/web-console-settings/server-settings", label: "Server Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/live-sources-ingress-settings", label: "Live Sources (Ingress) Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/abr-and-transcoding-settings", label: "ABR and Transcoding Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/streaming-egress-settings", label: "Streaming (Egress) Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/tls-encryption-settings", label: "TLS Encryption Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/access-control-settings", label: "Access Control Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/thumbnail-settings", label: "Thumbnail Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/recording-settings", label: "Recording Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/push-publishing-settings", label: "Push Publishing Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/rest-api-settings", label: "REST API Settings"},
            {type: 'doc', id: "exclusive/web-console/web-console-settings/alert-settings", label: "Alert Settings"}
          ],
        }
      ],
    },
    {type: 'doc', id: "exclusive/exclusive-feature-index", label: "Exclusive Feature Index"},
    {type: 'html', value: "<span class=\"sidebar-group-label\">FEATURES</span>", defaultStyle: true},
    {
      type: 'category',
      label: "Live Source",
      link: {type: 'doc', id: "features/live-source/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "features/live-source/rtmp", label: "RTMP"},
        {type: 'doc', id: "features/live-source/webrtc-whip", label: "WebRTC / WHIP"},
        {type: 'doc', id: "features/live-source/srt", label: "SRT"},
        {type: 'doc', id: "features/live-source/mpeg-2-ts", label: "MPEG-2 TS"},
        {type: 'doc', id: "features/live-source/rtsp-pull", label: "RTSP Pull"},
        {type: 'doc', id: "features/live-source/scheduled-channel", label: "Scheduled Channel"},
        {type: 'doc', id: "features/live-source/multiplex-channel", label: "Multiplex Channel"},
        {type: 'doc', id: "features/live-source/multicast", label: "Multicast"}
      ],
    },
    {
      type: 'category',
      label: "Transcoding & Processing",
      link: {type: 'doc', id: "features/transcoding-and-processing/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "features/transcoding-and-processing/transcoding", label: "Transcoding"},
        {type: 'doc', id: "features/transcoding-and-processing/abr", label: "ABR"},
        {type: 'doc', id: "features/transcoding-and-processing/transcodewebhook", label: "TranscodeWebhook"},
        {type: 'doc', id: "features/transcoding-and-processing/hardware-encoder-support", label: "Hardware Encoder Support"},
        {type: 'doc', id: "features/transcoding-and-processing/thumbnail", label: "Thumbnail"},
        {
          type: 'category',
          label: "Subtitles",
          link: {type: 'doc', id: "features/transcoding-and-processing/subtitles/README"},
          collapsed: true,
          items: [
            {type: 'doc', id: "features/transcoding-and-processing/subtitles/realtime-speech-to-text", label: "Realtime Speech-to-Text"}
          ],
        },
        {type: 'doc', id: "features/transcoding-and-processing/image-overlay", label: "Image Overlay"},
        {type: 'doc', id: "features/transcoding-and-processing/skip-frames", label: "Skip Frames"}
      ],
    },
    {
      type: 'category',
      label: "Streaming & Distribution",
      link: {type: 'doc', id: "features/streaming-and-distribution/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "features/streaming-and-distribution/webrtc-streaming", label: "WebRTC Streaming"},
        {type: 'doc', id: "features/streaming-and-distribution/low-latency-hls", label: "Low-Latency HLS"},
        {type: 'doc', id: "features/streaming-and-distribution/hls", label: "HLS"},
        {type: 'doc', id: "features/streaming-and-distribution/srt", label: "SRT"},
        {type: 'doc', id: "features/streaming-and-distribution/recording", label: "Recording"},
        {type: 'doc', id: "features/streaming-and-distribution/push-publishing", label: "Push Publishing"}
      ],
    },
    {
      type: 'category',
      label: "Access Control & Security",
      link: {type: 'doc', id: "features/access-control-and-security/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "features/access-control-and-security/signedpolicy", label: "SignedPolicy"},
        {type: 'doc', id: "features/access-control-and-security/admissionwebhooks", label: "AdmissionWebhooks"},
        {
          type: 'category',
          label: "Digital Rights Management (DRM)",
          link: {type: 'doc', id: "features/access-control-and-security/digital-rights-management-drm/README"},
          collapsed: true,
          items: [
            {type: 'doc', id: "features/access-control-and-security/digital-rights-management-drm/ovenmediaengine-configuration-for-drm", label: "OvenMediaEngine Configuration for DRM"},
            {type: 'doc', id: "features/access-control-and-security/digital-rights-management-drm/pallycon-drm-configuration", label: "PallyCon DRM Configuration"}
          ],
        },
        {type: 'doc', id: "features/access-control-and-security/rtmp-authentication", label: "RTMP Authentication"},
        {type: 'doc', id: "features/access-control-and-security/sha-2-support", label: "SHA-2 Support"}
      ],
    },
    {
      type: 'category',
      label: "High Availability",
      link: {type: 'doc', id: "features/high-availability/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "features/high-availability/clustering", label: "Clustering"},
        {type: 'doc', id: "features/high-availability/origin-redundancy", label: "Origin Redundancy"}
      ],
    },
    {
      type: 'category',
      label: "Operations & Monitoring",
      link: {type: 'doc', id: "features/operations-and-monitoring/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "features/operations-and-monitoring/crossdomains", label: "CrossDomains"},
        {type: 'doc', id: "features/operations-and-monitoring/api-storage", label: "API Storage"},
        {type: 'doc', id: "features/operations-and-monitoring/recording-delivery", label: "Recording Delivery"},
        {type: 'doc', id: "features/operations-and-monitoring/enhanced-alert", label: "Enhanced Alert"},
        {type: 'doc', id: "features/operations-and-monitoring/performance-tuning", label: "Performance Tuning"},
        {type: 'doc', id: "features/operations-and-monitoring/logs-and-statistics", label: "Logs and Statistics"},
        {type: 'doc', id: "features/operations-and-monitoring/troubleshooting", label: "Troubleshooting"}
      ],
    },
    {
      type: 'category',
      label: "Workflow Integration & External System Connectivity",
      link: {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/cdn-cache-control", label: "CDN Cache Control"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/proxy-protocol", label: "Proxy Protocol"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/sei-insertion", label: "SEI Insertion"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/amf0-message-insertion", label: "AMF0 Message Insertion"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/ad-markers", label: "Ad Markers"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/oncuepoint-message-insertion", label: "onCuePoint Message Insertion"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/delay-buffer", label: "Delay Buffer"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/query-string-handling", label: "Query String Handling"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/default-playlist-creation", label: "Default Playlist Creation"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/ios-audio-pts", label: "iOS Audio PTS"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/session-management-webrtc-only", label: "Session Management (WebRTC Only)"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/upload-recordings-to-bunny-stream", label: "Upload Recordings to Bunny Stream"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/event-forwarding-exclusions", label: "Event Forwarding Exclusions"},
        {type: 'doc', id: "features/workflow-integration-and-external-system-connectivity/p2p-delivery-experiment", label: "P2P Delivery (Experiment)"}
      ],
    },
    {
      type: 'category',
      label: "REST API",
      link: {type: 'doc', id: "features/rest-api/README"},
      collapsed: true,
      items: [
        {
          type: 'category',
          label: "v1",
          link: {type: 'doc', id: "features/rest-api/v1/README"},
          collapsed: true,
          items: [
            {
              type: 'category',
              label: "Virtual Host",
              link: {type: 'doc', id: "features/rest-api/v1/virtual-host/README"},
              collapsed: true,
              items: [
                {type: 'doc', id: "features/rest-api/v1/virtual-host/reload-certificate", label: "Reload Certificate"},
                {
                  type: 'category',
                  label: "Application",
                  link: {type: 'doc', id: "features/rest-api/v1/virtual-host/application/README"},
                  collapsed: true,
                  items: [
                    {type: 'doc', id: "features/rest-api/v1/virtual-host/application/output-profile", label: "Output Profile"},
                    {type: 'doc', id: "features/rest-api/v1/virtual-host/application/record", label: "Record"},
                    {type: 'doc', id: "features/rest-api/v1/virtual-host/application/push", label: "Push"},
                    {
                      type: 'category',
                      label: "Stream",
                      link: {type: 'doc', id: "features/rest-api/v1/virtual-host/application/stream/README"},
                      collapsed: true,
                      items: [
                        {type: 'doc', id: "features/rest-api/v1/virtual-host/application/stream/send-event", label: "Send Event"},
                        {type: 'doc', id: "features/rest-api/v1/virtual-host/application/stream/send-subtitles", label: "Send Subtitles"},
                        {type: 'doc', id: "features/rest-api/v1/virtual-host/application/stream/hls-dump", label: "HLS Dump"},
                        {type: 'doc', id: "features/rest-api/v1/virtual-host/application/stream/conclude-hls-live", label: "Conclude HLS Live"},
                        {type: 'doc', id: "features/rest-api/v1/virtual-host/application/stream/stt-control", label: "STT Control"}
                      ],
                    },
                    {type: 'doc', id: "features/rest-api/v1/virtual-host/application/scheduled-channel", label: "Scheduled Channel"},
                    {type: 'doc', id: "features/rest-api/v1/virtual-host/application/multiplex-channel", label: "Multiplex Channel"}
                  ],
                }
              ],
            },
            {
              type: 'category',
              label: "Statistics",
              link: {type: 'doc', id: "features/rest-api/v1/statistics/README"},
              collapsed: true,
              items: [
                {
                  type: 'category',
                  label: "Current",
                  link: {type: 'doc', id: "features/rest-api/v1/statistics/current/README"},
                  collapsed: true,
                  items: [
                    {type: 'doc', id: "features/rest-api/v1/statistics/current/session", label: "Session"}
                  ],
                }
              ],
            },
            {type: 'doc', id: "features/rest-api/v1/session", label: "Session"},
            {
              type: 'category',
              label: "Managers",
              link: {type: 'doc', id: "features/rest-api/v1/managers/README"},
              collapsed: true,
              items: [
                {
                  type: 'category',
                  label: "API Server",
                  link: {type: 'doc', id: "features/rest-api/v1/managers/api-server/README"},
                  collapsed: true,
                  items: [
                    {type: 'doc', id: "features/rest-api/v1/managers/api-server/reload-certificate", label: "Reload Certificate"}
                  ],
                }
              ],
            }
          ],
        },
        {
          type: 'category',
          label: "v2",
          link: {type: 'doc', id: "features/rest-api/v2/README"},
          collapsed: true,
          items: [
            {
              type: 'category',
              label: "Statistics",
              link: {type: 'doc', id: "features/rest-api/v2/statistics/README"},
              collapsed: true,
              items: [
                {type: 'doc', id: "features/rest-api/v2/statistics/current", label: "Current"}
              ],
            },
            {
              type: 'category',
              label: "Internals",
              link: {type: 'doc', id: "features/rest-api/v2/internals/README"},
              collapsed: true,
              items: [
                {type: 'doc', id: "features/rest-api/v2/internals/codecs", label: "Codecs"},
                {type: 'doc', id: "features/rest-api/v2/internals/queues", label: "Queues"}
              ],
            }
          ],
        }
      ],
    },
    {
      type: 'category',
      label: "Tests",
      link: {type: 'doc', id: "features/tests/README"},
      collapsed: true,
      items: [
        {type: 'doc', id: "features/tests/fault-injection", label: "Fault Injection"}
      ],
    },
    {type: 'html', value: "<span class=\"sidebar-group-label\">REFERENCES</span>", defaultStyle: true},
    {type: 'doc', id: "references/oss-notice", label: "OSS Notice"}
  ],
};

export default sidebars;
