---
title: Delay Buffer
description: "Add forced latency to all OvenMediaEngine Enterprise publishers with the Delay Buffer to handle live incidents."
enterprise_only: true
sidebar_position: 132
---

## Add Delay to the Stream

The Stream Delay feature allows you to force additional latency on all `<Publishers>`. This can help you handle unexpected situations when operating a live service.

Set the `<Publishers><DelayBufferTimeMs>` value in `Server.xml` as follows:

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
            <!-- milliseconds -->
            <DelayBufferTimeMs>10000</DelayBufferTimeMs>
            ...
          </Publishers>
        </Application>
      </Applications>
    </VirtualHost>
  </VirtualHosts>
</Server>
```
