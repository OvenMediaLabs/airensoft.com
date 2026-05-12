---
title: Inbound Security Group Rules
sidebar_position: 34
---

This guide explains the ports included in the \[Vendor-recommended security group] and the purpose of each port.&#x20;

Even if you do not use the \[Vendor-recommended security group] and create your own Security Group, you must allow the ports listed below to use OvenMediaEngine Enterprise on AWS properly.

## Security Group Rules Overview <a href="#security-group-rules-overview" id="security-group-rules-overview"></a>

<table><thead><tr><th width="151">Port</th><th>Usage</th></tr></thead><tbody><tr><td>22/tcp</td><td>SSH</td></tr><tr><td>8080/tcp</td><td>Web Console Access</td></tr><tr><td>8443/tcp</td><td>HTTP Web Console Access</td></tr><tr><td>9999/udp</td><td>SRT Input</td></tr><tr><td>9998/udp</td><td>SRT Streaming</td></tr><tr><td>4000/udp</td><td>MPEG-2 TS Input</td></tr><tr><td>1935/tcp</td><td>RTMP Input</td></tr><tr><td>80/tcp</td><td>Low-Latency HLS (LL-HLS; `http://`) Streaming, WebRTC Signaling (both ingest and streaming; `ws://`), Thumbnail</td></tr><tr><td>443/tcp</td><td>Secure Low-Latency HLS (LL-HLS; `https://`) Streaming, WebRTC Signaling (both ingest and streaming; `wss://`), Thumbnail</td></tr><tr><td>3478/tcp</td><td>WebRTC TCP relay (TURN Server, both ingest and streaming)</td></tr><tr><td>10000-10009/udp</td><td>WebRTC Ice candidate (both ingest and streaming)</td></tr><tr><td>9000/tcp</td><td>Origin Server (OVT)</td></tr></tbody></table>
