---
title: CDN Cache Control
sidebar_position: 126
---

## Control Origin Cache

You can specify how long content should be cached on edge servers or CDN cache servers by adding a `Cache-Control` header to the HTTP response.

Set the `<Publishers><LLHLS><CacheControl>` in `Server.xml` like this:

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
              <CacheControl>
                <MasterPlaylistMaxAge>0</MasterPlaylistMaxAge>
                <ChunklistMaxAge>0</ChunklistMaxAge>
                <ChunklistWithDirectivesMaxAge>60</ChunklistWithDirectivesMaxAge>
                <SegmentMaxAge>-1</SegmentMaxAge>
                <PartialSegmentMaxAge>-1</PartialSegmentMaxAge>
              </CacheControl>
            </LLHLS>
          </Publishers>
        </Application>
      </Applications>
    </VirtualHost>
  </VirtualHosts>
</Server>
```

<table><thead><tr><th width="335">Element</th><th>Description</th></tr></thead><tbody><tr><td>`MasterPlaylistMaxAge`</td><td>Specifies the max-age of the Master Playlist. It will not change while the Stream is being created.</td></tr><tr><td>`ChunklistMaxAge`</td><td>Specifies the max-age of the Media Playlist. It must always respond with the latest Media Playlist and is a URL without Delivery Directives for LL-HLS. Therefore, it should be cached as short as possible or not at all.</td></tr><tr><td>`ChunklistWithDirectivesMaxAge`</td><td>Specifies the max-age of the Media Playlist with the <a href="https://developer.apple.com/documentation/http-live-streaming/enabling-low-latency-http-live-streaming-hls#Add-Low-Latency-HLS-Delivery-Directives">Low-Latency HLS Delivery Directives</a>. The currently supported Delivery Directives are `_HLS_msn` and `_HLS_part`. It is a Playlist with Segment numbers and Partial Segment numbers, and this URL is unique while the Stream is being created and can be cached for a long time because the content of the same URL does not change.</td></tr><tr><td>`SegmentMaxAge`</td><td>Specifies the max-age of the Segment File. The URL of the Segment File is unique while the Stream is being created and can be cached for a long time because the content of the same URL does not change.</td></tr><tr><td>`PartialSegmentMaxAge`</td><td>Specifies the max-age of the Partial Segment File. The URL of the Partial Segment File is unique while the Stream is being created and can be cached for a long time because the content of the same URL does not change.</td></tr></tbody></table>

#### `<CacheControl>` Elements

<table><thead><tr><th width="335">Element</th><th>Description</th></tr></thead><tbody><tr><td>0</td><td><p>`CacheControl: no-cache, no-store`<br /></p><p>Instructs not to cache the content at all, always fetching new data from the Server.</p></td></tr><tr><td>Greater than 0</td><td><p><code>CacheControl: max-age=&#x3C;seconds></code><br /></p><p>Specifies the duration for which the Cache remains valid.</p></td></tr><tr><td>-1</td><td><p>Without `CacheControl` header</p><p></p><p>Indicates that no specific Cache Header will be sent from the Origin. In this case, caching may not be used at all, or the CDN or Cache server's policies may be applied, or the default Cache behavior of the Client or Browser may be followed.</p></td></tr></tbody></table>

`<CacheControl>` can be used with 0 and positive values, while using -1 may result in unexpected caching behaviors, so caution is advised.

## Cache Validation

Enabling this feature allows identification of whether the cached resource version matches the resource in OvenMediaEngine. When the HTTP request includes the `If-None-Match: "<etag_value>"` header, it compares the resource Etag with the OvenMediaEngine's resource Etag, and if the values match, it returns `304 Not-Modified`.

Set the `<Modules><ETag>` in `Server.xml` like this:

```
<Server>
  <Modules>
    <ETag>
      <Enable>true</Enable>
    </ETag>
  </Modules>
</Server>
```


:::info

When enabled, an Etag header will be added to all HTTP responses.

:::

