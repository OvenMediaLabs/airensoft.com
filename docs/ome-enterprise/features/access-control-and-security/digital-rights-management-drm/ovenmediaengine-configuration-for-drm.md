---
title: OvenMediaEngine Configuration for DRM
sidebar_position: 110
---

## Configuration Steps

### Specify the DRM Info File Path

You can set the relative or absolute path of the DRM Info File (`.xml`) relative to the directory where `Server.xml` is located:

```xml
<LLHLS>
    <ChunkDuration>0.5</ChunkDuration>
    <PartHoldBack>1.5</PartHoldBack>
    <SegmentDuration>6</SegmentDuration>
    <SegmentCount>10</SegmentCount>
    <DRM>
        <Enable>false</Enable>
        <InfoFile>path/to/file.xml</InfoFile>
    </DRM>
    <CrossDomains>
        <Url>*</Url>
    </CrossDomains>
</LLHLS>
```

### Configure the DRM Info File

You can apply dynamic changes to the file by separating the DRM Info File (`.xml`). The changes will be applied whenever a new stream is created.

Here's how you should structure your DRM Info File:

```xml
<?xml version="1.0" encoding="UTF-8"?>

<DRMInfo>
    <DRM>
        <Name>MultiDRM</Name>
        <VirtualHostName>default</VirtualHostName>
        <ApplicationName>app</ApplicationName>
        <StreamName>stream*</StreamName> <!-- Can be a wildcard regular expression -->
        <CencProtectScheme>cbcs</CencProtectScheme> <!-- cbcs, cenc -->
        <KeyId>572543f964e34dc68ba9ba9ef91d4xxx</KeyId> <!-- Hexadecimal -->
        <Key>16cf4232a86364b519e1982a27d90xxx</Key> <!-- Hexadecimal -->
        <Iv>572547f914e34dc68ba9ba9ef91d4xxx</Iv> <!-- Hexadecimal -->
        <Pssh>0000003f7073736800000000edef8ba979d64acea3c827dcd51d21ed0000001f1210572547f964e34dc68ba9ba9ef91d4c4a1a05657a64726d48f3c6899xxx</Pssh> <!-- Hexadecimal, for Widevine -->
        <!-- Add Pssh for FairPlay if needed -->
        <FairPlayKeyUrl>skd://fiarplay_key_url</FairPlayKeyUrl> <!-- FairPlay only -->
    </DRM>
    <DRM>
        <Name>MultiDRM2</Name>
        <VirtualHostName>default</VirtualHostName>
        <ApplicationName>app2</ApplicationName>
        <StreamName>stream*</StreamName> <!-- Can be a wildcard regular expression -->
         ...........
    </DRM>
</DRMInfo>
```

Multiple `<DRM>` can be set. Specify the `<VirtualHostName>`, `<ApplicationName>`, and `<StreamName>` where DRM should be applied. `<StreamName>` supports wildcard regular expressions.

Currently, `<CencProtectScheme>` supports "cbcs" and "cenc". There may be limited prospects for adding other schemes in the near future.

`<KeyId>`, `<Key>`, `<Iv>`, and `<Pssh>` values are essential and should be provided by your DRM provider. `<FairPlayKeyUrl>` is only needed for FairPlay and if you want to enable FairPlay to your stream, it is required. It will be also provided by your DRM provider.


:::warning

Currently, DRM is only supported for H.264 and AAC codecs. Support for H.265 will be added soon.

:::



:::info

Detailed Guide: [https://ovenmedialabs.com/docs/ome/streaming/low-latency-hls#drm-beta](https://ovenmedialabs.com/docs/ome/streaming/low-latency-hls#drm-beta)

:::

