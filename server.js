import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync, spawn } from "child_process";
import path from "path";
import fs from "fs";

const ARDUINO_CLI = "c:\\Users\\MT\\Projects\\arduino-cli\\arduino-cli.exe";

const server = new McpServer({
  name: "arduino-mcp-server",
  version: "2.0.0",
});

// Helper function to execute Arduino CLI commands
function runCommand(command, cwd = null) {
  try {
    const output = execSync(command, {
      encoding: "utf-8",
      cwd: cwd || process.cwd(),
      maxBuffer: 1024 * 1024 * 10,
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr?.toString() || "",
      stdout: error.stdout?.toString() || "",
    };
  }
}

// ============================================
// KNOWLEDGE BASES
// ============================================

const COMPONENT_DB = {
  "DHT11": { library: "DHT sensor library", pins: "any digital", voltage: "3.3-5V", type: "temperature/humidity" },
  "DHT22": { library: "DHT sensor library", pins: "any digital", voltage: "3.3-5V", type: "temperature/humidity" },
  "DS18B20": { library: "DallasTemperature, OneWire", pins: "any digital", voltage: "3.0-5.5V", type: "temperature" },
  "HC-SR04": { library: "none required", pins: "2 digital (trig/echo)", voltage: "5V", type: "ultrasonic distance" },
  "MPU6050": { library: "MPU6050_light or Adafruit_MPU6050", pins: "I2C (SDA/SCL)", voltage: "3.3-5V", type: "accelerometer/gyroscope" },
  "BME280": { library: "Adafruit_BME280", pins: "I2C or SPI", voltage: "3.3V", type: "pressure/humidity/temperature" },
  "BMP280": { library: "Adafruit_BMP280", pins: "I2C or SPI", voltage: "3.3V", type: "pressure/temperature" },
  "MQ-2": { library: "none required (analog)", pins: "analog (A0)", voltage: "5V", type: "gas/smoke sensor" },
  "MQ-135": { library: "none required (analog)", pins: "analog (A0)", voltage: "5V", type: "air quality" },
  "PIR": { library: "none required", pins: "any digital", voltage: "5V", type: "motion sensor" },
  "LDR": { library: "none required", pins: "analog (with resistor)", voltage: "3.3-5V", type: "light sensor" },
  "Servo": { library: "Servo", pins: "any PWM-capable", voltage: "5V", type: "servo motor" },
  "DC Motor": { library: "none (needs driver like L298N)", pins: "PWM + digital", voltage: "varies", type: "DC motor" },
  "Stepper Motor": { library: "Stepper", pins: "4 digital pins", voltage: "varies", type: "stepper motor" },
  "NeoPixel": { library: "Adafruit_NeoPixel", pins: "any digital", voltage: "5V", type: "RGB LED strip" },
  "LED": { library: "none required", pins: "any digital (with resistor)", voltage: "depends on color", type: "LED" },
  "OLED SSD1306": { library: "Adafruit_SSD1306, Adafruit_GFX", pins: "I2C or SPI", voltage: "3.3-5V", type: "display" },
  "LCD 1602": { library: "LiquidCrystal", pins: "6 digital or I2C", voltage: "5V", type: "display" },
  "Relay": { library: "none required", pins: "any digital", voltage: "5V coil", type: "relay module" },
  "Bluetooth HC-05": { library: "SoftwareSerial", pins: "2 digital (TX/RX)", voltage: "3.3-5V", type: "bluetooth" },
  "ESP32-CAM": { library: "esp32 camera", pins: "built-in", voltage: "5V", type: "camera module" },
  "LoRa RA-02": { library: "LoRa", pins: "SPI + digital", voltage: "3.3V", type: "LoRa radio" },
  "RFID RC522": { library: "MFRC522", pins: "SPI + digital", voltage: "3.3V", type: "RFID reader" },
  "GPS NEO-6M": { library: "TinyGPSPlus", pins: "Serial or software serial", voltage: "3.3-5V", type: "GPS module" },
  "Soil Moisture": { library: "none required (analog)", pins: "analog", voltage: "3.3-5V", type: "soil moisture" },
  "Water Level": { library: "none required (analog)", pins: "analog", voltage: "3.3-5V", type: "water level" },
  "Rain Sensor": { library: "none required", pins: "analog or digital", voltage: "3.3-5V", type: "rain detection" },
  "Flame Sensor": { library: "none required", pins: "analog or digital", voltage: "3.3-5V", type: "flame detection" },
  "Sound Sensor": { library: "none required", pins: "analog or digital", voltage: "3.3-5V", type: "sound detection" },
  "Joystick": { library: "none required", pins: "2 analog + 1 digital", voltage: "3.3-5V", type: "joystick module" },
  "Potentiometer": { library: "none required", pins: "analog", voltage: "3.3-5V", type: "analog input" },
  "Push Button": { library: "none required", pins: "any digital", voltage: "3.3-5V", type: "button" },
  "Buzzer": { library: "none required", pins: "any digital or PWM", voltage: "3.3-5V", type: "buzzer" },
  "RTC DS3231": { library: "RTClib", pins: "I2C (SDA/SCL)", voltage: "3.3-5V", type: "real-time clock" },
  "SD Card": { library: "SD", pins: "SPI", voltage: "3.3-5V", type: "SD card module" },
  "IR Receiver": { library: "IRremote", pins: "any digital", voltage: "3.3-5V", type: "IR receiver" },
  "IR Transmitter": { library: "IRremote", pins: "any digital (PWM)", voltage: "3.3-5V", type: "IR transmitter" },
  "WS2812B": { library: "Adafruit_NeoPixel or FastLED", pins: "any digital", voltage: "5V", type: "addressable RGB" },
  "MAX7219": { library: "LedControl", pins: "SPI (DIN, CLK, CS)", voltage: "5V", type: "LED matrix driver" },
};

const ESP32_PIN_REFERENCE = {
  digitalPins: "GPIO0-GPIO39 (note: some pins have restrictions)",
  analogPins: "GPIO32-GPIO39 (ADC1), GPIO0, GPIO2, GPIO4, GPIO12-GPIO15, GPIO25-GPIO27 (ADC2)",
  pwmPins: "All GPIO pins support PWM",
  i2c: {
    default: { SDA: "GPIO21", SCL: "GPIO22" },
    note: "Can be remapped to most GPIO pins using Wire.begin(SDA, SCL)",
  },
  spi: {
    default: { MOSI: "GPIO23", MISO: "GPIO19", CLK: "GPIO18", CS: "GPIO5" },
    note: "VSPI and HSPI available, can be remapped",
  },
  serial: {
    Serial0: { RX: "GPIO3", TX: "GPIO1", note: "Used for USB serial programming" },
    Serial1: { RX: "GPIO9", TX: "GPIO10" },
    Serial2: { RX: "GPIO16", TX: "GPIO17" },
  },
  touchPins: "GPIO0, GPIO2, GPIO4, GPIO12-GPIO15, GPIO27, GPIO32-GPIO33",
  dacPins: { GPIO25: "DAC1", GPIO26: "DAC2" },
  restricted: {
    GPIO6_GPI011: "Connected to flash chip - DO NOT USE",
    GPIO34_GPI039: "Input-only pins (no output, no pull-ups)",
    GPIO0: "Boot mode selection - use with caution",
    GPIO12: "Boot voltage selection - use with caution",
    GPIO15: "Boot message control - use with caution",
  },
  note: "ESP32 has 34 GPIO pins total, but some have boot restrictions",
};

const COMMON_WIRING_ISSUES = {
  "no_output": [
    "Check USB connection and COM port",
    "Verify board is selected correctly (FQBN)",
    "Check if EN/RST buttons are stuck",
    "Ensure proper power supply (3.3V vs 5V)",
    "Try pressing BOOT button during upload (ESP32)",
  ],
  "upload_failed": [
    "Check COM port is correct",
    "Close Serial Monitor before uploading",
    "Try different USB cable (some are charge-only)",
    "Press BOOT button when seeing 'Connecting...' (ESP32)",
    "Check if another program is using the port",
  ],
  "sensor_not_working": [
    "Verify wiring matches sensor pinout",
    "Check voltage levels (3.3V vs 5V sensors)",
    "Verify pull-up resistors are present (I2C, DHT, etc.)",
    "Test with known-working example code first",
    "Check if sensor needs time to initialize (add delay)",
    "Verify library is installed and up-to-date",
  ],
  "i2c_not_working": [
    "Check SDA and SCL are not swapped",
    "Verify pull-up resistors (4.7kΩ typical)",
    "Run I2C scanner to find device address",
    "Check if multiple devices have same address",
    "Verify I2C pins match board's default or your configuration",
  ],
  "wifi_not_connecting": [
    "Check SSID and password are correct",
    "Verify WiFi is 2.4GHz (ESP32 doesn't support 5GHz)",
    "Check router MAC filtering",
    "Add WiFi.mode(WIFI_STA) before WiFi.begin()",
    "Increase timeout for slow networks",
  ],
  "brownout_detected": [
    "Insufficient power supply - use better USB cable or external power",
    "Add capacitors (100uF) between 3.3V and GND",
    "Reduce WiFi transmit power with WiFi.setTxPower()",
    "Disable brownout detector (not recommended): WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0)",
  ],
  "watchdog_timeout": [
    "Code is taking too long in a loop - add yield() or delay()",
    "WiFi operations blocking - check connection status first",
    "Use esp_task_wdt_reset() in long-running tasks",
    "Avoid delay() > 10 seconds without feeding watchdog",
  ],
};

const PROJECT_TEMPLATES = {
  "wifi_sensor": {
    description: "ESP32 with WiFi sending sensor data",
    files: ["main.ino"],
    components: ["ESP32", "any sensor"],
  },
  "web_server": {
    description: "ESP32 Web Server with controls",
    files: ["main.ino", "index.h"],
    components: ["ESP32", "sensors/actuators"],
  },
  "bluetooth_control": {
    description: "ESP32 Bluetooth LE device control",
    files: ["main.ino"],
    components: ["ESP32", "LEDs/motors"],
  },
  "data_logger": {
    description: "Sensor data logging to SD card",
    files: ["main.ino"],
    components: ["ESP32/Arduino", "SD module", "sensors"],
  },
  "iot_dashboard": {
    description: "ESP32 IoT device with MQTT",
    files: ["main.ino"],
    components: ["ESP32", "any sensors"],
  },
  "smart_home": {
    description: "Smart home controller with relay",
    files: ["main.ino", "config.h"],
    components: ["ESP32", "relay module", "sensors"],
  },
};

// ============================================
// EXISTING TOOLS (kept and enhanced)
// ============================================

// Tool: List available boards
server.tool(
  "list_boards",
  "List all Arduino boards connected via USB with detailed information",
  {},
  async () => {
    const result = runCommand(`"${ARDUINO_CLI}" board list`);

    let enhancedOutput = result.success
      ? result.output
      : `Error listing boards:\n${result.error}\n${result.stderr}`;

    if (result.success && result.output.includes("COM")) {
      enhancedOutput += "\n\n💡 TIP: Note the COM port number - you'll need it for uploads and serial monitoring.";
    }

    return {
      content: [
        {
          type: "text",
          text: `Connected Boards:\n${enhancedOutput}`,
        },
      ],
    };
  }
);

// Tool: List all supported board types
server.tool(
  "list_board_types",
  "List all supported Arduino board types",
  {
    search: z.string().optional().describe("Optional search term to filter board types (e.g., 'esp32', 'uno')"),
  },
  async ({ search }) => {
    const result = runCommand(`"${ARDUINO_CLI}" board listall`);
    if (!result.success) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing board types:\n${result.error}\n${result.stderr}`,
          },
        ],
      };
    }

    let output = result.output;
    if (search) {
      const lines = output.split("\n").filter((line) =>
        line.toLowerCase().includes(search.toLowerCase())
      );
      output = lines.join("\n") || `No boards found matching: ${search}`;
    }

    return {
      content: [
        {
          type: "text",
          text: `Supported board types:\n${output}`,
        },
      ],
    };
  }
);

// Tool: Compile sketch with memory analysis
server.tool(
  "compile_sketch",
  "Compile an Arduino sketch for a specific board with memory usage analysis",
  {
    sketchPath: z.string().describe("Path to the sketch folder or .ino file"),
    fqbn: z.string().describe("Fully Qualified Board Name (e.g., arduino:avr:uno, esp32:esp32:esp32)"),
    show_memory: z.boolean().default(true).describe("Show memory usage analysis after compilation"),
  },
  async ({ sketchPath, fqbn, show_memory }) => {
    const absolutePath = path.resolve(sketchPath);
    if (!fs.existsSync(absolutePath)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: Sketch path does not exist: ${absolutePath}`,
          },
        ],
      };
    }

    const result = runCommand(
      `"${ARDUINO_CLI}" compile --fqbn "${fqbn}" "${absolutePath}"`
    );

    let output = result.success
      ? `✅ Compilation successful!\n\n${result.output}`
      : `❌ Compilation failed:\n${result.error}\n${result.stderr}\n${result.stdout}`;

    if (result.success && show_memory) {
      const memoryResult = runCommand(
        `"${ARDUINO_CLI}" compile --fqbn "${fqbn}" --show-properties "${absolutePath}"`
      );
      if (memoryResult.success) {
        output += "\n\n📊 Memory Usage:\n";
        const lines = memoryResult.output.split("\n").filter(line =>
          line.includes("upload_size") || line.includes("maximum_size") || line.includes(".size")
        );
        output += lines.join("\n") || "Memory info not available in this output";
      }
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Upload sketch
server.tool(
  "upload_sketch",
  "Upload an Arduino sketch to a connected board",
  {
    sketchPath: z.string().describe("Path to the sketch folder or .ino file"),
    fqbn: z.string().describe("Fully Qualified Board Name (e.g., arduino:avr:uno)"),
    port: z.string().optional().describe("Serial port (e.g., COM3, /dev/ttyUSB0)"),
  },
  async ({ sketchPath, fqbn, port }) => {
    const absolutePath = path.resolve(sketchPath);
    if (!fs.existsSync(absolutePath)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: Sketch path does not exist: ${absolutePath}`,
          },
        ],
      };
    }

    const portArg = port ? `--port "${port}"` : "";
    const result = runCommand(
      `"${ARDUINO_CLI}" upload --fqbn "${fqbn}" ${portArg} "${absolutePath}"`
    );

    let output = result.success
      ? `✅ Upload successful!\n\n${result.output}`
      : `❌ Upload failed:\n${result.error}\n${result.stderr}\n${result.stdout}`;

    if (!result.success) {
      output += "\n\n🔧 Troubleshooting:\n";
      if (result.stderr.includes("Connecting") || result.stderr.includes("timed out")) {
        output += "- ESP32: Press and hold BOOT button, then press EN button, release BOOT when upload starts\n";
        output += "- Try a different USB cable (some are charge-only)\n";
        output += "- Close any Serial Monitor that might be using the port\n";
      }
      if (result.stderr.includes("permission denied") || result.stderr.includes("access")) {
        output += "- Check if another program is using the COM port\n";
        output += "- Try running IDE as Administrator\n";
      }
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Compile and upload
server.tool(
  "compile_and_upload",
  "Compile and upload an Arduino sketch in one command",
  {
    sketchPath: z.string().describe("Path to the sketch folder or .ino file"),
    fqbn: z.string().describe("Fully Qualified Board Name (e.g., arduino:avr:uno)"),
    port: z.string().optional().describe("Serial port (e.g., COM3, /dev/ttyUSB0)"),
  },
  async ({ sketchPath, fqbn, port }) => {
    const absolutePath = path.resolve(sketchPath);
    if (!fs.existsSync(absolutePath)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: Sketch path does not exist: ${absolutePath}`,
          },
        ],
      };
    }

    const portArg = port ? `--port "${port}"` : "";
    const result = runCommand(
      `"${ARDUINO_CLI}" compile --upload --fqbn "${fqbn}" ${portArg} "${absolutePath}"`
    );

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `✅ Compile and upload successful!\n\n${result.output}`
            : `❌ Compile and upload failed:\n${result.error}\n${result.stderr}\n${result.stdout}`,
        },
      ],
    };
  }
);

// Tool: Advanced serial monitor with parsing
server.tool(
  "serial_monitor",
  "Monitor serial output from an Arduino board with optional auto-parsing",
  {
    port: z.string().describe("Serial port (e.g., COM3, /dev/ttyUSB0)"),
    baudrate: z.number().default(9600).describe("Baud rate (default: 9600)"),
    duration: z.number().optional().describe("Duration to monitor in seconds (optional)"),
    parse_sensor_data: z.boolean().default(false).describe("Auto-parse sensor data patterns (temp, humidity, etc.)"),
    log_to_file: z.string().optional().describe("Optional file path to log serial output"),
  },
  async ({ port, baudrate, duration, parse_sensor_data, log_to_file }) => {
    let instructions = `📡 Starting Serial Monitor\n`;
    instructions += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    instructions += `Port: ${port}\n`;
    instructions += `Baud Rate: ${baudrate}\n`;
    if (parse_sensor_data) {
      instructions += `Auto-parsing: ENABLED\n`;
    }
    instructions += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    instructions += `Command to run manually:\n`;
    instructions += `"${ARDUINO_CLI}" monitor --port "${port}" --config baudrate=${baudrate}\n\n`;

    if (log_to_file) {
      instructions += `📝 Logging to: ${log_to_file}\n`;
    }

    instructions += duration
      ? `⏱️  Will monitor for ${duration} seconds. Use Ctrl+C to stop.`
      : `ℹ️  Will run until stopped. Use Ctrl+C to stop.`;

    if (parse_sensor_data) {
      instructions += `\n\n💡 I will automatically detect patterns like:
- Temperature: "25.5°C" or "temp=25.5"
- Humidity: "60%" or "humidity=60"
- Distance: "150cm" or "dist=150"
- Sensor values: "analog=512", "digital=HIGH"
- Errors: "failed", "error", "timeout"`;
    }

    return {
      content: [
        {
          type: "text",
          text: instructions,
        },
      ],
    };
  }
);

// Tool: Install a library
server.tool(
  "install_library",
  "Install an Arduino library",
  {
    libraryName: z.string().describe("Name of the library to install"),
    version: z.string().optional().describe("Specific version to install (optional)"),
  },
  async ({ libraryName, version }) => {
    const versionArg = version ? `--version "${version}"` : "";
    const result = runCommand(
      `"${ARDUINO_CLI}" lib install ${versionArg} "${libraryName}"`
    );

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `✅ Library installed successfully!\n\n${result.output}`
            : `❌ Failed to install library:\n${result.error}\n${result.stderr}`,
        },
      ],
    };
  }
);

// Tool: List installed libraries
server.tool(
  "list_libraries",
  "List all installed Arduino libraries",
  {
    all: z.boolean().default(false).describe("Include built-in libraries"),
  },
  async ({ all }) => {
    const allFlag = all ? "--all" : "";
    const result = runCommand(`"${ARDUINO_CLI}" lib list ${allFlag}`);

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `Installed libraries:\n${result.output}`
            : `Error listing libraries:\n${result.error}\n${result.stderr}`,
        },
      ],
    };
  }
);

// Tool: Search for a library
server.tool(
  "search_library",
  "Search for an Arduino library in the library index",
  {
    query: z.string().describe("Library name to search for"),
  },
  async ({ query }) => {
    const result = runCommand(`"${ARDUINO_CLI}" lib search "${query}"`);

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `Search results for "${query}":\n${result.output}`
            : `Search failed:\n${result.error}\n${result.stderr}`,
        },
      ],
    };
  }
);

// Tool: Update cores and libraries index
server.tool(
  "update_index",
  "Update the index of available cores and libraries",
  {},
  async () => {
    const result = runCommand(`"${ARDUINO_CLI}" core update-index`);

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `✅ Core index updated successfully!\n\n${result.output}`
            : `Failed to update index:\n${result.error}\n${result.stderr}`,
        },
      ],
    };
  }
);

// Tool: Install a core
server.tool(
  "install_core",
  "Install an Arduino core package",
  {
    core: z.string().describe("Core package to install (e.g., arduino:avr, esp32:esp32)"),
  },
  async ({ core }) => {
    const result = runCommand(`"${ARDUINO_CLI}" core install "${core}"`);

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `✅ Core installed successfully!\n\n${result.output}`
            : `❌ Failed to install core:\n${result.error}\n${result.stderr}`,
        },
      ],
    };
  }
);

// Tool: List installed cores
server.tool(
  "list_cores",
  "List all installed Arduino cores",
  {},
  async () => {
    const result = runCommand(`"${ARDUINO_CLI}" core list`);

    return {
      content: [
        {
          type: "text",
          text: result.success
            ? `Installed cores:\n${result.output}`
            : `Error listing cores:\n${result.error}\n${result.stderr}`,
        },
      ],
    };
  }
);

// Tool: Get sketch info
server.tool(
  "sketch_info",
  "Get information about an Arduino sketch",
  {
    sketchPath: z.string().describe("Path to the sketch folder or .ino file"),
  },
  async ({ sketchPath }) => {
    const absolutePath = path.resolve(sketchPath);
    if (!fs.existsSync(absolutePath)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: Sketch path does not exist: ${absolutePath}`,
          },
        ],
      };
    }

    let sketchFiles = [];
    try {
      const inoFiles = fs
        .readdirSync(absolutePath)
        .filter((file) => file.endsWith(".ino"));
      sketchFiles = inoFiles;
    } catch (e) {
      sketchFiles = [path.basename(absolutePath)];
    }

    return {
      content: [
        {
          type: "text",
          text: `📁 Sketch location: ${absolutePath}\n📄 Sketch files: ${sketchFiles.join(", ") || "None found"}`,
        },
      ],
    };
  }
);

// Tool: Read sketch file
server.tool(
  "read_sketch_file",
  "Read the contents of an Arduino sketch file",
  {
    sketchPath: z.string().describe("Path to the sketch folder or .ino file"),
  },
  async ({ sketchPath }) => {
    const absolutePath = path.resolve(sketchPath);

    if (!fs.existsSync(absolutePath)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: Sketch path does not exist: ${absolutePath}`,
          },
        ],
      };
    }

    let content = "";
    if (fs.statSync(absolutePath).isDirectory()) {
      const inoFiles = fs
        .readdirSync(absolutePath)
        .filter((file) => file.endsWith(".ino"));
      if (inoFiles.length > 0) {
        const mainFile = path.join(absolutePath, inoFiles[0]);
        content = fs.readFileSync(mainFile, "utf-8");
      }
    } else {
      content = fs.readFileSync(absolutePath, "utf-8");
    }

    return {
      content: [
        {
          type: "text",
          text: content || "Sketch file is empty",
        },
      ],
    };
  }
);

// Tool: Write sketch file
server.tool(
  "write_sketch_file",
  "Write or update an Arduino sketch file",
  {
    sketchPath: z.string().describe("Path to save the sketch file (.ino)"),
    content: z.string().describe("Content to write to the sketch file"),
  },
  async ({ sketchPath, content }) => {
    const absolutePath = path.resolve(sketchPath);
    const dir = path.dirname(absolutePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(absolutePath, content, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `✅ Sketch file saved successfully: ${absolutePath}`,
        },
      ],
    };
  }
);

// Tool: Verify Arduino CLI is working
server.tool(
  "verify_setup",
  "Verify that Arduino CLI is properly configured and accessible",
  {},
  async () => {
    const versionResult = runCommand(`"${ARDUINO_CLI}" version`);

    if (!versionResult.success) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error: Arduino CLI not found at: ${ARDUINO_CLI}\n\nPlease check the ARDUINO_CLI constant in server.js`,
          },
        ],
      };
    }

    const coresResult = runCommand(`"${ARDUINO_CLI}" core list`);
    const boardsResult = runCommand(`"${ARDUINO_CLI}" board list`);

    return {
      content: [
        {
          type: "text",
          text: `🔧 Arduino CLI Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version: ${versionResult.output}

📦 Installed Cores:
${coresResult.success ? coresResult.output : "No cores installed"}

🔌 Connected Boards:
${boardsResult.success ? boardsResult.output : "No boards connected or board list empty"}`,
        },
      ],
    };
  }
);

// ============================================
// NEW ENHANCED TOOLS
// ============================================

// Tool: Smart component detector and library suggester
server.tool(
  "suggest_libraries",
  "Suggest Arduino libraries based on components you mention",
  {
    components: z.string().describe("List of components (e.g., 'DHT22, OLED, servo')"),
  },
  async ({ components }) => {
    const componentList = components.split(",").map(c => c.trim().toLowerCase());
    let output = `📚 Library Suggestions for: ${components}\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    for (const comp of componentList) {
      const match = Object.entries(COMPONENT_DB).find(([key]) =>
        key.toLowerCase().includes(comp) || comp.includes(key.toLowerCase())
      );

      if (match) {
        const [name, info] = match;
        output += `🔹 ${name} (${info.type})\n`;
        output += `   Library: ${info.library}\n`;
        output += `   Pins: ${info.pins}\n`;
        output += `   Voltage: ${info.voltage}\n`;
        output += `   Install: arduino-cli lib install "${info.library.split(",")[0].trim()}"\n\n`;
      } else {
        output += `⚠️  ${comp} - Not in database. Try searching:\n`;
        output += `   arduino-cli lib search "${comp}"\n\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: ESP32 Pin Reference and Validator
server.tool(
  "esp32_pin_reference",
  "Get ESP32 pin reference information and validate pin usage",
  {
    pin: z.number().optional().describe("Specific GPIO pin to get info about"),
    function: z.string().optional().describe("Pin function to check (e.g., 'I2C', 'ADC', 'PWM', 'SPI')"),
  },
  async ({ pin, func: functionType }) => {
    let output = `📌 ESP32 Pin Reference\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (pin !== undefined) {
      output += `GPIO${pin}:\n`;

      // Check restrictions
      if (pin >= 6 && pin <= 11) {
        output += `   ❌ RESTRICTED: Connected to SPI flash - DO NOT USE!\n`;
      } else if (pin >= 34 && pin <= 39) {
        output += `   ⚠️  INPUT ONLY: No output or internal pull-ups available\n`;
      } else if ([0, 12, 15].includes(pin)) {
        output += `   ⚠️  BOOT PIN: Use with caution (affects boot mode)\n`;
      } else {
        output += `   ✅ General purpose GPIO\n`;
      }

      // Check capabilities
      if ([25, 26].includes(pin)) {
        output += `   🎵 DAC capable\n`;
      }
      if ([0, 2, 4, 12, 13, 14, 15, 27, 32, 33].includes(pin)) {
        output += `   👆 Touch sensor capable\n`;
      }
      if (pin >= 32) {
        output += `   📊 ADC1 channel\n`;
      }
      output += `   ⚡ PWM capable\n`;
    } else if (functionType) {
      const func = functionType.toUpperCase();
      switch (func) {
        case "I2C":
          output += `Default I2C Pins:\n`;
          output += `   SDA: GPIO${ESP32_PIN_REFERENCE.i2c.default.SDA}\n`;
          output += `   SCL: GPIO${ESP32_PIN_REFERENCE.i2c.default.SCL}\n`;
          output += `   Note: Can be remapped using Wire.begin(SDA, SCL)\n`;
          break;
        case "SPI":
          output += `Default SPI Pins (VSPI):\n`;
          output += `   MOSI: GPIO${ESP32_PIN_REFERENCE.spi.default.MOSI}\n`;
          output += `   MISO: GPIO${ESP32_PIN_REFERENCE.spi.default.MISO}\n`;
          output += `   CLK:  GPIO${ESP32_PIN_REFERENCE.spi.default.CLK}\n`;
          output += `   CS:   GPIO${ESP32_PIN_REFERENCE.spi.default.CS}\n`;
          break;
        case "ADC":
          output += `ADC Pins:\n`;
          output += `   ADC1: GPIO32-GPIO39 (no WiFi interference)\n`;
          output += `   ADC2: GPIO0, GPIO2, GPIO4, GPIO12-GPIO15, GPIO25-GPIO27\n`;
          output += `   Note: ADC2 unavailable when WiFi is active\n`;
          break;
        case "PWM":
          output += `PWM: All GPIO pins support PWM output\n`;
          break;
        case "SERIAL":
          output += `Serial Ports:\n`;
          output += `   Serial0: RX=GPIO3, TX=GPIO1 (USB programming)\n`;
          output += `   Serial1: RX=GPIO9, TX=GPIO10\n`;
          output += `   Serial2: RX=GPIO16, TX=GPIO17\n`;
          break;
        default:
          output += `Unknown function type. Available: I2C, SPI, ADC, PWM, SERIAL\n`;
      }
    } else {
      output += `Full ESP32 Pin Map:\n\n`;
      output += `Digital Pins: ${ESP32_PIN_REFERENCE.digitalPins}\n`;
      output += `Analog Pins: ${ESP32_PIN_REFERENCE.analogPins}\n`;
      output += `I2C: SDA=GPIO${ESP32_PIN_REFERENCE.i2c.default.SDA}, SCL=GPIO${ESP32_PIN_REFERENCE.i2c.default.SCL}\n`;
      output += `SPI: MOSI=${ESP32_PIN_REFERENCE.spi.default.MOSI}, MISO=${ESP32_PIN_REFERENCE.spi.default.MISO}, CLK=${ESP32_PIN_REFERENCE.spi.default.CLK}\n`;
      output += `DAC: GPIO25, GPIO26\n`;
      output += `Touch: ${ESP32_PIN_REFERENCE.touchPins}\n`;
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Wiring Issue Analyzer
server.tool(
  "analyze_wiring_issue",
  "Analyze common wiring issues based on symptoms you describe",
  {
    symptom: z.string().describe("Describe the issue (e.g., 'upload fails', 'no serial output', 'sensor not reading')"),
    board: z.string().optional().describe("Board type (e.g., 'ESP32', 'Uno')"),
  },
  async ({ symptom, board }) => {
    let output = `🔍 Wiring Issue Analyzer\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `Symptom: "${symptom}"\n`;
    if (board) output += `Board: ${board}\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const symptomLower = symptom.toLowerCase();
    let matchedIssues = [];

    // Match symptoms to common issues
    if (symptomLower.includes("upload") || symptomLower.includes("flash") || symptomLower.includes("write")) {
      matchedIssues.push(...COMMON_WIRING_ISSUES.upload_failed);
    }
    if (symptomLower.includes("no output") || symptomLower.includes("not starting") || symptomLower.includes("dead")) {
      matchedIssues.push(...COMMON_WIRING_ISSUES.no_output);
    }
    if (symptomLower.includes("sensor") || symptomLower.includes("not reading") || symptomLower.includes("not working")) {
      matchedIssues.push(...COMMON_WIRING_ISSUES.sensor_not_working);
    }
    if (symptomLower.includes("i2c") || symptomLower.includes("sda") || symptomLower.includes("scl")) {
      matchedIssues.push(...COMMON_WIRING_ISSUES.i2c_not_working);
    }
    if (symptomLower.includes("wifi") || symptomLower.includes("network") || symptomLower.includes("connect")) {
      matchedIssues.push(...COMMON_WIRING_ISSUES.wifi_not_connecting);
    }
    if (symptomLower.includes("brownout") || symptomLower.includes("reset") || symptomLower.includes("restart")) {
      matchedIssues.push(...COMMON_WIRING_ISSUES.brownout_detected);
    }
    if (symptomLower.includes("watchdog") || symptomLower.includes("freeze") || symptomLower.includes("hang")) {
      matchedIssues.push(...COMMON_WIRING_ISSUES.watchdog_timeout);
    }

    // ESP32-specific issues
    if (board && board.toLowerCase().includes("esp32")) {
      if (symptomLower.includes("upload") || symptomLower.includes("connect")) {
        matchedIssues.unshift("ESP32: Hold BOOT button while uploading, then release when upload starts");
      }
      if (symptomLower.includes("adc") || symptomLower.includes("analog")) {
        matchedIssues.push("ESP32: ADC2 unavailable when WiFi is active. Use ADC1 pins (GPIO32-39)");
      }
    }

    if (matchedIssues.length === 0) {
      output += `No specific matches found. Please provide more details about:\n`;
      output += `- What you're trying to do\n`;
      output += `- What components are connected\n`;
      output += `- What error messages you see\n`;
    } else {
      output += `💡 Possible Causes & Solutions:\n\n`;
      matchedIssues.forEach((issue, i) => {
        output += `${i + 1}. ${issue}\n`;
      });
    }

    output += `\n\n📝 Still having issues? Describe your setup and I'll help debug!`;

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: WiFi Diagnostics for ESP32
server.tool(
  "wifi_diagnostics",
  "Get WiFi diagnostics and troubleshooting guide for ESP32",
  {
    ssid: z.string().optional().describe("WiFi network name (optional)"),
    show_test_code: z.boolean().default(false).describe("Show a WiFi test sketch"),
  },
  async ({ ssid, show_test_code }) => {
    let output = `📶 ESP32 WiFi Diagnostics\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (ssid) {
      output += `Testing network: "${ssid}"\n\n`;
      output += `Common issues with this network:\n`;
      output += `- Make sure it's 2.4GHz (ESP32 doesn't support 5GHz)\n`;
      output += `- Check for special characters in SSID\n`;
      output += `- Verify password is correct\n`;
      output += `- Check router MAC filtering\n\n`;
    }

    output += `WiFi Troubleshooting Checklist:\n\n`;
    output += `✅ Hardware:\n`;
    output += `   - ESP32 has built-in WiFi (no external module needed)\n`;
    output += `   - Ensure antenna is not damaged\n`;
    output += `   - Keep away from metal objects\n\n`;

    output += `✅ Code:\n`;
    output += `   - Include <WiFi.h>\n`;
    output += `   - Use WiFi.mode(WIFI_STA) before WiFi.begin()\n`;
    output += `   - Add timeout to prevent infinite loops\n`;
    output += `   - Check WiFi.status() == WL_CONNECTED\n\n`;

    output += `✅ Network:\n`;
    output += `   - 2.4GHz network only\n`;
    output += `   - WPA2 security (enterprise may need special handling)\n`;
    output += `   - DHCP enabled\n\n`;

    if (show_test_code) {
      output += `\n📝 WiFi Test Sketch:\n`;
      output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      output += `#include <WiFi.h>\n\n`;
      output += `const char* ssid = "YOUR_SSID";\n`;
      output += `const char* password = "YOUR_PASSWORD";\n\n`;
      output += `void setup() {\n`;
      output += `  Serial.begin(115200);\n`;
      output += `  WiFi.mode(WIFI_STA);\n`;
      output += `  WiFi.begin(ssid, password);\n\n`;
      output += `  Serial.print("Connecting to WiFi");\n`;
      output += `  int attempts = 0;\n`;
      output += `  while (WiFi.status() != WL_CONNECTED && attempts < 20) {\n`;
      output += `    delay(500);\n`;
      output += `    Serial.print(".");\n`;
      output += `    attempts++;\n`;
      output += `  }\n\n`;
      output += `  if (WiFi.status() == WL_CONNECTED) {\n`;
      output += `    Serial.println("\\nConnected!");\n`;
      output += `    Serial.print("IP: ");\n`;
      output += `    Serial.println(WiFi.localIP());\n`;
      output += `    Serial.print("RSSI: ");\n`;
      output += `    Serial.println(WiFi.RSSI());\n`;
      output += `  } else {\n`;
      output += `    Serial.println("\\nFailed to connect!");\n`;
      output += `  }\n`;
      output += `}\n\n`;
      output += `void loop() {\n`;
      output += `  // Check connection periodically\n`;
      output += `  if (WiFi.status() != WL_CONNECTED) {\n`;
      output += `    Serial.println("WiFi disconnected! Reconnecting...");\n`;
      output += `    WiFi.reconnect();\n`;
      output += `    delay(5000);\n`;
      output += `  } else {\n`;
      output += `    Serial.print("RSSI: ");\n`;
      output += `    Serial.println(WiFi.RSSI());\n`;
      output += `    delay(5000);\n`;
      output += `  }\n`;
      output += `}\n`;
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Code Analyzer for Common Issues
server.tool(
  "analyze_code",
  "Analyze Arduino code for common issues, bugs, and best practices",
  {
    sketchPath: z.string().describe("Path to the sketch to analyze"),
  },
  async ({ sketchPath }) => {
    const absolutePath = path.resolve(sketchPath);

    if (!fs.existsSync(absolutePath)) {
      return {
        content: [
          { type: "text", text: `❌ Sketch not found: ${absolutePath}` },
        ],
      };
    }

    let code = "";
    if (fs.statSync(absolutePath).isDirectory()) {
      const inoFiles = fs.readdirSync(absolutePath).filter(f => f.endsWith(".ino"));
      if (inoFiles.length > 0) {
        code = fs.readFileSync(path.join(absolutePath, inoFiles[0]), "utf-8");
      }
    } else {
      code = fs.readFileSync(absolutePath, "utf-8");
    }

    let output = `🔍 Code Analysis Report\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `File: ${absolutePath}\n\n`;

    let issues = [];
    let warnings = [];
    let tips = [];

    // Check for common issues
    if (code.includes("delay(") && code.split("delay(").length > 5) {
      warnings.push("Multiple delay() calls detected - consider using millis() for non-blocking code");
    }

    if (!code.includes("pinMode(")) {
      warnings.push("No pinMode() calls found - pins may not work as expected");
    }

    if (code.includes("Serial.begin(") && !code.includes("Serial.println(")) {
      tips.push("Serial is initialized but no output detected - add Serial.println() for debugging");
    }

    if (code.includes("#include <WiFi.h>") && !code.includes("WiFi.mode(")) {
      warnings.push("WiFi.h included but WiFi.mode() not set - add WiFi.mode(WIFI_STA)");
    }

    if (code.includes("delay(10000") || code.includes("delay(20000")) {
      warnings.push("Long delay() detected - may cause watchdog timeout on ESP32");
    }

    if (code.includes("String ") && code.includes("loop()")) {
      tips.push("Using String class in loop() may cause memory fragmentation - consider using char arrays");
    }

    if (!code.includes("setup()") || !code.includes("loop()")) {
      issues.push("Missing setup() or loop() function - required for Arduino sketches");
    }

    if (code.includes("attachInterrupt(") && !code.includes("volatile")) {
      warnings.push("Interrupt used but no volatile variables detected - ISR may not work correctly");
    }

    if (code.includes("malloc(") || code.includes("new ")) {
      tips.push("Dynamic memory allocation detected - monitor heap fragmentation on ESP32");
    }

    // Check for WiFi + ADC2 conflict
    if (code.includes("WiFi.") && code.match(/GPIO(0|2|4|1[2-5]|2[5-7])/g)) {
      warnings.push("WiFi active with potential ADC2 pins - ADC2 unavailable during WiFi. Use ADC1 (GPIO32-39)");
    }

    // Generate report
    if (issues.length === 0 && warnings.length === 0 && tips.length === 0) {
      output += `✅ No obvious issues detected!\n\n`;
    } else {
      if (issues.length > 0) {
        output += `🚨 Critical Issues:\n`;
        issues.forEach((issue, i) => output += `  ${i + 1}. ${issue}\n`);
        output += `\n`;
      }

      if (warnings.length > 0) {
        output += `⚠️  Warnings:\n`;
        warnings.forEach((warn, i) => output += `  ${i + 1}. ${warn}\n`);
        output += `\n`;
      }

      if (tips.length > 0) {
        output += `💡 Tips:\n`;
        tips.forEach((tip, i) => output += `  ${i + 1}. ${tip}\n`);
        output += `\n`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Serial Plotter Data Parser
server.tool(
  "parse_serial_data",
  "Parse and format serial data for Arduino Serial Plotter",
  {
    data: z.string().describe("Serial data to parse (can be multiple lines)"),
    format: z.enum(["plotter", "csv", "json"]).default("plotter").describe("Output format"),
  },
  async ({ data, format }) => {
    let output = `📊 Serial Data Parser\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const lines = data.split("\n").filter(l => l.trim());
    let parsed = [];

    for (const line of lines) {
      // Try to extract key=value patterns
      const keyValueMatch = line.match(/(\w+)[=:]\s*([\d.-]+)/);
      if (keyValueMatch) {
        parsed.push({ key: keyValueMatch[1], value: parseFloat(keyValueMatch[2]), raw: line });
      } else {
        // Try to extract numbers
        const numberMatch = line.match(/([\d.-]+)/);
        if (numberMatch) {
          parsed.push({ key: "value", value: parseFloat(numberMatch[1]), raw: line });
        }
      }
    }

    if (parsed.length === 0) {
      output += `No parseable data found. Expected format:\n`;
      output += `- Simple numbers: 25.5\n`;
      output += `- Key-value: temp=25.5\n`;
      output += `- Comma-separated: 25.5,60.2,1013\n`;
    } else {
      output += `Parsed ${parsed.length} values:\n\n`;

      switch (format) {
        case "plotter":
          output += `Arduino Serial Plotter Format:\n`;
          output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          const plotterLine = parsed.map(p => `${p.value}`).join(" ");
          output += plotterLine;
          output += `\n\n💡 Use this format in your code:\n`;
          output += `Serial.print("${parsed.map(p => p.value).join(" ")}");\n`;
          output += `Serial.println();`;
          break;

        case "csv":
          output += `CSV Format:\n`;
          output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          output += parsed.map(p => `${p.key},${p.value}`).join("\n");
          break;

        case "json":
          output += `JSON Format:\n`;
          output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          const json = {};
          parsed.forEach(p => json[p.key] = p.value);
          output += JSON.stringify(json, null, 2);
          break;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Project Template Generator
server.tool(
  "project_template",
  "Get project template code for common Arduino/ESP32 projects",
  {
    template: z.enum(["wifi_sensor", "web_server", "bluetooth_control", "data_logger", "iot_dashboard", "smart_home"]).describe("Project template type"),
    components: z.string().optional().describe("Components you're using (optional)"),
  },
  async ({ template, components }) => {
    const templates = {
      wifi_sensor: `#include <WiFi.h>

// Configuration
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* server = "api.thingspeak.com"; // Example server

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\\nConnected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read sensors and send data
    // float sensorValue = analogRead(34);
    // sendData(sensorValue);
  } else {
    Serial.println("WiFi disconnected! Reconnecting...");
    WiFi.reconnect();
  }
  
  delay(15000); // Thingspeak minimum update interval
}`,

      web_server: `#include <WiFi.h>
#include <WebServer.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

WebServer server(80);

void setup() {
  Serial.begin(115200);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  
  Serial.println(WiFi.localIP());
  
  // Routes
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", "<h1>ESP32 Web Server</h1>");
  });
  
  server.on("/on", HTTP_GET, []() {
    // digitalWrite(2, HIGH);
    server.send(200, "text/plain", "ON");
  });
  
  server.on("/off", HTTP_GET, []() {
    // digitalWrite(2, LOW);
    server.send(200, "text/plain", "OFF");
  });
  
  server.begin();
  Serial.println("Server started");
}

void loop() {
  server.handleClient();
}`,

      bluetooth_control: `#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

bool deviceConnected = false;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) { deviceConnected = true; }
    void onDisconnect(BLEServer* pServer) { deviceConnected = false; }
};

void setup() {
  Serial.begin(115200);
  
  BLEDevice::init("ESP32-BLE");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic *pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  
  pCharacteristic->setValue("Hello!");
  pService->start();
  
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->start();
  
  Serial.println("BLE started, waiting for connection...");
}

void loop() {
  if (deviceConnected) {
    // Send data or handle commands
    delay(2000);
  }
}`,

      data_logger: `#include <SD.h>
#include <SPI.h>

#define SD_CS 5  // Chip Select pin

File dataFile;

void setup() {
  Serial.begin(115200);
  
  if (!SD.begin(SD_CS)) {
    Serial.println("SD card failed!");
    return;
  }
  Serial.println("SD card ready");
  
  // Create/open file
  dataFile = SD.open("/datalog.csv", FILE_APPEND);
  if (dataFile) {
    // Write header if new file
    if (dataFile.size() == 0) {
      dataFile.println("timestamp,sensor1,sensor2");
    }
  }
}

void loop() {
  // float sensor1 = analogRead(34);
  // float sensor2 = analogRead(35);
  
  // String dataRow = String(millis()) + "," + 
  //                  String(sensor1) + "," + 
  //                  String(sensor2);
  
  // dataFile = SD.open("/datalog.csv", FILE_APPEND);
  // if (dataFile) {
  //   dataFile.println(dataRow);
  //   dataFile.close();
  // }
  
  delay(5000);
}`,

      iot_dashboard: `#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* mqtt_server = "broker.hivemq.com"; // Free broker

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  while (!client.connected()) {
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      client.subscribe("esp32/commands");
    } else {
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
  
  // Publish sensor data
  // client.publish("esp32/sensor", String(sensorValue).c_str());
  
  delay(5000);
}`,

      smart_home: `#include <WiFi.h>
#include <WebServer.h>

#define RELAY_1 4
#define RELAY_2 5
#define RELAY_3 16
#define RELAY_4 17

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

WebServer server(80);

bool relayStates[4] = {false, false, false, false};
const int relayPins[4] = {RELAY_1, RELAY_2, RELAY_3, RELAY_4};

void setup() {
  Serial.begin(115200);
  
  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], LOW); // Relays active LOW
  }
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  
  Serial.println(WiFi.localIP());
  
  // Web interface
  server.on("/", []() {
    String html = "<h1>Smart Home Controller</h1>";
    for (int i = 0; i < 4; i++) {
      html += "<p>Relay " + String(i+1) + ": ";
      html += relayStates[i] ? "ON" : "OFF";
      html += " <a href='/toggle?id=" + String(i) + "'>Toggle</a></p>";
    }
    server.send(200, "text/html", html);
  });
  
  server.on("/toggle", []() {
    int id = server.arg("id").toInt();
    relayStates[id] = !relayStates[id];
    digitalWrite(relayPins[id], relayStates[id] ? HIGH : LOW);
    server.sendHeader("Location", "/");
    server.send(303);
  });
  
  server.begin();
}

void loop() {
  server.handleClient();
}`,
    };

    let output = `📝 Project Template: ${template}\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (components) {
      output += `Components: ${components}\n`;
      output += `💡 You may need to modify the code to match your specific pins and components\n\n`;
    }

    output += `Here's your starter template:\n\n`;
    output += templates[template];
    output += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `💡 Next steps:\n`;
    output += `1. Replace SSID and password\n`;
    output += `2. Update pin numbers for your setup\n`;
    output += `3. Add your sensor code\n`;
    output += `4. I can compile and upload this for you!`;

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Memory and Performance Analyzer
server.tool(
  "memory_analysis",
  "Analyze ESP32/Arduino memory usage and provide optimization suggestions",
  {
    sketchPath: z.string().describe("Path to sketch to analyze"),
    fqbn: z.string().describe("Board FQBN (e.g., esp32:esp32:esp32)"),
  },
  async ({ sketchPath, fqbn }) => {
    const absolutePath = path.resolve(sketchPath);

    if (!fs.existsSync(absolutePath)) {
      return {
        content: [
          { type: "text", text: `❌ Sketch not found: ${absolutePath}` },
        ],
      };
    }

    let output = `📊 Memory Analysis Report\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `Board: ${fqbn}\n`;
    output += `Sketch: ${absolutePath}\n\n`;

    // Get compilation properties
    const result = runCommand(
      `"${ARDUINO_CLI}" compile --fqbn "${fqbn}" --show-properties "${absolutePath}"`
    );

    if (result.success) {
      // Extract memory information
      const lines = result.output.split("\n");
      let memoryInfo = {};

      for (const line of lines) {
        if (line.includes("upload.maximum_size")) {
          memoryInfo.flash = line.split("=")[1]?.trim();
        }
        if (line.includes("runtime.maxRAM")) {
          memoryInfo.ram = line.split("=")[1]?.trim();
        }
      }

      output += `Board Specifications:\n`;
      if (memoryInfo.flash) {
        output += `  Flash: ${memoryInfo.flash} bytes\n`;
      }
      if (memoryInfo.ram) {
        output += `  RAM: ${memoryInfo.ram} bytes\n`;
      }
      output += `\n`;
    }

    // Read and analyze code
    let code = "";
    if (fs.statSync(absolutePath).isDirectory()) {
      const inoFiles = fs.readdirSync(absolutePath).filter(f => f.endsWith(".ino"));
      if (inoFiles.length > 0) {
        code = fs.readFileSync(path.join(absolutePath, inoFiles[0]), "utf-8");
      }
    } else {
      code = fs.readFileSync(absolutePath, "utf-8");
    }

    let warnings = [];
    let optimizations = [];

    // Memory usage analysis
    if (code.includes("String")) {
      const stringCount = (code.match(/String\s+/g) || []).length;
      if (stringCount > 5) {
        warnings.push(`Found ${stringCount} String objects - consider using char arrays to reduce memory fragmentation`);
      }
    }

    if (code.includes("delay(")) {
      const delayCount = (code.match(/delay\(/g) || []).length;
      if (delayCount > 10) {
        optimizations.push("Many delay() calls detected - refactor using millis() for better performance");
      }
    }

    if (code.includes("malloc(") || code.includes("free(")) {
      warnings.push("Dynamic memory allocation detected - monitor heap usage");
    }

    if (code.includes("#include <WiFi.h>") && code.includes("#include <SD.h>")) {
      warnings.push("WiFi + SD card both use significant RAM - monitor available memory");
    }

    // Provide ESP32-specific info
    if (fqbn.includes("esp32")) {
      output += `ESP32 Memory Layout:\n`;
      output += `  Total PSRAM: 4MB (if available)\n`;
      output += `  Total SRAM: ~520KB\n`;
      output += `  Available for sketch: ~295KB\n`;
      output += `  WiFi stack uses: ~70KB\n\n`;
    }

    if (warnings.length > 0 || optimizations.length > 0) {
      output += `Findings:\n\n`;
      if (warnings.length > 0) {
        output += `⚠️  Warnings:\n`;
        warnings.forEach((w, i) => output += `  ${i + 1}. ${w}\n`);
        output += `\n`;
      }

      if (optimizations.length > 0) {
        output += `💡 Optimizations:\n`;
        optimizations.forEach((o, i) => output += `  ${i + 1}. ${o}\n`);
        output += `\n`;
      }
    } else {
      output += `✅ No significant memory issues detected!\n`;
    }

    output += `\n💡 Tips to reduce memory:\n`;
    output += `- Use F() macro for strings: Serial.println(F("text"))\n`;
    output += `- Use const char* instead of String\n`;
    output += `- Remove unused libraries and code\n`;
    output += `- Use PROGMEM for large constant data\n`;
    output += `- Close files and free memory when done`;

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Component compatibility checker
server.tool(
  "check_component_compat",
  "Check if components are compatible with your board and each other",
  {
    board: z.string().describe("Board type (e.g., 'ESP32', 'Arduino Uno')"),
    components: z.string().describe("Components to check (e.g., 'DHT22, OLED, servo')"),
  },
  async ({ board, components }) => {
    let output = `🔧 Component Compatibility Check\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `Board: ${board}\n`;
    output += `Components: ${components}\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const componentList = components.split(",").map(c => c.trim());
    let pinRequirements = { digital: 0, analog: 0, i2c: false, spi: false, pwm: 0, serial: false };
    let voltageRequirements = [];
    let compatibility = [];

    for (const comp of componentList) {
      const match = Object.entries(COMPONENT_DB).find(([key]) =>
        key.toLowerCase().includes(comp.toLowerCase()) || comp.toLowerCase().includes(key.toLowerCase())
      );

      if (match) {
        const [name, info] = match;
        compatibility.push({ name, info });

        // Count pin requirements
        if (info.pins.includes("I2C")) pinRequirements.i2c = true;
        if (info.pins.includes("SPI")) pinRequirements.spi = true;
        if (info.pins.includes("analog")) pinRequirements.analog++;
        if (info.pins.includes("digital") || info.pins.includes("PWM")) pinRequirements.digital++;
        if (info.pins.includes("PWM")) pinRequirements.pwm++;
        if (info.pins.includes("Serial") || info.pins.includes("serial")) pinRequirements.serial = true;

        voltageRequirements.push(`${name}: ${info.voltage}`);
      }
    }

    output += `Component Details:\n`;
    compatibility.forEach(c => {
      output += `  ✓ ${c.name} (${c.info.type})\n`;
      output += `    Library: ${c.info.library}\n`;
      output += `    Pins: ${c.info.pins}\n`;
      output += `    Voltage: ${c.info.voltage}\n\n`;
    });

    output += `Resource Requirements:\n`;
    output += `  I2C: ${pinRequirements.i2c ? "YES" : "No"}\n`;
    output += `  SPI: ${pinRequirements.spi ? "YES" : "No"}\n`;
    output += `  Digital pins: ${pinRequirements.digital}\n`;
    output += `  Analog pins: ${pinRequirements.analog}\n`;
    output += `  PWM channels: ${pinRequirements.pwm}\n`;
    output += `  Serial ports: ${pinRequirements.serial ? "YES" : "No"}\n\n`;

    // Voltage compatibility check
    const needs5V = voltageRequirements.some(v => v.includes("5V") && !v.includes("3.3"));
    const isESP32 = board.toLowerCase().includes("esp32");

    if (needs5V && isESP32) {
      output += `⚠️  VOLTAGE WARNING:\n`;
      output += `  ESP32 is 3.3V logic. 5V sensors need level shifters!\n\n`;
    }

    output += `✅ All components appear compatible!`;

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Tool: Quick wiring diagram generator
server.tool(
  "generate_wiring_diagram",
  "Generate a text-based wiring diagram for your components",
  {
    board: z.string().describe("Board type (e.g., 'ESP32', 'Arduino Uno')"),
    components: z.string().describe("Components and their pins (e.g., 'DHT22:GPIO4, LED:GPIO2, OLED:I2C')"),
  },
  async ({ board, components }) => {
    let output = `🔌 Wiring Diagram\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `Board: ${board}\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    output += `Board Pin Layout:\n`;
    output += `┌─────────────────────────┐\n`;

    if (board.toLowerCase().includes("esp32")) {
      output += `│  3V3  G   G  VIN  3V3 │\n`;
      output += `│  GND  G   G  GND GND │\n`;
      output += `│  D15  2  15   13  D2 │\n`;
      output += `│  D14  3  14   12  D4 │\n`;
      output += `│  D13  4  12  D1  TX0 │\n`;
      output += `│  D12  5  13  D0  RX0 │\n`;
      output += `│  GND  G   G   G   G │\n`;
      output += `│  D26  6  27  25  D5 │\n`;
      output += `│  D27  7  33  32  D18│\n`;
      output += `│  D25  8  34  39  D19│\n`;
      output += `│  D33  9  36  35  D21│\n`;
      output += `│  D32  0  38  37  D22│\n`;
      output += `│  GND  R   R   R  GND│\n`;
    } else {
      output += `│     ARDUINO UNO       │\n`;
      output += `│  AREF GND 13  12  11 │\n`;
      output += `│  A0   GND  8   7   6 │\n`;
      output += `│  A1   5V   5   4   3 │\n`;
      output += `│  A2   GND  2   TX  RX│\n`;
      output += `│  A3   GND  0   RST  R│\n`;
      output += `│  A4   A5  GND GND VIN │\n`;
    }
    output += `└─────────────────────────┘\n\n`;

    output += `Component Connections:\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    const connections = components.split(",").map(c => c.trim());
    for (const conn of connections) {
      const [comp, pins] = conn.split(":").map(s => s.trim());

      const match = Object.entries(COMPONENT_DB).find(([key]) =>
        key.toLowerCase().includes(comp.toLowerCase()) || comp.toLowerCase().includes(key.toLowerCase())
      );

      if (match) {
        const [name, info] = match;
        output += `\n${name}:\n`;
        output += `  Type: ${info.type}\n`;
        output += `  Connection: ${pins}\n`;
        output += `  Voltage: ${info.voltage}\n`;

        if (info.voltage.includes("5V") && board.toLowerCase().includes("esp32")) {
          output += `  ⚠️  WARNING: Needs level shifter for ESP32!\n`;
        }
      } else {
        output += `\n${comp}:\n`;
        output += `  Connection: ${pins}\n`;
      }
    }

    output += `\n\n💡 Tips:\n`;
    output += `- Always connect GND first\n`;
    output += `- Use breadboard for prototyping\n`;
    output += `- Double-check voltage levels\n`;
    output += `- I can generate code for this setup!`;

    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Arduino MCP server running on stdio");
}

main().catch(console.error);
