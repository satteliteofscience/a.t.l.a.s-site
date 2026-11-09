# A.T.L.A.S. Configurator — local MAVLink UDP/TCP bridge

The public A.T.L.A.S. site is hosted by GitHub Pages. **A browser cannot directly open raw UDP/TCP sockets**. This optional, user-run local helper securely exposes MAVLink as WebSocket frames to the browser. It needs Node.js 20+ and no npm dependencies.

## Run

1. Download the project code (or at least \`tools/mavlink-bridge.cjs\`) and install Node.js 20 or later.
2. Open a terminal at the project root and run:
   \`\`\`sh
   node tools/mavlink-bridge.cjs
   \`\`\`
3. The terminal displays a **session token**. Keep this secret. The bridge listens on \`ws://127.0.0.1:8765/mavlink\`, **not on a public interface**.
4. Open [the official configurator](https://satteliteofscience.github.io/a.t.l.a.s-site/configurator.html), expand **UDP/TCP**, choose your transport and IP/port, paste the token and click **Connect UDP/TCP**.
5. Wait for a **real MAVLink heartbeat**. A successful WebSocket connection alone does not mean a flight controller is connected. All writes require a live DISARMED heartbeat.

| Mode | Suggested IP | Port | Meaning |
| --- | --- | --- | --- |
| UDP Listen | 0.0.0.0 | 14550 | Flight controller/ground station sends MAVLink datagrams to this PC. A reply destination is learned from the first incoming datagram. |
| UDP Target | 127.0.0.1 | 14550 | Send datagrams to the specified IP and port, e.g. another local simulator or a VPN endpoint. |
| TCP Client | 127.0.0.1 | 5760 | Connect to MAVLink TCP server such as a local SITL instance. |

**Examples:** Use UDP Listen with a telemetry radio/IP gateway configured to send to your PC IP:14550. For SITL with a local TCP MAVLink server, use TCP Client 127.0.0.1:5760.

### Security

- WebSocket server binds only \`127.0.0.1\`, allows **one client**, checks the page's \`Origin\` and requires a fresh random token. Access from other origins is refused.
- UDP/TCP MAVLink by itself has **no transport encryption**. Do not forward arbitrary MAVLink ports across the public internet. Use a trusted private LAN or an authenticated VPN.
- UDP Listen with \`0.0.0.0\` accepts MAVLink packets from network interfaces. Consider your host firewall and your FC's MAVLink command permissions.
- The bridge can contact the destination you enter in the browser **only after local token authentication**. Do not copy the token into untrusted websites or chat.
- An HTTPS site may not be allowed to use \`ws://localhost\` on some browsers due to mixed-content/private-network restrictions. In that case, the page displays an error. Use a trusted local HTTPS/WSS reverse proxy for the bridge, or run the configurator locally over HTTP. The site does not fake a connection.
- Never change critical flight parameters from an uncertain network connection. Perform calibration on a bench with propeller removed; verify system state and power independently.

### Troubleshooting

- No **bridge ready**: check Node is running, token, localhost port and browser restrictions.
- **Bridge ready** but no heartbeat: check that UDP sender is really pointed to your PC and port, or that the TCP endpoint is a MAVLink server. Firewall rules may block packets.
- Network disconnected: restart the bridge; it intentionally does not keep a socket alive in the background.
- UDP/TCP are alternatives to USB: one transport is active in the browser at any moment.

### Battery monitor

The voltage calibration panel writes \`BATT_VOLT_MULT\` only for analog monitor types 3, 4 and 25. It calculates \`new multiplier = old multiplier × multimeter reading ÷ FC-reported voltage\`. The same battery must be connected to the sensor and multimeter. Nonanalog CAN/BMS/ESC monitors have a different calibration path and are deliberately not modified here.

## Release checks

Run \`node tools/check_release_configurator.cjs\` and the regular project smoke tests before publishing. Synthetic tests cannot substitute for a physical FC bench test over USB, UDP, TCP, real battery voltage, and telemetry packet loss.
