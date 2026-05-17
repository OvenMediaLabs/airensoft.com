---
title: Hardware Encoder Support
enterprise_only: true
sidebar_position: 93
---

When installing with the RPM/DEB package file distributed in the OvenMediaEngine Enterprise, the Hardware-Accelerated Video Encoding is automatically enabled if the device has an **NVIDIA Graphics Card** or **Xilinx Alveo U30MA** card and the corresponding driver installed. Graphics drivers can be reinstalled, updated, or removed after the RPM/DEB package installation without affecting program execution. This section describes the supported versions, supported codecs, and the methods for driver installation and verification.

## Supported OS and Driver Versions

| Device             | Support OS                                         | Driver Verion                                  |
| ------------------ | -------------------------------------------------- | ---------------------------------------------- |
| NVIDIA             | <p>Ubuntu 22.04,</p><p>Ubuntu 24.04<br />Rocky 9</p> | <p>NVIDIA Driver 470+<br />CUDA Driver 10.1+</p> |
| Xilinx Alveo U30MA | <p>Ubuntu 22.04,</p><p>Ubuntu 24.04</p>            | Xilinx Video SDK 3.0                           |

## Supported Codecs

<table><thead><tr><th width="246">Device</th><th>Decoder</th><th>Filter</th><th>Encoder</th></tr></thead><tbody><tr><td>NVIDIA</td><td>H.264, H.265</td><td>Scaler</td><td>H.264, H.265</td></tr><tr><td>Xilinx Alveo U30MA</td><td>H.264, H.265</td><td>Scaler</td><td>H.264, H.265</td></tr></tbody></table>

## Install and Check Drivers

### NVIDIA Graphics Driver

The contents of this section are based on the `misc/install_nvidia_driver.sh` script provided by OvenMediaEngine as an Open-Source. If installation issues arise, please refer to the [Official NVIDIA Documentation](https://docs.nvidia.com/cuda/archive/11.6.0/cuda-installation-guide-linux/#package-manager-installation).

#### Ubuntu Linux 22.04 / 24.04

```bash
sudo apt-get -y update
sudo apt-get -y install --no-install-recommends apt-utils lshw
sudo apt-get -y install --no-install-recommends keyboard-configuration
sudo apt-get -y install --no-install-recommends ubuntu-drivers-common
sudo apt-get -y install --no-install-recommends gnupg2 ca-certificates software-properties-common


# Uninstalling a previously installed NVIDIA Driver
sudo apt-get -y remove --purge nvidia-*
sudo apt-get -y autoremove
sudo apt-get -y update

# Remove the nouveau driver.
# If the nouveau driver is in use, the nvidia driver cannot be installed.
USE_NOUVEAU=`sudo lshw -class video | grep nouveau`
if [ ! -z "$USE_NOUVEAU" ]; then

        # Disable nouveau Driver
        echo "blacklist nouveau" >> /etc/modprobe.d/blacklist.conf
        echo "blacklist lbm-nouveau" >> /etc/modprobe.d/blacklist.conf
        echo "options nouveau modeset=0" >> /etc/modprobe.d/blacklist.conf
        echo "alias nouveau off" >> /etc/modprobe.d/blacklist.conf
        echo "alias lbm-nouveau off" >> /etc/modprobe.d/blacklist.conf
        sudo update-initramfs -u
        echo "Using a driver display nouveau.Remove the driver and reboot.Reboot and installation script to rerun the nvidia display the driver to complete the installation."

        sleep 5s
        reboot
fi

# Custom Driver Version
NVIDIA_DRIVER_VERSION=

# Install nvidia drivers and cuda-toolit
sudo add-apt-repository -y  ppa:graphics-drivers/ppa

sudo apt -y update
if [ -z "$NVIDIA_DRIVER_VERSION" ]
then 
    # installation with recommended version
    sudo ubuntu-drivers autoinstall
else
    # installation with specific version
    sudo apt-get install -y --no-install-recommends nvidia-driver-${NVIDIA_DRIVER_VERSION}
fi     
sudo apt-get install -y --no-install-recommends nvidia-cuda-toolkit
```

#### Rocky Linux (Verification Required)

```bash
sudo yum -y update
sudo yum -y install kernel-devel
sudo yum -y install epel-release
sudo yum -y install dkms curl lshw
sudo yum -y install subscription-manager

echo "Reboot is required to run with a new version of the kernel."

# Remove the nouveau driver.
USE_NOUVEAU=`lshw -class video | grep nouveau`
if [ ! -z "$USE_NOUVEAU" ]; then

        # Disable nouveau Driver
        sudo sed "s/GRUB_CMDLINE_LINUX=\"\(.*\)\"/GRUB_CMDLINE_LINUX=\"\1 rd.driver.blacklist=nouveau nouveau.modeset=0\"/" /etc/default/grub
        sudo grub2-mkconfig -o /boot/grub2/grub.cfg
        sudo echo "blacklist nouveau" >> /etc/modprobe.d/blacklist.conf
        sudo mv /boot/initramfs-$(uname -r).img /boot/initramfs-$(uname -r)-nouveau.img
        sudo dracut /boot/initramfs-$(uname -r).img $(uname -r)

        echo "Using a driver display nouveau. so, remove the driver and reboot. "
        echo "After reboot and installation script to rerun the nvidia display the driver to complete the installation."

        sleep 5s
        sudo reboot
fi

sudo subscription-manager repos --enable=rhel-7-server-optional-rpms
sudo yum-config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel7/x86_64/cuda-rhel7.repo
sudo yum clean expire-cache

sudo yum -y install nvidia-driver-latest-dkms
sudo yum -y install cuda
sudo yum -y install cuda-drivers
```

#### Install and Check the Driver

```
# nvcc --version
nvcc: NVIDIA (R) Cuda compiler driver
Copyright (c) 2005-2019 NVIDIA Corporation
Built on Sun_Jul_28_19:07:16_PDT_2019
Cuda compilation tools, release 10.1, V10.1.243

# nvidia-smi 
Wed Jul  3 23:30:00 2024       
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 470.256.02   Driver Version: 470.256.02   CUDA Version: 11.4     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                               |                      |               MIG M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce ...  Off  | 00000000:0A:00.0 Off |                  N/A |
| 55%   33C    P8    10W / 120W |      2MiB /  3018MiB |      0%      Default |
|                               |                      |                  N/A |
+-------------------------------+----------------------+----------------------+                                                                  
+-----------------------------------------------------------------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|        ID   ID                                                   Usage      |
|=============================================================================|
|  No running processes found                                                 |
+-----------------------------------------------------------------------------+
```

### XILINX Video SDK 3.0 Driver

The Xilinx Video SDK 3.0 driver officially supports Ubuntu, Red Hat Linux 7.8, and Amazon Linux 2. For detailed information, please refer to the [Official Xilinx Documentation](https://xilinx.github.io/video-sdk/v3.0/getting_started_on_prem.html#install-the-sdk).

## Check if the Hardware-accelerator is enabled

Once the RPM/DEB package and driver installation are complete, you need to verify that the drivers are correctly loaded and the Hardware-Accelerated Video Encoding is activated in OvenMediaEngine. This can be checked through the OvenMediaEngine's Log files.

```bash
$ cd /var/log/ovenmediaengine
$ cat ovenmediaengine.log | grep transcoder_gpu

[OvenMediaEngine:1234] TAG| transcoder_gpu.cpp:43   | Trying to check the hardware accelerator
[OvenMediaEngine:1234] TAG| transcoder_gpu.cpp:278  | NVIDIA. DeviceId(0), Name(NVIDIA GeForce GTX 1060 3GB), BusId(10), CudaId(0)
[OvenMediaEngine:1234] TAG| transcoder_gpu.cpp:48   | Supported NVIDIA Accelerator. Number of devices(1)
[OvenMediaEngine:1234] TAG| transcoder_gpu.cpp:62   | No supported Xilinx Media Accelerator
[OvenMediaEngine:1234] TAG| transcoder_gpu.cpp:72   | No supported Intel QuickSync Accelerator
[OvenMediaEngine:1234] TAG| transcoder_gpu.cpp:82   | No supported Netint VPU Accelerator
```

## &#x20;Configuration

To use hardware acceleration, set the **HardwareAcceleration** option to **true** under OutputProfiles. If this option is enabled, a hardware codec is automatically used when creating a stream, and if it is unavailable due to insufficient hardware resources, it is replaced with a software codec.

```markup
<OutputProfiles>
    <HWAccels>
        <!-- 
        Setting for Hardware Modules.
            - nv : Nvidia Video Codec SDK
            - xma :Xilinx Media Accelerator
            - qsv :Intel Quick Sync Video
            - nilogan: Netint VPU

        You can use multiple modules by separating them with commas.
        For example, if you want to use xma and nv, you can set it as follows.

        <Modules>[ModuleName]:[DeviceId],[ModuleName]:[DeviceId],...</Modules>
        <Modules>nv:0,nv:1,xma:0</Modules>
        -->
        <Decoder>
                <Enable>true</Enable>
                <Modules>nv</Modules>
        </Decoder>
        <Encoder>
                <Enable>true</Enable>
                <Modules>nv</Modules>
        </Encoder>
    </HWAccels>
    
    <OutputProfile>
        ...
    </OutputProfile>
</OutputProfiles>
```

## Reference

* NVIDIA NVDEC Video Format : [https://en.wikipedia.org/wiki/Nvidia\_NVDEC](https://en.wikipedia.org/wiki/Nvidia_NVDEC)
* NVIDIA NVENV Video Format : [https://en.wikipedia.org/wiki/Nvidia\_NVENC](https://en.wikipedia.org/wiki/Nvidia_NVENC)
* CUDA Toolkit Installation Guide : [https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#introduction](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#introduction)
* NVIDIA Container Toolkit : [https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/arch-overview.html#arch-overview](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/arch-overview.html#arch-overview)
* Xilinx Video SDK : [https://xilinx.github.io/video-sdk/v3.0/index.html](https://xilinx.github.io/video-sdk/v3.0/index.html)
