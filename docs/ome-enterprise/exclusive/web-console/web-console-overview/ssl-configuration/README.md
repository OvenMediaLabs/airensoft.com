---
title: SSL Configuration
sidebar_position: 64.5
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Modern web browsers such as Chrome, Safari, Firefox, and Edge enforce security restrictions that **prevent the use of camera/microphone permissions** and **block playback of unsecured streams** in environments **without SSL (HTTPS)**. In particular, to use WebRTC publishing/playback and HLS playback smoothly, communication between the **server and the client must be encrypted via HTTPS/WSS**.

OvenMediaEngine Enterprise on AWS provides features that make this configuration easy. Completing the security setup described in this guide is a required step to build and operate a stable and secure streaming service.

## Configure and Verify SSL



### Configure SSL in the Web Console

![](../../../../images/ssl-configuration-on-aws-configure-ssl-in-the-web-console.png)

1. Click the \[Settings] icon in the upper-right corner of the Web Console to open the Settings page, then select **\[SSL Configuration]** from the left menu.
2. In the Configuration Method section, click \[Change Configuration] to switch to edit mode.

![](../../../../images/ssl-configuration-on-aws-configure-ssl-in-the-web-console-2.png)

3. Choose an SSL configuration method that fits your service environment.


<Tabs>
<TabItem value="option-a" label="Option A">

#### OvenMediaEngine Enterprise–Provided Subdomain with Auto-Managed SSL Certificate \[Recommended]

![](../../../../images/ssl-configuration-on-aws-configure-ssl-in-the-web-console-3.png)


* Enter the **IP address** of your server in the **IP Address** field. OvenMediaEngine Enterprise will automatically point the provided subdomain (e.g., `xxxxxx.cloud.ovenmedia.io`) to this IP address, so that the SSL certificate can be issued and HTTPS access can be enabled correctly.
* Without any complex setup, OvenMediaEngine Enterprise automatically provisions a dedicated subdomain and SSL certificate required for SSL configuration, and manages certificate renewals starting 20 days before expiration.

</TabItem>
<TabItem value="option-b" label="Option B">

#### Your Own Domain with Your Own Certificate

![](../../../../images/ssl-configuration-on-aws-configure-ssl-in-the-web-console-4.png)

* Register your domain and SSL certificate directly in OvenMediaEngine Enterprise. With this option, the instance IP (Public IPv4 address) is shown \[SSL Configuration] page on the Web Console. To map your domain to this instance, update your domain's DNS records in your DNS management console to point to the displayed IP.
* Please ensure that your SSL certificate is renewed manually before it expires.

</TabItem>
</Tabs>


* If you choose the _Your Own Domain with Your Own Certificate_ option (Option B), please refer to the "[Custom SSL Certificate File Guide](custom-ssl-certificate-file-guide.md)" for the required certificate files to upload.


### Access via HTTPS

![](../../../../images/ssl-configuration-on-aws-access-via-https.png)

4. Once SSL is applied successfully, you can access the Web Console using the URL shown on the \[SSL Configuration] page.
   * For example, `https://ome-xxxxxxx.cloud.ovenmedia.io:8443`.



### Verify SSL playback and check URLs

![](../../../../images/ssl-configuration-on-aws-verify-ssl-playback-and-check-urls.png)

5. Following "[Post-Setup Verification for OvenMediaEngine Enterprise](../../../aws-marketplace/getting-started-on-aws/README.md#post-setup-verification-for-ovenmediaengine-enterprise)", publish a media source to `rtmp://{Domain}:1935/{app}/{stream}`, then confirm Stream List on the Web Console that the stream is being delivered properly.

![](../../../../images/ssl-configuration-on-aws-verify-ssl-playback-and-check-urls-2.png)

6. If playback works normally even after selecting `TLS` in the stream detail view, the SSL setup is complete.

![](../../../../images/ssl-configuration-on-aws-verify-ssl-playback-and-check-urls-3.png)

7. In the \[URLs] tab, you can view the TLS-enabled Ingress URL and Egress URL at a glance. Your service is now ready to deliver stable and secure streaming over encrypted connections.
