A.T.L.A.S. - USB driver for STM32 DFU (Windows)
==============================================

What it is
  The "STM32 Bootloader" driver of STMicroelectronics (USB\VID_0483&PID_DF11), version 1.1.0 of 07 May 2018. It binds Microsoft's WinUSB to a
  flight-controller board that is in DFU mode (the ROM bootloader of the STM32 chip), so that the DFU flasher of the A.T.L.A.S. configurator (WebUSB),
  STM32CubeProgrammer and dfu-util can open the board.
  The files are the unmodified package that Mission Planner also installs. Its catalog is signed by "Microsoft Windows Hardware Compatibility
  Publisher", so Windows installs it without trusting any extra certificate.

Files
  STM32Bootloader.inf, STM32Bootloader.cat                      the driver package (64-bit Windows 10 and 11)
  amd64/WdfCoInstaller01009.dll, amd64/WinUSBCoInstaller2.dll   co-installers that belong to the signed package
  LICENSE-ST-SLA0048.txt                                        the licence under which ST allows redistribution
  SHA256SUMS.txt                                                SHA-256 of the four files

Install
  Easiest: download tools/A.T.L.A.S.-USB-Drivers.cmd from the configurator (Firmware, DFU card) and run it. It downloads these four files, checks
  their SHA-256 and the catalog signature, and installs the package with pnputil after you approve the administrator prompt.
  By hand, in an administrator PowerShell, inside this folder:
      pnputil /add-driver STM32Bootloader.inf /install

Verify
  Get-FileHash -Algorithm SHA256 .\STM32Bootloader.inf, .\STM32Bootloader.cat, .\amd64\*.dll     (compare with SHA256SUMS.txt)
  Get-AuthenticodeSignature .\STM32Bootloader.cat      (Status must be Valid; the signer is Microsoft Windows Hardware Compatibility Publisher)

What it does not do
  It installs no certificate and changes no Windows setting; it only adds this one driver package. It has nothing to do with COM ports: a board in
  normal mode shows up as an ordinary USB serial device, and Windows 10 and 11 drive it with the usbser driver that is built in. No extra driver is
  needed for that, and Mission Planner is not required.

Remove
  pnputil /enum-drivers      (find the entry whose original name is stm32bootloader.inf, for example oem42.inf)
  pnputil /delete-driver oem42.inf /uninstall

Кратко
  Это подписанный драйвер STMicroelectronics (WinUSB) для плат в режиме DFU, тот же пакет, что ставит Mission Planner, без изменений. Установщик на
  странице конфигуратора скачивает эти файлы, проверяет контрольные суммы и подпись и ставит пакет через pnputil после подтверждения администратора.
  Сертификаты не добавляются, настройки Windows не меняются. Для обычных COM-портов плат ArduPilot драйвер не нужен: Windows 10 и 11 включают его сами.
