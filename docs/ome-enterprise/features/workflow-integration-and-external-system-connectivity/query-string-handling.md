---
title: Query String Handling
sidebar_position: 133
---

## Default Query String Settings

You can control the fundamental operations of Low-Latency HLS (or Legacy HLS) via the `<DefaultQueryString>`.

Set in `<Publishers><LLHLS><DefaultQueryString>` (or `<Publishers><HLS><DefaultQueryString>`) in `Server.xml` as follows:

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
              <DefaultQueryString>
		        <Query>
				  <Key>_HLS_legacy</Key>
				  <Value>NO</Value>
		        </Query>
		        <Query>
				  <Key>_HLS_rewind</Key>
				  <Value>YES</Value>
			    </Query>
			  </DefaultQueryString>
            </LLHLS>
          </Publishers>
        </Application>
      </Applications>
    </VirtualHost>
  </VirtualHosts>
</Server>
```


:::info

This setting is ignored if the playback URL already has a query string appended to it.

:::


<table><thead><tr><th width="151">Key</th><th width="138">Value</th><th>Description</th></tr></thead><tbody><tr><td>_HLS_legacy</td><td>YES | NO <br />* Default: NO</td><td>Sets the `_HLS_legacy` value to `YES` will remove partial segment information from LL-HLS playlists, making them work the same as legacy HLS like HLSv6.<br />* LL-HLS Only</td></tr><tr><td>_HLS_rewind</td><td>YES | NO<br />* Default: YES</td><td>If the `_HLS_rewind` value is set to `YES` and the <a href="https://ovenmedialabs.com/docs/ome/streaming/low-latency-hls#live-rewind">Live Rewind</a> feature is enabled, old segment information will be included in the playlist.</td></tr></tbody></table>

## Using Propagate Query String

When you enable `<PropagateQueryString>`, the query string included in the initial Master Playlist request is automatically carried over to all sub-requests (Media Playlist, Segment, and Partial Segment). By including session keys, authentication tokens, etc., in the query string and utilizing this feature, content access control becomes easier as all requests can be verified at the CDN level.

Set the `<Publishers><LLHLS><PropagateQueryString>` (or `<Publishers><HLS><PropagateQueryString>`) in `Server.xml` like this:

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
              <OriginMode>true</OriginMode>
              <PropagateQueryString>true</PropagateQueryString>
            </LLHLS>
          </Publishers>
        </Application>
      </Applications>
    </VirtualHost>
  </VirtualHosts>
</Server>
```


:::danger

You should take care not to include sensitive information in the Query String directly.

:::

