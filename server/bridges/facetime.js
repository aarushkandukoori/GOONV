import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROFILE_DIR = path.join(__dirname, '..', '..', '.goonv-browser-profile');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export function isMacOS() {
  return process.platform === 'darwin';
}

export async function detectJoinCapabilities() {
  const caps = {
    macosNative: isMacOS(),
    browserAutomation: false,
    companion: true,
  };

  try {
    await import('playwright');
    caps.browserAutomation = true;
  } catch {
    /* playwright not installed */
  }

  return caps;
}

/**
 * macOS: opens FaceTime (or default handler) and clicks Join via AppleScript.
 * Same approach used by open-source FaceTime wrappers (holysoles/facetime, teleportme).
 */
export async function joinViaMacOS(link) {
  if (!isMacOS()) {
    throw new Error('macOS native join only works on macOS');
  }

  const escaped = link.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  await execAsync(`open "${escaped}"`);
  await delay(2500);

  const script = `tell application "FaceTime" to activate
delay 1.5
tell application "System Events"
  tell process "FaceTime"
    set deadline to (current date) + 20
    repeat while (current date) < deadline
      try
        if exists (button "Join" of front window) then
          click button "Join" of front window
          return "joined"
        end if
        if exists (button "Open" of front window) then
          click button "Open" of front window
        end if
      end try
      delay 0.4
    end repeat
  end tell
end tell
return "opened"`;

  const scriptPath = path.join(os.tmpdir(), `goonv-join-${Date.now()}.scpt`);
  fs.writeFileSync(scriptPath, script);

  try {
    const { stdout } = await execAsync(`osascript "${scriptPath}"`);
    fs.unlinkSync(scriptPath);
    const status = stdout.trim();
    return {
      method: 'macos-native',
      status: status === 'joined' ? 'joined' : 'opened',
      message:
        status === 'joined'
          ? 'Goonv joined via FaceTime on this Mac'
          : 'FaceTime opened — Goonv may need you to tap Join once',
      needsAdmission: false,
    };
  } catch (err) {
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
    return {
      method: 'macos-native',
      status: 'opened',
      message: 'FaceTime link opened on this Mac',
      needsAdmission: false,
      warning: err.message,
    };
  }
}

/**
 * Browser: automates facetime.apple.com join as participant "Goonv".
 * Koov-style — headless Chrome joins the web FaceTime client.
 */
export async function joinViaBrowser(link, sessionStore) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    throw new Error(
      'Playwright not installed. Run: npx playwright install chromium',
    );
  }

  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }

  const launchOptions = {
    headless: false,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-stream',
    ],
    permissions: ['camera', 'microphone'],
    viewport: { width: 1100, height: 760 },
    ignoreHTTPSErrors: true,
  };

  let context;
  try {
    context = await chromium.launchPersistentContext(PROFILE_DIR, {
      ...launchOptions,
      channel: 'chrome',
    });
  } catch {
    context = await chromium.launchPersistentContext(PROFILE_DIR, launchOptions);
  }

  const page = context.pages()[0] || (await context.newPage());

  try {
    await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const nameInput = page
      .locator(
        'input[type="text"], input[placeholder*="name" i], input[aria-label*="name" i]',
      )
      .first();

    await nameInput.waitFor({ state: 'visible', timeout: 20000 });
    await nameInput.fill('Goonv');

    const continueBtn = page.getByRole('button', { name: /continue/i });
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
    }

    await delay(1500);

    const joinBtn = page.getByRole('button', { name: /^join$/i });
    await joinBtn.waitFor({ state: 'visible', timeout: 15000 });
    await joinBtn.click();

    sessionStore.set(link, { context, page, method: 'browser' });

    return {
      method: 'browser',
      status: 'waiting_admission',
      message:
        'Goonv joined the FaceTime lobby as "Goonv" — admit them on your iPhone/Mac',
      needsAdmission: true,
    };
  } catch (err) {
    await context.close().catch(() => {});
    throw new Error(`Browser join failed: ${err.message}`);
  }
}

export async function leaveSession(link, sessionStore) {
  const session = sessionStore.get(link);
  if (!session) return { ok: true, message: 'No active session' };

  if (session.context) {
    await session.context.close().catch(() => {});
  }
  sessionStore.delete(link);
  return { ok: true, message: 'Goonv left the call' };
}

export async function joinFaceTime(link, sessionStore, preferredMode) {
  const mode = preferredMode || process.env.FACETIME_JOIN_MODE || 'auto';

  if (mode === 'companion') {
    return {
      method: 'companion',
      status: 'companion',
      message: 'Using companion mode — Goonv listens through your browser mic',
      needsAdmission: false,
    };
  }

  if (mode === 'macos' || (mode === 'auto' && isMacOS())) {
    try {
      return await joinViaMacOS(link);
    } catch (err) {
      if (mode === 'macos') throw err;
      console.warn('macOS join failed, falling back to browser:', err.message);
    }
  }

  if (mode === 'browser' || mode === 'auto') {
    return await joinViaBrowser(link, sessionStore);
  }

  return {
    method: 'companion',
    status: 'companion',
    message: 'Fallback to companion mode',
    needsAdmission: false,
  };
}
