# IonCalc — Android calculator toolkit

A dark-first, responsive calculator app packaged with Capacitor. Includes:
- Standard calculator with keyboard-friendly expression entry.
- Scientific calculator with trigonometry, inverse trig, logarithms, roots, powers, constants and parentheses. The layout is inspired by the compact scientific calculator experience used in exam environments; it is not an exact reproduction of TCS iON software.
- Differential calculator (symbolic derivative) and definite integral calculator (numerical Simpson's rule).
- Age calculator, GST estimator, bill split calculator, currency converter and unit converter.
- Dark/light theme toggle; theme preference is saved locally.

## Build the APK using GitHub Actions

1. Extract this ZIP.
2. Create a new GitHub repository and upload **the contents** of this folder (so `package.json` and `.github/` are at repository root).
3. Open the repository's **Actions** tab. Enable Actions if GitHub asks.
4. Select **Build Android APK** and click **Run workflow**. A push to `main` or `master` also triggers it.
5. When the workflow finishes, open the run and download the `ioncalc-debug-apk` artifact. Extract it to get `app-debug.apk`.
6. Transfer the APK to your Android phone and install it. You may need to allow installation from that source.

## Local development

Requirements: Node.js 20+, Android Studio / Android SDK, and Java 21.

```bash
npm install
npm run dev
```

To create the Android project locally:

```bash
npm run build
npx cap add android
npx cap sync android
```

Open the generated Android project in Android Studio, or build from a terminal:

```bash
cd android
./gradlew assembleDebug
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Notes

- Currency conversion requires an internet connection and uses the Frankfurter API. The displayed date is the rate date returned by the service.
- The calculus integral is a numerical definite integral, not a general symbolic antiderivative. The differential function uses Math.js symbolic differentiation.
- The tax tool is a simple GST percentage estimator. It does not implement income-tax slabs or replace professional tax advice.
- The GitHub workflow creates a **debug APK** for testing/sideloading. For a Play Store release, configure signing and build a signed release APK/AAB.
- GitHub Actions creates the Android platform project during CI, so generated Gradle files are intentionally not included in this source ZIP.
