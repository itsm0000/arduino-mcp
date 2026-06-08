# Arduino MCP Server v2.0 - Enhanced Edition

The most comprehensive MCP server for AI-assisted Arduino/ESP32 development. This server gives AI agents deep insight into your hardware setup, code quality, and troubleshooting.

## 🚀 Quick Start

1. **Restart your IDE** to load the MCP server
2. Try: `verify the Arduino setup` or `list connected boards`
3. Tell the AI what components you have connected
4. Let it write, compile, upload, and debug code for you!

---

## 📦 Available Tools (25 Total)

### 🔧 Core Arduino Operations
| Tool | Description |
|------|-------------|
| `verify_setup` | Check Arduino CLI status, cores, connected boards |
| `list_boards` | Detect all connected Arduino boards via USB |
| `list_board_types` | List all supported board types (with search) |
| `list_cores` | Show installed Arduino cores |
| `install_core` | Install a core (e.g., esp32:esp32, arduino:avr) |
| `update_index` | Update package indexes for cores/libraries |

### 📝 Sketch Management
| Tool | Description |
|------|-------------|
| `compile_sketch` | Compile with memory usage analysis |
| `upload_sketch` | Upload to board with troubleshooting on failure |
| `compile_and_upload` | One-step compile + upload |
| `read_sketch_file` | Read .ino file contents |
| `write_sketch_file` | Create or update sketch files |
| `sketch_info` | Get sketch file information |
| `analyze_code` | **🆕** Code quality analysis (detects common bugs, best practices) |

### 📚 Library Management
| Tool | Description |
|------|-------------|
| `install_library` | Install Arduino library |
| `list_libraries` | List installed libraries |
| `search_library` | Search available libraries |
| `suggest_libraries` | **🆕** Smart suggestions based on components |

### 🔌 Hardware Diagnostics
| Tool | Description |
|------|-------------|
| `list_boards` | Detect connected hardware |
| `serial_monitor` | Monitor serial output with auto-parsing |
| `esp32_pin_reference` | **🆕** ESP32 pin map and usage validation |
| `analyze_wiring_issue` | **🆕** Diagnose wiring problems from symptoms |
| `check_component_compat` | **🆕** Verify component compatibility with board |
| `generate_wiring_diagram` | **🆕** Text-based wiring diagram generator |

### 📡 ESP32 Special Features
| Tool | Description |
|------|-------------|
| `wifi_diagnostics` | **🆕** WiFi troubleshooting with test code generator |
| `parse_serial_data` | **🆕** Parse sensor data for Serial Plotter |
| `memory_analysis` | **🆕** RAM/Flash usage analysis and optimization |

### 🎯 Project Templates
| Tool | Description |
|------|-------------|
| `project_template` | **🆕** Ready-to-use code templates for common projects |

Available templates:
- `wifi_sensor` - ESP32 WiFi sensor data transmitter
- `web_server` - ESP32 web server with controls
- `bluetooth_control` - ESP32 BLE device controller
- `data_logger` - SD card data logging
- `iot_dashboard` - MQTT-based IoT system
- `smart_home` - Smart home relay controller

---

## 💡 Usage Examples

### Example 1: Setting up a new ESP32 project
```
User: "I have an ESP32 with a DHT22 on GPIO4 and an OLED on I2C"

AI can:
1. suggest_libraries for "DHT22, OLED"
2. esp32_pin_reference for pin 4 and I2C
3. generate_wiring_diagram for your setup
4. project_template for "wifi_sensor"
5. Modify the code for your specific pins
6. compile_and_upload to your board
7. serial_monitor to see sensor readings
```

### Example 2: Debugging issues
```
User: "My upload keeps failing on ESP32"

AI can:
1. analyze_wiring_issue for "upload fails" on ESP32
2. list_boards to verify detection
3. Provide troubleshooting steps
4. Retry upload with correct settings
```

### Example 3: WiFi problems
```
User: "ESP32 won't connect to WiFi"

AI can:
1. wifi_diagnostics with your SSID
2. Generate test code to verify connection
3. Compile and upload it
4. Monitor serial output for diagnostics
```

### Example 4: Code quality check
```
User: "Check my code for issues"

AI can:
1. analyze_code on your sketch
2. Detect memory issues, blocking code, best practices
3. Suggest improvements
4. Apply fixes and recompile
```

---

## 🧠 Knowledge Base

### Component Database (35+ components)
The server knows about:
- **Sensors**: DHT11/22, DS18B20, BME280, BMP280, MQ-2/135, PIR, LDR, Soil Moisture, etc.
- **Displays**: OLED SSD1306, LCD 1602, LED Matrix MAX7219
- **Motors**: Servo, DC Motor, Stepper
- **LEDs**: NeoPixel, WS2812B, standard LEDs
- **Communication**: HC-05 Bluetooth, LoRa, WiFi, RFID RC522
- **Modules**: GPS NEO-6M, RTC DS3231, SD Card, Relay, HC-SR04

For each component, it knows:
- Required library
- Pin requirements
- Voltage levels
- Wiring considerations

### ESP32 Pin Reference
Complete pin map including:
- GPIO restrictions (boot pins, input-only)
- I2C, SPI, Serial defaults and remapping
- ADC1 vs ADC2 (WiFi conflict awareness)
- DAC and Touch pins
- PWM capabilities

### Common Wiring Issues Database
Auto-diagnosis for:
- No output / dead board
- Upload failures
- Sensor not reading
- I2C problems
- WiFi connection issues
- Brownout detected
- Watchdog timeout

---

## 🔥 Special Features

### Smart Upload Troubleshooting
When uploads fail, the server automatically suggests:
- ESP32 BOOT button procedure
- USB cable issues (charge-only vs data)
- Port conflicts
- Driver problems

### Code Analyzer
Detects common issues:
- Too many delay() calls (blocking code)
- Missing pinMode() declarations
- String memory fragmentation risk
- WiFi + ADC2 conflicts
- Missing volatile for interrupts
- Watchdog timeout risks

### Serial Monitor Enhancements
- Auto-parsing of sensor data patterns
- Detection of temp/humidity/distance readings
- Error pattern recognition
- Optional file logging

### Memory Analysis
- Flash and RAM usage reporting
- ESP32 memory layout information
- Optimization suggestions
- PROGMEM recommendations

---

## 📋 Common FQBN Strings

| Board | FQBN |
|-------|------|
| Arduino Uno | `arduino:avr:uno` |
| Arduino Mega | `arduino:avr:mega` |
| Arduino Nano | `arduino:avr:nano` |
| ESP32 Dev Module | `esp32:esp32:esp32` |
| ESP32-C3 | `esp32:esp32:esp32c3` |
| ESP32-S3 | `esp32:esp32:esp32s3` |
| ESP8266 NodeMCU | `esp8266:esp8266:nodemcu` |

---

## 🛠️ Configuration

**Arduino CLI Location:** `c:\Users\MT\Projects\arduino-cli\arduino-cli.exe`  
**MCP Server:** `C:\Users\MT\Projects\arduino-mcp\server.js`  
**MCP Settings:** `%APPDATA%\Code\User\globalStorage\kilocode.kilo-code\settings\mcp_settings.json`

---

## 🐛 Troubleshooting

### Board not detected
```
1. Run: list_boards
2. Check USB connection
3. Try different USB cable
4. Install drivers if needed
```

### Compilation fails
```
1. Verify FQBN is correct
2. Check all libraries installed: list_libraries
3. Use analyze_code to find code issues
```

### Upload fails
```
1. ESP32: Hold BOOT button when "Connecting..." appears
2. Close Serial Monitor before uploading
3. Verify COM port matches list_boards output
4. Try analyze_wiring_issue for "upload failed"
```

### Sensor not working
```
1. Check wiring with generate_wiring_diagram
2. Verify library installed: suggest_libraries
3. Use analyze_code to check for code issues
4. Monitor serial output for errors
```

---

## 📞 Need Help?

Just describe your issue to the AI agent! For example:
- "My DHT22 isn't reading"
- "Upload fails on ESP32"
- "How do I connect an OLED?"
- "Check my code for memory issues"
- "Generate a web server template"

The AI has full access to all these tools and the component database to help you!

---

## 🆕 What's New in v2.0

- ✅ Serial monitor with auto-parsing
- ✅ Wiring issue detection and diagnosis
- ✅ Smart library suggestions based on components
- ✅ ESP32 pin reference guide
- ✅ WiFi diagnostics and test code generator
- ✅ Code analyzer for common issues
- ✅ Serial plotter data parser
- ✅ Project templates (6 ready-to-use)
- ✅ Memory usage analyzer
- ✅ Component compatibility checker
- ✅ Wiring diagram generator
- ✅ Enhanced troubleshooting on failures
- ✅ 35+ component database
- ✅ ESP32-specific warnings and tips
