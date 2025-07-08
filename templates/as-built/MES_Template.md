{{#each resources}}

{{Code}}-{{ResourceType}}-{{ResourceURL}}
{{/each}}



# MES Integration Configuration: {{customerName}} - [Process/Line]

| **Document Property**    | **Value**                             |
| ------------------------ | ------------------------------------- |
| **Customer Name:**       | `{{customerName}}`                     |
| **Process / Line:**      | `[e.g., Assembly Line 3, CNC Cell 5]` |
| **Document Version:**    | 1.0                                   |
| **Last Updated:**        | `YYYY-MM-DD`                          |
| **Author / Integrator:** | `{{integratorName}}`                         |

### 1.0 Integration Overview

_A brief, high-level summary of the integration's purpose. What process is being monitored or controlled? What data is being captured and why?_

**Example:\***This document outlines the configuration for collecting production count and machine status data from the PLC on Assembly Line 3 and feeding it into the central MES. The goal is to provide real-time Overall Equipment Effectiveness (OEE) data and eliminate manual production tracking.\*

### 2.0 System & Equipment Details

_Details of the MES software and the physical equipment involved._

**System A: MES (Manufacturing Execution System)**

| **Attribute**            | **Value**                                                       |
| ------------------------ | --------------------------------------------------------------- |
| **Software Name:**       | `[e.g., Sepasoft MES, FactoryTalk]`                             |
| **Environment:**         | Production / Staging / UAT                                      |
| **Server URL / IP:**     | `[e.g., http://mes-server:8088]`                                |
| **Authentication:**      | `[e.g., Service Account 'svc_integration' writing to Database]` |
| **Target Database/API:** | `[e.g., PostgreSQL DB: mes_prod, Table: public.production_log]` |

**Equipment B: Shop Floor Device**

| **Attribute**               | **Value**                                             |
| --------------------------- | ----------------------------------------------------- |
| **Equipment Type:**         | `[e.g., PLC, CNC, Robot, Sensor, HMI]`                |
| **Manufacturer / Model:**   | `[e.g., Allen-Bradley / CompactLogix 5370]`           |
| **Physical Location:**      | `[e.g., Plant 2, Assembly Line 3, Control Panel 2A]`  |
| **Communication Protocol:** | `[e.g., EtherNet/IP, Modbus TCP, OPC-UA, TCP Socket]` |
| **IP Address / Port:**      | `[e.g., 192.168.10.50 / Port 44818]`                  |
| **Firmware / Driver Ver:**  | `[e.g., v32.011]`                                     |

### 3.0 Integration Architecture & Data Flow

_A description of how data moves from the shop floor to the MES._

**Flow Description:\***A step-by-step description of the process.\*

**Example:**

1. The Node.js integration service, running on the integration server, establishes a connection to the Assembly Line 3 PLC.
2. Every 5 seconds, the service polls a specific tag (`Program:MainProgram.CycleCount`) in the PLC.
3. When the value of the tag changes, the service reads the new value and the current machine status tag (`Program:MainProgram.MachineStatus`).
4. The service constructs a SQL INSERT statement with the collected data.
5. The service executes the statement against the MES database, logging the new production count.

**Data Flow Diagram:**`[Assembly Line 3 PLC] --(EtherNet/IP)--> [Integration Server: Node.js Service] --(SQL)--> [MES PostgreSQL DB]`

### 4.0 Configuration Specifics

_The core technical details needed for maintenance and troubleshooting._

**4.1 Key File Paths**

| **File Type**              | **Path**                                           |
| -------------------------- | -------------------------------------------------- |
| **Configuration File(s):** | `/etc/mes-integration/line3-plc/config.json`       |
| **Executable/Script(s):**  | `/opt/mes-integration/scripts/line3-plc-logger.js` |
| **Log File(s):**           | `/var/log/mes-integration/line3.log`               |

**4.2 Key Configuration Parameters**

| **Parameter**           | **Value**                              | **Description**                                                                    |
| ----------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| `plc.ip_address`        | `192.168.10.50`                        | IP Address of the target PLC.                                                      |
| `plc.polling_rate_ms`   | `5000`                                 | How often to poll the PLC for new data (in milliseconds).                          |
| `db.connection.string`  | `postgres://user:pass@mes-db/mes_prod` | Connection string for the MES database.                                            |
| `tags.production_count` | `Program:MainProgram.CycleCount`       | The PLC tag/register for the part count.                                           |
| `tags.machine_status`   | `Program:MainProgram.MachineStatus`    | The PLC tag/register for the machine's current state (e.g., 1=Running, 2=Faulted). |

### 5.0 Data Mapping

_Defines how raw equipment data points are interpreted and stored in the MES._

| **Source Data Point (PLC Tag)**     | **Transformation Logic**                                           | **Destination Field (MES DB)**   |
| ----------------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| `Program:MainProgram.CycleCount`    | (None)                                                             | `production_log.pieces_produced` |
| `Program:MainProgram.MachineStatus` | Map value: `1` to `'Running'`, `2` to `'Faulted'`, `3` to `'Idle'` | `production_log.machine_status`  |
| (Timestamp)                         | Generated by the script upon successful read                       | `production_log.timestamp`       |
| `Program:MainProgram.FaultCode`     | (None)                                                             | `production_log.fault_code`      |

### 6.0 Operational Procedures

_Simple instructions for support staff, maintenance, or other integrators._

**6.1 Monitoring & Health Checks**

- **Service Status:** Check if the integration service is running: `systemctl status mes-line3.service`.
- **Network Connectivity:** Ping the PLC from the integration server: `ping 192.168.10.50`. A successful reply is required.
- **Log Monitoring:** Tail the log file for errors: `tail -f /var/log/mes-integration/line3.log`.
- **Success Indicators:** Look for log entries like `INFO: Logged new count [1234] for Assembly Line 3`. The data should also appear in the MES dashboard.

**6.2 Common Issues & Troubleshooting Steps**

1. **Issue:** Data is not updating in the MES.

   - **Check:** Verify the integration service is running (see above).
   - **Check:** Ping the PLC to ensure basic network connectivity.
   - **Check:** Look for `ERROR` messages in the logs. Common errors are `CONNECTION_TIMEOUT` or `INVALID_TAG_NAME`.
   - **Physical Check:** Verify the PLC is powered on and the network cable is securely connected. Check for a link light on the switch and PLC port.

2. **Issue:** The service is stopped and won't restart.

   - **Action:** Check the system journal for startup errors: `journalctl -u mes-line3.service`. This often points to a syntax error in the configuration file.
   - **Action:** Manually run the script from the command line (`node /opt/mes...`) to see more detailed error output.

### 7.0 Revision History

| **Date**     | **Version** | **Author**    | **Summary of Changes**                         |
| ------------ | ----------- | ------------- | ---------------------------------------------- |
| `YYYY-MM-DD` | 1.0         | `{{integratorName}}` | Initial document creation for Assembly Line 3. |
