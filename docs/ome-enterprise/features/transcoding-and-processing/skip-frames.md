---
title: Skip Frames
enterprise_only: true
sidebar_position: 98
---

The Skip Frames feature is a frame sampling filter that skips unnecessary frames to reduce processing load and time for tasks that do not require full-frame processing, such as previews, inspecting specific segments of a stream, and lightweight analysis pipelines.

## Enabling Skip Frames

You can configure Skip Frames in `Server.xml` under `<OutputProfiles><OutputProfile><Encodes>` as follows:

```xml
<Server>
    ...
    <OutputProfiles>
        ...
        <OutputProfile>
        ...
            <Encodes>
                <Video>
                    <Name>h264_1080</Name>
                    <Codec>h264</Codec>
                    <Bitrate>7000000</Bitrate>
                    <Width>3840</Width>
                    <Height>2160</Height>
                    <!--
                    SkipFrames configuration:
                    
                    -1 : Disable frame skipping (no frames are dropped).
                    
                    0 : Enable automatic frame skipping.
                        The number of frames to drop is dynamically calculated
                        based on the current queue state and system load.
                        
                    1 ~ 120 :
                        Enable fixed-ratio frame skipping.
                        Frames are dropped according to the configured value.
                        For example:
                            - 1 : Drop 1 frame out of every 2 frames
                            - 2 : Drop 2 frames out of every 3 frames
                            - N : Drop N frames out of every (N + 1) frames
                            
                        The maximum allowed value is 120.
                    --> 
                    <SkipFrames>1</SkipFrames>
                </Video>     
            </Encodes>
        </OutputProfiles>
        ...
    </OutputProfiles>
    ...
</Server>
```

<table><thead><tr><th width="154" align="center">Value</th><th width="159.5555419921875" align="center">Input Range</th><th>Description</th></tr></thead><tbody><tr><td align="center">-1</td><td align="center">-1</td><td><p>Disables the Skip Frames feature.</p><ul><li>Default.</li></ul></td></tr><tr><td align="center">0</td><td align="center">0</td><td>Enables the Skip Frames feature (Auto). Dynamically adjusts the number of skipped frames based on system load and queue backlog.</td></tr><tr><td align="center">N</td><td align="center">1&#126;120</td><td><p>Enables the Skip Frames feature with a fixed ratio. Skips frames based on the configured value (N).</p><p></p><p><strong>Fixed ratio:</strong> Skips N frames out of every (N+1) input frames, processing the remaining 1 frame.</p><ul><li>Ex) If set to <code>&#x3C;SkipFrames>2&#x3C;/SkipFrames></code>, the system skips 2 out of every 3 input frames.</li></ul></td></tr></tbody></table>
