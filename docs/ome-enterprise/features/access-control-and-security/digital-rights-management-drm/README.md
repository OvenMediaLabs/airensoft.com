---
title: Digital Rights Management (DRM)
description: "Protect OvenMediaEngine Enterprise content with Digital Rights Management (DRM) against unauthorized use and copying."
sidebar_position: 109
---

## **DRM**

Digital Rights Management (DRM) is a technology designed to prevent the unauthorized use, copying, and distribution of digital content. The OME Enterprise Team considers DRM crucial for enterprise customers for the following reasons:

* **Content Protection**: Protects copyrighted streams from illegal copying and use.
* **Enhanced Security**: Encrypts streams to prevent eavesdropping and tampering during transmission.
* **Ensures Legal Use**: Manages licenses to allow only authorized users to access streams.
* **Revenue Protection**: Prevents revenue loss by restricting access to legitimate buyers.
* **Increased User Trust**: Provides a stable and secure streaming environment, boosting user confidence.

## How it works

OvenMediaEngine encrypts LLHLS streams with Common Encryption (CENC) and signals the keys in the playlists. A player reads the signalling, obtains a license from your DRM provider, and decrypts the stream.

| | Supported |
| --- | --- |
| Streaming | LLHLS |
| DRM systems | Widevine, FairPlay, PlayReady. One stream can offer several of them at the same time. |
| Encryption schemes | `cbcs` (AES-CBC with pattern encryption) and `cenc` (AES-CTR full sample encryption). FairPlay requires `cbcs`. |
| Codecs | H.264, H.265 (0.21.0.0 and later), AAC |
| Key rotation | The stream moves to a new key while it runs, without interrupting playback |

The keys are described in a DRM info file that is separate from `Server.xml`, so different streams can use different keys and the keys can be changed without touching the server configuration.

## Setting up the keys

If you use [DoveRunner](https://doverunner.com/), formerly PallyCon, OvenMediaEngine can obtain the keys from its key management service. You enter the address of the service and a token once, and every stream is issued a key as it starts, with nothing to prepare for a new stream. See [DoveRunner DRM Configuration](pallycon-drm-configuration.md).

With any other DRM provider, you enter the key material the provider issues to you: the content key, its key ID, the initialization vector and the protection system headers for the DRM systems you want to offer. See [OvenMediaEngine Configuration for DRM](ovenmediaengine-configuration-for-drm.md).

To have the key management service of another DRM provider integrated the same way as DoveRunner, [contact us](https://ovenmedialabs.com/contact) and we will add support for it.

Either way, the key can be rotated while the stream runs, so a viewer who obtained one key cannot keep decrypting the stream indefinitely.
