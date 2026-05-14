---
title: Realtime Speech-to-Text
sidebar_position: 96
---

OvenMediaEngine (OME) version 0.20.0 and later supports real-time automatic subtitles through integration with `whisper.cpp`. This feature converts live audio streams to text in real time and can optionally translate the recognized speech into English.

An NVIDIA GPU is required. CPU inference is not supported because it is too slow for real-time live transcription.

![](../../../images/image-34.png)

## Prerequisites

### NVIDIA GPU and Driver

Check your GPU and driver status using:

```
$ nvidia-smi
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.288.01             Driver Version: 535.288.01   CUDA Version: 12.2     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA GeForce GTX 1050        On  | 00000000:3B:00.0  On |                  N/A |
| 20%   39C    P8              N/A /  75W |    204MiB /  2048MiB |      0%      Default |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+
|   1  NVIDIA RTX 4000 SFF Ada ...    On  | 00000000:AF:00.0 Off |                  Off |
| 30%   38C    P8               5W /  70W |    171MiB / 20475MiB |      0%      Default |
|                                         |                      |                  N/A |
+-----------------------------------------+----------------------+----------------------+

+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|    0   N/A  N/A    802940      C   ...prise/src/bin/DEBUG/OvenMediaEngine       40MiB |
|    1   N/A  N/A    802940      C   ...prise/src/bin/DEBUG/OvenMediaEngine      158MiB |
+---------------------------------------------------------------------------------------+
```

If a driver is not installed, download it from the NVIDIA website or use the helper script provided in the OvenMediaEngine repository.

* Official driver: [https://www.nvidia.com/en-us/drivers/](https://www.nvidia.com/en-us/drivers/)
* OvenMediaEngine Helper Script: [https://github.com/OvenMediaLabs/OvenMediaEngine/blob/master/misc/install\_nvidia\_driver.sh](https://github.com/OvenMediaLabs/OvenMediaEngine/blob/master/misc/install_nvidia_driver.sh)


:::warning

This script installs the versions recommended by OvenMediaEngine. If you want to install the latest version, change the parameters.

:::


### CUDA Toolkit

CUDA Toolkit is required to build `whisper.cpp` with GPU acceleration.

* Download from: [https://developer.nvidia.com/cuda-downloads](https://developer.nvidia.com/cuda-downloads)
* Use a version that matches your GPU generation.
  * Recommended CUDA Toolkit: v12.0 \&#126; v12.8

### Build and Install `whisper.cpp`

Run the latest prerequisites.sh script from the OME source root to build and install `whisper.cpp`.

```
$ ./misc/prerequisites.sh --enable-nv
```

## STT Configuration

STT configuration is split across two sections:

* **`<Modules><Whisper>`** in `Server.xml` — preloads model files into GPU memory at startup.
* **`<Application><Subtitles>`** — defines subtitle renditions (label, language, etc.) that STT output will be written to.
* **`<Application><OutputProfiles><MediaOptions><STT>`** — connects an input audio track to a subtitle rendition via an STT engine.


:::warning

**Breaking change:** The `<Transcription>` element inside `<Subtitles><Rendition>` has been removed. If your existing configuration uses `<Subtitles><Rendition><Transcription>`, it will no longer work. Please migrate to `<OutputProfiles><MediaOptions><STT><Rendition>` as described below.

:::


### Step 1: Preload Models (`Server.xml`)

Declare the Whisper model files to load at server startup inside `<Modules><Whisper>`. Multiple `<PreloadModel>` entries are allowed. Models are loaded in descending file-size order to maximize GPU utilization.

Each `<PreloadModel>` entry has the following fields:

<table><thead><tr><th width="191.7777099609375">Key</th><th>Description</th></tr></thead><tbody><tr><td>Path</td><td>Path to the model file. Can be absolute or relative to the config directory.</td></tr><tr><td>Devices</td><td><p>Comma-separated list of CUDA device indices to load the model onto.</p><ul><li>e.g. `0`, `0,1`, `2`</li></ul><p>Set to `all` to load on every available GPU. If omitted, defaults to device `0`.</p></td></tr></tbody></table>

```xml
<Server>
    <Modules>
        <Whisper>
            <!-- Load on GPU 0 (default when Devices is omitted) -->
            <PreloadModel>
                <Path>whisper_model/ggml-small.bin</Path>
            </PreloadModel>

            <!-- Load on all available GPUs -->
            <PreloadModel>
                <Path>whisper_model/ggml-medium.bin</Path>
                <Devices>all</Devices>
            </PreloadModel>

            <!-- Load on GPU 0 and GPU 1 -->
            <PreloadModel>
                <Path>whisper_model/ggml-large.bin</Path>
                <Devices>0,1</Devices>
            </PreloadModel>
        </Whisper>
    </Modules>
</Server>
```


:::info

`<PreloadModel>` is optional. If omitted, models are loaded on demand when the first stream that uses them is published. Preloading is recommended for production to avoid a delay on the first stream.

:::


### Step 2: Define Subtitle Renditions

Define the subtitle tracks that will receive STT output. For more details on `<Subtitles>`, refer to the [Subtitles](./README.md) section.

```xml
<Application>
    <Subtitles>
        <Enable>true</Enable>
        <DefaultLabel>Korean</DefaultLabel>
        <Rendition>
            <Language>ko</Language>
            <Label>Korean</Label>
            <AutoSelect>true</AutoSelect>
            <Forced>false</Forced>
        </Rendition>
        <Rendition>
            <Language>en</Language>
            <Label>English</Label>
        </Rendition>
    </Subtitles>
</Application>
```

### Step 3: Configure STT in `OutputProfiles`

Under `<OutputProfiles><MediaOptions><STT>`, add a `<Rendition>` for each audio-to-subtitle mapping. The `<OutputSubtitleLabel>` must match a `<Label>` defined in `<Subtitles>`.

```xml
<Application>
    <OutputProfiles>
        <MediaOptions>
            <STT>
                <!-- Korean STT on GPU 0 -->
                <Rendition>
                    <Engine>whisper</Engine>
                    <Model>whisper_model/ggml-small.bin</Model>
                    <Modules>nv:0</Modules>
                    <InputAudioIndex>0</InputAudioIndex>
                    <OutputSubtitleLabel>Korean</OutputSubtitleLabel>
                    <SourceLanguage>auto</SourceLanguage>
                    <Translation>false</Translation>
                    <!-- Optional: sliding-window tuning -->
                    <StepMs>2000</StepMs>
                    <LengthMs>10000</LengthMs>
                    <KeepMs>1500</KeepMs>
                </Rendition>
                <!-- English STT on GPU 1 -->
                <Rendition>
                    <Engine>whisper</Engine>
                    <Model>whisper_model/ggml-small.bin</Model>
                    <Modules>nv:1</Modules>
                    <InputAudioIndex>0</InputAudioIndex>
                    <OutputSubtitleLabel>English</OutputSubtitleLabel>
                    <SourceLanguage>auto</SourceLanguage>
                    <Translation>true</Translation>
                </Rendition>
            </STT>
        </MediaOptions>
    </OutputProfiles>
</Application>
```

The `<STT><Rendition>` configuration includes the following options:

<table><thead><tr><th width="192">Key</th><th>Description</th></tr></thead><tbody><tr><td>Engine</td><td><p>The STT engine to use.</p><ul><li>Currently, only `whisper` is supported.</li></ul></td></tr><tr><td>Model</td><td>Path to the `whisper.cpp` model file. Can be absolute or relative to the configuration directory (where `Server.xml` is located).</td></tr><tr><td>InputAudioIndex</td><td><p>Index of the audio track in the input stream to transcribe.</p><ul><li>Default is `0` (first audio track).</li></ul></td></tr><tr><td>OutputSubtitleLabel</td><td>Label of the subtitle rendition (defined in <code>&#x3C;Subtitles></code>) to write the transcription output to.</td></tr><tr><td>SourceLanguage</td><td>Language code of the input audio (ISO 639-1, e.g., `ko`, `en`, `ja`). Set to `auto` to enable automatic detection.</td></tr><tr><td>Translation</td><td><p>When set to `true`, translates the recognized text into English.</p><ul><li>Whisper currently supports translation to English only.</li></ul></td></tr><tr><td>StepMs</td><td>How many milliseconds of new audio to collect before running each inference call. Default is `2000`. Lower values reduce subtitle latency but increase GPU load.</td></tr><tr><td>LengthMs</td><td>Total size of the audio window (in milliseconds) passed to Whisper per inference call. Default is `10000`. Larger windows give the model more context and improve accuracy.</td></tr><tr><td>KeepMs</td><td>Amount of audio (in milliseconds) carried over from the previous window after a context reset. Default is `1500`. Helps avoid cut-off words at window boundaries.</td></tr><tr><td>Modules</td><td>Selects the GPU to run this STT rendition on, using the same format as video encoder modules (e.g. `nv:0`, `nv:1`). If omitted, GPU `0` is used. Use this to distribute multiple renditions across different GPUs.</td></tr></tbody></table>

### Model

Model files can be downloaded from [https://huggingface.co/ggerganov/whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp). For example:

```
$ wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
$ wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
$ wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin
$ wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large.bin
$ wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2.bin
```

1. Smaller models like `ggml-small.bin` provide faster inference with lower accuracy.
2. Larger models, such as `ggml-medium.bin` or `ggml-large.bin` offer higher accuracy at the cost of increased GPU memory and computation time.

## Runtime Control via REST API

STT can be paused and resumed at runtime without restarting the server or recreating the stream. This is useful for temporarily disabling transcription for a specific stream (e.g., during ad breaks or when the stream is not speech-heavy) to save GPU resources.

For full API reference including request/response details and error codes, see [STT Control](../../rest-api/v1/virtual-host/application/stream/stt-control.md).

| Endpoint           | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `POST :enableStt`  | Resume STT inference for the stream                               |
| `POST :disableStt` | Pause STT inference, dropping audio frames without GPU processing |
| `POST :sttStatus`  | Get current enabled state and per-rendition configuration         |

### Disabling STT at Startup

STT can be started in the disabled (paused) state by setting `<Enable>false</Enable>` inside the `<STT>` block. In this case, no GPU inference runs until the stream receives an `:enableStt` call.

```xml
<STT>
    <Enable>false</Enable>
    <Rendition>
        ...
    </Rendition>
</STT>
```
