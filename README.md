# IonCalc

**IonCalc** is a dark-first, responsive calculator and engineering study toolkit built with Vite and Capacitor. It brings everyday calculations, scientific and calculus tools, signal plotting, logic-gate practice, and introductory programming/HDL learning spaces into one app.

## Features

### Calculators and engineering tools
- **Analog Circuit Lab** replaces the standard calculator as the opening workspace, with an LTspice-inspired schematic editor and component library.
  - Circuit models: nonlinear Shockley diode, simplified NPN BJT, square-law NMOS, finite-gain rail-limited op-amp, VCVS/VCCS/CCVS/CCCS, R/C/L and independent sources. DC operating point and backward-Euler transient analysis expose node voltages and device currents.
  - Educational model limitations: not vendor-compatible SPICE; no PNP/PMOS, MOSFET body diode, full Gummel-Poon, op-amp frequency response/slew-rate, temperature/noise, AC sweep, or adaptive time stepping.
- **Scientific calculator** with trigonometry, inverse trigonometry, logarithms, roots, powers, constants, and parentheses.
- **Calculus tools:** symbolic differentiation and numerical definite integration using Simpson's rule; the function expression field uses text input for a full QWERTY keyboard.
- **Everyday utilities:** age calculator, GST estimator, bill splitter, currency converter, and unit converter.
- **Signal graphing:** plot continuous-time signals `x(t)` and discrete-time sequences `x[n]` from editable Math.js expressions.
- **Logic-gate simulator:** experiment with AND, OR, NOT, NAND, NOR, XOR, and XNOR gates using live input switches and truth tables.

### Code Studio and learning spaces
- **8085 and 8086 assembly:** edit sample programs and step through a supported educational subset of instructions while observing registers and flags. Full instruction-set coverage is still under development.
- **Python:** write and run Python in the browser using Pyodide WebAssembly.
- **Java:** submit Java code to the Piston online execution service and view compiler/runtime output.
- **Verilog Learning Space:** explore editable examples for AND gates, multiplexers, counters, and flip-flops, with basic structure checks and selected truth-table helpers.

### App experience
- Dark and light themes, with the selected theme saved locally.
- Responsive interface for desktop and mobile screens.
- Custom IonCalc app icon and Android launcher icon assets.

## Technology stack

- HTML, CSS, and JavaScript
- [Vite](https://vite.dev/) for development and web builds
- [Math.js](https://mathjs.org/) for mathematical expression handling
- [Capacitor](https://capacitorjs.com/) for Android packaging
- GitHub Actions for automated Android debug APK builds

## Run locally

### Requirements

- Node.js 20 or newer
- npm
- For Android builds: Android Studio / Android SDK and Java 21

### Start the web app

```bash
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

### Build the web app

```bash
npm run build
```

The production web build is generated in `dist/`.

## Build for Android

To add the Android platform and sync the web build:

```bash
npm run build
npx cap add android
npx cap sync android
```

Open the Android project in Android Studio:

```bash
npx cap open android
```

Or build a debug APK from the Android project directory:

```bash
cd android
./gradlew assembleDebug
```

The debug APK is created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Build an APK with GitHub Actions

This repository includes a workflow at `.github/workflows/build-apk.yml`.

1. Push the project files to the repository's `main` branch (or `master`).
2. Open the repository's **Actions** tab and enable GitHub Actions if prompted.
3. Select **Build Android APK** and choose **Run workflow**. A push to `main` or `master` also triggers the workflow.
4. When the run completes, open it and download the `ioncalc-debug-apk` artifact.
5. Extract the artifact to obtain `app-debug.apk`, then transfer it to an Android device and install it. Android may ask you to allow installation from that source.

The workflow produces a **debug APK** for testing and sideloading. A Play Store release requires configuring signing and building a signed release APK or Android App Bundle (AAB).

## Important implementation notes and limitations

- The 8085/8086 tools are compact educational step-through simulators, **not complete instruction-set emulators**. Only the instruction subset provided in the app is supported; full memory addressing and many instructions are not implemented.
- Python runs in the browser through Pyodide WebAssembly. Its runtime is downloaded on first use, so an internet connection is needed initially.
- Java compilation/execution uses the external Piston service. An internet connection is required. Do not submit passwords, API keys, personal data, or confidential source code. The current interface displays compiler/runtime diagnostics but is not a full interactive JVM debugger.
- The Verilog space is a learning aid with basic structural checks and selected truth-table generation. It is not a full HDL compiler, testbench runner, or waveform simulator.
- Currency conversion requires internet access and uses the Frankfurter API; the displayed date is the rate date returned by the service.
- The integral tool calculates numerical **definite** integrals; it does not find general symbolic antiderivatives. Differentiation uses Math.js symbolic differentiation.
- Signal plots use `t` for continuous-time expressions and `n` for discrete-time expressions. Trigonometric functions use radians. Discrete plots are limited to 300 samples for responsiveness.
- The GST tool is a percentage estimator, not an income-tax calculator or a substitute for professional tax advice.
- The scientific calculator's layout is inspired by compact exam-style calculators; it is not an exact reproduction of TCS iON software.

## Project structure

```text
.
├── .github/workflows/build-apk.yml
├── assets/android-icons/   # Android launcher icon resources
├── public/                 # Public web assets
├── src/
│   ├── main.js             # Main application and calculator interface
│   ├── coding.js           # Code Studio and Verilog learning tools
│   └── style.css           # Application styles
├── capacitor.config.json
├── index.html
├── package.json
└── README.md
```

## License

No open-source license has been specified yet. Unless a license is added, the source is provided without an express license to reuse, modify, or redistribute it.


## Circuit Lab (Beta)

IonCalc includes an educational analog schematic workspace. It supports placing and moving resistors, ideal DC voltage sources and ground symbols, connecting component pins with wires, editing component references and values, and solving a basic DC operating point for resistor/source networks.

**Current scope:** this is an early educational DC solver, not a full LTspice/SPICE replacement. It does not yet implement transient or AC analysis, semiconductor device models, vendor SPICE models, advanced convergence controls, or full schematic routing. Validate circuit results independently before using them in hardware designs.
