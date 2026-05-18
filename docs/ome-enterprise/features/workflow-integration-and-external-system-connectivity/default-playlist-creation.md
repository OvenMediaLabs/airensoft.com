---
title: Default Playlist Creation
description: "Control creation of the default LLHLS, HLS, and WebRTC playlists per protocol in OvenMediaEngine Enterprise."
enterprise_only: true
sidebar_position: 134
---

## Default Playlist Creation Settings

If you wish to control the creation of the default Playlist (llhls, playlist, webrtc) for each playback protocol (Low Latency HLS, HLS, WebRTC). You can use the `<CreateDefaultPlaylist>` option to manage the system more easily.

Configure in `Server.xml` under `<Publishers><LLHLS><CreateDefaultPlaylist>` (or `<Publishers><HLS><CreateDefaultPlaylist>`, or `<Publishers><WebRTC><CreateDefaultPlaylist>`) as follows:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Server version="8">
  ...
  <VirtualHosts>
    <VirtualHost>
      <Applications>
        <Application>
          <Publishers>
            ...
            <LLHLS>
              <CreateDefaultPlaylist>true</CreateDefaultPlaylist>
            </LLHLS>
          </Publishers>
        </Application>
      </Applications>
    </VirtualHost>
  </VirtualHosts>
</Server>
```

<table><thead><tr><th width="156">Element</th><th width="135">Value</th><th>Description</th></tr></thead><tbody><tr><td>CreateDefaultPlaylsit</td><td>true | false<br />* Default: ture</td><td>Setting <code>&#x3C;CreateDefaultPlaylist></code> to `false` within each Publisher will prevent the creation of the default Playlist.</td></tr></tbody></table>
